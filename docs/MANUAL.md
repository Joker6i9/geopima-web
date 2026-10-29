# GeoPima User Manual

What every page contains and what you can do on it. This manual covers the frontend as it is today and is updated whenever pages change.

> **Status:** every page shows live records from the Django backend; there is no demo data. In the admin portal you can browse, search and **make changes** (move tenants in and out, raise invoices, assign payments, add landlords, properties and units, refund deposits, edit the agency profile); the tenant and landlord portals are read-only. What each staff role may change is decided by the backend. Pages are empty until the database has records. Items marked *(planned)* are on the roadmap.

Last updated: 24 Oct 2026, after admin actions and global search.

---

## 1. Getting started

### Signing in (`/login`)
Enter your username and password. You land in the portal that matches your account:

| Account | Portal | Lands on |
|---|---|---|
| Any staff role (Super Admin, Admin, Accountant, Secretary, Field Agent) | Admin ("Agency console") | `/admin/dashboard` |
| Linked to a tenant record | Tenant portal | `/tenant` |
| Linked to a landlord record | Landlord portal | `/landlord` |

An account with no role and no tenant or landlord link cannot sign in; an administrator must assign one.

You can only open your own portal. Visiting another portal's address sends you back to yours.

### Layout common to every page
- **Sidebar** (left on desktop, behind the menu button on phones): the main sections of your portal.
- **Header:** search (admin) and **Sign out**.
- **Status badges** are colour-coded: green = good (paid, active, settled, occupied), amber = needs a look (partially paid, unpaid, vacant, maintenance, held), red = problem (overdue, suspended, unmatched, inactive), grey = finished (vacated, refunded).
- **Search (admin only):** the **Search** box in the header, or press **⌘K / Ctrl+K** (or `/`). Type at least two characters to find tenants (name, ID, phone, unit), units, properties, landlords, invoices (number) and M-Pesa payments (code, account reference, phone). Use ↑ ↓ and Enter, or click, to open a result.
- **Forms and confirmations:** actions open a small window. If something is wrong (a bad phone number, a duplicate invoice) the message appears in red inside the window and your entries are kept; on success the window closes and a green message confirms it.
- **Filters** on list pages use the page address, so a filtered view can be bookmarked or shared. **Clear** resets them.

---

## 2. Admin portal (Agency console)

Sidebar: **Dashboard · Properties · People · Money · Settings**. People and Money each group several pages behind tabs at the top of the page.

### 2.1 Dashboard (`/admin/dashboard`)
The starting point: what needs doing today.

- **Four summary cards**
  - *Occupancy*: occupied units out of all units.
  - *Collected this month*: amount received against the amount billed.
  - *Overdue balances*: total and number of invoices past their due date that still have a balance (red when any exist).
  - *Vacant units*: how many units are free to let.
- **Needs attention** (each box is a link)
  - *Unmatched payments*: M-Pesa money that could not be tied to a tenant. Opens M-Pesa payments filtered to unmatched.
  - *Overdue invoices*: opens Invoices filtered to overdue.
  - *Vacant units*: the first five, with rent. Each opens that unit's side panel on its property.
  - *Leases ending soon*: active leases ending within 60 days, soonest first. Each opens the tenant.
- **Largest balances this month**: the six biggest overdue current-month invoices, with days late. Click one to open the invoice.
- **Recent M-Pesa payments**: the six latest payments, who they were matched to, and whether they were settled.

Charts and breakdowns that used to be here now live in **Money → Reports**.

### 2.2 Properties (`/admin/properties`)
The home of everything about buildings, units and who lives in them. (The old separate **Units** page no longer exists; `/admin/units` redirects here.)

**Property list**
- **Add property** (top right): choose the landlord, then name, location, cluster and commission %. Property names must be unique.
- Columns: property and location, landlord, cluster, occupancy bar, **Vacant** count, monthly rent roll, commission %, status.
- **Search** by property, location, cluster or landlord; **filter by landlord**.
- The vacant count is a link to that property's vacant units.
- Click a property name to open it.

