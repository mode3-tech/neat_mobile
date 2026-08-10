import { useState, type PropsWithChildren } from 'react';
import { View } from 'react-native';

import { useAppVersionGate } from '@/hooks/use-app-version-gate';

import { UpdateAvailableSheet } from './update-available-sheet';
import { UpdateRequiredScreen } from './update-required-screen';

// Module scope, not React state: a JS module lives as long as the process, so
// the dismissal survives a remount and a foreground resume but dies on a cold
// start — exactly the lifetime we want. Mirrors how security.service.ts keeps
// gate state in a module singleton rather than in a component.
let sessionDismissed = false;

// eas.json sets EXPO_PUBLIC_APP_VARIANT to "production" on the production
// profile only. If that ever goes missing the gate quietly stops running, so
// warn loudly at import time rather than letting a release ship with a dead
// gate nobody notices.
if (!__DEV__ && !process.env.EXPO_PUBLIC_APP_VARIANT) {
  console.warn(
    '[updates] EXPO_PUBLIC_APP_VARIANT is not set; the app version gate will not run. Configure it in eas.json.',
  );
}

/**
 * Wraps the navigator and asks the backend whether this native build is still
 * supported. Three outcomes: nothing, a dismissible prompt, a blocking sheet.
 *
 * Production builds only. Preview and internal APKs are rebuilt for every
 * change, so a tester is never on a stale build — and blocking one would send
 * them to Play, installing the production app over their test build. Note this
 * is stricter than DeviceIntegrityGate, which runs on every non-dev build and
 * only relaxes a single check for preview.
 *
 * The conditional lives at the component boundary so the query hook below is
 * never called conditionally.
 */
export function AppVersionGate({
  children,
}: PropsWithChildren): React.JSX.Element {
  // Read inside the component, not at module scope: EXPO_PUBLIC_* values are
  // inlined at build time either way, and this keeps the branch testable.
  const isProductionBuild =
    process.env.EXPO_PUBLIC_APP_VARIANT === 'production';

  if (__DEV__ || !isProductionBuild) {
    // if (false) { // ← local testing: forces the gate to run in a dev build so
    //              //   GET /app/version/<platform> actually fires. Never commit.
    // if (__DEV__) { // ← swap to this to also gate preview/internal APKs
    return <>{children}</>;
  }
  return <ActiveAppVersionGate>{children}</ActiveAppVersionGate>;
}

function ActiveAppVersionGate({
  children,
}: PropsWithChildren): React.JSX.Element {
  const { state, storeUrl } = useAppVersionGate();
  const [dismissed, setDismissed] = useState(sessionDismissed);

  // No loading branch on purpose. While the query is pending `state` is 'ok',
  // so children render on the first paint and the gate swaps in only once the
  // check resolves — a slow or dead backend never delays app open.

  // The wrapper renders unconditionally, and only the overlay below it is
  // conditional. Returning a bare fragment in the 'ok' case would change the
  // element type at this position, and React unmounts the whole subtree when
  // that happens — since the first paint is always 'ok', every soft/hard
  // resolution (and every dismissal) would remount the navigator and reset
  // navigation state.
  //
  // Both overlays keep children mounted so the screen behind stays alive and
  // animating. The hard block is still a total block: the overlay covers the
  // screen and eats every touch, and it offers no way to dismiss itself.
  return (
    <View className="flex-1">
      {children}
      {state === 'hard' && <UpdateRequiredScreen storeUrl={storeUrl} />}
      {state === 'soft' && !dismissed && (
        <UpdateAvailableSheet
          storeUrl={storeUrl}
          onDismiss={() => {
            sessionDismissed = true;
            setDismissed(true);
          }}
        />
      )}
    </View>
  );
}
