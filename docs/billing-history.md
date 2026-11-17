# Billing History (BE-313)

Implements Figma mobile v2 History frames `232:861` and `232:860` in `src/screens/BillingHistoryScreen.tsx`. History opens automatically after sign-in or restoration of an existing app session. `/history` requires a signed-in session. Main’s new `/home` and `/dashboard` routes are preserved.

## Included

- Boarding-house/room context and tenant initials.
- Electricity/Water chart for the latest three available bills in the selected year, ordered chronologically. Missing months are not invented or treated as zero.
- Newest-first monthly bill list, totals, Paid/Partial/Unpaid badges, balance/due date, and settlement date when provided.
- Year and payment-status filters, with clear filters, loading, retry, empty, no-match, refresh, timeout, and invalid-response handling.
- Safe areas, scrollable list, accessible control labels/states, and responsive phone/tablet width.
- Local Figma navigation assets and bundled Inter Regular/Bold fonts.

## Backend integration

The checked web backend exposes an **admin-only** `GET /api/bills?month=YYYY-MM`. This screen does not use that endpoint or query Supabase directly.

The mobile adapter in `src/features/billing-history/api.ts` now uses the implemented `GET /api/tenant/bills` in `boardingbills-web`, with `Authorization: Bearer <access token>`. The route is `app/api/tenant/bills/route.ts`; database queries are in `lib/tenant-billing-history.ts`. No migration is required. Unlinked accounts receive HTTP 403 with `code: TENANT_NOT_LINKED`, which the mobile screen explains separately from an empty history. It expects the complete authorized tenant history, not one page or the current month alone. If pagination is added, update the client to load all pages before deriving year options and trends.

Response (the backend returns decimal strings; the parser also accepts JSON numbers):

```json
{
  "tenant": {
    "name": "Maya Santos",
    "boardingHouseName": "Maple House",
    "roomNumber": "101"
  },
  "bills": [
    {
      "billId": "<bill UUID>",
      "billingMonth": "2026-10-01",
      "totalAmount": "5350.00",
      "electricCharge": "600.00",
      "waterCharge": "250.00",
      "outstandingBalance": "2350.00",
      "dueDate": "2026-10-10",
      "settledDate": null,
      "status": "partial"
    }
  ]
}
```

Use lowercase `paid`, `partial`, or `unpaid`, matching the current backend enum. Dates are calendar dates in `YYYY-MM-DD`; `billingMonth` uses day `01`. `settledDate`, boarding-house name, and room number may be null. A paid bill’s settlement date is the latest positive payment date recorded for that bill; partial/unpaid bills return null. The current backend schema has no boarding-house-name field, so the API returns null instead of a sample house name.

The server must derive tenant scope from the authenticated user, validate tenant linkage, and return only that tenant's bills. Never accept a client-provided tenant ID as authorization. Empty history returns `bills: []`; authorization/server failures must not be returned as an empty history.

## Teammate handoff

`BillingHistoryScreen` accepts `onBillPress(billId)`. Once the Bill details route is agreed, wire it in `src/app/history.tsx` with Expo Router, passing the selected bill ID. Until then, selecting a bill explains that details are unavailable; no competing Bill details screen has been created.

The old test Home was removed. Home is disabled until the real screen is built; the new Dashboard from main remains available at `/home` and `/dashboard`. The shared Account tab opens a temporary profile screen containing Sign out. A successful sign-up with an immediate session notifies the app route guard through the shared Supabase sign-in flow and opens History; accounts requiring email confirmation show confirmation instructions and a Continue to sign in action.

## Development preview

```bash
EXPO_PUBLIC_BILLING_HISTORY_DEMO=true npx expo start
```

Sign in normally; History opens automatically. The preview is labeled **Design preview · Sample data**. It uses the Figma example bills and is gated by `__DEV__` plus the explicit flag. Live mode never substitutes fixture data for API failures. Do not use this flag to verify live API integration.

## Checks

```bash
npx expo lint
npx tsc --noEmit
node --test tests/billing-history*.test.mjs
```

The focused model tests use Node 22.18+ (built-in TypeScript stripping). Validate live tenant authorization and real bill navigation after the backend/teammate integrations exist. Native device safe areas and screen-reader behavior still require device smoke checks.

Implementation verification: lint and TypeScript pass; all eight model tests pass. An isolated browser preview verified Electricity/Water switching, Paid filtering, Unpaid no-match state, filter reset, and layouts at 390 × 844, 375 × 812, and 812 × 375. A WCAG A/AA automated audit of the final no-match state reported zero violations and zero incomplete checks. The light Figma palette remains readable under browser dark-mode preference; the screen introduces no motion. Native Dynamic Type and assistive-technology behavior are not verified by these web checks.

Landing/profile follow-up: the test Home component has been removed. Mocked browser checks confirmed immediate-session signup → History, restored-session root → History, legacy `/home` → History, Account navigation → Sign out → Login, and confirmation-required signup staying signed out with confirmation instructions and Continue to sign in. These checks create no real accounts; live auth and native-device smoke checks are still needed.

API follow-up: the backend endpoint and six focused route/authorization/query tests are implemented. The API response was also checked through the mobile parser. Tests mock Supabase claims and database execution; signed-in live PostgreSQL/device integration remains unverified. Real data requires a linked tenant record and existing bills, the correct `EXPO_PUBLIC_API_URL`, and the demo flag unset (or false).

Final API verification: all six backend tests and eight mobile model tests pass; mobile lint/typecheck pass. Backend lint has no errors (seven existing unrelated warnings). The endpoint and its dependencies pass a focused typecheck; the full backend typecheck has the same three pre-existing errors in `drizzle/relations.ts` (`usersInAuth`) and `drizzle/schema.ts` (`users`). A real HTTP request to the existing local web server confirmed the endpoint compiles and returns `401 Unauthorized` with `Cache-Control: private, no-store` without authentication. No live authenticated tenant data or database writes were used for verification.

History bug-fix verification: the browser has an explicit Refresh button because React Native Web does not implement pull-to-refresh. A missing/expired token produces a typed session error, clears displayed history, and offers Sign in again; that action clears app tokens and lets the protected Router return to Login. Other errors keep retry behavior. Chart month labels now share dot coordinates, and ranges crossing a year boundary include both years. All 13 model/API tests, lint, and typecheck pass. An isolated browser with mocked bills verified Refresh making a second request, the Dec 2026–Feb 2027 label, label/dot centers matching within 0.01 CSS pixels at phone width, and 401 → Sign in again → Login with cleared storage. No real account or bill data was changed. Native device verification remains outstanding.

Main integration: History reads the same Supabase session used by the dashboard API client, including refreshed access tokens. It does not read the removed standalone token store. Supabase sign-out uses local scope and surfaces errors so History cannot report successful session recovery if storage was not cleared. Earlier custom-token browser checks above describe pre-migration behavior.

Conflict-resolution verification: all 19 model/API/auth tests, lint, typecheck, and exports pass. The root layout now declares `anchor: "history"` so preserving main’s Dashboard route does not change the restored-session landing screen. An isolated fresh web export with mocked Supabase responses confirmed session restoration → History, History using the shared bearer token, 401 → Sign in again → Login with Supabase storage cleared, and sign-in → History. Main’s dashboard source and routes are unchanged. No real credentials or database records were used.
