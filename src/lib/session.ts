import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { homeFor, isRole } from "./roles";
import type { Role } from "./types";

export const ACCESS_COOKIE = "gp_access";
export const REFRESH_COOKIE = "gp_refresh";
export const ROLE_COOKIE = "gp_role";
export const PROFILE_COOKIE = "gp_uid";

export interface Session {
  role: Role;
  /** Tenant id or landlord id the account is linked to; null for staff. */
  profileId: number | null;
}

const cookieBase = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export async function getAccessToken() {
  return (await cookies()).get(ACCESS_COOKIE)?.value;
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const role = store.get(ROLE_COOKIE)?.value;
  if (!store.has(ACCESS_COOKIE) || !isRole(role)) return null;
  const uid = store.get(PROFILE_COOKIE)?.value;
  return { role, profileId: uid ? Number(uid) : null };
}

/** Server-side gate used by every portal page. The Django API remains the real enforcer. */
export async function requireRole(role: Role): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== role) redirect(homeFor(session.role));
  return session;
}

export async function setSession(
  { access, refresh, role, profileId }: { access: string; refresh?: string; role: Role; profileId: number | null },
) {
  const store = await cookies();
  store.set(ACCESS_COOKIE, access, { ...cookieBase, maxAge: 60 * 60 });
  store.set(ROLE_COOKIE, role, { ...cookieBase, maxAge: 60 * 60 });
  if (profileId !== null) store.set(PROFILE_COOKIE, String(profileId), { ...cookieBase, maxAge: 60 * 60 });
  if (refresh) store.set(REFRESH_COOKIE, refresh, { ...cookieBase, maxAge: 60 * 60 * 24 * 7 });
}

export async function clearSession() {
  const store = await cookies();
  [ACCESS_COOKIE, REFRESH_COOKIE, ROLE_COOKIE, PROFILE_COOKIE].forEach((c) => store.delete(c));
}
