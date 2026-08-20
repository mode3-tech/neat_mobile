import * as Updates from 'expo-updates';

/**
 * Which build of the app this is: 'production' | 'preview' | 'development'.
 *
 * Sent to the backend as `app_env` on push-token registration so notifications
 * dedupe per build — a phone with production + preview + dev installed gets one
 * push, not three.
 *
 * `Updates.channel` comes from the NATIVE build (the `channel` field on each
 * eas.json build profile), so it survives an OTA bundled on a machine whose
 * .env says something else — unlike EXPO_PUBLIC_* vars, which are inlined at
 * bundle time and would silently ship the wrong value. It is null on dev builds
 * and Expo Go, which is what the env fallback covers.
 */
export const APP_ENV =
  Updates.channel || process.env.EXPO_PUBLIC_APP_VARIANT || 'development';
