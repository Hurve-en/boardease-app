# Project context

Last reviewed: November 16, 2026. This is a saved reference for future work; recheck source files before implementation.

## User direction

- This repository is the app side of BoardEase, specifically the tenant mobile application.
- The user says the ERD image is outdated. Do not use `docs_images/erd.png` (or references to `ERD.png`) as the current database contract.
- The user provided the Figma file below, then authorized Jira BE-289, "10.1 Set Up Mobile Application", on the existing `feat/BE-289-set-up-mobile-application` branch. Keep code simple and scoped to Expo setup (BE-290), React Native configuration (BE-291), navigation (BE-292), API connection (BE-293), and testing (BE-294).

## Figma reference and review status

- User-provided design: [BordEase on Figma](https://www.figma.com/design/vDSsrawTLaWHqM4UzWEeHc/BordEase?node-id=0-1).
- File key: `vDSsrawTLaWHqM4UzWEeHc`; supplied starting node: `0:1`.
- User confirmed this APP repository will implement the mobile designs. Do not implement the admin web application here.
- Access attempted November 16, 2026: the web reader could not access the file; browser access host was unavailable. Figma plugin discovery confirmed it was not installed/connected, and it was suggested to the user.
- Visual review is pending access. No screen inventory, design tokens, typography, spacing, assets, component states, or prototype flows have been verified from Figma. Do not infer them from existing app code.
- Once access is available, inspect the mobile frames and flows, then update this reference with verified observations. BE-289 authorizes setup work; visual feature work still requires its own requirements.

## Product and architecture

Source: `README.md` and `docs/sprint-1.md`.

- BoardEase manages boarding-house rooms, tenants, monthly bills, and recorded payments.
- Owners/admins use a separate Next.js web application. Tenants use this Expo application.
- The documented architecture uses shared Next.js Route Handlers for application data, Supabase Auth for authentication, and Supabase/PostgreSQL for storage.
- Tenants register themselves and may only access their own authorized records. Their accounts must be linked to tenant records; admins assign rooms.
- Registration requirements in the README: first name, last name, email, password, contact number.
- Admins configure occupancy and default room rent, with tenant-specific rent allowed. Rent is not automatically divided equally.
- Monthly bill = rent + manually entered electricity + manually entered water.
- Tenants pay owners outside the system. Admins record payments, including partial payments, and may correct or delete records.
- Payment status is derived from payments: `UNPAID`, `PARTIAL`, or `PAID`. Outstanding balance = total bill - total payments.
- Tenant scope includes dashboard, bill breakdown, status, outstanding balance, and billing history.
- No payment gateway, chat, AI, SMS, complex notifications, multiple branches, advanced accounting, maintenance, inventory, or reservations in the documented scope.

## Repository map and current implementation

- `package.json`: Expo `~58.0.25`, React Native `0.88.1`, React `19.3.0`, TypeScript, Expo Router. Uses `package-lock.json`; no Bun lockfile found during review.
- `src/app/_layout.tsx`: protected routes based on `hasSession()` and auth change listeners.
- `src/app/index.tsx`: redirects signed-out users to login.
- `src/app/login.tsx` and `register.tsx`: route wrappers around auth components.
- `src/app/home.tsx`: placeholder Tenant Home with logout.
- `src/components/LoginScreen.tsx`: email/password login UI; forgot-password action is a placeholder.
- `src/components/RegisterScreen.tsx`: full name, email, password and confirmation; calls `supabase.auth.signUp` directly. It does not yet match the documented separate-name/contact-number requirements.
- `src/lib/auth.ts`: POST `/api/login` and `/api/logout` using `EXPO_PUBLIC_API_URL`. Login expects access/refresh tokens and `user.role === "tenant"`. Tokens are stored using SecureStore on native and AsyncStorage on web. Local logout clears tokens even if the backend is unavailable.
- `hasSession()` checks token presence only. No token refresh or expiry validation is implemented in this module.
- `src/lib/supabase.ts`: separate Supabase client/session persistence for registration. The API token flow and Supabase client session flow are distinct in current code. Missing Supabase configuration now leaves the client null and shows a registration error on submission, instead of throwing on import.
- `src/components/ui/`: shared auth header, logo, text fields, and primary button.
- `src/constants/theme.ts`: current auth palette is cream/brown. Treat forthcoming Figma as design input rather than assuming these colors are final.
- `src/drizzle/`: checked-in schema, relations, and migration snapshot for auth users, profiles, roles and permissions. These do not establish the complete current billing backend schema.
- `drizzle.config.ts`: database tooling uses `DATABASE_URL`. Do not expose it in the mobile client.

## Configuration names

Record names only; never save secret values here.

- `EXPO_PUBLIC_API_URL`: login/logout API origin.
- `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_KEY`: registration client configuration.
- `DATABASE_URL`: database tooling configuration.

## Documentation state and known follow-ups

- `README.md` is the main product and architecture reference.
- `docs/sprint-1.md` records authentication/roles/logout work and proposed Sprint 2 API foundation tasks. Treat it as a historical report rather than proof of current backend completion.
- `docs/docs.md` and `docs/sprint-2.md` are empty at review time.
- README image links do not match some checked-in image filenames, including the ERD link.
- Registration credential/result logging was removed during BE-289.
- `src/drizzle/relations.ts` now imports the existing `users` export under its expected local alias; no schema changes were made.
- Auth buttons now use their existing busy state to disable submission and show progress text.
- Figma visual review and current backend contracts are still pending. The Jira screenshot lists setup subtasks without detailed descriptions; no additional feature scope was inferred from it or the outdated ERD.

## Original baseline checks

- `npx --no-install tsc --noEmit` failed with existing errors: missing `usersInAuth` export in `src/drizzle/relations.ts`, and color-scheme comparison/null indexing errors in `src/hooks/use-theme.ts`.
- `npx --no-install expo lint` could not complete: no ESLint config was found and Expo attempted dependency installation with networking disabled. The attempt was stopped; lint status remains unverified.
- No application source changes were made during this review.

## BE-289 setup work

- Added `.env.example`, Expo ESLint configuration, `npm run typecheck`, and [local setup instructions](mobile-setup.md).
- Installed the already-declared ESLint development tooling and synchronized the lockfile. Expo Doctor's online check identified a newer compatible SDK 58 patch set; `npx expo install --fix` was used to align dependencies within SDK 58.
- Fixed the theme hook's null fallback and web hydration lint issue.
- Added visible session loading and a signed-out fallback for storage-read failures; kept the existing Expo Router protected stack.
- Final lint and TypeScript checks passed. Expo Doctor passed all 20 checks after dependency alignment; Expo also registered the installed image, status-bar, and web-browser config plugins.
- One-off mocked checks passed for iOS, Android, and web auth behavior: tenant login, token persistence, offline logout, API/network errors, admin rejection, malformed token response, and missing API configuration.
- All-platform Expo export succeeded with Supabase settings unset. This verifies bundling/static rendering, not native device interaction.
- The configured backend was unreachable from this environment. Live authentication and the device smoke checklist in `docs/mobile-setup.md` remain unverified.

## Working rules

- Follow root `AGENTS.md`. Prioritize mobile performance and cross-platform compatibility.
- Before writing Expo/React Native API code, check the installed Expo major and fetch matching versioned docs (currently SDK 58). Use the Expo docs index for other Expo guidance.
- Keep route files under `src/app/`; keep components, hooks, and utilities outside it.
- Use Expo-compatible dependency installation via `npx expo install`; use EAS for cloud builds/submission/updates.
- Do not hand-edit generated `ios/` or `android/` folders.
- Run lint and TypeScript checks before completing work. Separate pre-existing failures from changes introduced by a task.
