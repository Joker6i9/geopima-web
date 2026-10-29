import "server-only";
import { notFound, redirect } from "next/navigation";
import { API_URL } from "../env";
import { getAccessToken } from "../session";

/** Raised for a failed Django call that is not a 401 or 404; carries the message DRF sent back. */
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

interface Page<T> { results: T[]; next: string | null }

/** First readable message out of a DRF error body ({detail}, {field: [msg]} or a list). */
export function errorMessage(body: unknown, fallback: string): string {
  if (typeof body === "string" && body) return body;
  if (Array.isArray(body)) return errorMessage(body[0], fallback);
  if (body && typeof body === "object") {
    const o = body as Record<string, unknown>;
    if (typeof o.detail === "string") return o.detail;
    const first = Object.entries(o)[0];
    if (first) {
      const msg = errorMessage(first[1], "");
      return msg ? (first[0] === "non_field_errors" ? msg : `${first[0].replace(/_/g, " ")}: ${msg}`) : fallback;
    }
  }
  return fallback;
}

/** Calls the Django API as the signed-in user. A rejected token sends them back to sign in; a missing record is a 404 page. */
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  if (!token) redirect("/login");
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...init.headers, Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) redirect("/login");
  if (res.status === 404) notFound();
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, errorMessage(body, `The server returned ${res.status}.`));
  return body as T;
}

/** Every row of a paginated list endpoint. */
export async function apiAll<T>(path: string): Promise<T[]> {
  const rows: T[] = [];
  for (let page = 1; ; page++) {
    const data = await api<Page<T> | T[]>(`${path}${path.includes("?") ? "&" : "?"}page=${page}`);
    if (Array.isArray(data)) return data;
    rows.push(...data.results);
    if (!data.next) return rows;
  }
}
