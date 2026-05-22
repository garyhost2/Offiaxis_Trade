# Offiaxis Trade App Audit

Date: 2026-05-20

## Executive Summary

Offiaxis Trade is not only a frontend anymore, but the app still behaves mostly like a frontend-first prototype. The repo contains a large Expo mobile app, a newer TypeScript Fastify backend, a Python FastAPI service for AI and older P&L endpoints, and shared schema packages. The largest gap is not that no backend exists. The largest gap is that the mobile screens are still heavily wired to mock data, in-memory stores, local helper modules, and direct unauthenticated fetch calls.

The npm vulnerabilities do not justify a full rewrite away from Expo by themselves. Expo is already React Native with a managed toolchain. Moving to bare React Native would keep the npm ecosystem, add native iOS/Android maintenance, and make security patching harder unless the app has a specific unsupported native requirement. The safer direction is to keep Expo for now, move to EAS/dev builds when needed, clean up dependency and lockfile drift, and focus engineering time on backend integration, auth, storage, RBAC, and release hardening.

Recommended technical direction: use the TypeScript Fastify backend as the public API, keep the Python service as a private AI worker behind Fastify, and migrate the Expo frontend screen-by-screen from mock/local state to authenticated RTK Query endpoints.

## Current Architecture

### Frontend

- Location: `frontend/`
- Stack: Expo Router, React Native 0.79.5, React 19, Redux Toolkit Query, AsyncStorage, Expo Camera/Image Picker/File System/Sharing.
- Entry/navigation: `frontend/app/_layout.tsx` registers onboarding screens and `(tabs)`.
- Main tabs: `frontend/app/(tabs)/_layout.tsx` exposes Home, Projects, Tracker, and Menu.
- API client: `frontend/shared/store/baseApi.ts` defines RTK Query base API with bearer-token support.
- Current issue: most visible screens do not use those RTK Query hooks yet. They still import `frontend/utils/projectsData.ts`, local mock arrays, or direct `fetch` calls.

### TypeScript Backend

- Location: `apps/backend/`
- Stack: Fastify, Zod, MongoDB/Mongoose, Firebase Admin auth, Cloudinary, Sentry, FCM helper.
- Entrypoint: `apps/backend/src/index.ts` registers auth, projects, tracker, change orders, financials, receipts, inventory, schedule, and permits routers.
- Auth middleware: `verifyFirebaseToken` and `attachRole` run globally except public auth/health routes.
- Data isolation: most repositories include `orgId` filters and indexes. This is a good foundation for multi-company separation.

### Python Backend / AI Service

- Location: `backend/`
- Stack: FastAPI, Motor/PyMongo, AI helper modules for permit extraction and site notes.
- Contains duplicate/older endpoints for P&L, projects, change orders, permit extraction, and site notes.
- Docker service name: `ai-service` in `docker-compose.yml`.
- Current issue: it is exposed as its own service and duplicates API ownership. It should become a private internal worker called by Fastify, not a second public backend contract.

### Shared Package

- Location: `packages/shared/`
- Contains Zod schemas for auth, projects, tracker, financials, receipts, inventory, schedule, permits, and change orders.
- Current issue: schemas exist, but the frontend still defines many local interfaces and the backend also defines local module schemas. The shared package is underused.

## User Flow Map

### Onboarding And Auth

Current visible flow:

1. `/` shows the OffiAxis login screen.
2. Email login navigates to `/email-login`.
3. Email login is still mock-era: it pre-fills a real-looking email/password and calls legacy `login()`, then navigates to `/(tabs)/home`.
4. Google login is also mock-era and calls `login()` directly.
5. Signup validates name/email/password locally, then goes to `/role-selection`.
6. Role selection splits users into General Contractor / Project Manager or Trade Professional.
7. GC/PM goes to subscription plans. Trade goes to trade subscription.
8. Subscription/payment completion calls legacy `login()` and navigates to home.

Critical auth finding: `AuthContext` has real `signIn` and `signUp`, but the visible onboarding screens mostly call legacy `login()`. That helper currently calls `signIn('', '')` without awaiting it. So the UI can enter the app without a valid user or token.

