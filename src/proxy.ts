import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Optimistic check only: real authorization happens in the Django API.
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has("gp_access");
  const { pathname } = request.nextUrl;

  if (!hasSession && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (hasSession && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
