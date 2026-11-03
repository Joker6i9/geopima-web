"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "../session";
import { ApiError, api, apiAll } from "../api/client";
import { kes } from "../format";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

/** What every form action returns; `useActionState` feeds it back to the form. */
export type ActionState = { ok: boolean; message: string } | null;

const text = (label: string, max = 120) =>
  z.string({ error: `${label} is required.` }).trim().min(1, `${label} is required.`).max(max, `${label} is too long.`);
const key = (label: string) => z.string({ error: `Choose ${label}.` }).min(1, `Choose ${label}.`);
const id = (label: string) => z.coerce.number({ error: `Choose ${label}.` }).int().positive(`Choose ${label}.`);
const money = (label: string) => z.coerce.number({ error: `${label} must be a number.` }).int().min(0, `${label} cannot be negative.`).max(10_000_000, `${label} is too large.`);
const date = (label: string) => z.string().regex(/^\d{4}-\d{2}-\d{2}$/, `${label} must be a date.`);
const email = z.string().trim().email("Enter a valid email address.");

/** Runs one admin action: checks the role, validates the form, calls the domain function, refreshes the pages. */
async function run<S extends z.ZodType>(
  formData: FormData,
  schema: S,
  act: (input: z.output<S>) => Promise<Result<object>>,
  success: (input: z.output<S>, result: object) => string,
): Promise<ActionState> {
  await requireRole("admin");
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  let result: Result<object>;
  try {
    result = await act(parsed.data);
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, message: e.message };
    throw e;
  }
  if (!result.ok) return { ok: false, message: result.error };
  revalidatePath("/admin", "layout");
  return { ok: true, message: success(parsed.data, result) };
}

const post = <T,>(path: string, body?: object) =>
  api<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });
const ok = async <T extends object>(call: Promise<T>): Promise<{ ok: true } & T> => ({ ok: true, ...(await call) });

export async function moveInAction(_: ActionState, f: FormData) {
  return run(
    f,
    z.object({
      unitId: id("a unit"), name: text("Name"), phone: text("Phone", 20), email, startDate: date("Start date"),
      idNumber: z.string().trim().max(30).optional().transform((v) => v ?? ""),
      secondaryContact: z.string().trim().max(20).optional().transform((v) => v ?? ""),
      endDate: z.string().optional().transform((v) => v || null), dueDay: z.coerce.number().int().min(1, "Rent due day is 1 to 28.").max(28, "Rent due day is 1 to 28."),
    }),
    (i) => ok(post<{ id: number }>("/tenants/tenants/move-in/", {
      unit: i.unitId, name: i.name, phone_number: i.phone, email: i.email, start_date: i.startDate, end_date: i.endDate, due_date: i.dueDay, id_number: i.idNumber, secondary_contact: i.secondaryContact,
    }).then((t) => ({ tenantId: t.id }))),
    (i) => `${i.name} has moved in.`,
  );
}

export async function vacateAction(_: ActionState, f: FormData) {
  return run(f, z.object({ tenantId: id("a tenant") }),
    (i) => ok(post<{ outstanding_balance: string | number }>(`/tenants/tenants/${i.tenantId}/vacate/`).then((r) => ({ balance: Number(r.outstanding_balance) || 0 }))),
    (_i, r) => {
      const balance = (r as { balance: number }).balance;
      return balance > 0 ? `Unit vacated. The tenant still owes ${kes(balance)}.` : "Unit vacated.";
    });
}

export async function setTenantStatusAction(_: ActionState, f: FormData) {
  return run(f, z.object({ tenantId: id("a tenant"), status: z.enum(["active", "suspended"]) }),
    (i) => ok(post(`/tenants/tenants/${i.tenantId}/${i.status === "suspended" ? "suspend" : "reactivate"}/`).then(() => ({}))),
    (i) => (i.status === "suspended" ? "Tenant suspended." : "Tenant reactivated."));
}

export async function raiseInvoiceAction(_: ActionState, f: FormData) {
  return run(f, z.object({ tenantId: id("a tenant"), period: text("Period", 7) }),
    (i) => ok(post("/billing/invoices/raise/", { tenant: i.tenantId, period: i.period }).then(() => ({}))), () => "Invoice raised.");
}

