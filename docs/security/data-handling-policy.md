# NeatPay Mobile — Data Handling Policy

**Audience:** Isecurdata Limited (Cybersecurity Advisory & Assurance)
**Scope:** NeatPay mobile application (React Native / Expo, customer app)
**Mapped to audit document:** `DMob_App_Developer_N.E.A.T.pdf` §5.3 (Data Protection Design) and §5.4 (Mobile Security Design)

This document describes how Personally Identifiable Information (PII) and authentication credentials are handled on the mobile client. It reflects the current implementation; every claim is verifiable in the linked source files.

---

## 1. Data Classification

| Field | Source | Sensitivity | Notes |
|---|---|---|---|
| BVN | User input | **Restricted** (NDPA — financial identifier) | 11 digits |
| NIN | User input | **Restricted** (NDPA — government identifier) | 11 digits |
| Phone number | Returned from BVN verification | **Confidential** (PII) | E.164 format |
| Full name | Returned from BVN/NIN verification | **Confidential** (PII) | |
| Date of birth | Returned from BVN/NIN verification | **Confidential** (PII) | |
| Email address | User input (optional) | **Confidential** (PII) | Sign-up flow allows skip |
| Account password | User input | **Secret** (credential) | Never sent to disk |
| 4-digit transaction PIN | User input | **Secret** (credential) | Never sent to disk |
| OTP codes (SMS, email) | Backend issuance | **Secret** (single use, short-lived) | 6 digits, server-validated |
| `verification_id` (BVN/NIN/phone/email) | Backend response | **Confidential** (opaque token) | Used in lieu of raw identifiers in registration payload |
| `access_token` / `refresh_token` | Backend response on login | **Secret** (credential) | JWT |
| Device key (`user_binding_key`) | Generated on-device | **Secret** (private key) | Hardware-backed, non-exportable |

---

## 2. Storage

### 2.1 Sign-up state — in-memory only

All sign-up PII (BVN, NIN, name, DOB, phone, email, password, transaction PIN) is held exclusively in a Zustand store in process memory.

