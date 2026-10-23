import "server-only";
import { notFound } from "next/navigation";
import { requireRole } from "../session";
import * as q from "../mock/queries";

async function me() {
  const s = await requireRole("landlord");
  if (s.profileId === null) notFound();
  return s.profileId;
}

export async function getOverview() {
  const id = await me();
  const detail = q.landlordDetail(id);
  if (!detail) notFound();
  return { ...detail, statements: q.statements(id), period: q.currentPeriod };
}
export async function getMyProperties() { return q.propertyRows(await me()); }
export async function getMyProperty(id: number) {
  const detail = q.propertyDetail(id, await me());
  if (!detail) notFound();
  return detail;
}
export async function getMyStatements() {
  const id = await me();
  return { landlord: q.landlordDetail(id)!.landlord, rows: q.statements(id) };
}
