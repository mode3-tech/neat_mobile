# App fonts

Empty on purpose. The app currently ships **no** custom typeface — every weight renders as the
platform system font. Stage 2 of the redesign drops the `.ttf`/`.otf` files here.

**One file per weight.** Android does not synthesise font weights, so a single `Inter.ttf` plus
`fontWeight: '600'` renders as *regular* Inter on a real device — silently, no error. Each weight
needs its own file registered under its own family name:

```
Inter-Regular.ttf   →  'Inter-Regular'
Inter-Medium.ttf    →  'Inter-Medium'
Inter-SemiBold.ttf  →  'Inter-SemiBold'
Inter-Bold.ttf      →  'Inter-Bold'
```

The family name on the right is whatever key you give it in `fontAssets()` in
[`src/theme/typography.js`](../../src/theme/typography.js) — that key *is* the name React Native
knows the font by. Keeping it identical to the filename is the convention here; the two maps in
that file are the only place these names appear.

Fonts are bundled into the binary, so adding them needs a **new native build** — an OTA update
will not deliver them.

See `docs/redesign/README.md` → "Stage 2 — swapping the typeface" for the full procedure.