- Source: [src/stores/sign-up.store.ts](../../src/stores/sign-up.store.ts)
- The store is created with `create<SignUpState>(...)` — **no `persist` middleware is attached**, so values never reach AsyncStorage, SecureStore, or any disk-backed store.
- Field initialization at [sign-up.store.ts:37-52](../../src/stores/sign-up.store.ts#L37-L52); `reset()` action at [sign-up.store.ts:77](../../src/stores/sign-up.store.ts#L77) sets every field back to the empty string / null initial state.

### 2.2 Cross-screen sign-up persistence — backend-side, claim-token model

To survive app kills mid-registration, the **backend** holds the in-progress registration state under a job ID. The mobile client only persists an opaque `claimToken` and an `expiresAt` timestamp, never raw identifiers. Resumption is gated by a short-lived token; the backend re-validates everything on claim.

### 2.3 Authentication tokens — Expo SecureStore

Access and refresh tokens are stored only in `expo-secure-store` (iOS Keychain / Android EncryptedSharedPreferences via Keystore). They are never written to AsyncStorage or any other persistent store on the device.

### 2.4 Device key — hardware-backed Keystore

A device-binding asymmetric key is generated and stored in the platform secure enclave via `react-native-device-crypto`, under alias `user_binding_key`. The private key is non-exportable and non-extractable. The corresponding device ID is stored in SecureStore under key `secure_device_id` and attached to every API request as `X-Device-ID`.

### 2.5 Negative assertion — no PII in AsyncStorage

`@react-native-async-storage/async-storage` is **not** in `package.json`. No PII is written to plaintext on-device storage by the application code.

---

## 3. Transmission

- All API traffic is HTTPS (TLS 1.2+) terminated by the backend at `EXPO_PUBLIC_API_URL`. The base URL is read from environment at [src/services/api.ts:112](../../src/services/api.ts#L112).
- Raw BVN is transmitted only to `POST /auth/validate-bvn`. Raw NIN only to `POST /auth/validate-nin`. Both endpoints return an opaque `verification_id` that supersedes the raw identifier for all downstream operations including `POST /auth/register`.
- Every authenticated request additionally carries:
  - `Authorization: Bearer <access_token>`
  - `X-Device-ID: <device id bound to hardware key>`
- **Certificate pinning** is on the roadmap. It is presently deferred because the backend is hosted on Render with auto-rotated Let's Encrypt certificates; implementation will follow the planned backend migration to a host with controllable cert lifecycle. This decision is documented and will be revisited.

---

## 4. Retention and Erasure

The sign-up store is cleared via `reset()` at every terminal state in the registration flow:

| Trigger | Call site |
|---|---|
| Successful claim of registration job | [registration-processing.tsx:98](../../src/app/(sign-up)/registration-processing.tsx#L98) |
| Registration session expired during polling | [registration-processing.tsx:74](../../src/app/(sign-up)/registration-processing.tsx#L74) |
| Claim failed | [registration-processing.tsx:105](../../src/app/(sign-up)/registration-processing.tsx#L105) |
| User cancelled and navigated to sign-in | [registration-processing.tsx:203](../../src/app/(sign-up)/registration-processing.tsx#L203) |

Because the store is in-memory only, process termination (app force-close, OS reclaim) also fully erases the state.

Authentication tokens are explicitly removed from SecureStore on logout and on refresh-token failure (see the response interceptor at [src/services/api.ts:99-103](../../src/services/api.ts#L99-L103) which calls `useAuthStore.getState().clearAuth()`).

---

## 5. Logging

- The axios request interceptor at [src/services/api.ts:44-56](../../src/services/api.ts#L44-L56) attaches headers only and **does not log** request bodies, headers, or query strings.
- The axios response interceptor at [src/services/api.ts:59-107](../../src/services/api.ts#L59-L107) handles 401 token refresh and **does not log** response bodies or error payloads.
- All `console.*` statements in `src/services/auth.service.ts` (lines 194–198) are commented out and do not execute.
- No `console.*` statements exist anywhere under `src/app/(sign-up)/` (the screens that handle BVN, NIN, password, and PIN entry).
- No third-party crash reporter, analytics SDK, or session-replay library is installed (verified: `package.json` contains no Sentry, Bugsnag, Crashlytics, Firebase Analytics, Mixpanel, Amplitude, FullStory, LogRocket, or equivalent).

The two active `console.warn` calls in [src/services/notification.service.ts](../../src/services/notification.service.ts) (lines 52, 76) carry no PII — they emit literal device-state diagnostics ("Push notifications require a physical device", "EAS project ID not found in app config").

---

## 6. Backend Handoff

After BVN and NIN are validated, raw identifiers are no longer used by the client. The registration payload sent to `POST /auth/register` carries only:

- `bvn_verification_id`, `nin_verification_id`, `phone_verification_id`, `email_verification_id` (opaque tokens)
- Hashed credentials and device-binding public key material
- Phone number (already verified)

Reference: [src/services/auth.service.ts](../../src/services/auth.service.ts) `registerUser` and the registration handler in [src/app/(sign-up)/enable-biometrics.tsx](../../src/app/(sign-up)/enable-biometrics.tsx) which reads `bvnData?.verification_id` and `ninData?.verification_id` from the store rather than raw BVN/NIN.

This means:
- The backend can audit who handled raw BVN/NIN by inspecting traffic to the two validation endpoints alone.
- The registration endpoint and all subsequent endpoints operate on tokens, not PII.

---

## 7. Outstanding Items (mapped to Isecurdata §5.4)

| Control | Status |
|---|---|
| Secure storage approach | ✅ Implemented (this document, §2) |
| Certificate pinning | ⏳ Deferred until backend migrates off Render |
| Root / jailbreak detection | 🚧 In implementation (separate commit) |
| Code obfuscation | ⏳ To be configured at release-build time (Hermes bytecode + ProGuard / R8 for Android, default Swift symbol stripping for iOS) |

Updates to this document will accompany the commits that close out each remaining item.
