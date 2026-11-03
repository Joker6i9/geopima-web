import "server-only";
import { notFound } from "next/navigation";
import { adminQueries } from "../data/load";
import { getMyStatements } from "../repo/landlord";
import { getMyInvoices, getMyPayments } from "../repo/tenant";
import { periodLabel } from "../dates";
import { channelLabel, titleCase } from "../format";
import type { Role } from "../types";
import type { Cell, Table } from "./table";

type Params = URLSearchParams;
const sum = (rows: Cell[][], i: number) => rows.reduce((n, r) => n + (Number(r[i]) || 0), 0);
const dateOf = (iso: string) => iso.slice(0, 10);
const label = (status: string) => titleCase(status);

/** "Overdue invoices for Riverside" style note from the filters in use. */
function describe(parts: (string | false | undefined)[]) {
  const used = parts.filter(Boolean);
  return used.length ? `Filtered by: ${used.join(", ")}` : "All records";
}

type Builder = (p: Params) => Promise<Table>;

const admin: Record<string, Builder> = {
  async tenants(p) {
    const q = await adminQueries();
    const search = p.get("search") ?? "", status = p.get("status") ?? "", property = p.get("property") ?? "";
    const rows = q.tenantRows({ search, status, property }).map((t): Cell[] => [
      t.code, t.name, t.phone, t.email, t.propertyName, t.unitName, t.landlordName, label(t.status), dateOf(t.entryDate), t.dueDay, t.balance,
    ]);
    return {
      title: "Tenants", subtitle: describe([search && `"${search}"`, status && label(status), property]),
      columns: [
        { header: "Tenant ID" }, { header: "Name", width: 24 }, { header: "Phone" }, { header: "Email", width: 26 }, { header: "Property", width: 20 },
        { header: "Unit", width: 10 }, { header: "Landlord", width: 22 }, { header: "Status", width: 12 }, { header: "Moved in", kind: "date" },
        { header: "Rent due day", kind: "int", width: 12 }, { header: "Balance (KES)", kind: "money" },
      ],
      rows, totals: ["Total", ...Array(9).fill(null), sum(rows, 10)],
    };
  },

  async invoices(p) {
    const q = await adminQueries();
    const search = p.get("search") ?? "", status = p.get("status") ?? "", period = p.get("period") ?? "";
    const rows = q.invoiceRows({ search, status, period }).map((i): Cell[] => [
      i.number, i.tenantName, i.tenantCode, i.propertyName, i.unitName, periodLabel(i.period), dateOf(i.issueDate), dateOf(i.dueDate),
      i.total, i.paid, i.balance, label(i.status),
    ]);
    return {
      title: "Invoices", subtitle: describe([search && `"${search}"`, status && label(status), period && periodLabel(period)]),
      columns: [
        { header: "Invoice" }, { header: "Tenant", width: 24 }, { header: "Tenant ID" }, { header: "Property", width: 20 }, { header: "Unit", width: 10 },
        { header: "Period", width: 16 }, { header: "Issued", kind: "date" }, { header: "Due", kind: "date" },
        { header: "Total (KES)", kind: "money" }, { header: "Paid (KES)", kind: "money" }, { header: "Balance (KES)", kind: "money" }, { header: "Status", width: 14 },
      ],
      rows, totals: ["Total", ...Array(7).fill(null), sum(rows, 8), sum(rows, 9), sum(rows, 10), null],
    };
  },

  async payments(p) {
    const q = await adminQueries();
    const status = p.get("status") ?? "";
    const rows = q.mpesaRows({ status }).map((m): Cell[] => [
      m.transId, dateOf(m.time), channelLabel[m.channel], m.channel === "mpesa" ? m.msisdn : m.paidTo, m.billRef, m.tenantName, m.amount, label(m.status),
    ]);
    return {
      title: "Payments", subtitle: describe([status && label(status)]),
      columns: [
        { header: "Reference", width: 18 }, { header: "Received", kind: "date" }, { header: "Paid by" }, { header: "Phone / bank", width: 16 },
        { header: "Account ref", width: 16 }, { header: "Tenant", width: 24 }, { header: "Amount (KES)", kind: "money" }, { header: "Status", width: 12 },
      ],
      rows, totals: ["Total", ...Array(5).fill(null), sum(rows, 6), null],
    };
  },

  async deposits() {
    const q = await adminQueries();
    const rows = q.depositRows().map((d): Cell[] => [d.code, d.tenantName, d.propertyName, d.unitName, d.amount, label(d.status)]);
    return {
      title: "Deposits", columns: [
        { header: "Code" }, { header: "Tenant", width: 24 }, { header: "Property", width: 20 }, { header: "Unit", width: 10 },
        { header: "Amount (KES)", kind: "money" }, { header: "Status", width: 12 },
      ],
      rows, totals: ["Total", null, null, null, sum(rows, 4), null],
    };
  },

  async landlords() {
    const q = await adminQueries();
    const rows = q.landlordRows().map((l): Cell[] => [l.code, l.name, l.phone, l.email, l.bank, l.accountNumber, l.propertyCount, l.unitCount, l.isActive ? "Active" : "Inactive"]);
    return {
      title: "Landlords", columns: [
        { header: "Code" }, { header: "Name", width: 24 }, { header: "Phone" }, { header: "Email", width: 26 }, { header: "Bank" }, { header: "Account number", width: 18 },
        { header: "Properties", kind: "int" }, { header: "Units", kind: "int" }, { header: "Status", width: 10 },
      ],
      rows,
    };
  },

  async properties() {
    const q = await adminQueries();
    const rows = q.propertyRows().map((p): Cell[] => [
      p.code, p.name, p.landlordName, p.location, p.cluster, p.commissionPct, p.unitCount, p.occupiedCount, p.occupancy, p.monthlyRent, p.billed, p.collected,
    ]);
    return {
      title: "Properties", columns: [
        { header: "Code" }, { header: "Property", width: 22 }, { header: "Landlord", width: 22 }, { header: "Location", width: 20 }, { header: "Cluster", width: 14 },
        { header: "Commission %", kind: "int" }, { header: "Units", kind: "int" }, { header: "Occupied", kind: "int" }, { header: "Occupancy %", kind: "int" },
        { header: "Monthly rent (KES)", kind: "money" }, { header: "Billed this month", kind: "money" }, { header: "Collected this month", kind: "money" },
      ],
      rows, totals: ["Total", ...Array(5).fill(null), sum(rows, 6), sum(rows, 7), null, sum(rows, 9), sum(rows, 10), sum(rows, 11)],
    };
  },

  /** Who owes what: one row per tenant with an open balance, worst first. */
  async arrears() {
    const q = await adminQueries();
    const open = q.invoiceRows().filter((i) => i.balance > 0);
    const by = new Map<number, { name: string; code: string; property: string; unit: string; balance: number; oldest: string; days: number; phone: string }>();
    const phones = new Map(q.tenantRows().map((t) => [t.id, t.phone]));
    for (const i of open) {
      const cur = by.get(i.tenantId);
      by.set(i.tenantId, {
        name: i.tenantName, code: i.tenantCode, property: i.propertyName, unit: i.unitName, phone: phones.get(i.tenantId) ?? "",
        balance: (cur?.balance ?? 0) + i.balance,
        oldest: cur && cur.oldest < i.dueDate ? cur.oldest : i.dueDate,
        days: Math.max(cur?.days ?? 0, i.daysOverdue),
      });
    }
    const rows = [...by.values()].sort((a, b) => b.balance - a.balance).map((r): Cell[] => [
      r.code, r.name, r.phone, r.property, r.unit, dateOf(r.oldest), r.days, r.balance,
    ]);
    return {
      title: "Arrears", subtitle: "Tenants with unpaid invoices, largest balance first",
      columns: [
        { header: "Tenant ID" }, { header: "Name", width: 24 }, { header: "Phone" }, { header: "Property", width: 20 }, { header: "Unit", width: 10 },
        { header: "Oldest due date", kind: "date" }, { header: "Days overdue", kind: "int" }, { header: "Owed (KES)", kind: "money" },
      ],
      rows, totals: ["Total", ...Array(6).fill(null), sum(rows, 7)],
    };
  },

  async finance() {
    const q = await adminQueries();
    const rows = q.financeSummary().monthly.map((m): Cell[] => [m.period, m.billed, m.collected, m.billed - m.collected]);
    return {
      title: "Billed vs collected", columns: [
        { header: "Month", width: 14 }, { header: "Billed (KES)", kind: "money" }, { header: "Collected (KES)", kind: "money" }, { header: "Outstanding (KES)", kind: "money" },
      ],
      rows, totals: ["Total", sum(rows, 1), sum(rows, 2), sum(rows, 3)],
    };
  },
};