**Property page** (`/admin/properties/<id>`)
- Header: name, location, cluster, a link to the landlord, and status.
- Four cards: units (with occupied and vacant counts), occupancy, monthly rent roll, collected this month.
- Three tabs:
  - **Units**: every unit with type, rent, water + garbage, tenant and status. Use the chips (**All / Occupied / Vacant / Maintenance**, each with a count) to narrow the list. **Click a unit name to open its side panel.** **Add unit** (top right of the tab) asks for the unit name, type, rent, deposit, water and garbage; new units start vacant, and names must be unique within the property.
  - **Tenants**: the tenants living in this property, with phone, balance and status. Click a name to open the tenant.
  - **Invoices**: all invoices for units in this property. Click an invoice number to open it.

**Unit side panel** (opens over the property page; close with ✕, Esc or by clicking outside)
- Status and unit type.
- *Monthly charges*: rent, water, garbage and the total.
- If occupied: *Tenant* (name linking to their page, phone, move-in date, lease dates, balance), *Recent invoices* (latest three, each opens the invoice) and *Recent payments* (latest three).
- If vacant or under maintenance: a note saying so.
- **Actions** (buttons at the top of the panel):
  - **Move in a tenant** (vacant units): asks for name, phone, email, lease start, optional lease end and the rent due day. It creates the tenant, the lease and a held deposit (equal to the unit's deposit), marks the unit occupied and raises the first invoice for the current month. Phone numbers must be Kenyan (e.g. `0712 345 678`) and not already used by a current tenant.
  - **Raise invoice** (occupied units): pick a billing period; the invoice uses the unit's current rent, water and garbage. A tenant can only have one invoice per period.
  - **Vacate** (occupied units): after confirmation the lease ends today, the tenant becomes *Vacated* and the unit becomes vacant. Any unpaid balance stays on the tenant's record, and the deposit stays *held* until refunded (see Deposits).
- The panel's address contains `?unit=<id>`, so you can bookmark it or send the link to a colleague.

### 2.3 People
Two tabs: **Tenants** and **Landlords**.

**Tenants** (`/admin/tenants`)
- Table of tenant ID, name, property and unit, phone, balance (red when owing) and status.
- **Search** by name, ID, unit or phone; **filter** by property and by status (active, suspended, vacated).
- Click a name for the tenant page.

**Tenant page** (`/admin/tenants/<id>`)
- **Actions** (current tenants only): **Raise invoice**, **Suspend / Reactivate** (flags the tenant without moving them out) and **Vacate**.
- Cards: balance, monthly rent, deposit and its status.
- *Details*: phone, email, unit, landlord, move-in date, rent due day and lease dates.
- *Invoices*: every invoice for this tenant (click to open).
- *Payments*: M-Pesa payments matched to this tenant.

**Landlords** (`/admin/landlords`)
- **Add landlord** (top right): name, phone, email, bank and account number.
- Table of code, name, phone, bank, number of properties and units, status. Click a name for the landlord page.

**Landlord page** (`/admin/landlords/<id>`)
- Contact and bank details.
- *Properties*: each property with location, units, occupancy, commission % and amount collected. Click one to open it. **Add property** here pre-selects this landlord.

### 2.4 Money
Four tabs: **Invoices · M-Pesa payments · Deposits · Reports**.

**Invoices** (`/admin/invoices`)
- Header shows the number of invoices and the total outstanding for the current filter.
- **Search** by invoice number, tenant, tenant ID or unit; **filter** by period and by status (paid, partially paid, overdue, unpaid).
- Table: invoice number, tenant (with property and unit), period, due date, total, paid, balance, status.

**Invoice page** (`/admin/invoices/<id>`)
- A printable invoice: billed-to details, period, issue date, the line items (rent, water, garbage…), total, paid, **balance due**, and the payments received against it.
- **← All invoices** goes back to the list.

**M-Pesa payments** (`/admin/mpesa`)
- Header: total received and the amount still needing reconciliation.
- Buttons: **All**, **Unmatched** (with count), **Settled**. **Unmatched payments are always listed first.**
- Table: transaction code, time received, sender's phone, the account reference they typed, the tenant it was matched to (a link), amount, status.
- *An unmatched payment* usually means the sender typed a wrong or missing unit number as the account reference. Press **Assign** on its row, pick the tenant (only tenants with an open balance are listed, with what they owe) and confirm. The money is applied to that tenant's **oldest open invoices first**, and the payment becomes *Settled*. If the payment is larger than what they owe, the extra is shown under the tenant's name as "unallocated".

**Deposits** (`/admin/deposits`)
- Header: total held and total refunded.
- Table: code, tenant, property and unit, amount, status (held or refunded).
- **Refund** appears on a held deposit only once its tenant has **vacated**. It marks the deposit refunded; paying the money out is done in your bank.

**Reports** (`/admin/finance`)
- Cards: total billed, collected (with % of billed), arrears and deposits held.
- *Billed vs collected*: a chart for each month.
- *Arrears ageing*: unpaid balances grouped by days since the due date (0–30, 31–60, 61+).
- *Units by property*: total vs occupied units per property.
- *Collections by charge*: how much of the current month's rent, water and garbage has been collected.

### 2.5 Settings (`/admin/configuration`)
Sections:
- **Agency profile**: name, slogan, phone, email, address and the M-Pesa paybill number. **Edit** changes them (the paybill must be 5 to 7 digits). The tenant portal's payment instructions use the paybill.
- The sections below are view-only for now *(planned: editing staff, roles, banks, vote heads and SMS templates)*.
- **Staff**: staff accounts with username, phone, role and active status.
- **Roles**: each role, how many permissions it has and how many users.
- **Collection banks**: the agency's bank accounts and which appear on invoices.
- **Vote heads**: the charge types and the order in which an incoming payment is applied to them (priority 1 is paid first).
- **SMS templates**: the message wording used for reminders and receipts. Words in braces, like `{name}`, are filled in when sent.

---

## 3. Tenant portal

Sidebar: **Home · Invoices · Payments · Pay rent · My lease**. Tenants see only their own information.

- **Home** (`/tenant`): a greeting with property, unit and tenant ID. Shows the **amount due** and whether it is overdue with a **How to pay** button, or "You are all paid up". Also the paybill and account number with copy buttons, the three latest invoices and the five latest payments.
- **Invoices** (`/tenant/invoices`): every monthly invoice and what has been paid against it. Click one (`/tenant/invoices/<id>`) for the full invoice with line items and payments.
- **Payments** (`/tenant/payments`): history of M-Pesa payments received: code, date, account used and amount.
- **Pay rent** (`/tenant/pay`): the paybill (business) number and the tenant's account number (their unit number), each with a copy button, plus step-by-step M-Pesa instructions. If a balance is owing, the amount that clears it is shown.
- **My lease** (`/tenant/lease`): start and end dates, monthly rent, rent due day, deposit and its status, landlord, and the managing agency's phone and email.

---

## 4. Landlord portal

Sidebar: **Overview · Properties · Statements**. Landlords see only their own properties.

- **Overview** (`/landlord`): cards for properties and units, occupancy, rent collected this month (of billed) and **net payable to you** (after commission); a chart of billed vs collected for each property; a link to Statements.
- **Properties** (`/landlord/properties`): a card per property with occupancy bar, rent roll and collected this month. Click a property (`/landlord/properties/<id>`) for its unit list: unit, type, rent, water + garbage, tenant name and status. Tenant details are not linked, since landlords do not get tenant records.
- **Statements** (`/landlord/statements`): one table per month, with a row per property: billed, collected, arrears, commission and **net to you**, plus a total row.

---

## 5. Changelog

| Date | Change |
|---|---|
| 24 Oct 2026 | Admin sidebar cut from 10 items to 5. Units folded into Properties (unit side panel, Units / Tenants / Invoices tabs). People and Money sections with tabs. Dashboard rebuilt around "Needs attention". Finance renamed Reports and absorbed the occupancy and collections-by-charge charts. M-Pesa and Deposits summary cards replaced by a header line; unmatched payments sort first. |
| 29 Oct 2026 | Demo data removed. All three portals and every admin action now read and write the Django API. Invoice and deposit ids are Django UUIDs. The "Demo data" badge and demo sign-in buttons are gone. Signing in fails, instead of defaulting to admin, when the backend cannot say which portal an account belongs to. The agency paybill is no longer editable here: it is set on the server (`MPESA_PAYBILL`). |
| 24 Oct 2026 | Admin actions: move in, vacate, suspend/reactivate, raise invoice, assign unmatched M-Pesa payment, refund deposit, add landlord / property / unit, edit agency profile. Demo data is now changeable in memory. Global search (⌘K) added to the admin header. |
