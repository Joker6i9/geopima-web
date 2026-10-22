# GeoPima: Study & Improvement Plan

Property/rent management system (agency "PEMWA"): landlords, properties, units, tenants, leases, invoicing, M-Pesa C2B collection, vote-heads, deposits, and admin configuration.

## 1. Architecture

| Layer | Tech | Location |
|---|---|---|
| Frontend | Static HTML/CSS/vanilla JS, one `x.html + x.css + x.js` triplet per module | repo root, `configuration/`, `js/` |
| Backend | Django 5.2 + DRF + SimpleJWT, Postgres (`dj_database_url`), WhiteNoise, gunicorn | `geopima-backend/` |
| Hosting | Render (API at `geopima.onrender.com`), Neon Postgres | |

**Django apps**

| App | Owns |
|---|---|
| `tenants` | custom `User`, `Tenant`, `LeaseAgreement` |
| `properties` | `Landlord`, `Property`, `Unit`, plus a second `MpesaTransaction` and `PaymentAllocation` |
| `billing` | `Agency`, `VoteHead`, `Deposit`, `Invoice`, `InvoiceItem`, `generate_monthly_invoices` command |
| `mpesa` | `MpesaTransaction`, `PaymentSettlement`, `MpesaSettlementEngine`, C2B webhooks |
| `config_core` | roles, permissions, templates, banks, `UserProfile` |

**API routes** (`/api/v1/`): `token/`, `tenants/`, `properties/`, `billing/`, `mpesa/`, and `config_core` mounted at the root.

## 2. Findings

### Critical: broken or dangerous

| # | Issue | Where |
|---|---|---|
| C1 | **Monthly invoice command can't run.** It uses fields that don't exist on `Invoice` (`period`, `invoice_no`, `arrears_amount`, `expected_amount`, and an `'UNPAID'` status). The model has `billing_period`, `invoice_number` and lowercase statuses. The `generate-monthly` endpoint always returns 500. | `billing/management/commands/generate_monthly_invoices.py` |
| C2 | **M-Pesa settlement is broken.** It calls `invoice.paid_amount`, `invoice.update_status()` and `status='PAID'`, none of which exist. `Invoice.balance` is computed from `allocations` (the `properties` app), but settlement writes `PaymentSettlement` (the `mpesa` app). Even once the crash is fixed, balances never change. | `mpesa/services.py`, `billing/models.py` |
| C3 | **Two parallel payment models.** `properties.MpesaTransaction` + `PaymentAllocation` duplicate `mpesa.MpesaTransaction` + `PaymentSettlement`. Pick one. | `properties/models.py`, `mpesa/models.py` |
| C4 | **Unauthenticated money endpoints.** `AllowAny` on VoteHead, Deposit, Invoice (including `generate-monthly`) and on properties/landlords/units. Anyone can read or modify financial data. | `billing/views.py`, `properties/views.py` |
| C5 | **M-Pesa webhooks are unverified.** There's no source-IP allowlist or shared secret, and the error path leaks `str(e)`. The mpesa dashboard views have no auth and reference templates that don't exist. | `mpesa/views.py` |
| C6 | **Insecure defaults.** The code falls back to a committed `SECRET_KEY`, `DEBUG=True`, `ALLOWED_HOSTS=*`, `CORS_ALLOW_ALL_ORIGINS=True` and a default DB password `postgres:1234`. | `settings.py` |
| C7 | **Login redirects to `dashboard.html`, which doesn't exist** (the dashboard is `index.html`). | `js/login.js` |

### High: correctness and design

- **H1. Role permissions never work.** `permissions.py` reads `user.role`, but `User` only has a `roles` M2M. Only superusers and groups pass.
- **H2. `TenantViewSet` filters `cluster` on `Tenant`.** The field lives on `Property`, so `?cluster=` raises `FieldError`.
- **H3. Invoice logic gaps.** `net_total` ignores arrears, and `rent_paid` / `balance` run a query per invoice (N+1). `invoice_number` uses `count()+1`, which is racy and can collide. Overdue status is never set. An overpayment with no open invoice is silently dropped (the transaction is still marked settled).
- **H4. Tenant matching is ambiguous.** `unit_name__iexact` can match units in different properties, and the code then takes `.first()`. The MSISDN fallback is weak.
- **H5. Dashboard data is hardcoded.** Both `/dashboard/metrics/` and `/payment-summaries/` return fake numbers, are defined twice (`billing/views.py` and the root `urls.py` wiring) and are unauthenticated.
- **H6. JWT config is incomplete.** `BLACKLIST_AFTER_ROTATION=True` needs `rest_framework_simplejwt.token_blacklist` in `INSTALLED_APPS`. Access tokens last 1 day. The frontend never calls the refresh endpoint, so expiry just yields 401s.
- **H7. Settings deprecations.** `STATICFILES_STORAGE` was removed in Django 5.1+ and should become `STORAGES`. `ssl_require=True` breaks local Postgres.
- **H8. Tokens sit in `localStorage` (XSS-exposed), and the fallback user is `is_superuser: true`.** Client-side role flags are cosmetic only, so the server must enforce.

