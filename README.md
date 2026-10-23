# GeoPima Web

Next.js frontend for the GeoPima property management platform. It replaces the legacy static HTML pages and talks to the existing Django REST API.

Design documents are in [`docs/`](docs): [`DESIGN.md`](docs/DESIGN.md) (architecture, use cases, class diagram) and [`CURRENT_STATE_REVIEW.md`](docs/CURRENT_STATE_REVIEW.md).

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

With no `GEOPIMA_API_URL` set, the app runs on a built-in demo dataset. The login page has one-click demo accounts for each portal.

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
src/lib/mock/*        demo dataset and query helpers (swap for Django calls)
src/components/shared reusable tables, badges, charts, filter bar
```

## Connecting to Django

Set `GEOPIMA_API_URL` (see `.env.example`). Login already exchanges credentials for a JWT at `/token/` and reads the role from `/me/`. The data functions in `src/lib/repo` still return demo data; replacing their bodies with API calls is the next step and depends on the backend changes listed in `docs/DESIGN.md` (section 8).