export async function assignPaymentAction(_: ActionState, f: FormData) {
  return run(f, z.object({ mpesaId: id("a payment"), tenantId: id("a tenant") }),
    (i) => ok(post<{ trans_amount: string; unallocated: string | number }>(`/mpesa/transactions/${i.mpesaId}/assign/`, { tenant: i.tenantId })
      .then((t) => ({ applied: Number(t.trans_amount) - Number(t.unallocated), unallocated: Number(t.unallocated) }))),
    (_i, r) => {
      const { applied, unallocated } = r as { applied: number; unallocated: number };
      return unallocated > 0
        ? `${kes(applied)} applied to open invoices. ${kes(unallocated)} was more than they owed and is left unallocated.`
        : `${kes(applied)} applied to the tenant's open invoices.`;
    });
}

export async function recordPaymentAction(_: ActionState, f: FormData) {
  return run(
    f,
    z.object({
      tenantId: id("a tenant"),
      amount: z.coerce.number({ error: "Amount must be a number." }).int("Enter whole shillings.").positive("Enter the amount received.").max(10_000_000, "Amount is too large."),
      channel: z.enum(["cash", "bank", "cheque"], { error: "Choose how it was paid." }),
      date: date("Date received"),
      reference: z.string().trim().max(100).optional().transform((v) => v ?? ""),
      paidTo: z.string().trim().max(100).optional().transform((v) => v ?? ""),
      note: z.string().trim().max(255).optional().transform((v) => v ?? ""),
    }),
    (i) => ok(post<{ trans_amount: string; unallocated: string | number }>("/mpesa/transactions/record/", {
      tenant: i.tenantId, amount: i.amount, channel: i.channel, date: i.date, reference: i.reference, paid_to: i.paidTo, note: i.note,
    }).then((t) => ({ applied: Number(t.trans_amount) - Number(t.unallocated), unallocated: Number(t.unallocated) }))),
    (_i, r) => {
      const { applied, unallocated } = r as { applied: number; unallocated: number };
      return unallocated > 0
        ? `Payment recorded. ${kes(applied)} cleared invoices and ${kes(unallocated)} is kept as credit for the next one.`
        : `Payment of ${kes(applied)} recorded and applied to the tenant's invoices.`;
    },
  );
}

const idList = z.string().optional().transform((v) => (v ? v.split(",").map(Number).filter(Number.isInteger) : []));

export async function sendMessageAction(_: ActionState, f: FormData) {
  return run(
    f,
    z.object({ message: text("Message", 640), tenants: idList, landlords: idList }),
    (i) => ok(post<{ sent: number; test: number; failed: number; skipped: number }>("/communication/messages/send/", {
      message: i.message, tenants: i.tenants, landlords: i.landlords,
    })),
    (_i, r) => {
      const { sent, test, failed, skipped } = r as { sent: number; test: number; failed: number; skipped: number };
      const parts = [
        sent && `${sent} sent`,
        test && `${test} logged in test mode (no SMS provider is set up, nothing was delivered)`,
        failed && `${failed} failed`,
        skipped && `${skipped} skipped (no phone number)`,
      ].filter(Boolean);
      return parts.join(", ") + ".";
    },
  );
}

export async function refundDepositAction(_: ActionState, f: FormData) {
  return run(f, z.object({ depositId: key("a deposit") }),
    (i) => ok(post(`/billing/deposits/${i.depositId}/refund/`).then(() => ({}))), () => "Deposit marked as refunded.");
}

export async function addLandlordAction(_: ActionState, f: FormData) {
  return run(
    f,
    z.object({ name: text("Name"), phone: text("Phone", 20), email, bank: text("Bank", 40), accountNumber: text("Account number", 30) }),
    async (i) => {
      // Landlord codes are LL-001, LL-002, ...: take the next one after the highest in use.
      const existing = await apiAll<{ landlord_id: string }>("/properties/landlords/");
      const next = existing.reduce((n, l) => Math.max(n, Number(l.landlord_id.replace(/\D/g, "")) || 0), 0) + 1;
      return ok(post<{ id: number }>("/properties/landlords/", {
        landlord_id: `LL-${String(next).padStart(3, "0")}`, name: i.name, phone_number: i.phone, email: i.email,
        bank_name: i.bank, account_number: i.accountNumber,
      }).then((l) => ({ id: l.id })));
    },
    (i) => `${i.name} added as a landlord.`,
  );
}