### Main App Tabs

- Home: dashboard, employees, activities, P&L cards, portfolio shortcuts. Uses local project data and mock activity/user data.
- Projects: company/project management, project creation/editing, status/date flows, gallery/P&L shortcuts. Uses `projectsData.ts` in-memory data.
- Tracker: lets the user choose between Simple, Common, Automated, and Admin tracker variants. UI is mostly local state and mock timesheet/transcription data.
- Menu: navigation hub for Settings, Users & Roles placeholder, Schedule, Inventory, Receipts, Knowledge Center, Site Notes AI, and E-Contracts.

### Feature Screens

- Project Details: large project workspace with property details, permits, change orders, receipts/P&L style logic, gallery, and modals.
- Profit & Loss: direct backend fetches plus local data aggregation from change orders, permits, and receipts.
- Schedule: local calendar derived from projects and in-memory calendar sync.
- Inventory: large mock-data screen with tools/materials/checkouts.
- Receipts: local mock receipts and project data.
- Gallery/Portfolio/Materials/Knowledge Center: mostly local stores in `projectsData.ts`.
- Site Notes AI: captures photos/voice text and fetches a site-notes endpoint directly, but the endpoint/base URL is inconsistent with the newer backend path.

## Backend Coverage

Implemented in the TypeScript backend:

| Area | Implemented routes | Notes |
| --- | --- | --- |
| Auth | sign-up, sign-in, register, me, role update | Flow has token contract problems. |
| Projects | list/create/get/update/delete | Uses orgId scoping. |
| Tracker | clock in/out, breaks, sessions, manual, review | Has some supervisor role checks. |
| Change Orders | list/create/get/update/delete | Uses orgId scoping and status log logic. |
| Financials/P&L | expenses, income, summary, breakdown | Exists in TS backend and duplicated in Python. |
| Receipts | list/create/get/update/delete | Metadata only, no real upload pipeline. |
| Inventory | list/create/get/update/delete | Backend exists but frontend screen is mock-heavy. |
| Schedule | list/create/get/update/delete | Backend exists but schedule UI uses local project/calendar data. |
| Permits | list/create/get/update/delete/extract | Extract route contract does not match frontend/Python. |
| Notifications | FCM helpers only | No router, device registration flow, or event triggers. |

## Critical Gaps

### P0 - Auth Token Contract Is Broken

The backend sign-in verifies email/password through Firebase REST, then returns a Firebase custom token. The protected backend middleware uses `verifyIdToken`, which expects an ID token, not a custom token. A custom token must be exchanged by a Firebase client SDK before it can be used as a bearer token.

Current frontend does not use Firebase client auth and does not exchange custom tokens. Even if the UI switched from mock login to `signIn`, protected API requests would fail unless the backend returns the REST `idToken` or the frontend signs in with the custom token and stores the resulting ID token.

Also, `FIREBASE_WEB_API_KEY` is optional in config but required by sign-in logic.

### P0 - API Bearer Token Is Not Wired Into RTK Query

`baseApi` supports `setTokenProvider`, but no app code calls it. RTK Query endpoints will not send the bearer token today. Direct `fetch` calls also do not attach auth headers.

### P0 - App Has No Route Guard

The `(tabs)` screens are registered directly and can be reached without a valid authenticated user. The onboarding screens navigate into the app even when auth fails.

### P0 - Frontend Screens Are Mostly Not Connected To Backend APIs

The repo has API wrappers under `frontend/features/*/api.ts`, but visible screens mostly use:

- `frontend/utils/projectsData.ts` in-memory project/portfolio/material/training/template stores.
- `frontend/utils/calendarSync.ts` in-memory calendar store.
- Mock arrays inside screens like inventory, receipts, home, activity, and tracker.
- Direct fetch calls with inconsistent environment variables.

This makes the product look feature-rich while persistence, multi-user sync, and real authorization are still missing.

### P0 - AI Service Endpoint Contracts Do Not Line Up

There are three different expectations:

