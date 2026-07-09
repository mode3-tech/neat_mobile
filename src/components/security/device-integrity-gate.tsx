import { useEffect, useState, type PropsWithChildren } from 'react';
import { useFreeRasp } from 'freerasp-react-native';
import * as Application from 'expo-application';

import {
  getIntegrityStatus,
  reportBlockingThreat,
  reportChecksFinished,
  subscribeIntegrity,
  type IntegrityStatus,
} from '@/services/security.service';

import { DeviceBlockedScreen } from './device-blocked-screen';

const WATCHER_EMAIL = 'security@neatpay.ng';

const ANDROID_CERT_HASHES = (process.env.EXPO_PUBLIC_ANDROID_CERT_SHA256 ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

if (!__DEV__ && ANDROID_CERT_HASHES.length === 0) {
  console.warn(
    '[security] EXPO_PUBLIC_ANDROID_CERT_SHA256 is not set; appIntegrity will fire and block the app. Configure the release keystore SHA-256 in eas.json.',
  );
}

// A `preview` build is an internal-distribution APK sideloaded from outside the
// Play/App Store, so freeRASP's `unofficialStore` check ALWAYS fires for it — even on a
// perfectly clean device. That would block every QA install. Relax ONLY that one check,
// and ONLY when the variant is exactly 'preview'. Anything else — production, or an
// unset variant — stays strict, so production fails closed. Every other reaction
// (root/jailbreak, hooks, debug, simulator, …) hard-blocks on every build, preview
// included.
const IS_PREVIEW_BUILD = process.env.EXPO_PUBLIC_APP_VARIANT === 'preview';

const onUnofficialStore = IS_PREVIEW_BUILD ? () => {} : reportBlockingThreat;

export function DeviceIntegrityGate({
  children,
}: PropsWithChildren): React.JSX.Element {
  if (__DEV__) {
    return <>{children}</>;
  }
  return <ProductionIntegrityGate>{children}</ProductionIntegrityGate>;
}

function ProductionIntegrityGate({
  children,
}: PropsWithChildren): React.JSX.Element {
  const [status, setStatus] = useState<IntegrityStatus>(() =>
    getIntegrityStatus(),
  );

  useFreeRasp(
    {
      androidConfig: {
        packageName:
          Application.applicationId ?? 'com.mode3.neatmobile',
        certificateHashes: ANDROID_CERT_HASHES,
      },
      iosConfig: {
        appBundleId:
          Application.applicationId ?? 'com.mode3.neatmobile',
        appTeamId: process.env.EXPO_PUBLIC_IOS_TEAM_ID ?? '',
      },
      watcherMail: WATCHER_EMAIL,
      isProd: true,
    },
    {
      privilegedAccess: reportBlockingThreat,
      hooks: reportBlockingThreat,
      debug: reportBlockingThreat,
      appIntegrity: reportBlockingThreat,
      // appIntegrity: () => {}, // stub — re-enabled once cert hash configured in eas.json (go-live)

      unofficialStore: onUnofficialStore,
      simulator: reportBlockingThreat,
      passcode: () => {},
      deviceBinding: () => {},
      deviceID: () => {},
      obfuscationIssues: () => {},
      devMode: () => {},
      systemVPN: () => {},
      malware: () => {},
      adbEnabled: () => {},
      multiInstance: () => {},
      timeSpoofing: () => {},
      locationSpoofing: () => {},
      unsecureWifi: () => {},
      automation: () => {},
      screenshot: () => {},
      screenRecording: () => {},
      secureHardwareNotAvailable: () => {},
    },
    {
      allChecksFinished: reportChecksFinished,
    },
  );

  useEffect(() => {
    const unsubscribe = subscribeIntegrity(setStatus);
    return unsubscribe;
  }, []);

  // Render the app immediately and let the integrity checks run in the
  // background — we no longer hold the first paint hostage to them. A blocking
  // threat (now while 'unknown', or later once checks settle to 'ok') flips the
  // status to 'compromised' and swaps in the blocked screen — see
  // security.service.ts:update, where 'compromised' overrides any prior state.
  if (status === 'compromised') {
    return <DeviceBlockedScreen />;
  }
  return <>{children}</>;
}
