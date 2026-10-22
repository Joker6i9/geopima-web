import "server-only";
import { cookies } from "next/headers";

export const ACCESS_COOKIE = "gp_access";
export const REFRESH_COOKIE = "gp_refresh";

const cookieBase = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export async function getAccessToken() {
  return (await cookies()).get(ACCESS_COOKIE)?.value;
}

export async function setSession(access: string, refresh?: string) {
  const store = await cookies();
  store.set(ACCESS_COOKIE, access, { ...cookieBase, maxAge: 60 * 60 });
  if (refresh) {
    store.set(REFRESH_COOKIE, refresh, { ...cookieBase, maxAge: 60 * 60 * 24 * 7 });
  }
}

export async function clearSession() {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}
