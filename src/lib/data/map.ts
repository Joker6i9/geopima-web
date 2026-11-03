import type {
  Agency, Bank, Deposit, Invoice, InvoiceStatus, Landlord, Lease, MpesaTx, PaymentChannel, Property, PropertyStatus, SmsTemplate,
  StaffUser, Tenant, TenantStatus, Unit, UnitStatus, VoteHead,
} from "../types";

/* Shapes of the Django responses we read. Only the fields the web app uses are listed. */
export interface ApiLandlord { id: number; landlord_id: string; name: string; phone_number: string; email: string | null; bank_name: string | null; account_number: string | null; is_active: boolean; has_login?: boolean }
export interface ApiProperty { id: number; property_id: string; name: string; landlord: number | null; location: string; cluster: string; commission_percentage: string | number; default_deposit?: number; default_water_rate?: number; default_garbage_fee?: number; status: string }
export interface ApiUnit { id: number; property_pk: number | null; unit_name: string; unit_type: string | null; rent_amount: string | null; water_rate: string | null; garbage_fee: string | null; deposit: string | null; status: string | null }
export interface ApiTenant { id: number; tenant_id: string; name: string; phone_number: string; email: string | null; id_number?: string; secondary_contact?: string; unit: number | null; due_date: number; entry_date: string; status: string; has_login?: boolean }
export interface ApiLease { id: number; tenant: number; unit: number; start_date: string; end_date: string | null; rent_amount: string; deposit_amount: string; is_active: boolean }
export interface ApiInvoice {
  id: string; invoice_no: string; tenant_pk: number; unit_pk: number; period_key: string; issued_on: string; due_date: string;
  items: { description: string; amount: string }[]; net_total: string; rent_paid: string; balance: string; status: string;
}
export interface ApiMpesa {
  id: number; trans_id: string; time: string; trans_amount: string; msisdn: string; bill_ref_number: string; status: string;
  channel?: string; paid_to?: string; note?: string;
  tenant: { id: number } | null; allocations: { invoice: string; invoice_id: string; amount: string }[]; unallocated: string | number;
}
export interface ApiDeposit { id: string; deposit_code: string; tenant_pk: number; unit_pk: number | null; amount: string; status: string }
export interface ApiVoteHead { id: string; code: string; name: string; priority_order: number; status: string }
export interface ApiUser { id: number; username: string; name: string; roles: string[]; is_active: boolean }
export interface ApiBank { id: number; short_name: string; acc_name: string; acc_number: string; branch: string; on_invoice: boolean }
export interface ApiSms { category: string; template_text: string; enabled?: boolean }
export interface ApiAgency { company_name: string; motto_slogan: string; contact: string; email: string; physical_address: string; paybill?: string }

const num = (v: string | number | null | undefined) => Number(v ?? 0) || 0;

export const mapLandlord = (l: ApiLandlord): Landlord => ({
  id: l.id, code: l.landlord_id, name: l.name, phone: l.phone_number, email: l.email ?? "",
  bank: l.bank_name ?? "", accountNumber: l.account_number ?? "", isActive: l.is_active, hasLogin: l.has_login ?? false,
});

const PROPERTY_STATUS: PropertyStatus[] = ["active", "inactive", "under_maintenance"];
export const mapProperty = (p: ApiProperty): Property => ({
  id: p.id, code: p.property_id, name: p.name, landlordId: p.landlord ?? 0, location: p.location, cluster: p.cluster,
  commissionPct: num(p.commission_percentage),
  defaults: { deposit: num(p.default_deposit), water: num(p.default_water_rate), garbage: num(p.default_garbage_fee) },
  status: PROPERTY_STATUS.includes(p.status as PropertyStatus) ? (p.status as PropertyStatus) : "active",
});

