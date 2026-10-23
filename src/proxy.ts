import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ROLES, homeFor, isRole } from "@/lib/roles";

// Optimistic check only: pages re-check the role on the server and Django enforces access.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get("gp_role")?.value;
  const signedIn = request.cookies.has("gp_access") && isRole(role);
  const go = (path: string) => NextResponse.redirect(new URL(path, request.url));

  if (!signedIn) return pathname === "/login" ? NextResponse.next() : go("/login");
  if (pathname === "/login" || pathname === "/") return go(homeFor(role));

  const portal = ROLES.find((r) => pathname === `/${r}` || pathname.startsWith(`/${r}/`));
  if (portal && portal !== role) return go(homeFor(role));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
