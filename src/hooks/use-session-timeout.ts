import { useCallback, useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import type { Router } from 'expo-router';

import { useAuthStore } from '@/stores/auth.store';

const SESSION_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes

export function useSessionTimeout(router: Router) {
  //  return { onTouchActivity: () => false };
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backgroundTimestampRef = useRef<number | null>(null);
  const isTimedOutRef = useRef(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const routerRef = useRef(router);
  routerRef.current = router;

  const handleTimeout = useCallback(() => {
    if (isTimedOutRef.current) return;
    isTimedOutRef.current = true;

    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }

    useAuthStore.getState().clearAuth();
    // Navigation is handled by the auth guard in _layout.tsx
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (!useAuthStore.getState().isAuthenticated) return;

    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(handleTimeout, SESSION_TIMEOUT_MS);
  }, [handleTimeout]);

  const onTouchActivity = useCallback(() => {
    resetInactivityTimer();
    return false;
  }, [resetInactivityTimer]);

  // AppState listener — background/foreground tracking
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        const prev = appStateRef.current;
        appStateRef.current = nextState;

        if (!useAuthStore.getState().isAuthenticated) return;

        // Going to background/inactive from active
        if (prev === 'active' && nextState !== 'active') {
          backgroundTimestampRef.current = Date.now();
          if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
            inactivityTimerRef.current = null;
          }
        }

        // Coming back to foreground
        if (nextState === 'active' && prev !== 'active') {
          if (backgroundTimestampRef.current) {
            const elapsed = Date.now() - backgroundTimestampRef.current;
            backgroundTimestampRef.current = null;
            if (elapsed >= SESSION_TIMEOUT_MS) {
              handleTimeout();
              return;
            }
          }
          resetInactivityTimer();
        }
      },
    );

    return () => subscription.remove();
  }, [handleTimeout, resetInactivityTimer]);

  // Auth subscription — start/stop timers on login/logout
  useEffect(() => {
    const unsubscribe = useAuthStore.subscribe((state, prevState) => {
      if (state.isAuthenticated && !prevState.isAuthenticated) {
        isTimedOutRef.current = false;
        resetInactivityTimer();
      }
      if (!state.isAuthenticated && prevState.isAuthenticated) {
        if (inactivityTimerRef.current) {
          clearTimeout(inactivityTimerRef.current);
          inactivityTimerRef.current = null;
        }
        backgroundTimestampRef.current = null;
      }
    });

    // Start timer if already authenticated on mount
    if (useAuthStore.getState().isAuthenticated) {
      resetInactivityTimer();
    }

    return () => {
      unsubscribe();
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [resetInactivityTimer]);

  return { onTouchActivity };
}
