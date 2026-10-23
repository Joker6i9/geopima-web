import "server-only";
import { notFound } from "next/navigation";
import { requireRole } from "../session";
import * as q from "../mock/queries";

async function me() {
  const s = await requireRole("tenant");
  if (s.profileId === null) notFound();
  return s.profileId;
}

export async function getHome() {
  const home = q.tenantHome(await me());
  if (!home) notFound();
  return home;
}
export async function getMyInvoices() { return q.invoiceRows({ tenantId: await me() }); }
export async function getMyInvoice(id: number) {
  const detail = q.invoiceDetail(id, await me());
  if (!detail) notFound();
  return detail;
}
export async function getMyPayments() { return q.mpesaRows({ tenantId: await me() }); }
export async function getMyLease() {
  const d = q.tenantDetail(await me());
  if (!d) notFound();
  return { ...d, agency: q.agencyInfo() };
}
