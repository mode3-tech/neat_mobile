# Project: NEAT APP — Mobile Frontend

## Overview
Customer-facing digital lending mobile app built with React Native Expo.
I am the mobile frontend developer. Backend is handled by a separate team.
Timeline: 3 months | Sprint duration: 2 weeks

## Tech Stack
- **Framework:** React Native with Expo (SDK 52)
- **Language:** TypeScript (strict mode)
- **Navigation:** Expo Router 
- **State Management:** Zustand
- **Server State / API:** React Query (TanStack Query)
- **HTTP Client:** Axios
- **Styling:** NativeWind 
- **Forms:** React Hook Form + Zod validation
- **Testing:** Jest + React Testing Library

## Folder Structure
```
src/
├── app/              # Expo Router screens
├── components/
│   ├── ui/           # Base design system components (Button, Input, Card)
│   └── features/     # Feature-specific components
├── hooks/            # Custom React hooks
├── services/         # API service functions (one file per domain)
├── stores/           # Zustand stores
├── types/            # TypeScript interfaces and types
├── utils/            # Helper functions
└── constants/        # App constants, config, enums
```

## Coding Standards
- Always use TypeScript. No `any` types — use `unknown` and narrow properly
- All API response shapes must have a corresponding interface in `src/types/`
- Components must be functional with explicit return types
- Use named exports, not default exports (except screens)
- All forms must use React Hook Form + Zod schema validation
- Never hardcode strings — use constants or i18n keys
- All monetary values must be handled as integers (kobo/cents), formatted only at display layer

## API & Environment
- Base URL is injected via environment variable: `process.env.EXPO_PUBLIC_API_URL`
- All API calls go through `src/services/` — never call axios directly in a component
- Backend team provides Postman collection — check `/docs/api-contracts/` for latest
- Auth uses JWT — access token + refresh token pattern
- Token storage: Expo SecureStore (never AsyncStorage for sensitive data)

## Current Sprint Context
<!-- Update this every sprint -->
**Sprint 1 (Feb 09 - Feb 22)**
Working on: Project setup, registration framework, UI framework & design system, security and authentication

## Key Business Rules
- BVN is exactly 11 digits — always validate this
- Phone numbers are Nigerian format (+234)
- Loan amounts and repayment figures must always match backend calculation exactly — never calculate independently on frontend, fetch from API
- GSI consent must be explicitly logged — never skip or mock this flow
- Interest rates and repayment schedules come from backend — display only, no frontend calculation

## Third Party Integrations (Frontend-facing)
- BVN verification — backend handles, frontend shows result
- OTP via SMS and Email
- Payment Gateway (TBD — update when confirmed)
- Card issuance provider (TBD — Sprint 5)

## Design System
- Primary color: [add hex]
- Font: [add font name]
- Figma link: [add link]
- Spacing scale: multiples of 4px

## Security Rules (Non-negotiable)
- Never log sensitive data (BVN, account numbers, tokens) to console
- All auth-related screens must prevent screenshot on Android (`FLAG_SECURE`)
- Session timeout after [X] minutes of inactivity
- Biometric authentication supported where available

## What NOT to Do
- Do not install new packages without checking with team first
- Do not mock or skip BVN, OTP, or GSI flows even in dev
- Do not store tokens in AsyncStorage
- Do not calculate loan figures on the frontend




Also, use comments sparingly. only comment on complex code