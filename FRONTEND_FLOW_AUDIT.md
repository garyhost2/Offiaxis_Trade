# Offiaxis Frontend Flow Audit

Date: 2026-05-22

## Executive Summary

The frontend is not ready for production or field testing. The app can run in Expo web, and the protected tabs can be reached through the development admin bypass, but the visible product behaves like a prototype: several key buttons have no action, many controls are not exposed as real accessible buttons on web, critical screens are still mock/local-data driven, the design system is only partially adopted, and the static quality gates fail hard.

This audit focused on the frontend user flow, button/control behavior, responsiveness, runtime accessibility, visual consistency, and current testability. The existing `APP_AUDIT.md` already covers backend/auth architecture, so this report only repeats backend/API issues when they visibly break user flows.

Recommended direction: stabilize the interaction layer first. Fix no-op controls, add a shared accessible button/control primitive, connect the most important routes to real API hooks, remove or clearly mark unfinished placeholders, then add Playwright regression coverage for login, onboarding, tabs, menu routes, projects, tracker, receipts, and project details.

## Audit Method

Sources and tools used:

- Product criteria from `PRODUCT.md`: field-first use, sunlight legibility, 44pt minimum touch targets, one primary action per screen, and fast task completion.
- Live Expo web audit at `http://localhost:8081` with Playwright browser tooling.
- Relevant Awesome Copilot methods: `playwright-tester`, `accessibility-runtime-tester`, `web-design-reviewer`, and `audit-integrity`.
- Static inspection of `frontend/app`, `frontend/components`, `frontend/contexts`, `frontend/hooks`, `frontend/features`, and `frontend/shared`.
- Static commands: `npm run lint`, `npx tsc --noEmit`, source searches, and route/control inspection.

Runtime command that successfully served the app:

```powershell
Push-Location frontend; $env:EXPO_NO_DEPENDENCY_VALIDATION='1'; $env:EXPO_OFFLINE='1'; npm run web
```

Normal `npm run web` previously failed because Expo attempted to fetch native module version metadata and hit `TypeError: fetch failed`.

## Audit Health Score

| # | Dimension | Score | Key Finding |
|---|---|---:|---|
| 1 | Accessibility | 1/4 | Login/home surfaces expose many click targets as unlabeled generic `div` elements on web. |
| 2 | Functional Controls | 1/4 | Multiple visible quick actions and footer links have no `onPress` or no user-visible outcome. |
| 3 | Responsive Design | 1/4 | Fixed sizing and tab/header clipping were observed; no reliable responsive test harness exists. |
| 4 | Theming | 1/4 | `shared/theme.ts` exists, but screens still hard-code large color/gradient vocabularies. |
| 5 | Static Quality | 0/4 | Lint fails with 54 errors/112 warnings; TypeScript fails with 109 errors. |
| **Total** | | **4/20** | **Critical: fundamental interaction and quality gates are failing.** |

## P0 Findings

### P0-1: Primary Home Quick Actions Are No-Ops

Location: `frontend/app/(tabs)/home.tsx`, quick actions section.

Evidence:

- `Clock In/Out` is rendered as a `TouchableOpacity` with no `onPress`.
- `Upload File` is rendered as a `TouchableOpacity` with no `onPress`.
- `Inventory Scanner` is rendered as a `TouchableOpacity` with no `onPress`.
- Runtime clicking on `Clock In/Out` and `Upload File` produced no route change, modal, toast, or state change.

Impact: The first action cluster on the dashboard promises core workflows but does nothing. For a field app, this blocks fast task completion and trains users not to trust the interface.

Recommendation:

- Route `Clock In/Out` to the tracker tab or open the clock modal directly.
- Route `Upload File` to a real document/attachment upload flow or remove it until implemented.
- Route `Inventory Scanner` to inventory scanning/take-from-stock flow or mark it disabled with explicit unavailable state.
- Add analytics/test IDs and Playwright assertions for each quick action.

### P0-2: Static Quality Gates Fail Before Runtime Testing Can Be Trusted

Evidence:

- `npm run lint`: 54 errors and 112 warnings.
- `npx tsc --noEmit`: 109 TypeScript errors.
- Representative issues: duplicate style keys in `frontend/app/(tabs)/projects.tsx`, duplicate style keys in `frontend/app/project-details.tsx`, implicit `any`, `never` state errors, unused imports, Unicode BOM, and duplicate imports.

Impact: Duplicate style keys and type errors can directly change UI behavior. They also make refactoring buttons/responsiveness risky because the compiler cannot protect the work.

Recommendation:

- Treat lint/typecheck as release-blocking.
- Fix duplicate keys first because they silently override styles.
- Then fix type errors in `project-details`, `projects-by-company`, `projects`, and shared modal surfaces.

### P0-3: No Frontend Regression Test Harness Exists

Evidence: `frontend/package.json` has `start`, `android`, `ios`, `web`, and `lint`, but no Playwright/Jest/Vitest scripts or config. No `frontend/playwright.config.*` file exists.

Impact: There is no repeatable way to prove buttons work, routes do not regress, modals trap focus, or responsive layouts survive changes.

Recommendation:

- Add Playwright as an audit/regression harness for Expo web.
- First specs should cover login, signup validation, route guard, dev-admin smoke, tabs, menu routes, home quick actions, receipt modal, projects navigation, and tracker selector.
- Add mobile/tablet/desktop projects at 320, 375, 390, 768, 1280, and 1920 widths.

## P1 Findings

### P1-1: Login Screen Controls Lack Accessible Roles/Labels on Web

Location: `frontend/app/index.tsx`.

Runtime evidence from the accessibility snapshot:

- `Log in with Email`, `Create New Account`, `Continue with Google`, `Forgot Password?`, `Need Help?`, and `DEV - Enter as Admin` appeared as generic clickable nodes, not named buttons.
- Keyboard Tab reached those generic `DIV` elements, but they had no role or accessible label.

Source evidence:

- Login buttons use `TouchableOpacity` without `accessibilityRole` or `accessibilityLabel`.
- Footer links are `TouchableOpacity` nodes without `onPress` handlers.

Impact: Screen-reader and keyboard users get weak semantics on the first screen. This also makes Playwright tests brittle because the app lacks reliable accessible locators.

Recommendation:

- Add a shared `AppButton`/`IconButton` abstraction that always sets role, label, state, minimum target size, disabled behavior, and loading behavior.
- Apply it first to auth/onboarding, dashboard quick actions, menu rows, modal actions, and icon-only controls.

### P1-2: Footer Auth Links Are Visible But Not Wired

Location: `frontend/app/index.tsx`.

Evidence:

- `Forgot Password?` and `Need Help?` are rendered as `TouchableOpacity` but have no `onPress`.

Impact: Users who cannot log in are offered recovery/help actions that do nothing.

Recommendation:

- Add password reset flow and help/support route, or hide these links until the flows exist.
- Add a regression test that verifies each auth footer link changes route, opens a modal, or shows a meaningful unavailable state.

### P1-3: Menu Disabled Items Are Still Exposed As Buttons

Location: `frontend/app/(tabs)/menu.tsx`.

Evidence:

- `OffiAxis Spaces` and `Users and Roles` are visually marked `Soon` and have `accessibilityState={{ disabled: item.disabled }}`, but are still rendered as `TouchableOpacity` with button semantics and pointer cursor in the web snapshot.
- `handleItemPress` returns early for disabled rows, so clicking them has no outcome.

Impact: Assistive and keyboard users encounter controls that announce like buttons but cannot complete an action. Pointer users see clickable rows that do nothing.

Recommendation:

- Render disabled menu items as non-interactive rows, or provide a real explanation/notify-me action.
- If they remain focusable, they need clear `aria-disabled` behavior and a visible explanation.

### P1-4: Protected Deep Links Are Not Testable Through The Dev Admin Shortcut

Locations: `frontend/app/index.tsx`, `frontend/contexts/AuthContext.tsx`, `frontend/app/_layout.tsx`.

Evidence:

- Runtime: after using `DEV - Enter as Admin`, direct reload or direct navigation to `/home` redirected back to `/`.
- Source: `devAdminLogin` sets in-memory state but does not persist to `AsyncStorage`, while the route guard redirects unauthenticated protected routes to `/` after reload.

Impact: This is acceptable for a temporary dev shortcut, but it blocks reliable Playwright setup for protected routes and creates confusing QA behavior.

Recommendation:

- Add an explicit e2e auth fixture or persisted dev session only in development/test builds.
- Never ship `DEV_BYPASS_TOKEN` in production builds.

### P1-5: Runtime Web Warnings Point To Styling/API Drift

Evidence from browser console:

- `shadow* style props are deprecated. Use boxShadow.`
- `props.pointerEvents is deprecated. Use style.pointerEvents.`
- `[expo-av]: Expo AV has been deprecated and will be removed in SDK 54.`

Impact: The app is already on a compatibility edge. These warnings are not just noise because styling and media capture/audio are central to receipts, site notes, and tracker flows.

Recommendation:

- Replace React Native Web deprecated shadow usage with web-compatible `boxShadow` where needed.
- Move `pointerEvents` to style usage.
- Plan migration from `expo-av` to `expo-audio`/`expo-video` before the next Expo SDK jump.

## P2 Findings

### P2-1: Menu/Header Layout Clips In The Shared Browser View

Location: `frontend/app/(tabs)/menu.tsx`.

Evidence: Screenshot captured during audit showed `Quick Access` partially hidden under the tab/header area. The integrated browser had an unusual height, so this must be re-tested in standalone Playwright projects before calling it a release-blocking responsive bug.

Impact: If reproduced on real narrow/short mobile web or landscape devices, key navigation context is obscured.

Recommendation:

- Add responsive screenshots at phone portrait, phone landscape, tablet, desktop, and wide sizes.
- Audit `Tabs` positioning on web separately from native bottom-tab behavior.

### P2-2: Design Tokens Exist But Are Not The Source Of Truth

Locations: broad use across `frontend/app` and `frontend/components`.

Evidence:

- `frontend/shared/theme.ts` defines semantic colors, spacing, touch targets, typography, shadows, and status tokens.
- Large numbers of direct hex colors and gradients remain in screens such as `trade-subscription.tsx`, `subscription-plans.tsx`, `ChangeOrdersTab.tsx`, `home.tsx`, and onboarding screens.

Impact: Visual consistency and contrast are impossible to enforce screen-by-screen. It also keeps the product in a generic blue/purple SaaS look that conflicts with `PRODUCT.md` field-first direction.

Recommendation:

- Convert shared primitives first: button, card/panel, row/list item, form field, modal, icon button, status pill.
- Move one screen at a time to semantic tokens, starting with auth, home, menu, tracker, and projects.

### P2-3: Mock Data Still Drives High-Value Screens

Evidence:

- `frontend/contexts/ActivityContext.tsx` seeds recent activity with `MOCK_ACTIVITIES`.
- `frontend/app/(tabs)/home.tsx` uses placeholder employees and mock P&L values.
- `frontend/components/TimeTrackerSimple.tsx`, `TimeTrackerCommon.tsx`, and `hooks/useTimeTrackerState.ts` use mock weekly hours/transcription data.

Impact: The app looks busy but cannot be trusted as an operational tool. Users may think time, receipts, P&L, and activity data are real.

Recommendation:

- Add explicit empty/loading/error states for real APIs.
- Replace home, projects, tracker, receipts, inventory, schedule, and activity feed with RTK Query-backed flows in priority order.

### P2-4: Direct Fetch Calls Bypass A Unified Frontend Data Layer

Evidence: direct `fetch` calls remain in `AuthContext.tsx`, `site-notes-ai.tsx`, `project-details.tsx`, and `profitloss.tsx`.

Impact: Error handling, auth headers, retries, loading states, and schema validation are inconsistent. This makes buttons feel broken when a backend call fails.

Recommendation:

- Keep auth in context if desired, but move feature calls to RTK Query endpoints.
- Standardize error toasts/inline errors and network retry behavior.