export async function addPropertyAction(_: ActionState, f: FormData) {
  return run(
    f,
    z.object({
      landlordId: id("a landlord"), name: text("Name"), location: text("Location"), cluster: text("Cluster", 40),
      commissionPct: z.coerce.number({ error: "Commission must be a number." }).min(0, "Commission is 0 to 100.").max(100, "Commission is 0 to 100."),
    }),
    (i) => ok(post<{ id: number }>("/properties/", {
      landlord: i.landlordId, name: i.name, location: i.location, cluster: i.cluster, commission_percentage: i.commissionPct,
    }).then((p) => ({ id: p.id }))),
    (i) => `${i.name} added.`,
  );
}

export async function addUnitAction(_: ActionState, f: FormData) {
  return run(
    f,
    z.object({
      propertyId: id("a property"), name: text("Unit name", 20), type: text("Type", 40),
      rent: money("Rent"), water: money("Water"), garbage: money("Garbage"), deposit: money("Deposit"),
    }),
    async (i) => {
      // Units name their property by its code, not its id.
      const property = (await apiAll<{ id: number; property_id: string }>("/properties/")).find((p) => p.id === i.propertyId);
      if (!property) return { ok: false as const, error: "That property no longer exists." };
      return ok(post<{ id: number }>("/properties/units/", {
        property: property.property_id, unit_no: i.name, unit_name: i.name, unit_type: i.type,
        rent_amount: i.rent, water_rate: i.water, garbage_fee: i.garbage, deposit: i.deposit,
      }).then((u) => ({ id: u.id })));
    },
    (i) => `Unit ${i.name} added.`,
  );
}

export async function updateAgencyAction(_: ActionState, f: FormData) {
  return run(
    f,
    z.object({ name: text("Name"), slogan: text("Slogan"), phone: text("Phone", 20), email, address: text("Address") }),
    (i) => ok(api("/agency-profile/1/", {
      method: "PATCH",
      body: JSON.stringify({ company_name: i.name, motto_slogan: i.slogan, contact: i.phone, email: i.email, physical_address: i.address }),
    }).then(() => ({}))),
    () => "Agency profile saved.",
  );
}

/* ---------- settings ---------- */

const bankFields = {
  name: text("Bank name", 50), branch: text("Branch", 100), accountName: text("Account name", 100), accountNumber: text("Account number", 50),
  onInvoice: z.string().optional().transform((v) => v === "on"),
};
const bankBody = (i: { name: string; branch: string; accountName: string; accountNumber: string; onInvoice: boolean }) => ({
  short_name: i.name, long_name: i.name, branch: i.branch, acc_name: i.accountName, acc_number: i.accountNumber, on_invoice: i.onInvoice,
});

export async function addBankAction(_: ActionState, f: FormData) {
  return run(f, z.object(bankFields),
    (i) => ok(post("/payment-banks/", bankBody(i)).then(() => ({}))), (i) => `${i.name} added.`);
}

export async function updateBankAction(_: ActionState, f: FormData) {
  return run(f, z.object({ bankId: id("a bank"), ...bankFields }),
    (i) => ok(api(`/payment-banks/${i.bankId}/`, { method: "PATCH", body: JSON.stringify(bankBody(i)) }).then(() => ({}))), (i) => `${i.name} saved.`);
}

export async function deleteBankAction(_: ActionState, f: FormData) {
  return run(f, z.object({ bankId: id("a bank") }),
    (i) => ok(api(`/payment-banks/${i.bankId}/`, { method: "DELETE" }).then(() => ({}))), () => "Bank removed.");
}

export async function saveSmsTemplateAction(_: ActionState, f: FormData) {
  return run(f, z.object({ category: key("a template"), text: text("Message", 480), enabled: z.string().optional() }),
    (i) => ok(post("/sms-templates/bulk-save/", [{
      category: i.category, template_text: i.text,
      // Only the receipt template has an on/off switch; its form always sends the checkbox (absent = unticked).
      ...(i.category === "PAYMENT_NOTIF" ? { enabled: i.enabled === "on" } : {}),
    }]).then(() => ({}))), () => "Template saved.");
}