/** A unit is occupied when a current tenant points at it; "maintenance" comes from the unit's own status. */
export function mapUnit(u: ApiUnit, occupied: Set<number>): Unit {
  const status: UnitStatus = occupied.has(u.id) ? "occupied" : (u.status ?? "").toLowerCase().includes("maint") ? "maintenance" : "vacant";
  return {
    id: u.id, propertyId: u.property_pk ?? 0, name: u.unit_name, type: u.unit_type ?? "Residential",
    rent: num(u.rent_amount), water: num(u.water_rate), garbage: num(u.garbage_fee), deposit: num(u.deposit), status,
  };
}

const TENANT_STATUS: TenantStatus[] = ["active", "vacated", "suspended"];
export const mapTenant = (t: ApiTenant): Tenant => ({
  id: t.id, code: t.tenant_id, name: t.name, phone: t.phone_number, email: t.email ?? "", idNumber: t.id_number ?? "", secondaryContact: t.secondary_contact ?? "", unitId: t.unit, hasLogin: t.has_login ?? false,
  dueDay: t.due_date, entryDate: t.entry_date,
  status: TENANT_STATUS.includes(t.status as TenantStatus) ? (t.status as TenantStatus) : "active",
});

export const mapLease = (l: ApiLease): Lease => ({
  id: l.id, tenantId: l.tenant, unitId: l.unit, startDate: l.start_date, endDate: l.end_date,
  rent: num(l.rent_amount), deposit: num(l.deposit_amount), isActive: l.is_active,
});

const INVOICE_STATUS: InvoiceStatus[] = ["unpaid", "partially_paid", "paid", "overdue"];
export const mapInvoice = (i: ApiInvoice): Invoice => ({
  id: i.id, number: i.invoice_no, tenantId: i.tenant_pk, unitId: i.unit_pk, period: i.period_key,
  issueDate: i.issued_on, dueDate: i.due_date,
  items: i.items.map((x) => ({ description: x.description, amount: num(x.amount) })),
  total: num(i.net_total), paid: num(i.rent_paid), balance: num(i.balance),
  status: INVOICE_STATUS.includes(i.status as InvoiceStatus) ? (i.status as InvoiceStatus) : "unpaid",
});

export function mapMpesa(m: ApiMpesa): MpesaTx {
  const allocations = m.allocations.map((a) => ({ invoiceId: a.invoice_id, amount: num(a.amount) }));
  return {
    id: m.id, transId: m.trans_id, amount: num(m.trans_amount), msisdn: m.msisdn, billRef: m.bill_ref_number,
    time: m.time, status: m.status === "settled" ? "settled" : "unmatched",
    channel: (["cash", "bank", "cheque"].includes(m.channel ?? "") ? m.channel : "mpesa") as PaymentChannel,
    paidTo: m.paid_to ?? "", note: m.note ?? "", tenantId: m.tenant?.id ?? null,
    invoiceId: allocations[0]?.invoiceId ?? null, allocations, unallocated: num(m.unallocated),
  };
}

export const mapDeposit = (d: ApiDeposit): Deposit => ({
  id: d.id, code: d.deposit_code, tenantId: d.tenant_pk, unitId: d.unit_pk, amount: num(d.amount),
  status: d.status === "refunded" ? "refunded" : "held",
});

export const mapVoteHead = (v: ApiVoteHead): VoteHead => ({
  id: v.id, code: v.code, name: v.name, priority: v.priority_order, active: v.status === "active",
});

export const mapStaff = (u: ApiUser): StaffUser => ({
  id: u.id, name: u.name, username: u.username, role: u.roles[0] ?? "—", phone: "", active: u.is_active,
});

export const mapBank = (b: ApiBank): Bank => ({
  id: b.id, shortName: b.short_name, accountName: b.acc_name, accountNumber: b.acc_number, branch: b.branch, onInvoice: b.on_invoice,
});

export const mapSms = (s: ApiSms): SmsTemplate => ({ category: s.category, text: s.template_text, enabled: s.enabled ?? true });

export const mapAgency = (a: ApiAgency): Agency => ({
  name: a.company_name, slogan: a.motto_slogan.replace(/^"|"$/g, ""), phone: a.contact, email: a.email,
  address: a.physical_address, paybill: a.paybill ?? "",
});