- Frontend permits API sends `{ imageBase64 }` to `/api/extract-permit`.
- TypeScript backend expects `{ imageUrl }` for `/api/extract-permit`, then calls the AI service with `{ image_url }` at `/extract-permit`.
- Python FastAPI expects `{ imageBase64 }` at `/api/extract-permit`.

Site Notes has a similar split: the frontend calls `/api/site-notes/process` directly, the Python server implements it, but the TypeScript backend has no site-notes router/proxy.

### P0 - File Upload Pipeline Is Incomplete

Cloudinary upload helper exists, but routers do not expose a multipart/base64 upload flow for receipts, permits, project photos, portfolio photos, site-note images, or contract documents. Many screens store local URIs, base64 data, or image URLs without a consistent upload/storage contract.

## Security And Access Control Findings

### High Risk

- Mock credentials are prefilled in email login and signup screens.
- Mock login paths let users enter the app without a valid session.
- Backend RBAC is partial. Tracker review and auth role updates have checks, but projects, financials, receipts, inventory, permits, schedule, and change order mutations mainly rely on authentication plus orgId, not per-role permissions.
- Python FastAPI service allows all CORS origins and has no auth middleware. It should not be public in production.
- AI endpoints accept image/base64 payloads without strong file size, MIME, content validation, quota, or per-endpoint rate limits.
- Direct mobile fetches do not include bearer tokens and use inconsistent `EXPO_PUBLIC_BACKEND_URL` vs `EXPO_PUBLIC_API_URL` naming.

### Medium Risk

- MongoDB in docker-compose has no auth. Fine for local development, not production.
- Firebase private key and Cloudinary secrets are passed through docker-compose environment variables. Use platform secrets in deployment.
- Sentry is optional; production should fail deployment or alert if observability is not configured.
- No `.env.example` documents required variables for frontend, Fastify, and AI service.
- `frontend/app.json` disables Expo updates. That is acceptable for conservative releases, but it means urgent JS patches require full app store or internal distribution rebuilds.

### Repo Hygiene

- Root has npm workspaces and `package-lock.json`; frontend declares Yarn 1 and has both `yarn.lock` and `package-lock.json`. Choose one package manager per workspace.
- Root `.gitignore` contains repeated generated `-e` blocks. Not dangerous, but messy and worth cleaning.
- Backend Dockerfile uses `npm install` instead of a lockfile-based reproducible install.

## Dependency Audit

Audit commands were run read-only with `npm audit --json`.

### Root / Backend Workspace

- Total: 8 low vulnerabilities.
- Reported packages: `firebase-admin`, `@google-cloud/firestore`, `@google-cloud/storage`, `google-gax`, `retry-request`, `teeny-request`, `http-proxy-agent`, `@tootallnate/once`.
- Main action: update Firebase Admin / Google packages after testing auth behavior.
- Risk level: low, not a rewrite reason.

### Frontend Workspace

- Full audit: 21 total vulnerabilities: 1 low, 9 moderate, 11 high.
- Production audit: 19 total vulnerabilities: 9 moderate, 10 high.
- High-severity packages reported include `lodash`, `tar`, `node-forge`, `undici`, `glob`, `minimatch`, `picomatch`, `flatted`, `fast-uri`, `@xmldom/xmldom`, and `@isaacs/brace-expansion`.
- Main action: upgrade Expo/RN-compatible dependency set and remove lockfile drift. Do not blindly run `npm audit fix --force` because it can break Expo SDK compatibility.

Dependency conclusion: the frontend audit needs cleanup, but a bare React Native rewrite would not remove these problems. It would still use npm packages and likely add more native dependency risk. The correct fix is controlled upgrades, lockfile cleanup, and CI audit policy.

## Platform Recommendation

Keep Expo in the near term.

Why:

- Expo is already React Native. It is not a separate web-like framework that blocks native apps.
- The app uses common Expo-supported capabilities: camera, image picker, file system, sharing, router, vector icons, media permissions.
- A bare RN migration would add Xcode/Gradle/native module maintenance before the backend and auth are ready.
- Dependency vulnerabilities are better solved by upgrade discipline and package selection than by changing the app shell.

