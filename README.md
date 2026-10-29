# GeoPima Web

Next.js frontend for the GeoPima property management platform. It replaces the legacy static HTML pages and talks to the existing Django REST API.

Design documents are in [`docs/`](docs): [`DESIGN.md`](docs/DESIGN.md) (architecture, use cases, class diagram) and [`CURRENT_STATE_REVIEW.md`](docs/CURRENT_STATE_REVIEW.md). What every page contains and does is in [`MANUAL.md`](docs/MANUAL.md).

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

Set `GEOPIMA_API_URL` (for example `http://127.0.0.1:8000/api/v1`) and run the Django backend; every page reads live data from it. Sign in with a staff, tenant or landlord account.

| Portal | Path | Who |
|---|---|---|
| Agency console | `/admin` | Staff: landlords, properties, units, tenants, invoices, M-Pesa, deposits, finance, configuration |
| Tenant portal | `/tenant` | Balance and due date, invoices, payment history, how to pay, lease |
| Landlord portal | `/landlord` | Own properties, occupancy, monthly statements after commission |

## Structure

```
src/app/(auth)        login
src/app/(admin|tenant|landlord)/<portal>   one route group and shell per role
src/app/api/auth      login and logout route handlers (httpOnly cookies)
src/proxy.ts          optimistic role-based route guard
src/lib/repo/*        data access per role; every call re-checks the session role
src/lib/api/*         Django client (token from the session cookie, paginated reads)
src/lib/data/*        loads Django records into the shapes the pages draw, and the query helpers over them
src/lib/actions/*     admin form actions that write to Django
src/components/shared reusable tables, badges, charts, filter bar
```

## Connecting to Django

Set `GEOPIMA_API_URL` (see `.env.example`). Login exchanges credentials for a JWT at `/token/` and reads the portal from `/me/`. Staff pages read the list endpoints and the tenant and landlord portals read `/portal/...`; Django enforces what each role may see.
