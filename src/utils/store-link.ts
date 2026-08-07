import { Linking, Platform } from 'react-native';
import * as Application from 'expo-application';

// Matches the fallback already used in device-integrity-gate.tsx.
const FALLBACK_APP_ID = 'com.mode3.neatmobile';

/**
 * Open this app's store listing.
 *
 * `market://` first: it hands off to the installed Play Store app and shows the
 * native update overlay, instead of bouncing the user out to a browser tab.
 *
 * We attempt openURL and catch, rather than probing with canOpenURL. On
 * Android 11+ package visibility, canOpenURL('market://…') returns false unless
 * the scheme is declared in a <queries> block in the manifest — and we are not
 * touching app.config.js — so probing would send every user down the web path.
 *
 * `storeUrl` is the optional `store_url` from GET /app/version. It is only a
 * fallback: if it is missing we build the canonical Play URL from the app id.
 */
export async function openStoreListing(storeUrl?: string): Promise<void> {
  const appId = Application.applicationId ?? FALLBACK_APP_ID;

  // iOS is not shipped yet, and the gate returns 'ok' when the payload has no
  // `ios` key, so this path is currently unreachable. When iOS ships:
  //   native = `itms-apps://itunes.apple.com/app/id<APPLE_APP_ID>`
  //   web    = storeUrl ?? `https://apps.apple.com/app/id<APPLE_APP_ID>`
  // The Apple app id is not derivable from applicationId, so it will need to
  // come from the backend's `ios.store_url` or a constant.
  const native =
    Platform.OS === 'ios'
      ? undefined
      : `market://details?id=${encodeURIComponent(appId)}`;

  const web =
    storeUrl ??
    `https://play.google.com/store/apps/details?id=${encodeURIComponent(appId)}`;

  if (native) {
    try {
      await Linking.openURL(native);
      return;
    } catch {
      // Play Store app missing or the scheme is blocked — fall through to web.
    }
  }

  try {
    await Linking.openURL(web);
  } catch {
    // Nothing can handle the link. Swallow it: a dead button is bad, but a
    // crash on the screen the user cannot leave is worse.
  }
}
