import "server-only";
import { notFound } from "next/navigation";
import { requireRole } from "../session";
import * as d from "../data/landlord";

export async function getOverview() { await requireRole("landlord"); return d.loadOverview(); }
export async function getMyProperties() { await requireRole("landlord"); return d.loadProperties(); }
export async function getMyProperty(id: number) {
  await requireRole("landlord");
  if (!Number.isInteger(id)) notFound();
  return d.loadProperty(id);
}
export async function getMyStatements() { await requireRole("landlord"); return d.loadStatements(); }
