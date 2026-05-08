import { useEffect, useState, type PropsWithChildren } from 'react';
import { View } from 'react-native';
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

const SPLASH_BG = '#472FF8';
const FALLBACK_TIMEOUT_MS = 15_000;
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
      // appIntegrity: reportBlockingThreat,
      appIntegrity: () => {}, // TODO: re-enable once cert hash configured in eas.json

      unofficialStore: reportBlockingThreat,
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
    // Defensive fallback: if neither a blocking threat nor
    // allChecksFinished fires (e.g., library failure), unblock the user
    // after this timeout rather than stranding them on the splash. A
    // late-arriving threat after this point can still upgrade the
    // status to 'compromised' — see security.service.ts:update.
    const timer = setTimeout(() => {
      if (getIntegrityStatus() === 'unknown') {
        reportChecksFinished();
      }
    }, FALLBACK_TIMEOUT_MS);
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  if (status === 'unknown') {
    return <View style={{ flex: 1, backgroundColor: SPLASH_BG }} />;
  }
  if (status === 'compromised') {
    return <DeviceBlockedScreen />;
  }
  return <>{children}</>;
}
