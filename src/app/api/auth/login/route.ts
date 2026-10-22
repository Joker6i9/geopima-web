import { NextResponse } from "next/server";
import { z } from "zod";
import { API_URL, isDemo } from "@/lib/api";
import { setSession } from "@/lib/session";

const schema = z.object({ username: z.string().min(1), password: z.string().min(1) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ detail: "Username and password are required." }, { status: 400 });
  }

  if (isDemo) {
    await setSession("demo-token");
    return NextResponse.json({ ok: true });
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
  await setSession(data.access, data.refresh);
  return NextResponse.json({ ok: true });
}
