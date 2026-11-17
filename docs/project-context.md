# Project context

Last reviewed: November 16, 2026. Recheck source files before implementation.

## User direction

- This repository is BoardEase's tenant mobile app. Owners/admins use the separate `boardingbills-web` project.
- Keep implementations simple and scoped to the assigned Jira task.
- When work is complete and ready to commit, always include a suggested commit title and PR description in the final response. Do not create commits unless requested.
- The user confirmed the ERD (`docs/images/erd.png`) is outdated. Do not use it as the current schema contract.
- BE-289 covered mobile setup: Expo (BE-290), React Native (BE-291), navigation (BE-292), API connection (BE-293), and testing (BE-294).
- The user authorized file organization and unused-file cleanup on `refactor/mobile-architecture-cleanup`. Authentication behavior changes are a separate task.

## Figma

- [BordEase design](https://www.figma.com/design/vDSsrawTLaWHqM4UzWEeHc/BordEase?node-id=0-1).
- File key: `vDSsrawTLaWHqM4UzWEeHc`; supplied node: `0:1`.
- Only mobile designs belong in this repository.
- Live Figma review completed November 16, 2026 through the connected Figma tools, including rendered screenshots of all five updated mobile v2 frames: Home `232:863`, bill details/payment proof `232:862`, History Electricity `232:861`, History Water `232:860`, and Account `232:859`.
- Verified screen content, Inter typography, core color values, canvas dimensions, and utility-tab prototype links are saved in [mobile-design.md](mobile-design.md). Older mobile/web designs coexist in the file; use these v2 frames for the updated tenant design. Detailed component bindings, assets, spacing, and unshown interaction states require targeted review when implementing the assigned task.
- The new design shows payment-proof submission with owner approval before balance updates. This extends the older admin-only payment-recording flow; confirm the upcoming Jira task and backend support before implementation. No implementation is authorized by this design review alone.

## Product and architecture

Source: `README.md` and `docs/sprint-1.md`.

- Flow: tenant mobile app → Next.js API in the web project → Supabase/PostgreSQL. The web project also serves the admin website.
- Current exception: mobile registration calls Supabase Auth directly.
- Tenants register themselves and may access only their own authorized records. Accounts must be linked to tenant records; admins assign rooms and enforce occupancy limits.
- Documented registration fields: first name, last name, email, password, contact number. Current registration uses full name, email, password, and confirmation.
- Room rent has a default, with tenant-specific amounts allowed. Shared rent is not automatically divided equally.
- Monthly bill = rent + manually entered electricity + manually entered water.
- Tenants pay owners outside the system. Admins record payments, including partial payments, and can correct/delete records.
- Status is derived from recorded payments: `UNPAID`, `PARTIAL`, or `PAID`. Outstanding balance = bill total − total payments.
- Tenant scope: dashboard, bill breakdown, payment status, balance, and billing history.
- Out of scope: payment gateways, chat, AI, SMS, complex notifications, multiple branches, advanced accounting, maintenance, inventory, and reservations.

## Repository map

- Expo SDK 58, React Native 0.88.1, React 19.3, TypeScript, Expo Router; npm with `package-lock.json`.
- `src/app/`: lowercase routes and protected root layout. Index redirects to login; session restoration shows loading and falls back to signed-out navigation if storage fails.
- `src/screens/auth/`: `LoginScreen.tsx` and `RegisterScreen.tsx`; routes are thin wrappers.
- `src/app/home.tsx` preserves main’s new Dashboard screen; the old test Home screen was removed. History is the first protected route and the destination after sign-in/session restoration. `src/screens/AccountScreen.tsx` now implements BE-322 Account v2, reachable through the shared Home, History, and Account tab bar. The Home tab opens the dashboard at `/home`.
- BE-313 was reassigned to Billing History; another developer owns Bill details. The user authorized implementation of History. `src/app/history.tsx` is protected by the existing session guard and is the temporary app landing screen. `src/screens/BillingHistoryScreen.tsx` implements the mobile v2 utility tabs/charts, bill list, year/status filters, and loading/error/empty states. Feature components and parsing live in `src/features/billing-history/`.
- The user authorized the tenant History API. `boardingbills-web/app/api/tenant/bills/route.ts` implements `GET /api/tenant/bills` using `lib/tenant-billing-history.ts`, matching the mobile adapter. It resolves `tenants.user_id` from the verified authenticated tenant, returns all own bills newest first, and distinguishes missing tenant linkage (403 `TENANT_NOT_LINKED`) from an empty history. It includes the authorized bill payment records for the mobile Bill Details screen. The existing web `/api/bills` stays admin-only. No database migration was needed; boarding-house name is null because the schema has no such field. Home links to Bill Details, and Home/Details display a clear prompt when no room is assigned. BE-322 implements Account v2; see the Account note below.
- BE-322 was repurposed from Payment Status to Tenant Account, confirmed by the user. On `feat/BE-322-build-tenant-account-screen`, Account now shows profile/initials, boarding-house/room/owner fields with missing-data states, available phone/email contact options, an inline Supabase password-change form requiring the current password, and existing sign-out. `src/features/account/` contains the parser, API adapter, password service, and form. The user authorized relevant sibling backend work: `GET /api/tenant/account` and `lib/tenant-account.ts` resolve only the authenticated tenant profile/latest active room. The schema has no boarding-house name or owner relationship/contact fields, so the API returns null for those; no migration or inferred admin contact is included. See [account.md](account.md). Home/Dashboard and Bill Details were not changed.
- BE-322 Superpowers follow-up review confirmed no additional Account bugs; all 27 mobile tests, four backend Account tests, lint/typechecks and synthetic password/sign-out/long-text browser checks passed. Live native-device and real authentication-policy smoke checks remain outstanding.
- `src/components/auth/`: shared `AuthHeader` and `LogoMark`. Both auth screens reuse the same header.
- `src/components/ui/`: `PrimaryButton` and `TextField`. Submission buttons use existing busy state.
- `src/constants/theme.ts`: one shared cream/brown palette; future verified Figma requirements determine design changes.
- `src/lib/auth.ts`: preserves main’s direct Supabase sign-in and user validation. `getAccessToken()` reads the current persisted/refreshed Supabase session for History, matching the dashboard client in `src/lib/api.ts`. Sign-out uses Supabase’s local scope and reports failures before changing the route guard.
- `hasSession()` uses Supabase `getUser()` as on main. Session persistence and automatic refresh are configured in `src/lib/supabase.ts`; legacy standalone accessToken/refreshToken storage is no longer read.
- `src/lib/supabase.ts`: shared Supabase client/session used by registration, sign-in, History, and the dashboard. Missing config leaves a null client and produces a registration message on submission.
- `assets/`: configured app/splash icons. `docs/images/`: documentation diagrams.
- Database schemas/migrations/configuration belong to `boardingbills-web`; its `db/schema.ts`, `drizzle/`, and `drizzle.config.ts` were verified before removing unused app copies and server tooling dependencies.
- Unused starter components, theme hooks/CSS, sample images, reset script, and empty docs were removed during cleanup. No database migrations were executed.

## Configuration and verification

- `EXPO_PUBLIC_API_URL`: Next.js backend origin without `/api`. Use the backend computer's current LAN IP and actual port on a physical phone.
- `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_KEY`: registration project URL and public client key. Never save secret values in these notes.
- A prior iPhone connection issue came from an outdated API IP and port occupied by another project. Check the actual backend process rather than assuming port 3000. LAN addresses and ports can change.
- [Mobile setup guide](mobile-setup.md) documents installation, structure, API contract, navigation, and device smoke checks.
- BE-289 verification passed lint, typecheck, Expo Doctor (20/20), all-platform export, and one-off mocked auth checks. Live authenticated device tests were not performed by the agent.
- Architecture cleanup verification passed lint, typecheck, Expo Doctor (20/20), and iOS/Android/web exports. Source comparisons confirmed unchanged auth services, guards, login handler, registration logic, home screen, header/logo, and color values; configured icon/splash assets still exist. No remaining locked package versions changed.
- Forgot-password action remains a placeholder. Registration still calls Supabase directly; after sign-up returns a session, it uses the shared Supabase sign-in flow to notify the route guard and open History. Email-confirmation sign-ups remain signed out with confirmation instructions and a Continue to sign in action. Failed automatic sign-in preserves the account-created notice and offers manual sign-in rather than repeating sign-up.
- Follow root `AGENTS.md`: consult matching Expo docs before API changes, keep non-route code outside `src/app/`, use Expo-compatible dependency installation, do not hand-edit generated native folders, and run lint/typecheck before completing work.

Conflict resolution against main `f75d8dd`: kept the new Dashboard route and Supabase authentication migration, adapted History token access to the shared session, retained History as the landing screen with an explicit Router anchor and the Account sign-out flow. The prior feature commit is preserved on local backup branch `backup/BE-313-before-conflict-fix-20261117`; resolved feature work is left uncommitted on top of main.
