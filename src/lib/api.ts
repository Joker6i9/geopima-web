import "server-only";
import { redirect } from "next/navigation";
import { getAccessToken } from "./session";
import { mockOccupancy, mockPayments, mockTenants } from "./mock-data";
import type { OccupancyMetrics, Paginated, PaymentSummary, Tenant } from "./types";

export const API_URL = process.env.GEOPIMA_API_URL?.replace(/\/$/, "");
export const isDemo = !API_URL;

async function request<T>(path: string): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (res.status === 401) redirect("/login");
  if (!res.ok) throw new Error(`API ${res.status} on ${path}`);
  return res.json();
}

export async function getOccupancy(): Promise<OccupancyMetrics> {
  return isDemo ? mockOccupancy : request("/dashboard/metrics/");
}

export async function getPaymentSummaries(): Promise<PaymentSummary[]> {
  return isDemo ? mockPayments : request("/dashboard/payment-summaries/");
}

export async function getTenants(search = "", status = ""): Promise<Tenant[]> {
  if (isDemo) {
    const q = search.toLowerCase();
    return mockTenants.filter(
      (t) =>
        (!status || t.status === status) &&
        (!q || [t.name, t.tenant_id, t.unit_name ?? ""].some((v) => v.toLowerCase().includes(q))),
    );
  }
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (status) params.set("status", status);
  const data = await request<Paginated<Tenant>>(`/tenants/?${params}`);
  return data.results;
}
