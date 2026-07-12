# TransitOps — Demo Script

**Target length:** 8–10 minutes
**Login:** all seed accounts use password `password123`

---

## 1. Problem statement (30s)

> "Logistics companies still run transport ops on spreadsheets and logbooks — that
> means double-booked vehicles, drivers dispatched with expired licenses, missed
> maintenance, and no real visibility into cost or profitability. TransitOps
> replaces that with one platform that enforces the rules automatically instead
> of relying on someone remembering to check."

## 2. Stack, in one breath (15s)

Next.js 15 (App Router) + TypeScript, Postgres on Neon via Prisma, JWT auth with
role-based access control, Tailwind + Recharts for the UI/analytics, dark mode.

---

## 3. Role tour — the core differentiator

Log in as each role and show **the nav bar changing**, not just a settings toggle —
each role is a genuinely different app surface.

### 3a. Fleet Manager — `fleet@transitops.com`
- Full nav: Dashboard, Vehicles, Drivers, Trips, Maintenance, Fuel & Expenses, Reports, **Admin Panel**.
- Dashboard: KPI row (Active/Available Vehicles, In Maintenance, Active/Pending Trips, Drivers On Duty, Fleet Utilization %) + Trips-by-Status / Fleet Composition charts + compliance alerts banner.
- Say: *"Fleet Manager owns the assets — registers vehicles, onboards drivers, manages maintenance lifecycle. This is the only role that sees Admin Panel, where new signups get approved."*

### 3b. Driver — `driver@transitops.com`
- Nav: Dashboard, Vehicles, Drivers, Trips, Fuel & Expenses, Reports — **no Maintenance tab**.
- Go to **Trips → New Trip**: pick source/destination, an *available* vehicle, an *available* driver, cargo weight, distance. Submit.
- Click **Dispatch** on the DRAFT trip → note vehicle + driver both flip to `ON_TRIP` automatically (glance at Vehicles/Drivers list to prove it).
- Click **Complete** → enter end odometer + fuel consumed + revenue → both flip back to `AVAILABLE`, and a fuel log gets created automatically.
- Say: *"Driver is a dispatcher role — full trip lifecycle control, but they can't edit the vehicle or driver master records themselves, and they can't touch maintenance. That boundary matches the spec exactly: creates trips, assigns vehicles and drivers, monitors active deliveries — nothing about owning the fleet."*

### 3c. Safety Officer — `safety@transitops.com`
- Nav collapses to: Dashboard, Drivers, Reports — **no Vehicles, Trips, Maintenance, or Fuel & Expenses**.
- Dashboard: Total Drivers, Average Safety Score, Suspended Drivers, Expired Licenses KPIs + safety-score distribution chart + license compliance alerts + at-risk-drivers table.
- Go to **Drivers**, open a driver with a low safety score (Tom Martinez, score 45) or the expired one (Sarah Johnson) — show the **suspend/reinstate** control.
- Say: *"This role only sees driver-compliance data — license validity, safety scores. No fleet-ops noise, because that's not their job."*

### 3d. Financial Analyst — `finance@transitops.com`
- Nav: Dashboard, Trips, Maintenance, Fuel & Expenses, Reports — **no Vehicles or Drivers tab**.
- Dashboard: Total Revenue, Operational Cost, Net Margin, Completed Trips KPIs + cost breakdown pie + 14-day revenue-vs-cost trend + top-cost-vehicles table.
- Go to **Fuel & Expenses** → **Add Expense** (log a toll) to show write access there.
- Reports page: per-vehicle Fuel Efficiency, Operational Cost, and **ROI** — `(Revenue − (Maintenance + Fuel)) / Acquisition Cost`, exactly the spec's formula.
- Say: *"Financial Analyst reviews the money — fuel, expenses, maintenance cost, profitability — nothing about managing the fleet itself."*

---

## 4. Business rules, live (2 min) — the part judges actually probe

Do these as Fleet Manager or Driver:

1. **Cargo overload rejected**: try creating a trip with cargo weight above the vehicle's `maxLoadCapacity` (e.g. 600kg on Van-05, cap 500kg) → inline validation error.
2. **Double-booking blocked**: try assigning a vehicle/driver that's already `ON_TRIP` → rejected with a clear message.
3. **Expired/suspended driver blocked**: try assigning Sarah Johnson (expired license) or a suspended driver to a new trip → rejected.
4. **Maintenance auto-status**: create a maintenance log on an available vehicle → watch it flip to `IN_SHOP` and instantly disappear from the trip-creation vehicle dropdown. Close the log → it returns to `AVAILABLE` (unless retired).

## 5. Analytics & bonus features (1 min)

- Toggle **dark mode**.
- **Reports → Export CSV** on any table.
- **Print / Save as PDF** button (browser print, styled with `no-print` classes so only the report content prints).
- Dashboard **Email License Reminders** button (Fleet Manager/Safety Officer) — triggers the nodemailer flow for expiring/expired licenses.
- Vehicle detail page → **document upload** (registration/insurance docs).

## 6. Close (15s)

> "Every business rule from the spec is enforced server-side, not just hidden in
> the UI — and every role sees exactly the surface area their job needs, nothing
> more. That's TransitOps."

---

## Quick reference: seed accounts

| Role | Email | Notable seed data to point at |
|---|---|---|
| Fleet Manager | fleet@transitops.com | — |
| Driver | driver@transitops.com | — |
| Safety Officer | safety@transitops.com | Tom Martinez (score 45), Sarah Johnson (expired license) |
| Financial Analyst | finance@transitops.com | Van-05 / Truck-01 for revenue/ROI examples |

All passwords: `password123`
