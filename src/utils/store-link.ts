import { Linking, Platform } from 'react-native';
import * as Application from 'expo-application';

// Matches the fallback already used in device-integrity-gate.tsx.
const FALLBACK_APP_ID = 'com.mode3.neatmobile';
// App Store Connect → App Information → Apple ID. Not derivable from the bundle id.
const APPLE_APP_ID = '6815645214';

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
 * fallback: if it is missing we build the canonical store URL.
 */
export async function openStoreListing(storeUrl?: string): Promise<void> {
  const appId = Application.applicationId ?? FALLBACK_APP_ID;
  const isIOS = Platform.OS === 'ios';

  // apps.apple.com is a universal link that opens the App Store app directly,
  // so iOS needs no native scheme.
  const native = isIOS
    ? undefined
    : `market://details?id=${encodeURIComponent(appId)}`;

  const web =
    storeUrl ??
    (isIOS
      ? `https://apps.apple.com/app/id${APPLE_APP_ID}`
      : `https://play.google.com/store/apps/details?id=${encodeURIComponent(appId)}`);

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