export async function addVoteHeadAction(_: ActionState, f: FormData) {
  return run(f, z.object({ name: text("Name", 100) }),
    async (i) => {
      const heads = await apiAll<{ code: string; priority_order: number }>("/billing/vote-heads/");
      // The code is what other systems see, so it is made from the name and kept unique.
      const base = i.name.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 24) || "CHARGE";
      const taken = new Set(heads.map((h) => h.code));
      let code = base;
      for (let n = 2; taken.has(code); n++) code = `${base}_${n}`;
      const last = heads.reduce((m, h) => Math.max(m, h.priority_order), 0);
      return ok(post("/billing/vote-heads/", { name: i.name, code, priority_order: last + 1, status: "active" }).then(() => ({})));
    },
    (i) => `${i.name} added at the end of the payment order.`);
}

export async function updateVoteHeadAction(_: ActionState, f: FormData) {
  return run(f, z.object({ voteHeadId: key("a charge"), name: text("Name", 100), active: z.string().optional().transform((v) => v === "on") }),
    (i) => ok(api(`/billing/vote-heads/${i.voteHeadId}/`, { method: "PATCH", body: JSON.stringify({ name: i.name, status: i.active ? "active" : "inactive" }) }).then(() => ({}))),
    (i) => `${i.name} saved.`);
}

/** Moves one vote head a place up or down and rewrites the whole order. */
export async function moveVoteHeadAction(voteHeadId: string, direction: "up" | "down"): Promise<ActionState> {
  await requireRole("admin");
  try {
    const heads = await apiAll<{ id: string; priority_order: number }>("/billing/vote-heads/");
    const ids = heads.sort((a, b) => a.priority_order - b.priority_order).map((h) => h.id);
    const at = ids.indexOf(voteHeadId);
    const to = direction === "up" ? at - 1 : at + 1;
    if (at < 0 || to < 0 || to >= ids.length) return { ok: true, message: "Already there." };
    [ids[at], ids[to]] = [ids[to], ids[at]];
    await post("/billing/vote-heads/reorder/", { priority_order: ids });
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, message: e.message };
    throw e;
  }
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Order updated." };
}

export async function addStaffAction(_: ActionState, f: FormData) {
  return run(
    f,
    z.object({
      fullName: text("Full name"), username: text("Username", 30).regex(/^[\w.@+-]+$/, "Username can use letters, numbers and . _ - only."),
      email, phone: text("Phone", 20), role: key("a role"), password: z.string().min(8, "Password needs at least 8 characters."),
    }),
    (i) => ok(post("/users/", { full_name: i.fullName, username: i.username, email: i.email, phone: i.phone, role: i.role, password: i.password }).then(() => ({}))),
    (i) => `${i.fullName} can now sign in as ${i.username}.`,
  );
}

export async function updateStaffAction(_: ActionState, f: FormData) {
  return run(
    f,
    z.object({
      userId: id("a person"), role: key("a role"), active: z.string().optional().transform((v) => v === "on"),
      password: z.string().optional().transform((v) => v || undefined).pipe(z.string().min(8, "Password needs at least 8 characters.").optional()),
    }),
    (i) => ok(api(`/users/${i.userId}/`, { method: "PATCH", body: JSON.stringify({ role: i.role, is_active: i.active, password: i.password }) }).then(() => ({}))),
    () => "Saved.",
  );
}

/* ---------- edit details ---------- */

const patch = (path: string, body: object) => api(path, { method: "PATCH", body: JSON.stringify(body) }).then(() => ({}));

export async function updateTenantAction(_: ActionState, f: FormData) {
  return run(
    f,
    z.object({
      tenantId: id("a tenant"), name: text("Name"), phone: text("Phone", 20), email,
      idNumber: z.string().trim().max(30).optional().transform((v) => v ?? ""),
      secondaryContact: z.string().trim().max(20).optional().transform((v) => v ?? ""),
      dueDay: z.coerce.number().int().min(1, "Rent due day is 1 to 28.").max(28, "Rent due day is 1 to 28."),
    }),
    (i) => ok(patch(`/tenants/tenants/${i.tenantId}/`, {
      name: i.name, phone_number: i.phone, email: i.email, id_number: i.idNumber, secondary_contact: i.secondaryContact, due_date: i.dueDay,
    })),
    (i) => `${i.name} saved.`,
  );
}

