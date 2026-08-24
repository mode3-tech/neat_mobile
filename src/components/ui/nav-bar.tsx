import { useCallback, useEffect } from 'react';
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

// What's currently applied, so an overlay can restore it on unmount rather than
// guessing the default — the screen behind never re-fires its focus effect,
// since it never lost focus.
let currentStyle: NavBarContentStyle = DEFAULT_NAV_BAR_STYLE;

function apply(style: NavBarContentStyle): void {
  currentStyle = style;
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

/**
 * For overlays that cover the bottom of the screen with a different surface —
 * bottom sheets, full-screen blocking states — rendered ABOVE the navigator
 * rather than as a screen, so `useFocusEffect` never fires for them.
 *
 * Restores whatever was applied before, not DEFAULT_NAV_BAR_STYLE: the screen
 * underneath keeps focus the whole time, so its own effect won't re-assert its
 * style on dismiss. A white sheet over a navy screen must hand "light" back.
 */
export function useOverlayNavBarStyle(style: NavBarContentStyle): void {
  useEffect(() => {
    const previous = currentStyle;
    apply(style);
    return () => apply(previous);
  }, [style]);
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
