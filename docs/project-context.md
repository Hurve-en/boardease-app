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
- Visual review remains pending access. The web reader could not access the file, browser access was unavailable, and Figma was not connected when checked. No visual tokens, frame inventory, assets, or prototype flows have been verified.

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
- `src/screens/HomeScreen.tsx`: placeholder Tenant Home with logout.
- `src/components/auth/`: shared `AuthHeader` and `LogoMark`. Both auth screens reuse the same header.
- `src/components/ui/`: `PrimaryButton` and `TextField`. Submission buttons use existing busy state.
- `src/constants/theme.ts`: one shared cream/brown palette; future verified Figma requirements determine design changes.
- `src/lib/auth.ts`: POST `/api/login` and `/api/logout`; tenant-only login; native SecureStore and web AsyncStorage token persistence. Local logout works when the backend is unavailable.
- `hasSession()` checks token presence only; this module does not refresh or validate expiry.
- `src/lib/supabase.ts`: separate client/session flow used by registration. Missing config leaves a null client and produces a registration message on submission.
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
- Forgot-password action remains a placeholder; registration and API login use distinct session stores. Do not change these as part of file cleanup.
- Follow root `AGENTS.md`: consult matching Expo docs before API changes, keep non-route code outside `src/app/`, use Expo-compatible dependency installation, do not hand-edit generated native folders, and run lint/typecheck before completing work.
