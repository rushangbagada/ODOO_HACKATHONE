# TransitOps

A centralized transport operations platform that replaces spreadsheets and logbooks for managing a logistics fleet — vehicles, drivers, trip dispatching, maintenance, fuel/expenses, and analytics — with strict, server-enforced business rules and four purpose-built role workspaces.

Built in a single Next.js codebase (App Router, TypeScript) against Postgres on Neon via Prisma.

---

## Contents

- [Roles](#roles)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Seed / demo accounts](#seed--demo-accounts)
- [Testing](#testing)
- [Project structure](#project-structure)
- [Business rules](#business-rules)
- [Scripts](#scripts)
- [Docs](#docs)

---

## Roles

Every role sees a different app — not just a different theme. Nav tabs, dashboard content, and write access are all scoped server-side, not just hidden in the UI.

| Role | Responsibility | Can manage | Read-only / no access |
|---|---|---|---|
| **Fleet Manager** | Owns fleet assets, maintenance, vehicle lifecycle | Vehicles, drivers, maintenance, full trip lifecycle, fuel/expenses, user approvals | — |
| **Driver** | Dispatches trips, assigns vehicles/drivers, monitors active deliveries | Full trip lifecycle (create → dispatch → complete → cancel), fuel logs | Vehicles/drivers (view only, to pick who/what to assign) — no maintenance, no expenses |
| **Safety Officer** | Driver compliance — license validity, safety scores | Driver records (suspend/reinstate, safety score) | Everything else — no vehicles, trips, maintenance, or fuel/expenses |
| **Financial Analyst** | Reviews costs and profitability | Fuel logs, expenses | No driver management, no trip creation/dispatch, no vehicle CRUD |

Each role gets a **personalized Dashboard and Reports view** — e.g. Safety Officer sees a safety-score distribution and license alerts instead of fleet-ops KPIs; Financial Analyst sees revenue/cost/margin instead of vehicle counts.

New signups start as `PENDING` and require Fleet Manager approval (Admin Panel) before they can sign in.

## Features

- Email/password auth with JWT sessions + role-based access control (RBAC) enforced in middleware and on every API route
- Full CRUD for vehicles and drivers, with search/filter/sort
- Trip lifecycle management (`Draft → Dispatched → Completed → Cancelled`) with automatic vehicle/driver status transitions
- Maintenance workflow — opening a log takes a vehicle out of the dispatch pool automatically, closing it restores availability
- Fuel log and expense tracking with automatic per-vehicle operational cost rollup
- Dashboard KPIs (active/available vehicles, in-maintenance, active/pending trips, drivers on duty, fleet utilization) with type/status/region filters
- Reports & analytics: fuel efficiency, operational cost, and **Vehicle ROI** = `(Revenue − (Maintenance + Fuel)) / Acquisition Cost`
- CSV export and print-to-PDF on every report
- Email reminders for expiring/expired driver licenses
- Vehicle document management (registration, insurance, etc.)
- Dark mode
- Fully responsive layout

## Tech stack

- **Framework:** Next.js 15 (App Router) + TypeScript, all-in-one frontend + API routes
- **Database:** Postgres on [Neon](https://neon.tech) via **Prisma ORM**
- **Auth:** JWT sessions (`jose`), bcrypt password hashing, `middleware.ts` route protection
- **Validation:** Zod (shared between client forms and API routes)
- **UI:** Tailwind CSS, custom component primitives, `lucide-react` icons, `next-themes` dark mode
- **Charts:** Recharts
- **Testing:** Vitest

## Getting started

### Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) Postgres project (free tier is fine)

### Setup

```bash
git clone <this-repo>
cd ODOO_HACKATHONE
npm install
```

Copy `.env.example` to `.env` and fill in real values (see [Environment variables](#environment-variables) below):

```bash
cp .env.example .env
```

Push the schema and seed demo data:

```bash
npx prisma db push
npx prisma db seed
```

Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

See `.env.example` for the full list with placeholders. Summary:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon **pooled** connection string — used by the running app |
| `DIRECT_URL` | Neon **direct** connection string — used by Prisma Migrate |
| `JWT_SECRET` | Signing secret for session tokens (`openssl rand -base64 32`) |
| `NEXT_PUBLIC_APP_URL` | Base URL of the app (used in emails) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` / `SMTP_FROM` | SMTP credentials for license-reminder emails |

`.env` is gitignored — never commit real credentials.

## Seed / demo accounts

`npx prisma db seed` creates one approved account per role, plus sample vehicles, drivers, trips, fuel logs, maintenance logs, and expenses.

| Role | Email | Password |
|---|---|---|
| Fleet Manager | `fleet@transitops.com` | `password123` |
| Driver | `driver@transitops.com` | `password123` |
| Safety Officer | `safety@transitops.com` | `password123` |
| Financial Analyst | `finance@transitops.com` | `password123` |

## Testing

```bash
npm test          # run once
npm run test:watch  # watch mode
```

The suite covers the code paths that matter most for correctness and are otherwise invisible in a UI demo:

- **`src/lib/permissions.test.ts`** — the full RBAC matrix for all four roles, plus explicit boundary assertions (e.g. "only Fleet Manager can delete vehicles/drivers", "Safety Officer is denied everything outside driver compliance").
- **`src/lib/rules.test.ts`** — every mandatory business rule from the spec: vehicle/driver availability, expired-license and suspended-driver blocking, cargo-weight capacity checks, unique reg number/license number, single-active-maintenance-log enforcement.
- **`src/lib/metrics.test.ts`** — the analytics formulas: fleet utilization %, fuel efficiency (distance/fuel), operational cost rollup, and the Vehicle ROI formula, including edge cases (divide-by-zero, no data, negative ROI).

Prisma is mocked in all three files — tests never touch the network or the real database.

## Project structure

```
src/
  app/
    (auth)/            signin, signup, forgot/reset password
    (app)/              authenticated pages — one folder per module
      dashboard/         role-personalized dashboard
      vehicles/          list + detail/edit + documents
      drivers/           list + detail/edit
      trips/             list + create + dispatch/complete/cancel
      maintenance/        list + create + close
      fuel-expenses/      fuel logs + expenses tabs
      reports/            role-personalized reports + CSV/PDF export
      admin/users/        Fleet Manager: approve/reject signups
    api/                 route handlers, mirror the page structure above
  components/
    layout/               navbar/topbar/sidebar (permission-driven nav)
    ui/                   button, input, badge, card, loading primitives
  lib/
    auth.ts               JWT session encode/decode/cookie handling
    permissions.ts         the RBAC matrix (tested)
    rules.ts               business-rule validators (tested)
    metrics.ts              analytics/report calculations (tested)
    prisma.ts               Prisma client singleton
  middleware.ts            route protection, redirects unauthenticated users
prisma/
  schema.prisma            data model
  seed.ts                  demo data
docs/
  DEMO_SCRIPT.md           condensed ~10 min demo script
  FEATURE_WALKTHROUGH.md   exhaustive module-by-module feature + QA script
```

## Business rules

Enforced server-side (not just hidden in the UI) via `src/lib/rules.ts`, called from every relevant API route:

- Vehicle registration numbers and driver license numbers must be unique
- Retired or In Shop vehicles never appear in the trip-creation vehicle pool
- Drivers with expired licenses or `SUSPENDED` status cannot be assigned to trips
- A vehicle or driver already `ON_TRIP` cannot be assigned to another trip
- Cargo weight cannot exceed the assigned vehicle's max load capacity
- Dispatching a trip sets both vehicle and driver to `ON_TRIP`; completing or cancelling restores them to `AVAILABLE`
- Opening a maintenance log sets the vehicle to `IN_SHOP`; closing it restores `AVAILABLE` (unless the vehicle is separately `RETIRED`)
- A vehicle can only have one `ACTIVE` maintenance log at a time

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Run tests in watch mode |
| `npx prisma db push` | Sync the Prisma schema to the database |
| `npx prisma db seed` | Seed demo data |
| `npx prisma studio` | Browse the database with Prisma's GUI |

## Docs

- [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md) — condensed live-demo script (~8-10 min)
- [`docs/FEATURE_WALKTHROUGH.md`](docs/FEATURE_WALKTHROUGH.md) — exhaustive walkthrough of every screen, action, and business rule; also doubles as a manual QA checklist
