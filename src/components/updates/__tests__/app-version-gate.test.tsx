import { BackHandler, Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { useAppVersionGate } from '@/hooks/use-app-version-gate';
import { openStoreListing } from '@/utils/store-link';
import { AppVersionGate } from '../app-version-gate';

jest.mock('@/hooks/use-app-version-gate', () => ({
  useAppVersionGate: jest.fn(),
}));
jest.mock('@/utils/store-link', () => ({ openStoreListing: jest.fn() }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: require('react-native').View,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockGate = useAppVersionGate as jest.Mock;

function App() {
  return <Text>dashboard</Text>;
}

const renderGate = () =>
  render(
    <AppVersionGate>
      <App />
    </AppVersionGate>,
  );

// The gate short-circuits unless the build is BOTH release-mode and the
// production variant. Jest sets __DEV__ true and no variant, so both have to be
// faked here; each bypass is asserted separately below.
const realDev = (globalThis as { __DEV__?: boolean }).__DEV__;
const realVariant = process.env.EXPO_PUBLIC_APP_VARIANT;

beforeEach(() => {
  (globalThis as { __DEV__?: boolean }).__DEV__ = false;
  process.env.EXPO_PUBLIC_APP_VARIANT = 'production';
  jest.clearAllMocks();
  jest
    .spyOn(BackHandler, 'addEventListener')
    .mockReturnValue({ remove: jest.fn() } as never);
});

afterAll(() => {
  (globalThis as { __DEV__?: boolean }).__DEV__ = realDev;
  process.env.EXPO_PUBLIC_APP_VARIANT = realVariant;
});

describe('AppVersionGate', () => {
  it('renders the app when the build is current', () => {
    mockGate.mockReturnValue({ state: 'ok', storeUrl: undefined });
    renderGate();

    expect(screen.getByText('dashboard')).toBeTruthy();
    expect(screen.queryByText('Update available')).toBeNull();
    expect(screen.queryByText('Update required')).toBeNull();
  });

  it('renders the app on the very first paint, before the check resolves', () => {
    // A pending query yields 'ok' — this is the no-blocking-first-paint rule.
    mockGate.mockReturnValue({ state: 'ok', storeUrl: undefined });
    renderGate();

    expect(screen.getByText('dashboard')).toBeTruthy();
  });

  it('shows a dismissible prompt over the live app on a soft update', () => {
    mockGate.mockReturnValue({ state: 'soft', storeUrl: undefined });
    renderGate();

    expect(screen.getByText('dashboard')).toBeTruthy();
    expect(screen.getByText('Update available')).toBeTruthy();
    expect(screen.getByText('Later')).toBeTruthy();
  });

  it('blocks over the live app on a hard block, with no way past it', () => {
    mockGate.mockReturnValue({ state: 'hard', storeUrl: undefined });
    renderGate();

    expect(screen.getByText('Update required')).toBeTruthy();
    // Children stay mounted so the screen behind keeps animating — the overlay
    // covers them and eats every touch.
    expect(screen.getByText('dashboard')).toBeTruthy();
    // The only affordance is Update: no Later, and the backdrop is a plain View
    // rather than a Pressable, so tapping it cannot dismiss anything.
    expect(screen.queryByText('Later')).toBeNull();
    expect(screen.getByText('Update Now')).toBeTruthy();
  });

  it('swallows the Android back button while hard-blocked', () => {
    const addEventListener = BackHandler.addEventListener as jest.Mock;
    mockGate.mockReturnValue({ state: 'hard', storeUrl: undefined });
    renderGate();

    expect(addEventListener).toHaveBeenCalledWith(
      'hardwareBackPress',
      expect.any(Function),
    );
    // Returning true means "handled" — the navigator never sees the press.
    const handler = addEventListener.mock.calls[0][1] as () => boolean;
    expect(handler()).toBe(true);
  });

  it('bypasses the gate entirely in dev', () => {
    (globalThis as { __DEV__?: boolean }).__DEV__ = true;
    mockGate.mockReturnValue({ state: 'hard', storeUrl: undefined });
    renderGate();

    expect(screen.getByText('dashboard')).toBeTruthy();
    expect(screen.queryByText('Update required')).toBeNull();
    // The hook must not even run.
    expect(mockGate).not.toHaveBeenCalled();
  });

  it.each(['preview', 'development', undefined])(
    'bypasses the gate on a non-production build (variant: %s)',
    (variant) => {
      // Testers are rebuilt onto a fresh APK every change, and blocking one
      // would push them to Play and overwrite their test build.
      if (variant === undefined) {
        delete process.env.EXPO_PUBLIC_APP_VARIANT;
      } else {
        process.env.EXPO_PUBLIC_APP_VARIANT = variant;
      }
      mockGate.mockReturnValue({ state: 'hard', storeUrl: undefined });
      renderGate();

      expect(screen.getByText('dashboard')).toBeTruthy();
      expect(screen.queryByText('Update required')).toBeNull();
      expect(mockGate).not.toHaveBeenCalled();
    },
  );

  it('opens the store listing from the blocking screen', () => {
    mockGate.mockReturnValue({ state: 'hard', storeUrl: 'https://play/x' });
    renderGate();

    fireEvent.press(screen.getByText('Update Now'));
    expect(openStoreListing).toHaveBeenCalledWith('https://play/x');
  });

  it('opens the store listing from the soft prompt', () => {
    mockGate.mockReturnValue({ state: 'soft', storeUrl: 'https://play/x' });
    renderGate();

    fireEvent.press(screen.getByText('Update Now'));
    expect(openStoreListing).toHaveBeenCalledWith('https://play/x');
  });

  describe('soft dismissal lifetime', () => {
    it('survives a dismissal and a remount, then resets on cold start', () => {
      mockGate.mockReturnValue({ state: 'soft', storeUrl: undefined });

      const first = renderGate();
      fireEvent.press(screen.getByText('Later'));

      // Gone, app still usable.
      expect(screen.queryByText('Update available')).toBeNull();
      expect(screen.getByText('dashboard')).toBeTruthy();

      // Remount stands in for a foreground resume: the prompt must stay gone.
      first.unmount();
      renderGate();
      expect(screen.queryByText('Update available')).toBeNull();

      // A cold start is a fresh JS context — the module-level flag resets.
      // Keep the ORIGINAL react instance in the fresh registry, otherwise the
      // re-required component gets a second React whose hook dispatcher is null.
      const react = require('react');
      jest.resetModules();
      jest.doMock('react', () => react);
      const freshHook =
        require('@/hooks/use-app-version-gate') as { useAppVersionGate: jest.Mock };
      freshHook.useAppVersionGate.mockReturnValue({
        state: 'soft',
        storeUrl: undefined,
      });
      const {
        AppVersionGate: FreshGate,
      } = require('../app-version-gate') as typeof import('../app-version-gate');
      render(
        <FreshGate>
          <App />
        </FreshGate>,
      );
      expect(screen.getByText('Update available')).toBeTruthy();
    });
  });
});
