import "server-only";
import { cache } from "react";
import { api, apiAll } from "../api/client";
import type { RoleDef } from "../types";
import type { Data } from "./queries";
import { makeQueries } from "./queries";
import * as M from "./map";

/**
 * One snapshot of everything staff can see, read from Django. Cached per request so a page that asks for several
 * things (and the layout around it) hits the API once.
 */
export const loadAdminData = cache(async (): Promise<Data> => {
  const [landlords, properties, units, tenants, leases, invoices, mpesa, deposits, voteHeads, users, roles, banks, sms, agency] =
    await Promise.all([
      apiAll<M.ApiLandlord>("/properties/landlords/"),
      apiAll<M.ApiProperty>("/properties/"),
      apiAll<M.ApiUnit>("/properties/units/"),
      apiAll<M.ApiTenant>("/tenants/tenants/"),
      apiAll<M.ApiLease>("/tenants/agreements/"),
      apiAll<M.ApiInvoice>("/billing/invoices/"),
      apiAll<M.ApiMpesa>("/mpesa/transactions/"),
      apiAll<M.ApiDeposit>("/billing/deposits/"),
      apiAll<M.ApiVoteHead>("/billing/vote-heads/"),
      apiAll<M.ApiUser>("/users/").catch(() => []),
      apiAll<{ name: string; permissions: string[] }>("/user-roles/").catch(() => []),
      apiAll<M.ApiBank>("/payment-banks/"),
      apiAll<M.ApiSms>("/sms-templates/"),
      api<M.ApiAgency>("/agency-profile/1/"),
    ]);

  const tenantRows = tenants.map(M.mapTenant);
  const occupied = new Set(tenantRows.filter((t) => t.status !== "vacated" && t.unitId).map((t) => t.unitId!));
  const staff = users.filter((u) => u.roles.length).map(M.mapStaff);
  const roleDefs: RoleDef[] = roles.map((r) => ({
    name: r.name, permissions: r.permissions.length, users: staff.filter((s) => s.role === r.name).length,
  }));

  return {
    agency: M.mapAgency(agency),
    landlords: landlords.map(M.mapLandlord),
    properties: properties.map(M.mapProperty),
    units: units.map((u) => M.mapUnit(u, occupied)),
    tenants: tenantRows,
    leases: leases.map(M.mapLease),
    invoices: invoices.map(M.mapInvoice),
    mpesa: mpesa.map(M.mapMpesa),
    deposits: deposits.map(M.mapDeposit),
    voteHeads: voteHeads.map(M.mapVoteHead),
    staff,
    roles: roleDefs,
    banks: banks.map(M.mapBank),
    smsTemplates: sms.map(M.mapSms),
  };
});

export const adminQueries = async () => makeQueries(await loadAdminData());

/* ---------- tenant portal ---------- */

interface PortalHome {
  tenant: { id: number; code: string; name: string; status: string; property: string | null; unit: string | null };
  payment: { paybill: string; account_number: string };
}
interface PortalInvoice extends M.ApiInvoice { unit_no: string; property_name: string }
interface PortalLease {
  tenant: { name: string; code: string; phone: string; email: string | null; status: string; entry_date: string; due_day: number };
  unit: { name: string; type: string; property: string; location: string } | null;
  lease: { start_date: string; end_date: string | null; rent: string; is_active: boolean } | null;
  deposit: { amount: string; status: string } | null;
  landlord: string | null;
  agency: { name: string; phone: string; email: string };
}

/**
 * The signed-in tenant's own records, shaped as a one-tenant `Data` so the same queries serve their pages.
 * Django only ever returns this tenant's rows.
 */
export const loadTenantData = cache(async (): Promise<Data> => {
  const [home, invoices, payments, lease] = await Promise.all([
    api<PortalHome>("/portal/tenant/home/"),
    api<PortalInvoice[]>("/portal/tenant/invoices/"),
    api<M.ApiMpesa[]>("/portal/tenant/payments/"),
    api<PortalLease>("/portal/tenant/lease/"),
  ]);
  const tenantId = home.tenant.id;

  // Units and properties only exist here so invoices can show where they were for; ids are local to this snapshot.
  const propertyId = new Map<string, number>();
  const idFor = (name: string) => propertyId.get(name) ?? (propertyId.set(name, propertyId.size + 1), propertyId.size);
  const units = new Map<number, Data["units"][number]>();
  const addUnit = (id: number, name: string, property: string, type = "Residential") =>
    units.has(id) || units.set(id, { id, propertyId: idFor(property), name, type, rent: 0, water: 0, garbage: 0, deposit: 0, status: "occupied" });
  invoices.forEach((i) => addUnit(i.unit_pk, i.unit_no, i.property_name));
  // The unit they live in now; 0 stands in for its id when no invoice has named it yet.
  const currentUnitId = invoices.find((i) => i.unit_no === home.tenant.unit)?.unit_pk ?? 0;
  if (home.tenant.unit) addUnit(currentUnitId, home.tenant.unit, home.tenant.property ?? "", lease.unit?.type);

  const mapped = invoices.map(M.mapInvoice);
  const deposits = lease.deposit
    ? [{ id: "deposit", code: "", tenantId, unitId: home.tenant.unit ? currentUnitId : null, amount: Number(lease.deposit.amount), status: lease.deposit.status === "refunded" ? "refunded" as const : "held" as const }]
    : [];

  return {
    agency: { name: lease.agency.name, slogan: "", phone: lease.agency.phone, email: lease.agency.email, address: "", paybill: home.payment.paybill },
    landlords: [{ id: 1, code: "", name: lease.landlord ?? "", phone: "", email: "", bank: "", accountNumber: "", isActive: true, hasLogin: true }],
    properties: [...propertyId].map(([name, id]) => ({
      id, code: "", name, landlordId: 1, location: lease.unit?.property === name ? lease.unit.location : "", cluster: "", commissionPct: 0, defaults: { deposit: 0, water: 0, garbage: 0 }, status: "active" as const,
    })),
    units: [...units.values()],
    tenants: [{
      id: tenantId, code: home.tenant.code, name: home.tenant.name, phone: lease.tenant.phone, email: lease.tenant.email ?? "", idNumber: "", secondaryContact: "", hasLogin: true,
      unitId: home.tenant.unit ? currentUnitId : null, dueDay: lease.tenant.due_day, entryDate: lease.tenant.entry_date,
      status: (["active", "vacated", "suspended"].includes(home.tenant.status) ? home.tenant.status : "active") as "active",
    }],
    leases: lease.lease
      ? [{ id: 1, tenantId, unitId: currentUnitId, startDate: lease.lease.start_date, endDate: lease.lease.end_date, rent: Number(lease.lease.rent), deposit: deposits[0]?.amount ?? 0, isActive: lease.lease.is_active }]
      : [],
    invoices: mapped,
    mpesa: payments.map(M.mapMpesa).map((p) => ({ ...p, tenantId })),
    deposits,
    voteHeads: [], staff: [], roles: [], banks: [], smsTemplates: [],
  };
});

export const tenantQueries = async () => makeQueries(await loadTenantData());
