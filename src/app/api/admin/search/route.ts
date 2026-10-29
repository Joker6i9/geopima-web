import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { adminQueries } from "@/lib/data/load";

export async function GET(request: Request) {
  // The proxy skips /api, so check the role here.
  const session = await getSession();
  if (session?.role !== "admin") return NextResponse.json({ detail: "Not allowed." }, { status: 403 });
  const q = new URL(request.url).searchParams.get("q") ?? "";
  return NextResponse.json({ hits: (await adminQueries()).searchAll(q.slice(0, 80)) });
}
