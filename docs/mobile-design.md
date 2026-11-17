# Updated mobile design reference

Reviewed November 16, 2026 directly in Figma using the connected Figma tools, including rendered screenshots of all five updated mobile frames. This records design observations only; implementation waits for the upcoming Jira task.

## Source and access

- [BoardEase Figma](https://www.figma.com/design/vDSsrawTLaWHqM4UzWEeHc/BordEase?node-id=0-1).
- The screenshot shows five mobile frames: Home, bill details, History with Electricity selected, History with Water selected, and Account v2.
- Live Figma access now works. The v2 frames match the screenshot supplied by the user. Older mobile and web frames also exist; use the v2 IDs below for the updated tenant screens.

| Updated frame | Figma node | Canvas size |
| --- | --- | --- |
| Home · current balance · v2 | `232:863` | 390 × 844 |
| Bill detail · partial payment · v2 | `232:862` | 390 × 1064 |
| Billing history · Electricity · v2 | `232:861` | 390 × 844 |
| Billing history · Water · v2 | `232:860` | 390 × 844 |
| Account · v2 | `232:859` | 390 × 844 |

- The taller bill-detail frame shows longer content; determine scrolling and safe-area behavior when implementing for actual devices. Canvas dimensions are references, not fixed runtime screen dimensions.
- Only the utility segment switches have prototype reactions within these five frames: Water tab `232:672` navigates to `232:860`; Electricity tab `232:750` navigates to `232:861`. No other prototype reactions were found in these frame subtrees. Visible buttons do not establish a fully specified interaction flow.

## Shared visual structure

- Warm cream page backgrounds, dark brown brand/actions, white rounded cards with subtle borders, dark headings, and muted secondary text.
- Brand header contains a house mark, BoardEase wordmark, and a circular initials avatar. Bill details instead shows a back arrow and “Bill details” header.
- Home, History, and Account form the bottom tab navigation. The selected icon has a light beige rounded background and a darker label. Bill details also shows this bar with Home selected.
- Partial-payment badges use pale gold; paid badges and recorded-payment notices use pale green. Monetary values and the outstanding balance receive strong emphasis.
- Verified font: Inter, Regular (400) and Bold (700). Page titles are 28 px; brand wordmark 19 px; section headings commonly 17 px; primary button labels 14 px; secondary text commonly 12–13 px; tab labels and badges 11 px. Home balance is 40 px bold; bill-detail balance is 30 px bold.
- Verified solid fills: brand brown `#583E30`, cream background `#F7F4EE`, primary text `#27211D`, muted text `#675C52`, beige `#EDE2D5`, white `#FFFFFF`, partial badge `#F4E8CF`, recorded/paid green `#E3EDE3`. Home also contains `#F6E9DE`.
- These values were read from nodes, not inferred from the screenshot. Component bindings, reusable assets, exact per-element spacing/radii/strokes, and other states still need targeted inspection for the assigned implementation task.

## Screens

| Screen | Visible content and controls |
| --- | --- |
| Home | Tenant greeting; boarding-house name and room; brown outstanding-balance card with Partial badge, bill month, due date, and “View current bill”; monthly billed/payment totals; green recorded-payment notice; contact-owner action. |
| Bill details | Back navigation; bill month, room, bill reference and Partial badge; balance and due date; rent/electricity/water breakdown, bill total and recorded payments; payment-proof form; recorded-payment notice. |
| Billing history | Boarding-house and room context; utility-charge line chart for Aug–Oct 2026; Electricity/Water segmented control; bill list with year and status dropdown controls; monthly bill rows with amount, payment status, remaining balance or settlement date, and a chevron. |
| Account | Name/email/initials card; boarding-house card with room and owner name; Contact owner button; Change password action; Sign out action. |

## Payment-proof flow shown in the design

- Tenant pays the owner outside the app and submits evidence using amount paid (₱), date paid with calendar control, and a proof image from camera or photo library.
- The action is “Submit proof for review”. The design states that the balance updates after owner approval.
- This is a proposed addition to the older documented flow where only admins recorded payments. Do not treat uploading proof as an approved payment or immediately reduce the balance.
- This does not show a payment gateway or in-app money transfer.
- Approval/rejection screens, upload limits, validation, pending/error states, storage rules, and API contracts are not shown. Confirm the Jira scope and backend support before implementation.

## Example data consistency

- October 2026: rent ₱4,500 + electricity ₱600 + water ₱250 = total ₱5,350.
- Recorded payment ₱3,000 leaves ₱2,350 outstanding, with Partial status and a 10 October due date.
- The recorded-payment notice shows 3 October 2026 and Cash. These are sample design values, not defaults to hardcode.
- History shows October as Partial and September/August as Paid. The two history frames show the alternate utility-chart selections rather than two separate navigation destinations.

## Boundaries for the next task

- Implement only the screens/behavior assigned in Jira. The screenshot alone does not authorize building every visible feature.
- Contact-owner behavior is unspecified; do not infer an in-app chat feature. Account editing and password-change form details are not shown.
- Filter options, bill-detail link behavior, data-loading/empty/error states, and detailed layout measurements still require targeted design or task confirmation.
- Keep the mobile → web API → Supabase architecture for application data. Current direct Supabase registration remains a separate existing behavior.