export async function updateLandlordAction(_: ActionState, f: FormData) {
  return run(
    f,
    z.object({ landlordId: id("a landlord"), name: text("Name"), phone: text("Phone", 20), email, bank: text("Bank", 40), accountNumber: text("Account number", 30) }),
    (i) => ok(patch(`/properties/landlords/${i.landlordId}/`, {
      name: i.name, phone_number: i.phone, email: i.email, bank_name: i.bank, account_number: i.accountNumber,
    })),
    (i) => `${i.name} saved.`,
  );
}

export async function updatePropertyAction(_: ActionState, f: FormData) {
  return run(
    f,
    z.object({
      code: key("a property"), landlordId: id("a landlord"), name: text("Name"), location: text("Location"), cluster: text("Cluster", 40),
      commissionPct: z.coerce.number({ error: "Commission must be a number." }).min(0, "Commission is 0 to 100.").max(100, "Commission is 0 to 100."),
      deposit: money("Deposit"), water: money("Water"), garbage: money("Garbage"),
    }),
    (i) => ok(patch(`/properties/${encodeURIComponent(i.code)}/`, {
      landlord: i.landlordId, name: i.name, location: i.location, cluster: i.cluster, commission_percentage: i.commissionPct,
      default_deposit: i.deposit, default_water_rate: i.water, default_garbage_fee: i.garbage,
    })),
    (i) => `${i.name} saved.`,
  );
}

export async function updateUnitAction(_: ActionState, f: FormData) {
  return run(
    f,
    z.object({ unitId: id("a unit"), type: text("Type", 40), rent: money("Rent"), water: money("Water"), garbage: money("Garbage"), deposit: money("Deposit") }),
    (i) => ok(patch(`/properties/units/${i.unitId}/`, {
      unit_type: i.type, rent_amount: i.rent, water_rate: i.water, garbage_fee: i.garbage, deposit: i.deposit,
    })),
    () => "Unit saved. New rent and charges apply from the next invoice.",
  );
}

/* ---------- real M-Pesa ---------- */

export async function requestPaymentAction(_: ActionState, f: FormData) {
  return run(
    f,
    z.object({
      tenantId: id("a tenant"),
      amount: z.coerce.number({ error: "Amount must be a number." }).int("Enter whole shillings.").min(1, "Enter the amount to request.").max(150_000, "The most M-Pesa allows at once is KES 150,000."),
      phone: z.string().trim().max(20).optional().transform((v) => v ?? ""),
    }),
    (i) => ok(post<{ phone: string }>("/mpesa/stk/", { tenant: i.tenantId, amount: i.amount, phone: i.phone }).then((r) => ({ phone: r.phone }))),
    (i, r) => `Request for ${kes(i.amount)} sent to ${(r as { phone: string }).phone.replace(/^254/, "0")}. It appears under Payments once they enter their PIN.`,
  );
}

export async function registerMpesaUrlsAction(_: ActionState, f: FormData) {
  return run(f, z.object({}), () => ok(post("/mpesa/integration/").then(() => ({}))), () => "Safaricom now sends this paybill's payments to the system.");
}

/* ---------- portal logins ---------- */

export type LoginResult = { ok: true; username: string; password: string; created: boolean } | { ok: false; message: string };

/** Creates the tenant's or landlord's portal login (or resets its password) and returns the password once. */
export async function issueLoginAction(kind: "tenant" | "landlord", recordId: number): Promise<LoginResult> {
  await requireRole("admin");
  if (!Number.isInteger(recordId) || recordId <= 0) return { ok: false, message: "Choose a record." };
  const path = kind === "tenant" ? `/tenants/tenants/${recordId}/login/` : `/properties/landlords/${recordId}/login/`;
  try {
    const r = await post<{ username: string; password: string; created: boolean }>(path);
    return { ok: true, ...r };
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, message: e.message };
    throw e;
  }
}