### Medium: maintainability

- **M1. The frontend API base URL is set in ~20 places.** Most files hardcode `http://127.0.0.1:8000`, while `api.js`, `script.js` and the login code hardcode the Render URL. Production pages pointing at `127.0.0.1` fail.
- **M2. `api.js` isn't loaded on `coop.html`, `mpesa.html`, `login.html` or `invoice.html`.** Several modules re-implement their own `fetch`.
- **M3. Every module repeats the same layout (sidebar, header).** About 21 pages copy-paste the markup and CSS.
- **M4. Hardcoded personal and agency data.** The "Peter Mwaniki" fallback name and the PEMWA agency defaults (phone, email) in the model; 11 references in total.
- **M5. Debug `console.log` of auth state on every request.**
- **M6. No tests.** All `tests.py` files are stubs. There's no CI, no `.env.example`, no README.
- **M7. Repo hygiene.** An empty file named `c` at the root, a `.gitignore` only inside the backend folder, no linting.
- **M8. Inconsistent models.** Some use UUID PKs and some use ints. Status values mix case. Deposits live in `billing`, but `Unit.deposit` and `LeaseAgreement.deposit_amount` also exist (three sources of truth).
- **M9. Naming.** `Unit.unit_no` vs `unit_name`, and the `PropertyUnit = Unit` alias.

## 3. Improvement roadmap

### Phase 0: Safety net (½ day)
1. Add the root `.gitignore`, delete the file `c`, add `.env.example` and a README (setup, env vars, run, deploy).
2. Make settings fail closed: require `SECRET_KEY`, default `DEBUG=False`, explicit `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS`, no default DB password, `ssl_require` only when not local. Move to `STORAGES`.
3. **Rotate the committed secret key and the DB credentials** (assume they're burned).

### Phase 1: Make the core flow work (2–3 days)
1. **One payment model.** Keep `mpesa.MpesaTransaction` and `PaymentSettlement`, and delete the duplicates in `properties` (with a migration).
2. **Fix `Invoice`:** add `arrears`, `total`, `amount_paid` and a `status` with consistent values. Compute them with `aggregate()`, using `select_for_update` inside the settlement transaction. Use a sequence-safe invoice number.
3. **Rewrite `generate_monthly_invoices`** against the real fields. Make it idempotent per `(tenant, unit, billing_period)`, and charge the deposit only on the first invoice of a lease. Schedule it (Render cron).
4. **Harden the settlement engine:** handle overpayment as a tenant credit, disambiguate matching by property, and write unit tests with Safaricom sample payloads.
5. **Secure the webhooks:** IP allowlist or secret path token, no error leakage, and an audit log of raw payloads.

### Phase 2: Auth and permissions (1–2 days)
1. Replace `AllowAny` with `IsAuthenticated` plus role permissions everywhere.
2. Fix `permissions.py` to use `user.roles` (or one `role` FK). Pick one model.
3. Add a `/me/` endpoint returning the user and role permissions, and have login call it instead of faking the user.
4. Add the token blacklist app and a refresh interceptor in `fetchAPI`. Shorten the access-token lifetime to about 15–60 minutes.
5. Return `is_superuser` and permissions only from the server. Remove the fallback superuser.

### Phase 3: Real dashboard (1 day)
Replace both hardcoded endpoints with one authenticated endpoint backed by real queries (units total/occupied per property, collected vs billed per vote-head). Remove the duplicate view and fix the `dashboard.html` redirect.

### Phase 4: Frontend consolidation (2–4 days)
1. A single `js/config.js` (`API_BASE_URL` switched by hostname) and a single `fetchAPI` with refresh. Delete the ~20 inline copies.
2. A shared layout (sidebar/header injected from one `layout.js` or partial) to cut per-page duplication.
3. Escape all injected HTML (`textContent` or a sanitizer), since many templates render API data via `innerHTML`. Remove the auth-state console logging.
4. Longer term: consider Vite plus a component library once Phases 1–3 are stable.

### Phase 5: Quality and ops (ongoing)
- pytest + factory_boy for models, settlement, billing and permissions; GitHub Actions running tests and `ruff`.
- DRF throttling on login and webhooks, structured logging, Sentry.
- `django-filter` for pagination and filters, which also fixes `?cluster=` and `?property=`.
- Features worth adding: tenant statements and PDF receipts, SMS on payment (templates already modelled), arrears ageing report, landlord statements with commission, lease-expiry alerts, CSV export.

## 4. Suggested order of attack

Phase 0 → C1/C2/C3 (billing and M-Pesa correctness) → C4/C5/H1 (security) → C7, H5, M1 (visible fixes) → everything else.

## 5. Open questions
1. Is `Theedxctor/GeoPima` (your other copy on the Desktop) a fork of this? Which is the source of truth?
2. Does the live Render/Neon deployment hold real tenant data? If so, migrations need extra care.
3. Is M-Pesa live (Paybill/Till number, Daraja registration), or still planned?
4. Is this single-agency (PEMWA) or meant to be multi-tenant SaaS? That changes the data model considerably.
