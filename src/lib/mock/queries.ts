import {
  PERIODS, TODAY, agency, banks, deposits, invoices, landlords, leases, mpesa, properties,
  roles, smsTemplates, staff, tenants, units, voteHeads,
} from "./seed";
import type { Invoice, MpesaTx, Property, Tenant, Unit } from "../types";

const index = <T extends { id: number }>(rows: T[]) => new Map(rows.map((r) => [r.id, r]));
const L = index(landlords);
const P = index(properties);
const U = index(units);
const T = index(tenants);

const sum = (rows: number[]) => rows.reduce((s, n) => s + n, 0);
const daysBetween = (from: string, to: string) =>
  Math.floor((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000);

export const periodLabel = (period: string) =>
  new Date(`${period}-01T00:00:00`).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

export const currentPeriod = PERIODS[PERIODS.length - 1];

/* ---------- units ---------- */

export function unitRow(u: Unit) {
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

export function unitRows(filter: { search?: string; property?: string; status?: string } = {}) {
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

/* ---------- properties & landlords ---------- */

export function propertyRow(p: Property) {
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

export const propertyRows = (landlordId?: number) =>
  properties.filter((p) => landlordId === undefined || p.landlordId === landlordId).map(propertyRow);

export function propertyDetail(id: number, landlordId?: number) {
  const p = P.get(id);
  if (!p || (landlordId !== undefined && p.landlordId !== landlordId)) return null;
  return { property: propertyRow(p), units: unitRows({ property: String(id) }) };
}

export function landlordRows() {
  return landlords.map((l) => {
    const props = propertyRows(l.id);
    return { ...l, propertyCount: props.length, unitCount: sum(props.map((p) => p.unitCount)) };
  });
}

export function landlordDetail(id: number) {
  const landlord = L.get(id);
  return landlord ? { landlord, properties: propertyRows(id) } : null;
}

/* ---------- tenants ---------- */

export function tenantRow(t: Tenant) {
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

export function tenantRows(filter: { search?: string; status?: string; property?: string } = {}) {
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

export function tenantDetail(id: number) {
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

export function invoiceRow(i: Invoice) {
  const t = T.get(i.tenantId)!;
  const u = U.get(i.unitId)!;
  return {
    ...i,
    tenantName: t.name,
    tenantCode: t.code,
    unitName: u.name,
    propertyName: P.get(u.propertyId)!.name,
    propertyId: u.propertyId,
    daysOverdue: i.balance > 0 && i.dueDate < TODAY ? daysBetween(i.dueDate, TODAY) : 0,
  };
}

export function invoiceRows(filter: { search?: string; status?: string; period?: string; tenantId?: number } = {}) {
  const q = (filter.search ?? "").toLowerCase();
  return invoices
    .filter(
      (i) =>
        (filter.tenantId === undefined || i.tenantId === filter.tenantId) &&
        (!filter.status || i.status === filter.status) &&
        (!filter.period || i.period === filter.period),
    )
    .map(invoiceRow)
    .filter((i) => !q || [i.number, i.tenantName, i.tenantCode, i.unitName].some((v) => v.toLowerCase().includes(q)))
    .sort((a, b) => b.period.localeCompare(a.period) || b.id - a.id);
}

export function invoiceDetail(id: number, tenantId?: number) {
  const i = invoices.find((x) => x.id === id);
  if (!i || (tenantId !== undefined && i.tenantId !== tenantId)) return null;
  return { invoice: invoiceRow(i), payments: mpesaRows({ invoiceId: id }) };
}

/* ---------- M-Pesa ---------- */

export function mpesaRow(m: MpesaTx) {
  return { ...m, tenantName: m.tenantId ? T.get(m.tenantId)!.name : null };
}

export function mpesaRows(filter: { status?: string; tenantId?: number; invoiceId?: number } = {}) {
  return mpesa
    .filter(
      (m) =>
        (!filter.status || m.status === filter.status) &&
        (filter.tenantId === undefined || m.tenantId === filter.tenantId) &&
        (filter.invoiceId === undefined || m.invoiceId === filter.invoiceId),
    )
    .map(mpesaRow);
}

/* ---------- deposits ---------- */

export const depositRows = () =>
  deposits.map((d) => {
    const t = T.get(d.tenantId)!;
    const u = d.unitId ? U.get(d.unitId) : undefined;
    return { ...d, tenantName: t.name, unitName: u?.name ?? null, propertyName: u ? P.get(u.propertyId)!.name : null };
  });

/* ---------- dashboards & finance ---------- */

export function adminDashboard() {
  const props = propertyRows();
  const current = invoices.filter((i) => i.period === currentPeriod);
  const overdue = invoiceRows({ status: "overdue" }).concat(invoiceRows({ status: "partially_paid" }));
  return {
    period: currentPeriod,
    properties: props,
    totalUnits: sum(props.map((p) => p.unitCount)),
    occupiedUnits: sum(props.map((p) => p.occupiedCount)),
    billed: sum(current.map((i) => i.total)),
    collected: sum(current.map((i) => i.paid)),
    unmatched: mpesa.filter((m) => m.status === "unmatched").length,
    recentPayments: mpesaRows().slice(0, 6),
    topArrears: overdue.filter((i) => i.period === currentPeriod).sort((a, b) => b.balance - a.balance).slice(0, 6),
    collections: [
      { name: "Rent", ...collectByItem("House rent") },
      { name: "Water", ...collectByItem("Water") },
      { name: "Garbage", ...collectByItem("Garbage collection") },
    ],
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

export function financeSummary() {
  const monthly = PERIODS.map((period) => {
    const rows = invoices.filter((i) => i.period === period);
    return { period: periodLabel(period).split(" ")[0], billed: sum(rows.map((i) => i.total)), collected: sum(rows.map((i) => i.paid)) };
  });
  const open = invoices.filter((i) => i.balance > 0);
  const bucket = (min: number, max: number) =>
    sum(open.filter((i) => { const d = daysBetween(i.dueDate, TODAY); return d >= min && d <= max; }).map((i) => i.balance));
  return {
    monthly,
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

/* ---------- landlord statements ---------- */

export function statements(landlordId: number) {
  return PERIODS.flatMap((period) =>
    properties
      .filter((p) => p.landlordId === landlordId)
      .map((p) => {
        const ids = new Set(units.filter((u) => u.propertyId === p.id).map((u) => u.id));
        const rows = invoices.filter((i) => ids.has(i.unitId) && i.period === period);
        const billed = sum(rows.map((i) => i.total));
        const collected = sum(rows.map((i) => i.paid));
        const commission = Math.round((collected * p.commissionPct) / 100);
        return { period, propertyId: p.id, property: p.name, billed, collected, arrears: billed - collected, commission, net: collected - commission };
      }),
  ).filter((s) => s.billed > 0);
}

/* ---------- tenant home ---------- */

export function tenantHome(id: number) {
  const detail = tenantDetail(id);
  if (!detail) return null;
  const open = detail.invoices.filter((i) => i.balance > 0).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return { ...detail, open, balance: sum(open.map((i) => i.balance)), nextDue: open[0] ?? null, paybill: agency.paybill };
}

/* ---------- configuration ---------- */

export const configuration = () => ({ agency, staff, roles, banks, smsTemplates, voteHeads });
export const agencyInfo = () => agency;
