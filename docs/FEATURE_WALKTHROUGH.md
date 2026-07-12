# TransitOps — Complete Feature Walkthrough Script

Exhaustive, module-by-module script covering every screen and action in the app.
Use this for a full QA pass or a long-form demo; use `DEMO_SCRIPT.md` for the
condensed 8-10 minute version.

**All seed passwords:** `password123`

---

## 1. Public / Auth flows

### 1.1 Landing page (`/`)
- Hero, feature highlights (Vehicle Tracking, Driver Management, Analytics & Reports, Compliance).
- **Sign In** / **Get Started Free** buttons when logged out; **Open Dashboard** when logged in.
- Dark mode toggle in the header (works pre-login too).

### 1.2 Sign up (`/signup`)
- Fields: **Full Name**, **Email address**, **Password**, **Role** (dropdown: Fleet Manager / Driver / Safety Officer / Financial Analyst).
- Submit → account created with `status: PENDING` → redirected to Sign In.
- Say: *"New accounts don't get access immediately — they need Fleet Manager approval first."*

### 1.3 Sign in (`/signin`)
- Email + password. A `PENDING` or `REJECTED` account should be blocked with a clear error (test with a fresh signup before it's approved).
- Successful login sets an httpOnly JWT cookie and redirects to `/dashboard`.

### 1.4 Forgot / reset password (`/forgot-password`, `/reset-password/[token]`)
- Forgot Password: enter email → "Reset link sent if account exists" (doesn't leak whether the email exists — check the `mail.ts` nodemailer flow / server logs for the actual link in dev).
- Reset Password: token-based, sets a new password, invalidates the reset token after use.

### 1.5 Admin Panel — `/admin/users` (Fleet Manager only)
- Three tabs: **Pending**, **Approved**, **Rejected**, each with a live count badge.
- On a Pending row: **Approve** (instant) or **Reject** (requires typing a reason first — the button is blocked with a toast if the reason field is empty).
- Approved/Rejected users move tabs immediately; a rejected user can't sign in and sees their rejection reason.

---

## 2. Dashboard (`/dashboard`) — 4 distinct views by role

### Fleet Manager / Driver view
- KPI row 1: Active Vehicles, Available Vehicles, In Maintenance, Active Trips.
- KPI row 2: Pending Trips, Drivers On Duty, Fleet Utilization %.
- Filters: **Type**, **Status**, **Region** dropdowns + **Clear Filters** — re-fetches KPIs/charts scoped to the filter.
- Charts: Trips by Status (pie), Fleet Composition (bar, respects filters), Trips Completed Last 14 Days (line).
- Compliance Alerts card (only renders if there's something to show): Expired Licenses, Licenses Expiring Soon, Active Maintenance — plus an **Email License Reminders** button (Fleet Manager/Safety Officer only, but this generic view is Fleet Manager/Driver, so it's Fleet Manager here).

### Safety Officer view
- KPIs: Total Drivers, Average Safety Score, Suspended Drivers, Expired Licenses.
- Safety Score Distribution bar chart (Excellent/Good/At Risk buckets).
- License Compliance Alerts (expired + expiring lists) with **Email License Reminders** button.
- At-Risk Drivers table (safety score < 60).

### Financial Analyst view
- KPI row 1: Total Revenue, Total Operational Cost, Net Margin (color flips red/green), Completed Trips.
- KPI row 2: Fuel Cost, Maintenance Cost, Tolls & Other Expenses.
- Cost Breakdown pie chart, Revenue vs Cost (14-day) line chart.
- Top Vehicles by Operational Cost table.

---

## 3. Vehicles (`/vehicles`) — Fleet Manager & Driver only

- Search box (by reg number/name), filters: **Status**, **Region**, and column sort (click headers, arrow indicators).
- **New Vehicle** button (Fleet Manager only) → form: Reg Number, Name, Type, Max Load Capacity, Acquisition Cost, Odometer, Region.
  - Submit a duplicate reg number → server rejects with "Vehicle with registration number X already exists."
- Each row: **View** (detail page), **Edit** and **Archive/Retire** icons (Fleet Manager only).
- Vehicle detail page (`/vehicles/[id]`):
  - Edit form (Fleet Manager) covering all fields including **Status** (Available/On Trip/In Shop/Retired).
  - **Documents** section: add a document (Name + URL), remove a document.
  - Trying to retire a vehicle that's `ON_TRIP` should be rejected server-side.

---

## 4. Drivers (`/drivers`) — everyone except Financial Analyst

- Search, filters (Status, Region), sortable columns.
- **New Driver** button (Fleet Manager only) → form: Name, License Number, License Category, License Expiry Date, Contact Number, Safety Score, Region.
  - Duplicate license number → rejected with "Driver with license number X already exists."
- Driver detail page (`/drivers/[id]`):
  - Edit form — Fleet Manager can edit everything; **Safety Officer can edit too** (their one write permission — this is where suspend/reinstate and safety-score adjustments happen).
  - Status dropdown includes `SUSPENDED` — flipping a driver to Suspended should immediately block them from new trip assignment (verify in section 6).

---

## 5. Trips (`/trips`) — Fleet Manager & Driver (full control), everyone else read-only where visible

- Status tabs show live counts: Draft / Dispatched / Completed / Cancelled.
- **New Trip** button (Fleet Manager/Driver) → form: Source, Destination, **Vehicle** dropdown (only `AVAILABLE` vehicles), **Driver** dropdown (only `AVAILABLE` + non-expired-license drivers), Cargo Weight, Planned Distance.
- Per-trip actions on a `DRAFT` trip: **Dispatch** (blue) and **Cancel** (gray).
- Per-trip action on a `DISPATCHED` trip: **Complete** (green) → opens a modal for End Odometer, Fuel Consumed, Fuel Cost, Revenue Generated. End odometer is validated to be ≥ current odometer.
- Each trip card shows Vehicle / Driver / Cargo / Distance and a status badge.

---

## 6. Business rules — run these as Fleet Manager or Driver, in order

1. **Unique reg number**: try registering a vehicle with an existing reg number → rejected.
2. **Unique license number**: try registering a driver with an existing license number → rejected.
3. **Cargo overload**: create a trip with cargo weight above the chosen vehicle's max capacity → rejected client-side and server-side.
4. **Double-booking**: dispatch a trip, then try creating a second trip with the same (now `ON_TRIP`) vehicle or driver → they won't even appear in the dropdown (filtered to `AVAILABLE` only), and the server re-validates on dispatch too.
5. **Expired/suspended driver**: try assigning a driver with an expired license or `SUSPENDED` status → rejected ("Driver's license expired on..." or status message).
6. **Retired/In Shop exclusion**: a vehicle that's `RETIRED` or `IN_SHOP` never appears in the trip-creation vehicle dropdown.
7. **Dispatch → status flip**: dispatching sets both vehicle and driver to `ON_TRIP` in one transaction.
8. **Complete → status flip**: completing sets both back to `AVAILABLE`, records `actualDistance`/`fuelConsumed`/`revenue`, and auto-creates a `FuelLog` entry.
9. **Cancel → restore**: cancelling a `DISPATCHED` trip restores vehicle+driver to `AVAILABLE`; cancelling a `DRAFT` trip is a no-op status change (nothing to restore).
10. **Maintenance → In Shop**: creating a maintenance log on an available vehicle flips it to `IN_SHOP` and removes it from the trip dropdown immediately.
11. **Maintenance close → restore**: closing a maintenance log restores the vehicle to `AVAILABLE` — **unless** its status was separately set to `RETIRED`, in which case it stays retired.
12. **One active maintenance log at a time**: try creating a second maintenance log on a vehicle that already has an `ACTIVE` one → rejected ("already has an active maintenance log").

---

## 7. Maintenance (`/maintenance`) — Fleet Manager & Financial Analyst

- List of all maintenance logs (Active/Closed), sortable.
- **New Maintenance Log** (Fleet Manager only) → Vehicle, Type, Description, Cost.
- **Close** button on an Active log → triggers rule #11 above.
- Financial Analyst sees this as read-only (cost context for their reports).

---

## 8. Fuel & Expenses (`/fuel-expenses`) — Fleet Manager, Driver, Financial Analyst

- Two tabs: **Fuel Logs**, **Expenses** — the Expenses tab is hidden entirely for Driver (no `expenses.read`).
- Fuel Logs tab: Total Fuel Cost card, **Add Fuel Log** (Fleet Manager/Driver/Financial Analyst) → Vehicle, Liters, Cost. Table of all logs.
- Expenses tab (Fleet Manager/Financial Analyst only): Total Expenses card, **Add Expense** → Vehicle, Type (Toll/Maintenance/Other), Amount, Description. Table of all expenses.

---

## 9. Reports (`/reports`) — 3 distinct views

### Fleet Manager & Financial Analyst
- Summary cards: Total Completed Trips, Total Revenue, Total Operational Cost, Fleet Utilization.
- Three charts + tables: **Fuel Efficiency** (km/L per vehicle), **Operational Cost per Vehicle** (fuel + maintenance + other, stacked breakdown in the table), **Vehicle ROI** (bar chart colored green/red by sign, formula shown on-page).
- **Export Data** section: 4 separate CSV export buttons (Vehicles Summary, Fuel Efficiency, Operational Cost, Vehicle ROI).
- **Print / Save as PDF** button — browser print dialog, styled to hide nav/buttons via `no-print` classes.

### Driver
- Same view as Fleet Manager/Financial Analyst (full fleet-wide report) — Driver is a dispatcher role, not scoped to "their own" data.

### Safety Officer
- Summary cards: Average Safety Score, Expired Licenses, Expiring within 30 Days, Suspended Drivers.
- Critical Licensing Warnings banner (only shows if there are expired/expiring licenses).
- Driver Compliance & Safety Summary table: every driver with license expiry, safety score, status.
- **Print Compliance Report** button.

---

## 10. Cross-cutting / bonus features

- **Dark mode** — toggle in the top bar, persists via `next-themes`, styled consistently across every page (verify a few pages in both modes).
- **Search, filter, sort** — present on Vehicles, Drivers, and (status-based) Trips lists.
- **Email license reminders** — Fleet Manager/Safety Officer only, triggers `nodemailer` to email drivers with expired/expiring licenses.
- **Vehicle document management** — upload/remove documents on the vehicle detail page.
- **Responsive layout** — resize the browser or open on mobile; nav collapses to a hamburger menu, cards restack to single-column.
- **Role-based nav** — confirm the top bar itself changes per role (this is the fastest way to *show* RBAC is real, not just backend-enforced).

---

## 11. Negative-path checklist (for a thorough QA pass, not usually shown live)

- Hit any page directly by URL while logged out → redirected to `/signin?from=...`.
- As Safety Officer, hit `/vehicles`, `/trips`, `/maintenance`, `/fuel-expenses` directly by URL → page loads its shell but API calls 403, no data/crash.
- As Driver, hit `/maintenance` directly → same graceful 403 behavior.
- Try submitting any create form with missing required fields → client-side Zod validation blocks it before it hits the server.