const landlord: Record<string, Builder> = {
  async statements() {
    const { rows: all } = await getMyStatements();
    const rows = all.map((r): Cell[] => [periodLabel(r.period), r.property, r.billed, r.collected, r.arrears, r.commission, r.net]);
    return {
      title: "Statements", columns: [
        { header: "Month", width: 16 }, { header: "Property", width: 24 }, { header: "Billed (KES)", kind: "money" }, { header: "Collected (KES)", kind: "money" },
        { header: "Arrears (KES)", kind: "money" }, { header: "Commission (KES)", kind: "money" }, { header: "Net to you (KES)", kind: "money" },
      ],
      rows, totals: ["Total", null, ...[2, 3, 4, 5, 6].map((i) => sum(rows, i))],
    };
  },
};

const tenant: Record<string, Builder> = {
  async invoices() {
    const rows = (await getMyInvoices()).map((i): Cell[] => [i.number, periodLabel(i.period), dateOf(i.dueDate), i.total, i.paid, i.balance, label(i.status)]);
    return {
      title: "My invoices", columns: [
        { header: "Invoice" }, { header: "Period", width: 16 }, { header: "Due", kind: "date" }, { header: "Total (KES)", kind: "money" },
        { header: "Paid (KES)", kind: "money" }, { header: "Balance (KES)", kind: "money" }, { header: "Status", width: 14 },
      ],
      rows, totals: ["Total", null, null, sum(rows, 3), sum(rows, 4), sum(rows, 5), null],
    };
  },
  async payments() {
    const rows = (await getMyPayments()).map((m): Cell[] => [m.transId, dateOf(m.time), channelLabel[m.channel], m.amount]);
    return {
      title: "My payments", columns: [
        { header: "Reference", width: 18 }, { header: "Received", kind: "date" }, { header: "Paid by" }, { header: "Amount (KES)", kind: "money" },
      ],
      rows, totals: ["Total", null, null, sum(rows, 3)],
    };
  },
};

const registry: Record<Role, Record<string, Builder>> = { admin, landlord, tenant };

/** Builds a dataset for the signed-in role, or a 404 if that role has no such dataset. */
export async function buildDataset(role: Role, name: string, params: Params): Promise<Table> {
  const build = Object.hasOwn(registry[role], name) ? registry[role][name] : undefined;
  if (!build) notFound();
  return build(params);
}
