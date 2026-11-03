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

**Giving a tenant or landlord a login.** Open the tenant (People > Tenants) or landlord page and press **Create login**. The username and a one-time password appear in the window: press **Copy** and send them to the person. The password cannot be shown again; if it is lost, press **Reset login** to make a new one (the old one stops working). Tenants who have moved out cannot be given a login. Staff accounts are added in Settings instead.

You can only open your own portal. Visiting another portal's address sends you back to yours.

### Layout common to every page
- **Sidebar** (left on desktop, behind the menu button on phones): the main sections of your portal.
- **Header:** search (admin) and **Sign out**.
- **Status badges** are colour-coded: green = good (paid, active, settled, occupied), amber = needs a look (partially paid, unpaid, vacant, maintenance, held), red = problem (overdue, suspended, unmatched, inactive), grey = finished (vacated, refunded).
- **Search (admin only):** the **Search** box in the header, or press **⌘K / Ctrl+K** (or `/`). Type at least two characters to find tenants (name, ID, phone, unit), units, properties, landlords, invoices (number) and M-Pesa payments (code, account reference, phone). Use ↑ ↓ and Enter, or click, to open a result.
- **Forms and confirmations:** actions open a small window. If something is wrong (a bad phone number, a duplicate invoice) the message appears in red inside the window and your entries are kept; on success the window closes and a green message confirms it.
- **Export / download:** tables have **Excel · CSV · PDF** links at the top right. The file matches what you see: if you filtered the list first, the download is filtered the same way. Excel and CSV keep amounts as real numbers (so you can sum them); the PDF is a print-ready page with the agency name, filters used, date and page numbers. Available on: Tenants, Invoices, Payments, Deposits, Landlords, Properties and (in Reports) Arrears and Billed vs collected. Tenants can download their own invoices and payments; landlords can download their statements.
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
  - *Tenants with no invoice this month*: current tenants with nothing billed for the month, with the first five. Open one and press **Raise invoice**.
  - *Missing or invalid phone*: current tenants whose number is not a valid Kenyan mobile. They cannot get SMS and their M-Pesa payments may not match.
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
- Header: name, location, cluster, a link to the landlord, and status. **Edit** changes the name, landlord, location, cluster, commission % and the **standard charges for new units** (deposit, water, garbage). The *Add unit* form is pre-filled from those charges. A property's code never changes.
- Four cards: units (with occupied and vacant counts), occupancy, monthly rent roll, collected this month.
- Three tabs:
  - **Units**: every unit with type, rent, water + garbage, tenant and status. Use the chips (**All / Occupied / Vacant / Maintenance**, each with a count) to narrow the list. **Click a unit name to open its side panel.** **Add unit** (top right of the tab) asks for the unit name, type, rent, deposit, water and garbage; new units start vacant, and names must be unique within the property.
  - **Tenants**: the tenants living in this property, with phone, balance and status. Click a name to open the tenant.
  - **Invoices**: all invoices for units in this property. Click an invoice number to open it.

