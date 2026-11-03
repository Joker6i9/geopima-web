import "server-only";
import { cache } from "react";
import { api } from "../api/client";
import type { Landlord, PropertyStatus, UnitStatus } from "../types";

/* The landlord portal endpoints already total things per property and month, so these map their answers straight
   onto the shapes the landlord pages draw, rather than rebuilding the sums here. */

interface ApiRow {
  id: number; code: string; name: string; location: string; cluster: string; status: string; commission_pct: string;
  units: number; occupied: number; occupancy: number; billed: string; collected: string; rent_roll: string;
}
interface ApiWho { id: number; code: string; name: string }
interface ApiStatement { period: string; property_id: number; property: string; billed: string; collected: string; arrears: string; commission: string; net: string }

const landlordOf = (w: ApiWho, id = w.id): Landlord =>
  ({ id, code: w.code, name: w.name, phone: "", email: "", bank: "", accountNumber: "", isActive: true, hasLogin: true });

const propertyRow = (r: ApiRow, landlordName: string) => ({
  id: r.id, code: r.code, name: r.name, landlordId: 0, location: r.location, cluster: r.cluster,
  commissionPct: Number(r.commission_pct), status: r.status as PropertyStatus, landlordName,
  unitCount: r.units, occupiedCount: r.occupied, occupancy: r.occupancy,
  monthlyRent: Number(r.rent_roll), billed: Number(r.billed), collected: Number(r.collected),
});

const statementRow = (s: ApiStatement) => ({
  period: s.period, propertyId: s.property_id, property: s.property, billed: Number(s.billed), collected: Number(s.collected),
  arrears: Number(s.arrears), commission: Number(s.commission), net: Number(s.net),
});

export const loadOverview = cache(async () => {
  const [o, s] = await Promise.all([
    api<{ landlord: ApiWho; period: string; properties: ApiRow[] }>("/portal/landlord/overview/"),
    api<{ rows: ApiStatement[] }>("/portal/landlord/statements/"),
  ]);
  return {
    landlord: landlordOf(o.landlord),
    properties: o.properties.map((p) => propertyRow(p, o.landlord.name)),
    statements: s.rows.map(statementRow),
    period: o.period,
  };
});

export async function loadProperties() {
  const [o, rows] = await Promise.all([
    loadOverview(),
    api<ApiRow[]>("/portal/landlord/properties/"),
  ]);
  return rows.map((r) => propertyRow(r, o.landlord.name));
}

export async function loadProperty(id: number) {
  const [o, d] = await Promise.all([
    loadOverview(),
    api<{
      property: ApiRow;
      units: { id: number; name: string; type: string; rent: string; water: string; garbage: string; status: string; tenant_name: string | null }[];
    }>(`/portal/landlord/properties/${id}/`),
  ]);
  const property = propertyRow(d.property, o.landlord.name);
  return {
    property,
    units: d.units.map((u) => {
      const rent = Number(u.rent), water = Number(u.water), garbage = Number(u.garbage);
      return {
        id: u.id, propertyId: property.id, name: u.name, type: u.type, rent, water, garbage, deposit: 0,
        status: u.status as UnitStatus, propertyName: property.name, tenantId: null, tenantName: u.tenant_name,
        monthlyTotal: rent + water + garbage,
      };
    }),
  };
}

export async function loadStatements() {
  const o = await loadOverview();
  return { landlord: o.landlord, rows: o.statements };
}
