import { useEffect, useState } from 'react';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

/**
 * Proactive connectivity detection. Subscribes to NetInfo and exposes a single
 * `isOffline` flag for banners and submit-button guards.
 *
 * We treat the device as offline only on an *explicit* negative signal
 * (`isConnected === false`, or the reachability probe returning `false`).
 * `isInternetReachable` is `null` while NetInfo is still probing on launch —
 * treating that as offline would flash the banner on every cold start, so we
 * ignore it until it resolves.
 */
function deriveOffline(state: NetInfoState): boolean {
  return state.isConnected === false || state.isInternetReachable === false;
}

export function useNetworkStatus() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Seed with the current state so we don't wait for the first change event.
    NetInfo.fetch().then((state) => setIsOffline(deriveOffline(state)));

    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(deriveOffline(state));
    });

    return () => unsubscribe();
  }, []);

  return { isOffline };
}
