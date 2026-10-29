import { currentPeriod as thisPeriod, periodLabel, recentPeriods, today } from "../dates";
import type { Agency, Bank, Deposit, Invoice, Landlord, Lease, MpesaTx, Property, RoleDef, SmsTemplate, StaffUser, Tenant, Unit, VoteHead } from "../types";

/** Everything the queries read: one snapshot of the records the signed-in user is allowed to see. */
export interface Data {
  agency: Agency;
  landlords: Landlord[];
  properties: Property[];
  units: Unit[];
  tenants: Tenant[];
  leases: Lease[];
  invoices: Invoice[];
  mpesa: MpesaTx[];
  deposits: Deposit[];
  voteHeads: VoteHead[];
  staff: StaffUser[];
  roles: RoleDef[];
  banks: Bank[];
  smsTemplates: SmsTemplate[];
}

const sum = (rows: number[]) => rows.reduce((s, n) => s + n, 0);
const daysBetween = (from: string, to: string) =>
  Math.floor((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000);

const LEASE_WARNING_DAYS = 60;

export interface SearchHit { kind: "Tenant" | "Unit" | "Property" | "Landlord" | "Invoice" | "Payment"; title: string; subtitle: string; href: string }

export function makeQueries(data: Data) {
  const { agency, banks, deposits, invoices, landlords, leases, mpesa, properties, roles, smsTemplates, staff, tenants, units, voteHeads } = data;
  const lookup = <T extends { id: number }>(rows: T[]) => ({ get: (id: number) => rows.find((r) => r.id === id) });
  const L = lookup(landlords);
  const P = lookup(properties);
  const U = lookup(units);
  const T = lookup(tenants);
  const now = today();
  const currentPeriod = thisPeriod();
  const periods = recentPeriods(6);

  /* ---------- units ---------- */

  function unitRow(u: Unit) {
    const p = P.get(u.propertyId)!;
    const tenant = tenants.find((t) => t.unitId === u.id && t.status !== "vacated") ?? null;
    return {
      ...u,
      propertyName: p.name,
      tenantId: tenant?.id ?? null,
      tenantName: tenant?.name ?? null,
      monthlyTotal: u.rent + u.water + u.garbage,
    };
  }

  function unitRows(filter: { search?: string; property?: string; status?: string } = {}) {
    const q = (filter.search ?? "").toLowerCase();
    return units
      .map(unitRow)
      .filter(
        (u) =>
          (!filter.property || String(u.propertyId) === filter.property) &&
          (!filter.status || u.status === filter.status) &&
          (!q || [u.name, u.propertyName, u.tenantName ?? "", u.type].some((v) => v.toLowerCase().includes(q))),
      );
  }

  /** Everything the unit side panel shows: the unit, who is in it, and their recent money. */
  function unitDetail(id: number) {
    const u = U.get(id);
    if (!u) return null;
    const unit = unitRow(u);
    const tenant = unit.tenantId ? tenantRow(T.get(unit.tenantId)!) : null;
    return {
      unit,
      tenant,
      lease: tenant ? (leases.find((l) => l.tenantId === tenant.id && l.isActive) ?? null) : null,
      invoices: tenant ? invoiceRows({ tenantId: tenant.id }).slice(0, 3) : [],
      payments: tenant ? mpesaRows({ tenantId: tenant.id }).slice(0, 3) : [],
    };
  }

  /* ---------- properties & landlords ---------- */

  function propertyRow(p: Property) {
    const us = units.filter((u) => u.propertyId === p.id);
    const occupied = us.filter((u) => u.status === "occupied");
    const unitIds = new Set(us.map((u) => u.id));
    const current = invoices.filter((i) => unitIds.has(i.unitId) && i.period === currentPeriod);
    return {
      ...p,
      landlordName: L.get(p.landlordId)!.name,
      unitCount: us.length,
      occupiedCount: occupied.length,
      occupancy: us.length ? Math.round((occupied.length / us.length) * 100) : 0,
      monthlyRent: sum(occupied.map((u) => u.rent)),
      billed: sum(current.map((i) => i.total)),
      collected: sum(current.map((i) => i.paid)),
    };
  }

  const propertyRows = (landlordId?: number) =>
    properties.filter((p) => landlordId === undefined || p.landlordId === landlordId).map(propertyRow);

  function propertyDetail(id: number, landlordId?: number) {
    const p = P.get(id);
    if (!p || (landlordId !== undefined && p.landlordId !== landlordId)) return null;
    return { property: propertyRow(p), units: unitRows({ property: String(id) }) };
  }

  function landlordRows() {
    return landlords.map((l) => {
      const props = propertyRows(l.id);
      return { ...l, propertyCount: props.length, unitCount: sum(props.map((p) => p.unitCount)) };
    });
  }

  function landlordDetail(id: number) {
    const landlord = L.get(id);
    return landlord ? { landlord, properties: propertyRows(id) } : null;
  }

  /* ---------- tenants ---------- */

  function tenantRow(t: Tenant) {
    const u = t.unitId ? U.get(t.unitId) : undefined;
    const p = u ? P.get(u.propertyId) : undefined;
    const mine = invoices.filter((i) => i.tenantId === t.id);
    return {
      ...t,
      unitName: u?.name ?? null,
      propertyName: p?.name ?? null,
      landlordName: p ? L.get(p.landlordId)!.name : null,
      balance: sum(mine.map((i) => i.balance)),
    };
  }

  function tenantRows(filter: { search?: string; status?: string; property?: string } = {}) {
    const q = (filter.search ?? "").toLowerCase();
    return tenants
      .map(tenantRow)
      .filter(
        (t) =>
          (!filter.status || t.status === filter.status) &&
          (!filter.property || t.propertyName === filter.property) &&
          (!q || [t.name, t.code, t.unitName ?? "", t.phone].some((v) => v.toLowerCase().includes(q))),
      );
  }

  function tenantDetail(id: number) {
    const t = T.get(id);
    if (!t) return null;
    return {
      tenant: tenantRow(t),
      lease: leases.find((l) => l.tenantId === id && l.isActive) ?? null,
      invoices: invoiceRows({ tenantId: id }),
      payments: mpesaRows({ tenantId: id }),
      deposit: deposits.find((d) => d.tenantId === id) ?? null,
    };
  }

  /* ---------- invoices ---------- */

  function invoiceRow(i: Invoice) {
    const t = T.get(i.tenantId)!;
    const u = U.get(i.unitId)!;
    return {
      ...i,
      tenantName: t.name,
      tenantCode: t.code,
      unitName: u.name,
      propertyName: P.get(u.propertyId)!.name,
      propertyId: u.propertyId,
      daysOverdue: i.balance > 0 && i.dueDate < now ? daysBetween(i.dueDate, now) : 0,
    };
  }

  function invoiceRows(
    filter: { search?: string; status?: string; period?: string; tenantId?: number; propertyId?: number } = {},
  ) {
    const q = (filter.search ?? "").toLowerCase();
    return invoices
      .filter(
        (i) =>
          (filter.tenantId === undefined || i.tenantId === filter.tenantId) &&
          (!filter.status || i.status === filter.status) &&
          (!filter.period || i.period === filter.period),
      )
      .map(invoiceRow)
      .filter((i) => filter.propertyId === undefined || i.propertyId === filter.propertyId)
      .filter((i) => !q || [i.number, i.tenantName, i.tenantCode, i.unitName].some((v) => v.toLowerCase().includes(q)))
      .sort((a, b) => b.period.localeCompare(a.period) || b.number.localeCompare(a.number));
  }

  function invoiceDetail(id: string, tenantId?: number) {
    const i = invoices.find((x) => x.id === id);
    if (!i || (tenantId !== undefined && i.tenantId !== tenantId)) return null;
    return { invoice: invoiceRow(i), payments: mpesaRows({ invoiceId: id }), agency };
  }

  /* ---------- M-Pesa ---------- */

  function mpesaRow(m: MpesaTx) {
    return { ...m, tenantName: m.tenantId ? T.get(m.tenantId)!.name : null };
  }

  function mpesaRows(filter: { status?: string; tenantId?: number; invoiceId?: string } = {}) {
    return mpesa
      .filter(
        (m) =>
          (!filter.status || m.status === filter.status) &&
          (filter.tenantId === undefined || m.tenantId === filter.tenantId) &&
          (filter.invoiceId === undefined || m.invoiceId === filter.invoiceId || !!m.allocations?.some((a) => a.invoiceId === filter.invoiceId)),
      )
      .map(mpesaRow);
  }

  /* ---------- deposits ---------- */

  const depositRows = () =>
    deposits.map((d) => {
      const t = T.get(d.tenantId)!;
      const u = d.unitId ? U.get(d.unitId) : undefined;
      return { ...d, tenantName: t.name, tenantStatus: t.status, unitName: u?.name ?? null, propertyName: u ? P.get(u.propertyId)!.name : null };
    });

  /* ---------- dashboards & finance ---------- */

  function adminDashboard() {
    const props = propertyRows();
    const current = invoices.filter((i) => i.period === currentPeriod);
    const overdue = invoiceRows().filter((i) => i.balance > 0 && i.dueDate < now);
    const unmatched = mpesaRows({ status: "unmatched" });
    const vacant = unitRows({ status: "vacant" });
    const leasesEnding = leases
      .filter((l) => l.isActive && l.endDate && l.endDate >= now && daysBetween(now, l.endDate) <= LEASE_WARNING_DAYS)
      .sort((a, b) => a.endDate!.localeCompare(b.endDate!))
      .map((l) => {
        const t = tenantRow(T.get(l.tenantId)!);
        return { leaseId: l.id, tenantId: t.id, tenantName: t.name, unitName: t.unitName, propertyName: t.propertyName, endDate: l.endDate!, daysLeft: daysBetween(now, l.endDate!) };
      });
    return {
      period: currentPeriod,
      totalUnits: sum(props.map((p) => p.unitCount)),
      occupiedUnits: sum(props.map((p) => p.occupiedCount)),
      billed: sum(current.map((i) => i.total)),
      collected: sum(current.map((i) => i.paid)),
      unmatched: { count: unmatched.length, amount: sum(unmatched.map((m) => m.amount)) },
      overdue: { count: overdue.length, amount: sum(overdue.map((i) => i.balance)) },
      vacant: vacant.slice(0, 5),
      vacantCount: vacant.length,
      leasesEnding,
      leaseWarningDays: LEASE_WARNING_DAYS,
      topArrears: overdue.filter((i) => i.period === currentPeriod).sort((a, b) => b.balance - a.balance).slice(0, 6),
      recentPayments: mpesaRows().slice(0, 6),
    };
  }

  function collectByItem(description: string) {
    const current = invoices.filter((i) => i.period === currentPeriod);
    const total = sum(current.flatMap((i) => i.items.filter((x) => x.description === description).map((x) => x.amount)));
    // Payments are allocated pro rata across an invoice's lines.
    const collected = Math.round(
      sum(
        current.map((i) => {
          const line = i.items.find((x) => x.description === description)?.amount ?? 0;
          return i.total ? (line / i.total) * i.paid : 0;
        }),
      ),
    );
    return { total, collected, pct: total ? Math.round((collected / total) * 100) : 0 };
  }

  function financeSummary() {
    const monthly = periods.map((period) => {
      const rows = invoices.filter((i) => i.period === period);
      return { period: periodLabel(period).split(" ")[0], billed: sum(rows.map((i) => i.total)), collected: sum(rows.map((i) => i.paid)) };
    });
    const open = invoices.filter((i) => i.balance > 0);
    const bucket = (min: number, max: number) =>
      sum(open.filter((i) => { const d = daysBetween(i.dueDate, now); return d >= min && d <= max; }).map((i) => i.balance));
    const props = propertyRows();
    return {
      monthly,
      occupancy: props.map((p) => ({ property: p.name.split(" ")[0], total: p.unitCount, occupied: p.occupiedCount })),
      collections: [
        { name: "Rent", ...collectByItem("House rent") },
        { name: "Water", ...collectByItem("Water") },
        { name: "Garbage", ...collectByItem("Garbage collection") },
      ],
      ageing: [
        { label: "0–30 days", amount: bucket(0, 30) },
        { label: "31–60 days", amount: bucket(31, 60) },
        { label: "61+ days", amount: bucket(61, 9999) },
      ],
      totalBilled: sum(invoices.map((i) => i.total)),
      totalCollected: sum(invoices.map((i) => i.paid)),
      totalArrears: sum(open.map((i) => i.balance)),
      depositsHeld: sum(deposits.filter((d) => d.status === "held").map((d) => d.amount)),
    };
  }

  /* ---------- global search ---------- */


  /** Finds records across the admin portal for the ⌘K search. Each group is capped so one kind cannot crowd out the rest. */
  function searchAll(query: string, perKind = 4): SearchHit[] {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const has = (...vals: (string | null | undefined)[]) => vals.some((v) => v?.toLowerCase().includes(q));
    const digits = q.replace(/\D/g, "");
    const phoneHas = (p: string) => digits.length >= 3 && p.includes(digits.replace(/^0/, "254"));
    const hits: SearchHit[] = [];
    const add = (rows: SearchHit[]) => hits.push(...rows.slice(0, perKind));

    add(tenants.map(tenantRow).filter((t) => has(t.name, t.code, t.unitName, t.email) || phoneHas(t.phone)).map((t) => ({
      kind: "Tenant", title: t.name, subtitle: `${t.code} · ${t.propertyName ? `${t.propertyName} ${t.unitName}` : "Vacated"}`, href: `/admin/tenants/${t.id}`,
    })));
    add(units.map(unitRow).filter((u) => has(u.name, u.propertyName, u.tenantName)).map((u) => ({
      kind: "Unit", title: `${u.propertyName} · ${u.name}`, subtitle: `${u.status}${u.tenantName ? ` · ${u.tenantName}` : ""}`, href: `/admin/properties/${u.propertyId}?unit=${u.id}`,
    })));
    add(properties.map(propertyRow).filter((p) => has(p.name, p.code, p.location, p.cluster)).map((p) => ({
      kind: "Property", title: p.name, subtitle: `${p.location} · ${p.landlordName}`, href: `/admin/properties/${p.id}`,
    })));
    add(landlords.filter((l) => has(l.name, l.code, l.email) || phoneHas(l.phone)).map((l) => ({
      kind: "Landlord", title: l.name, subtitle: l.code, href: `/admin/landlords/${l.id}`,
    })));
    add(invoiceRows().filter((i) => has(i.number)).map((i) => ({
      kind: "Invoice", title: i.number, subtitle: `${i.tenantName} · ${periodLabel(i.period)} · ${i.status.replace("_", " ")}`, href: `/admin/invoices/${i.id}`,
    })));
    add(mpesaRows().filter((m) => has(m.transId, m.billRef) || phoneHas(m.msisdn)).map((m) => ({
      kind: "Payment", title: m.transId, subtitle: `${m.tenantName ?? "Unmatched"} · KES ${m.amount.toLocaleString("en-KE")}`,
      href: m.tenantId ? `/admin/tenants/${m.tenantId}` : "/admin/mpesa?status=unmatched",
    })));
    return hits;
  }

  /* ---------- tenant home ---------- */

  function tenantHome(id: number) {
    const detail = tenantDetail(id);
    if (!detail) return null;
    const open = detail.invoices.filter((i) => i.balance > 0).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    return { ...detail, open, balance: sum(open.map((i) => i.balance)), nextDue: open[0] ?? null, paybill: agency.paybill };
  }

  /* ---------- configuration ---------- */

  const configuration = () => ({ agency, staff, roles, banks, smsTemplates, voteHeads });
  const agencyInfo = () => agency;

  return { unitRow, unitRows, unitDetail, propertyRow, propertyRows, propertyDetail, landlordRows, landlordDetail, tenantRow, tenantRows, tenantDetail, invoiceRow, invoiceRows, invoiceDetail, mpesaRow, mpesaRows, depositRows, adminDashboard, collectByItem, financeSummary, searchAll, tenantHome, configuration, agencyInfo };
}
