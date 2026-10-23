import { NextResponse } from "next/server";
import { z } from "zod";
import { API_URL, isDemo } from "@/lib/env";
import { isRole } from "@/lib/roles";
import { setSession } from "@/lib/session";
import { DEMO_LANDLORD_ID, DEMO_TENANT_ID } from "@/lib/mock/seed";
import type { Role } from "@/lib/types";

const schema = z.object({ username: z.string().min(1), password: z.string().min(1) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ detail: "Username and password are required." }, { status: 400 });
  }

  if (isDemo) {
    // Demo: the username picks the portal. Anything else signs in as staff.
    const name = parsed.data.username.toLowerCase();
    const role: Role = name === "tenant" ? "tenant" : name === "landlord" ? "landlord" : "admin";
    const profileId = role === "tenant" ? DEMO_TENANT_ID : role === "landlord" ? DEMO_LANDLORD_ID : null;
    await setSession({ access: "demo-token", role, profileId });
    return NextResponse.json({ ok: true, role });
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

  // The `/me/` endpoint is part of the proposed backend changes; until it exists, treat the account as staff.
  let role: Role = "admin";
  let profileId: number | null = null;
  const me = await fetch(`${API_URL}/me/`, { headers: { Authorization: `Bearer ${data.access}` } })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
  if (me && isRole(me.role)) {
    role = me.role;
    profileId = me.tenant_id ?? me.landlord_id ?? null;
  }

  await setSession({ access: data.access, refresh: data.refresh, role, profileId });
  return NextResponse.json({ ok: true, role });
}
