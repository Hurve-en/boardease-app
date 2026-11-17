# Tenant Account (BE-322)

Implements Figma mobile Account v2 `232:859`: tenant name/email/initials, boarding-house and room card, owner information, Contact owner, Change password, and existing local sign-out. Home/Dashboard and Bill Details are unchanged.

## Data

`GET /api/tenant/account` uses the current Supabase bearer token. The backend resolves the profile from the authenticated user ID, joins only that user's tenant record and latest active room, and returns `Cache-Control: private, no-store`. Client-provided user/tenant IDs cannot select another account.

```json
{
  "profile": { "name": "Maya Santos", "email": "maya@example.com" },
  "tenancy": { "roomNumber": "101", "boardingHouseName": null },
  "owner": null
}
```

An account without a linked tenant receives its profile with `tenancy: null`. An account without a room has `roomNumber: null`. Missing profiles return 404; forbidden roles return 403; invalid sessions return 401. Server failures are not empty/successful profiles. Requests time out after 15 seconds; retry, pull-to-refresh and a web Refresh account action are available. Expired sessions clear displayed data and offer Sign in again through the existing sign-out/route-guard flow.

**Schema gap:** the current backend has no boarding-house-name field or owner relationship/contact fields. It returns null for these, and the mobile screen explains missing information. No admin identity is inferred as the tenant's owner. No migration is included.

When owner details become available, return `owner: { name: string | null, phone: string | null, email: string | null }`. Contact owner expands the available call/email options; each opens the system app only after the tenant chooses it. Invalid contact fields do not become arbitrary URLs. No message is sent automatically.

## Password and sign-out

Change password expands an inline form for current password, new password, and confirmation. Client validation requires eight characters, matching confirmation, and a different password. Supabase verifies the current password against the authenticated user's email before `updateUser`; server password policy remains authoritative. Passwords are transient component state and are not logged or stored. Cancel/success unmounts the form. Supabase authentication remains direct, consistent with existing login/registration; application profile data goes through the web API.

Sign-out reuses the existing local Supabase sign-out and protected navigation. Errors remain visible. No real passwords, accounts, emails, calls, or database records were changed during automated verification.

## Verification

Run `npx expo lint`, `npx tsc --noEmit`, and `node --test tests/*.test.mjs` in mobile. Backend checks: `node --import tsx --test tests/tenant-account.test.cjs`, `npx tsc --noEmit --incremental false`, and ESLint on the new route/query/test files.

Native device, live authenticated database, mail/phone app, and real password-policy checks still require a manual smoke test. Browser checks use synthetic data in an isolated temporary preview; no preview fixtures or test bypass are bundled in the app.

Implementation verification: mobile lint/typecheck and all 25 tests pass; web/iOS/Android exports pass. Four new backend Account tests, backend full typecheck, and focused ESLint pass. An isolated browser verified the Figma sample layout, contact options, password validation/cancel, 320px and landscape layouts, missing tenancy/contact information, server-error retry, and expired-session recovery entry point with zero page errors. Existing backend History tests have stale authentication mocks (`getClaims` versus the current `getUser`/role lookup); five of those six tests fail independently of this Account feature and were left unchanged.

Superpowers review (November 17, 2026): no additional Account defects were confirmed. Added two automated tests covering missing/invalid authentication and password transport failures; all 27 mobile tests, mobile lint/typecheck, four backend Account tests, backend typecheck and focused ESLint pass. Additional isolated browser checks verified wrong-current-password rejection before saving, server weak-password rejection, successful save clearing the form, failed sign-out preserving Account, successful sign-out reaching Login, and long names/email/boarding-house text at 320px without horizontal overflow. Authentication responses were intercepted with synthetic fixtures; no real credentials were used. The first sign-out test locator failed because the existing Login button's accessible name includes its icon; checking the observed Login URL/text confirmed navigation works. Production code did not need another fix during this review.
