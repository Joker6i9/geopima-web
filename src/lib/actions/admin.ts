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
      endDate: z.string().optional().transform((v) => v || null), dueDay: z.coerce.number().int().min(1, "Rent due day is 1 to 28.").max(28, "Rent due day is 1 to 28."),
    }),
    (i) => ok(post<{ id: number }>("/tenants/tenants/move-in/", {
      unit: i.unitId, name: i.name, phone_number: i.phone, email: i.email, start_date: i.startDate, end_date: i.endDate, due_date: i.dueDay,
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