## Positive Findings

- The app can serve through Expo web once dependency validation is skipped/offline.
- Route guard behavior exists and prevents unauthenticated protected route access.
- Email login has inline validation and an accessible alert for missing credentials.
- Menu rows have better accessibility labels than most other screens.
- `frontend/shared/theme.ts` is a good foundation for a field-first design system.
- `AuthContext` now wires `setTokenProvider`, which is an improvement over the older audit state.

## Route Coverage In This Pass

Live-smoked:

- `/`
- `/email-login`
- `/home` via dev-admin bypass
- `/projects` tab route
- `/tracker` tab route
- `/menu` tab route

Source-inspected high-risk routes/components:

- `/signup`
- `/role-selection`
- `/subscription-plans`
- `/trade-subscription`
- `/time-tracker-options`
- `/project-details`
- `/profitloss`
- `/receipts`
- `/inventory`
- `/site-notes-ai`
- `TimeTrackerSimple`, `TimeTrackerCommon`, `TimeTrackerAutomated`, `TimeTrackerAdmin`
- `ChangeOrdersTab`, `ReceiptsTab`, `PLTab`
- modal components under `frontend/components/modals`

Still needs standalone Playwright route-by-route evidence:

- Project create/edit/delete flows
- Project details tabs and modals
- Tracker clock-in/out and admin review flows
- Receipt camera/gallery/manual entry flows
- Inventory scanner/take-from-stock flows
- Schedule route
- Site Notes AI capture/voice/photo flow
- E-contracts route
- Gallery and portfolio folder flows

## Triage Backlog

| Priority | Item | Owner Area | Verification |
|---|---|---|---|
| P0 | Wire or remove dashboard no-op quick actions | Home/dashboard | Playwright clicks each quick action and asserts route/modal/state. |
| P0 | Fix lint and TypeScript blockers | Whole frontend | `npm run lint` and `npx tsc --noEmit` pass. |
| P0 | Add Playwright audit harness | Frontend tooling | CI/local command runs login, tabs, menu, home quick action smoke. |
| P1 | Create shared accessible button/control primitives | Shared UI | Accessibility snapshot shows named buttons, states, and 44pt targets. |
| P1 | Fix login footer links | Auth/onboarding | Forgot password and help produce real flows or unavailable states. |
| P1 | Make disabled menu rows semantically disabled or non-interactive | Menu | Disabled rows are not clickable/focusable unless they explain next steps. |
| P1 | Add e2e auth fixture instead of memory-only dev bypass | Auth/test tooling | Protected routes can be tested after reload in test mode only. |
| P2 | Move high-value screens off mock data | Home/tracker/projects/activity | Empty/loading/error/data states are backed by API fixtures. |
| P2 | Replace direct feature fetches with RTK Query endpoints | Feature APIs | Auth headers/errors/loading states are consistent. |
| P2 | Convert hard-coded colors to semantic tokens | Design system | Token audit passes for key screens. |
| P2 | Re-test responsive layout in standalone Playwright viewports | UI QA | Screenshots pass at 320/375/390/768/1280/1920. |

## Recommended Implementation Order

1. Add Playwright config and smoke tests before broad UI rewrites.
2. Fix home quick actions and auth footer no-op controls.
3. Build shared `AppButton`, `IconButton`, `MenuRow`, `ModalAction`, and `StatusPill` primitives.
4. Apply those primitives to login, signup, home, menu, tracker header, and modal actions.
5. Fix lint/typecheck duplicate keys and type errors.
6. Migrate home/tracker/projects from mock/local data to API-backed states.
7. Run a second full visual/responsive/accessibility pass and update this report with screenshots per route.

## Verification Commands

```powershell
Push-Location frontend
$env:EXPO_NO_DEPENDENCY_VALIDATION='1'
$env:EXPO_OFFLINE='1'
npm run web
```

```powershell
Push-Location frontend
npm run lint
npx tsc --noEmit
```

Future Playwright command after test harness is added:

```powershell
Push-Location frontend
npx playwright test
```