**Unit side panel** (opens over the property page; close with ✕, Esc or by clicking outside)
- Status and unit type. **Edit** changes the type, rent, deposit, water and garbage. The new amounts apply from the next invoice; invoices already raised and the current lease keep their amounts.
- *Monthly charges*: rent, water, garbage and the total.
- If occupied: *Tenant* (name linking to their page, phone, move-in date, lease dates, balance), *Recent invoices* (latest three, each opens the invoice) and *Recent payments* (latest three).
- If vacant or under maintenance: a note saying so.
- **Actions** (buttons at the top of the panel):
  - **Move in a tenant** (vacant units): asks for name, phone, email, optional ID number and second contact, lease start, optional lease end and the rent due day. It creates the tenant, the lease and a held deposit (equal to the unit's deposit), marks the unit occupied and raises the first invoice for the current month. Phone numbers must be Kenyan (e.g. `0712 345 678`) and not already used by a current tenant.
  - **Raise invoice** (occupied units): pick a billing period; the invoice uses the unit's current rent, water and garbage. A tenant can only have one invoice per period.
  - **Vacate** (occupied units): after confirmation the lease ends today, the tenant becomes *Vacated* and the unit becomes vacant. Any unpaid balance stays on the tenant's record, and the deposit stays *held* until refunded (see Deposits).
- The panel's address contains `?unit=<id>`, so you can bookmark it or send the link to a colleague.

### 2.3 People
Three tabs: **Tenants · Landlords · Messages**.

**Tenants** (`/admin/tenants`)
- Table of tenant ID, name, property and unit, phone, balance (red when owing) and status.
- **Search** by name, ID, unit or phone; **filter** by property and by status (active, suspended, vacated).
- Click a name for the tenant page.

**Tenant page** (`/admin/tenants/<id>`)
- **Edit** (top right) changes the name, phone, email, ID number, second contact (next of kin) and rent due day. Phone numbers must be valid Kenyan numbers not used by another current tenant.
- **Request M-Pesa payment** (current tenants who owe): sends a PIN prompt to their phone for the amount you choose (the balance is suggested; the phone can be changed). When they enter the PIN the payment is recorded and applied by itself.
- **Record payment** (any tenant, including one who has left but still owes). **Actions** (current tenants only): **Raise invoice**, **Suspend / Reactivate** (flags the tenant without moving them out) and **Vacate**.
- Cards: balance, monthly rent, deposit and its status.
- *Details*: phone, email, ID number, second contact, unit, landlord, move-in date, rent due day and lease dates.
- *Invoices*: every invoice for this tenant (click to open).
- *Payments*: M-Pesa payments matched to this tenant.

**Messages** (`/admin/messages`)
Send a text message to many people at once. Four steps on one screen:
1. **Who**: *Tenants who owe rent*, *All current tenants*, *Tenants in one property* (choose the property) or *Landlords*. It shows how many people will get it (people with no phone number are skipped) and "See the list" shows their names.
2. **Write**: start from *Rent reminder*, *General notice* or one of your saved SMS templates, then edit. The **Insert** buttons add details that are filled in for each person: first name, unit, property, balance owed, paybill, agency name. Landlords can only get first name and agency name.
3. **Preview**: the message exactly as the first recipient would see it, with the character count and how many SMS parts it uses (160 characters per part).
4. **Send**: press *Send to N people*, then confirm.
- **Recent messages** below lists the latest 50 with who sent them, to whom, the text and the status (*Sent*, *Failed* with the reason, or *Test only*).
- **Test mode:** until an SMS provider is connected on the server (`SMS_PROVIDER=africastalking` plus `AT_API_KEY`, `AT_USERNAME`, `AT_SENDER_ID`), a yellow banner shows and messages are only recorded as *Test only*, not delivered.
- Allowed for Super Admin, Admin, Accountant and Secretary.

**Landlords** (`/admin/landlords`)
- **Add landlord** (top right): name, phone, email, bank and account number.
- Table of code, name, phone, bank, number of properties and units, status. Click a name for the landlord page.

**Landlord page** (`/admin/landlords/<id>`)
- Contact and bank details. **Edit** changes the name, phone, email, bank and account number.
- *Properties*: each property with location, units, occupancy, commission % and amount collected. Click one to open it. **Add property** here pre-selects this landlord.

### 2.4 Money
Four tabs: **Invoices · Payments · Deposits · Reports**.

**Invoices** (`/admin/invoices`)
- Header shows the number of invoices and the total outstanding for the current filter.
- **Search** by invoice number, tenant, tenant ID or unit; **filter** by period and by status (paid, partially paid, overdue, unpaid).
- Table: invoice number, tenant (with property and unit), period, due date, total, paid, balance, status.

**Invoice page** (`/admin/invoices/<id>`)
- A printable invoice: billed-to details, period, issue date, the line items (rent, water, garbage…), total, paid, **balance due**, and the payments received against it.
- **← All invoices** goes back to the list.

**Payments** (`/admin/mpesa`)
- **Record payment** (top right) is for money that did not come through the paybill: cash, a bank transfer or a cheque. Choose the tenant (those who owe are listed first, with the amount), the amount, the date, how it was paid, the bank it went into, and the reference (bank reference or cheque number; required for bank and cheque, not for cash). It is applied to the tenant's oldest open invoices first, and anything extra is kept as credit for the next invoice. The same button is on the tenant page and on an unpaid invoice, where the tenant and the balance are filled in for you.
- Header: total received and the amount still needing reconciliation.
- Buttons: **All**, **Unmatched** (with count), **Settled**. **Unmatched payments are always listed first.**
- Table: reference (M-Pesa code, bank reference or generated cash number), time received, how it was paid (sender's phone for M-Pesa; otherwise Cash / Bank transfer / Cheque with the bank and note),  the account reference they typed, the tenant it was matched to (a link), amount, status.
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
One page of cards. Who may change what follows each person's role.
- **Agency profile**: name, slogan, phone, email, address and the M-Pesa paybill number. **Edit** changes them (the paybill must be 5 to 7 digits). The tenant portal's payment instructions use the paybill.
- **Staff** *(Admin only)*: staff accounts with username, role and active status. **Add staff** asks for full name, username, role, email, phone and a starting password (8+ characters). The pencil on a row changes their role, sets a new password, or untick **Can sign in** to remove their access. Accounts are never deleted, so their history stays. You cannot deactivate or change the role of your own account.
- **M-Pesa connection** *(Admin only)*: ticks for what is set up (paybill and Daraja credentials, https address, pay-from-phone prompts, last payment received) and, when something is missing, which server setting it is. When ready, **Connect paybill to this system** registers the paybill with Safaricom so payments arrive automatically. Shows the callback addresses with their secret hidden. Setup steps: `docs/MPESA_GO_LIVE.md` in the backend repo. Until real credentials are set it runs against Safaricom's test environment.
- **Roles**: each role, how many permissions it has and how many users. View only.
- **Collection banks**: the accounts tenants can pay into. **Add bank**, the pencil edits (bank, branch, account name and number, and whether it **shows on invoices**), the bin removes it. Payments already received are not affected.
- **Vote heads (charges)**: the charge types in the order an incoming payment pays them off; the first is paid first. **Add charge** puts a new one at the end; the arrows move one up or down; the pencil renames it or marks it *Not in use* (kept for history).
- **Automatic payment receipts**: every time a payment is recorded for a tenant (M-Pesa paybill, M-Pesa prompt, cash, bank or cheque, or when you assign an unmatched payment), the tenant gets a text such as "Dear Tom, we received KES 1,500 on 2 Nov 2026 (ref QWE123). Your balance is KES 52,495." One text per payment, even if Safaricom repeats it. Change the wording or switch it off in the **Payment received** SMS template below (extra words available there: `{amount}`, `{receipt}`, `{date}`). If the wording is empty or contains a word we don't know, the standard message is used so receipts never stop. These texts show in People > Messages as *Automatic*. A text that fails to send never affects the payment itself.
- **SMS templates**: ready-made wording for reminders, receipts, discounts and welcomes. **Edit** or **Write** changes one. Words in braces, like `{first_name}`, `{balance}`, `{unit}`, `{paybill}`, are filled in for each person. Saved templates show up as starting points in People > Messages.

---

## 3. Tenant portal

Sidebar: **Home · Invoices · Payments · Pay rent · My lease**. Tenants see only their own information.

- **Home** (`/tenant`): a greeting with property, unit and tenant ID. Shows the **amount due** and whether it is overdue with a **How to pay** button, or "You are all paid up". Also the paybill and account number with copy buttons, the three latest invoices and the five latest payments.
- **Invoices** (`/tenant/invoices`): every monthly invoice and what has been paid against it. Click one (`/tenant/invoices/<id>`) for the full invoice with line items and payments.
- **Payments** (`/tenant/payments`): history of M-Pesa payments received: code, date, account used and amount.
- **Pay rent** (`/tenant/pay`): **Pay now** at the top. Enter the amount (your balance is suggested) and the M-Pesa phone (yours is filled in; it can be any Safaricom number) and press **Pay with M-Pesa**. A PIN prompt appears on that phone; enter your PIN. The page follows the payment and tells you when it is received, cancelled or timed out (nothing is charged unless you enter the PIN). Below it, **Or pay with Paybill**: the paybill (business) number and the tenant's account number (their unit number), each with a copy button, plus step-by-step M-Pesa instructions. If a balance is owing, the amount that clears it is shown.
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
| 2 Nov 2026 | **Automatic payment-received SMS** to the tenant for every recorded payment, with an on/off switch and editable wording in Settings. Needs Django migrations `communication` 0002 and `config_core` 0003. Fixed: an M-Pesa prompt that Safaricom reported as "still under processing" was wrongly marked failed, and a prompt paid after we had given up waiting is now still recorded. |
| 2 Nov 2026 | **Real M-Pesa (Daraja):** tenants can pay from their phone with a PIN prompt (Pay rent > Pay now); staff can send a prompt from the tenant page; Settings has an M-Pesa connection card that shows what is missing and registers the paybill with Safaricom. Payments from prompts and from the paybill are recorded once. Needs the Django `mpesa` 0005 migration and the new `MPESA_*` environment variables. |
| 2 Nov 2026 | **Downloads:** Excel, CSV and PDF on every main table (filters respected), plus tenant and landlord statements. **Editing:** tenants (with new ID number and second contact fields), landlords, properties (with standard charges for new units) and units can now be edited. Dashboard gained *no invoice this month* and *invalid phone* alerts. Needs the Django tenant-field migration (`tenants` 0004) and the property-edit fix (a property's code no longer changes when edited). |
| 2 Nov 2026 | Settings are now editable: staff (add, change role, reset password, deactivate), collection banks, vote heads (add, rename, reorder, retire) and SMS templates. Needs the Django staff-update changes. |
| 2 Nov 2026 | **Record payment** (cash, bank, cheque) added to Money > Payments, the tenant page and unpaid invoices; M-Pesa tab renamed Payments, with a "paid by" column. **Messages** tab added under People: bulk SMS to tenants who owe, all tenants, one property or landlords, with personalised fields, preview, confirmation and a sent log. Needs the matching Django changes (`communication` app, `/mpesa/transactions/record/`). |
| 3 Nov 2026 | **Create login** button on every tenant and landlord page: makes their portal account, links it to the record and shows a one-time password to hand over (**Reset login** if it is lost). Needs the Django changes (`/tenants/tenants/<id>/login/`, `/properties/landlords/<id>/login/`, `has_login`). |
| 29 Oct 2026 | Demo data removed. All three portals and every admin action now read and write the Django API. Invoice and deposit ids are Django UUIDs. The "Demo data" badge and demo sign-in buttons are gone. Signing in fails, instead of defaulting to admin, when the backend cannot say which portal an account belongs to. The agency paybill is no longer editable here: it is set on the server (`MPESA_PAYBILL`). |
| 24 Oct 2026 | Admin actions: move in, vacate, suspend/reactivate, raise invoice, assign unmatched M-Pesa payment, refund deposit, add landlord / property / unit, edit agency profile. Demo data is now changeable in memory. Global search (⌘K) added to the admin header. |
