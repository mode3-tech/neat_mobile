# NEATPay Mobile

React Native / Expo app for NEATPay — a Nigerian fintech app covering account opening
(BVN/NIN + liveness), transfers, savings, loans, and VAS (airtime, data, cable,
electricity). Ships on Android via EAS; iOS is set up but not yet released.

- **Package:** `com.mode3.neatmobile` · **EAS owner:** `micropayafrica`
- **Routing:** Expo Router, file-based, under [src/app/](src/app/)
- **Styling:** NativeWind (`className`); `style` only for genuinely dynamic values
- **State/data:** Zustand + TanStack Query + Axios

---

## Requirements

- Node 20+
- A **development build** — Expo Go will **not** run this app. It depends on native
  modules (`react-native-device-crypto`, `freerasp-react-native`, SMS user consent,
  `expo-notifications`), none of which exist in the Expo Go sandbox.
- Android device or emulator (min SDK 29 / Android 10)
- Android Studio, or Xcode + CocoaPods on macOS — only if you build the dev client
  locally rather than on EAS

## Setup

```bash
npm install                # postinstall runs patch-package (see patches/)
cp .env.example .env       # then set EXPO_PUBLIC_API_URL
```

You need the dev client installed on the device once. Either path works:

| | Command | When |
|---|---|---|
| **EAS build** | `eas build --profile development` → install the APK | No Android Studio / Xcode needed; builds in the cloud |
| **Local build** | `npm run android` / `npm run ios` | Faster iteration on native changes; needs the local toolchain |

After that, day-to-day work is just Metro — start it, then open the dev client on the
device and it connects:

```bash
npm start                  # expo start — auto-detects the dev client
npx expo start --dev-client  # same thing, explicit
```

Rebuild the dev client only when you add a native dependency or change
[app.config.js](app.config.js). Pure JS/TS changes never need one.

### Firebase / push notifications

`google-services.json` is **gitignored** and required for an Android build. Get it from
the Firebase console (or another dev) and drop it in the project root. Same for the
`*-firebase-adminsdk-*.json` service account key, which is only needed for server-side
push testing — never commit either.

## Environment variables

| Variable | Where it's set | Notes |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | `.env` locally, `env` block in [eas.json](eas.json) for builds | Backend base URL, includes `/api/v1`. **The host has changed before — trust `.env`/`eas.json` over docs.** |
| `EXPO_PUBLIC_APP_VARIANT` | eas.json only | `preview` \| `production`. Gates production-only behaviour such as the force-update check. |
| `EXPO_PUBLIC_ANDROID_CERT_SHA256` | eas.json only | Signing cert hash for RASP integrity checks. Differs per keystore — preview vs Play app-signing. |
| `APP_VARIANT` | eas.json only | Drives app name + package suffix in [app.config.js](app.config.js) so dev/preview/prod installs coexist on one device. |

Anything prefixed `EXPO_PUBLIC_` is **inlined into the JS bundle at build time** — it is
readable by anyone with the APK. Never put a secret behind that prefix.

## Scripts

| Command | Does |
|---|---|
| `npm start` | Metro bundler (needs an existing dev build installed) |
| `npm run android` / `npm run ios` | Native build + install + run |
| `npm test` | Jest (`jest-expo` + Testing Library) |
| `npm run test:watch` / `test:coverage` | Watch mode / coverage report |
| `npm run lint` | ESLint via `expo lint` |

> ⚠️ `npm run reset-project` is leftover Expo starter tooling. It **moves the entire app
> into `app-example/`** and leaves you a blank one. Don't run it.

## Project structure

```
src/
  app/           Expo Router screens — one folder per route group
    (sign-up)/   14-screen onboarding: BVN → phone OTP → NIN → liveness → email → PIN
    (sign-in)/   login, device binding, biometrics
    (account)/ (transfer)/ (transaction)/ (savings)/ (loan)/ (vas)/ (profile)/
    (close-account)/
    Dashboard/   post-login home
  components/    shared UI (ui/ holds primitives like otp-input)
  services/      API layer — one axios instance in services/api.ts, all services import it
  stores/        Zustand stores (auth, sign-up, …)
  hooks/         shared hooks (+ __tests__/)
  types/         API + domain types
  utils/         pure helpers (+ __tests__/)
  constants/     shared constants (BVN_LENGTH, OTP_LENGTH, colours, …)
```

Notes worth knowing before you touch the API layer:

- Every response is wrapped in an envelope — unwrap with `response.data.data`.
- There is exactly **one** axios instance. `X-Device-ID` is attached by an interceptor and
  401s trigger an automatic token refresh.
- Tokens live in `expo-secure-store` only, never AsyncStorage.

## Builds & releases

Profiles are defined in [eas.json](eas.json):

```bash
eas build --profile development   # dev client APK, internal
eas build --profile apk           # preview APK, internal (easy to sideload)
eas build --profile preview       # preview AAB, store track
eas build --profile production     # production AAB
eas submit --profile production
```

`production` and `preview` use `autoIncrement`, so `versionCode` moves every build while
`version` stays `1.0.0` — always identify a release by its versionCode.

**After every production build, read [RELEASE-PLAYBOOK.md](RELEASE-PLAYBOOK.md).** It
covers the silent / nudge / force update decision, which is a live user-facing switch on
the backend and easy to get wrong.

## Other docs

- [RELEASE-PLAYBOOK.md](RELEASE-PLAYBOOK.md) — per-release routine and update-gate policy
- [THINGS-TO-DO-BEFORE-GOING-LIVE.md](THINGS-TO-DO-BEFORE-GOING-LIVE.md)
- [THINGS-TO-DO-BEFORE-APP-STORE.md](THINGS-TO-DO-BEFORE-APP-STORE.md) — iOS specifics
- [EAS-ACCOUNT-CHANGE-CHECKLIST.md](EAS-ACCOUNT-CHANGE-CHECKLIST.md) — what breaks when the
  Expo account or keystore changes
