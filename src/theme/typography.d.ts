/**
 * Types for typography.js.
 *
 * typography.js has to stay CommonJS so tailwind.config.js can require() it at
 * build time, so the types are declared here instead. Keep in sync when adding
 * a weight.
 */

import type { TextStyle } from 'react-native';

/** The five weights the app actually uses. Matches Tailwind's `font-*` names. */
export type WeightName = 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';

/**
 * Weight name → registered font family. `undefined` = system font.
 * Android does not synthesise weights, so every weight is its own family.
 */
export declare const fonts: Record<WeightName, string | undefined>;

/**
 * expo-font asset map. A function, not an object — see the comment in
 * typography.js. Values are Metro asset module ids.
 */
export declare function fontAssets(): Record<string, number>;

/**
 * Style fragments to SPREAD into style objects:
 *   { fontSize: 16, ...weight.semibold, color: colors.ink }
 */
export declare const weight: Record<
  WeightName,
  { fontFamily: string | undefined; fontWeight: TextStyle['fontWeight'] }
>;
