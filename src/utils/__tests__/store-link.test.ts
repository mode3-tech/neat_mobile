import { Linking } from 'react-native';
import * as Application from 'expo-application';

import { openStoreListing } from '../store-link';

jest.mock('react-native', () => ({
  Linking: { openURL: jest.fn() },
  Platform: { OS: 'android' },
}));
jest.mock('expo-application', () => ({ applicationId: 'com.mode3.neatmobile' }));

const openURL = Linking.openURL as jest.Mock;
const PLAY_WEB =
  'https://play.google.com/store/apps/details?id=com.mode3.neatmobile';

beforeEach(() => {
  jest.clearAllMocks();
  (Application as { applicationId: string | null }).applicationId =
    'com.mode3.neatmobile';
});

describe('openStoreListing', () => {
  it('prefers the market:// scheme so Play opens natively', async () => {
    openURL.mockResolvedValue(true);

    await openStoreListing(PLAY_WEB);

    expect(openURL).toHaveBeenCalledTimes(1);
    expect(openURL).toHaveBeenCalledWith(
      'market://details?id=com.mode3.neatmobile',
    );
  });

  it('falls back to the backend store_url when market:// cannot open', async () => {
    openURL.mockRejectedValueOnce(new Error('no activity')).mockResolvedValue(true);

    await openStoreListing('https://example.test/listing');

    expect(openURL).toHaveBeenNthCalledWith(
      2,
      'https://example.test/listing',
    );
  });

  it('builds the Play URL when store_url is absent', async () => {
    openURL.mockRejectedValueOnce(new Error('no activity')).mockResolvedValue(true);

    await openStoreListing(undefined);

    expect(openURL).toHaveBeenNthCalledWith(2, PLAY_WEB);
  });

  it('derives the id from applicationId rather than hardcoding it', async () => {
    (Application as { applicationId: string | null }).applicationId =
      'com.mode3.neatmobile.preview';
    openURL.mockResolvedValue(true);

    await openStoreListing(undefined);

    expect(openURL).toHaveBeenCalledWith(
      'market://details?id=com.mode3.neatmobile.preview',
    );
  });

  it('uses the known package id when applicationId is unavailable', async () => {
    (Application as { applicationId: string | null }).applicationId = null;
    openURL.mockResolvedValue(true);

    await openStoreListing(undefined);

    expect(openURL).toHaveBeenCalledWith(
      'market://details?id=com.mode3.neatmobile',
    );
  });

  it('never throws when nothing can handle the link', async () => {
    openURL.mockRejectedValue(new Error('no handler'));

    // The blocking screen is the one place a crash is unrecoverable.
    await expect(openStoreListing(undefined)).resolves.toBeUndefined();
    expect(openURL).toHaveBeenCalledTimes(2);
  });
});
