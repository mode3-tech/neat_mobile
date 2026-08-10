/**
 * Types for palette.js.
 *
 * palette.js has to stay CommonJS so tailwind.config.js can require() it at
 * build time, so the literal types are declared here instead. Keep in sync when
 * adding a token.
 */

export type ColorToken = string;

export declare const raw: {
  brand: Record<50 | 100 | 200 | 500 | 900 | 950, ColorToken>;
  gray: Record<0 | 50 | 100 | 150 | 200 | 300 | 400 | 500 | 700 | 900 | 1000, ColorToken>;
  red: Record<50 | 100 | 200 | 500 | 600, ColorToken>;
  green: Record<50 | 75 | 100 | 500 | 600, ColorToken>;
  amber: Record<50 | 100 | 500 | 600 | 700, ColorToken>;
  orange: Record<50 | 100 | 200 | 500, ColorToken>;
  blue: Record<50 | 500, ColorToken>;
  purple: Record<50 | 75 | 100 | 500, ColorToken>;
  pink: Record<50 | 75 | 500, ColorToken>;
  teal: Record<500 | 600, ColorToken>;
  cyan: Record<500, ColorToken>;
  drift: Record<
    | 'ink1'
    | 'ink2'
    | 'ink3'
    | 'ink4'
    | 'faint'
    | 'surface1'
    | 'surface2'
    | 'surface3'
    | 'surface4'
    | 'warnSurface',
    ColorToken
  >;
};

export declare const colors: {
  primary: ColorToken;
  primaryDark: ColorToken;
  primaryDeep: ColorToken;
  primarySurface: ColorToken;
  primarySurfaceStrong: ColorToken;
  primaryBorder: ColorToken;

  ink: ColorToken;
  inkBody: ColorToken;
  inkSoft: ColorToken;
  inkMuted: ColorToken;
  inkInverse: ColorToken;

  surface: ColorToken;
  surfaceMuted: ColorToken;
  surfaceSubtle: ColorToken;
  surfaceInput: ColorToken;
  surfaceDisabled: ColorToken;

  line: ColorToken;
  lineSubtle: ColorToken;
  lineStrong: ColorToken;

  success: ColorToken;
  successBright: ColorToken;
  successSurface: ColorToken;
  successSurfaceAlt: ColorToken;
  successSurfaceStrong: ColorToken;

  danger: ColorToken;
  dangerStrong: ColorToken;
  dangerSurface: ColorToken;
  dangerSurfaceStrong: ColorToken;
  dangerBorder: ColorToken;

  warning: ColorToken;
  warningStrong: ColorToken;
  warningAccent: ColorToken;
  warningSurface: ColorToken;
  warningSurfaceStrong: ColorToken;
  warningSurfaceAlt: ColorToken;
  warningBorder: ColorToken;
  warningBorderStrong: ColorToken;

  overlay: ColorToken;

  legacy: Record<
    | 'text1'
    | 'text2'
    | 'text3'
    | 'text4'
    | 'textFaint'
    | 'surface1'
    | 'surface2'
    | 'surface3'
    | 'surface4'
    | 'warningSurface',
    ColorToken
  >;
};

export type AccentName =
  | 'airtime'
  | 'transfer'
  | 'data'
  | 'electricity'
  | 'cable'
  | 'betting'
  | 'reward'
  | 'loan'
  | 'loanAlt'
  | 'fallback';

export declare const accents: Record<AccentName, { surface: ColorToken; icon: ColorToken }>;

export declare const confetti: ColorToken[];

export declare const tailwindColors: Record<string, unknown>;