Recommended platform path:

1. Stay on Expo managed workflow while fixing auth and backend integration.
2. Use EAS Build / development builds instead of Expo Go when native behavior must match production.
3. Use Expo prebuild only if a required native SDK cannot run in managed Expo.
4. Consider bare RN only after backend, auth, uploads, offline sync, and production data model are stable.

## Missing Backend/Product Capabilities

These are the main missing pieces before the app can be production-grade:

- Real auth flow: email/password, Google, password reset, token refresh, logout, session expiry UX.
- Company/org onboarding: create org, invite users, accept invite, assign role, remove user.
- Subscription/billing backend: plans, seats, add-ons, trials, payment provider, entitlement checks.
- Backend RBAC per endpoint/action.
- Unified project data model replacing `projectsData.ts`.
- File upload service for receipts, permits, photos, portfolios, contracts, and AI captures.
- Site Notes AI proxy in Fastify, with auth, rate limits, storage, and saved sessions.
- Permit extraction contract fix and persisted extracted data.
- Notifications: device token registration, scheduled reminders, assignment updates, low stock, overdue timesheets.
- Offline queue integration for tracker and possibly field notes/photos.
- Audit/activity log backed by MongoDB instead of local AsyncStorage mock history.
- Tests for auth, repositories, API contracts, mobile screen integration, and critical workflows.

## Recommended Roadmap

### Phase 0 - Stabilize The Foundation

- Pick package manager and lockfile strategy.
- Upgrade Expo-compatible dependencies and rerun audit.
- Add `.env.example` files for frontend, Fastify, and AI service.
- Fix TypeScript diagnostic by updating backend `moduleResolution` or adding the recommended deprecation setting.
- Decide that Fastify is the public API and Python is private AI-only.

### Phase 1 - Fix Auth And API Client

- Replace legacy `login()` paths with real `signIn` / `signUp` calls.
- Fix Firebase token contract: return/store valid ID token or add Firebase client SDK custom-token exchange.
- Call `setTokenProvider` from `AuthProvider`, or move token into Redux/auth state used by `baseApi`.
- Add route guards around `(tabs)` and onboarding redirects.
- Require `FIREBASE_WEB_API_KEY` when email/password auth is enabled.

### Phase 2 - Connect Core Business Flows

- Projects: migrate Projects and Project Details from `projectsData.ts` to backend API.
- P&L: move local change-order/receipt/permit aggregation into backend financial summary endpoints.
- Tracker: connect clock-in/out, breaks, manual entries, review, and offline queue.
- Schedule: move calendar events to backend and sync project milestone dates server-side.
- Inventory/Receipts: connect screens to RTK Query APIs.

### Phase 3 - Files And AI

- Add authenticated upload endpoints through Fastify.
- Store files in Cloudinary or object storage and persist metadata in MongoDB.
- Proxy permit extraction and site notes through Fastify with rate limits and org/user context.
- Save AI recording sessions, generated punch lists, checklists, materials, and linked photos.

### Phase 4 - Production Hardening

- Implement backend RBAC middleware per action.
- Add test coverage for auth, org isolation, RBAC, file uploads, financial calculations, and AI endpoints.
- Add CI: typecheck, lint, audit, backend tests, frontend checks.
- Add deployment secrets, production MongoDB with auth/TLS, Sentry, logging, backups, and monitoring.

## Verification Notes

- VS Code diagnostics currently show one TypeScript config issue in `apps/backend/tsconfig.json`: `moduleResolution=node10` is deprecated for TypeScript 7.
- I did not run destructive commands or dependency fixes.
- I did not run app servers as part of this audit.
- Dependency audits were read-only.

## Bottom Line

Do not rewrite the app because of npm audit output. Treat this as a backend integration and production-hardening project. The app already has a lot of UI value, and the newer Fastify backend gives you a usable foundation. The fastest safe path is to fix auth/token handling, standardize API access, migrate the highest-value screens away from mock data, and keep Expo until there is a concrete native requirement that Expo cannot satisfy.