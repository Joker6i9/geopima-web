import "server-only";
import { notFound } from "next/navigation";
import { requireRole } from "../session";
import { tenantQueries } from "../data/load";

async function me() {
  const s = await requireRole("tenant");
  if (s.profileId === null) notFound();
  return { id: s.profileId, q: await tenantQueries() };
}

export async function getHome() {
  const { id, q } = await me();
  const home = q.tenantHome(id);
  if (!home) notFound();
  return home;
}
export async function getMyInvoices() { const { id, q } = await me(); return q.invoiceRows({ tenantId: id }); }
export async function getMyInvoice(id: string) {
  const { id: tenantId, q } = await me();
  const detail = q.invoiceDetail(id, tenantId);
  if (!detail) notFound();
  return detail;
}
export async function getMyPayments() { const { id, q } = await me(); return q.mpesaRows({ tenantId: id }); }
export async function getMyLease() {
  const { id, q } = await me();
  const d = q.tenantDetail(id);
  if (!d) notFound();
  return { ...d, agency: q.agencyInfo() };
}
