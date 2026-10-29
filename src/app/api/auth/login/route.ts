import { NextResponse } from "next/server";
import { z } from "zod";
import { API_URL } from "@/lib/env";
import { isRole } from "@/lib/roles";
import { setSession } from "@/lib/session";
import type { Role } from "@/lib/types";

const schema = z.object({ username: z.string().min(1), password: z.string().min(1) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ detail: "Username and password are required." }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
  } catch {
    return NextResponse.json({ detail: "Could not reach the server." }, { status: 502 });
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json({ detail: data.detail ?? "Invalid credentials." }, { status: res.status });
  }

  // Never guess the portal: if Django cannot say who this is, do not sign them in.
  const me = await fetch(`${API_URL}/me/`, { headers: { Authorization: `Bearer ${data.access}` } })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
  if (!me || !isRole(me.role)) {
    return NextResponse.json({ detail: "This account has no portal access. Ask an administrator to assign a role." }, { status: 403 });
  }
  const role: Role = me.role;
  const profileId: number | null = me.tenant_id ?? me.landlord_id ?? null;

  await setSession({ access: data.access, refresh: data.refresh, role, profileId });
  return NextResponse.json({ ok: true, role });
}
