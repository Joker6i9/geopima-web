import "server-only";
import { requireRole } from "../session";
import { adminQueries } from "../data/load";

// Every call is gated on the signed-in role here; Django still enforces what each staff role may see.
async function q() {
  await requireRole("admin");
  return adminQueries();
}

export async function getDashboard() { return (await q()).adminDashboard(); }
export async function getLandlords() { return (await q()).landlordRows(); }
export async function getLandlord(id: number) { return (await q()).landlordDetail(id); }
export async function getProperties() { return (await q()).propertyRows(); }
export async function getProperty(id: number) { return (await q()).propertyDetail(id); }
export async function getUnits(f?: { search?: string; property?: string; status?: string }) { return (await q()).unitRows(f); }
export async function getUnit(id: number) { return (await q()).unitDetail(id); }
export async function getTenants(f?: { search?: string; status?: string; property?: string }) { return (await q()).tenantRows(f); }
export async function getTenant(id: number) { return (await q()).tenantDetail(id); }
export async function getInvoices(f?: { search?: string; status?: string; period?: string; tenantId?: number; propertyId?: number }) { return (await q()).invoiceRows(f); }
export async function getInvoice(id: string) { return (await q()).invoiceDetail(id); }
export async function getMpesa(f?: { status?: string; tenantId?: number; invoiceId?: string }) { return (await q()).mpesaRows(f); }
export async function getDeposits() { return (await q()).depositRows(); }
export async function getFinance() { return (await q()).financeSummary(); }
export async function getConfiguration() { return (await q()).configuration(); }
export async function searchAll(query: string) { return (await q()).searchAll(query); }
