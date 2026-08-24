import { useCallback } from 'react';
import { Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as NavigationBar from 'expo-navigation-bar';

/**
 * Android system navigation bar button colour, per screen. Applied on focus,
 * reverted to DEFAULT_NAV_BAR_STYLE on blur.
 *
 * `style` follows <StatusBar> semantics — it names the content, not the
 * surface: "light" = white buttons, for dark screens.
 *
 * Only takes effect with `androidNavigationBar.enforceContrast: false`
 * (app.config.js) and three-button navigation.
 */

type NavBarContentStyle = 'light' | 'dark';

// Most screens are white, so dark buttons are the resting state.
const DEFAULT_NAV_BAR_STYLE: NavBarContentStyle = 'dark';

function apply(style: NavBarContentStyle): void {
  if (Platform.OS !== 'android') return;
  // Flip: expo-navigation-bar's "style" names the surface, ours names the ink.
  NavigationBar.setStyle(style === 'light' ? 'dark' : 'light');
}

/**
 * Sets the app-wide resting value. Call once from the root layout, at **module
 * scope** — not from an effect. React flushes child effects before the parent's,
 * so from inside RootLayout's mount effect this runs *after* the first screen's
 * <NavBar> focus effect and clobbers it back to the default.
 */
export function initNavBarStyle(): void {
  apply(DEFAULT_NAV_BAR_STYLE);
}

export function NavBar({ style }: { style: NavBarContentStyle }): null {
  useFocusEffect(
    useCallback(() => {
      apply(style);
      return () => apply(DEFAULT_NAV_BAR_STYLE);
    }, [style]),
  );

  return null;
}
