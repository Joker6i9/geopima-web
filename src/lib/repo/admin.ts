import "server-only";
import { requireRole } from "../session";
import * as q from "../mock/queries";

// Every call is gated on the signed-in role. Replace the bodies with Django API calls once the backend PR lands.
const guard = () => requireRole("admin");

export async function getDashboard() { await guard(); return q.adminDashboard(); }
export async function getLandlords() { await guard(); return q.landlordRows(); }
export async function getLandlord(id: number) { await guard(); return q.landlordDetail(id); }
export async function getProperties() { await guard(); return q.propertyRows(); }
export async function getProperty(id: number) { await guard(); return q.propertyDetail(id); }
export async function getUnits(f?: Parameters<typeof q.unitRows>[0]) { await guard(); return q.unitRows(f); }
export async function getTenants(f?: Parameters<typeof q.tenantRows>[0]) { await guard(); return q.tenantRows(f); }
export async function getTenant(id: number) { await guard(); return q.tenantDetail(id); }
export async function getInvoices(f?: Parameters<typeof q.invoiceRows>[0]) { await guard(); return q.invoiceRows(f); }
export async function getInvoice(id: number) { await guard(); return q.invoiceDetail(id); }
export async function getMpesa(f?: Parameters<typeof q.mpesaRows>[0]) { await guard(); return q.mpesaRows(f); }
export async function getDeposits() { await guard(); return q.depositRows(); }
export async function getFinance() { await guard(); return q.financeSummary(); }
export async function getConfiguration() { await guard(); return q.configuration(); }
