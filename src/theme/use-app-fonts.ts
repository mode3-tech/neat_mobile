import { useEffect } from 'react';
import { useFonts } from 'expo-font';

import { fontAssets } from './typography';

/**
 * Loads the app typeface and reports whether the UI is safe to render.
 *
 * TODAY THIS IS A NO-OP. `fontAssets()` is empty, and expo-font's `useFonts`
 * seeds its state with `isMapLoaded(map)` — and `Object.keys({}).every(...)` is
 * `true` — so `loaded` is already `true` on the FIRST render. No extra frame,
 * no added splash delay, no font flash.
 *
 * Stage 2 adds the four font files to `fontAssets()` in src/theme/typography.js
 * and this starts doing real work with no change here or in _layout.tsx. At
 * that point `loaded` is false for the first render or two; the caller holds
 * the render back, the native splash stays up (it is only hidden from
 * src/app/index.tsx, which cannot mount until the root layout renders), and the
 * first painted text is already in the right typeface.
 */
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts(fontAssets());

  useEffect(() => {
    if (error) {
      console.warn('[theme] font load failed, falling back to system font', error);
    }
  }, [error]);

  // Fail open. A missing or corrupt font file should downgrade the typeface,
  // never leave the app parked on the splash screen forever.
  return loaded || error !== null;
}
