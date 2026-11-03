import { NextResponse } from "next/server";
import { ApiError } from "@/lib/api/client";
import { buildDataset } from "@/lib/export/datasets";
import { contentTypes, toCsv, toPdf, toXlsx } from "@/lib/export/render";
import { isFormat } from "@/lib/export/table";
import { adminQueries } from "@/lib/data/load";
import { getSession } from "@/lib/session";

const EXT = { csv: "csv", xlsx: "xlsx", pdf: "pdf" } as const;

/** Downloads the table behind a page as CSV, Excel or PDF, honouring the same filters as the page. */
export async function GET(request: Request, { params }: { params: Promise<{ dataset: string }> }) {
  // The proxy skips /api, so check the session here.
  const session = await getSession();
  if (!session) return NextResponse.json({ detail: "Sign in first." }, { status: 401 });

  const { dataset } = await params;
  const url = new URL(request.url);
  const format = url.searchParams.get("format");
  if (!isFormat(format)) return NextResponse.json({ detail: "Choose csv, xlsx or pdf." }, { status: 400 });

  try {
    const table = await buildDataset(session.role, dataset, url.searchParams);
    const body =
      format === "csv" ? toCsv(table)
      : format === "xlsx" ? await toXlsx(table)
      : toPdf(table, session.role === "admin" ? (await adminQueries()).agencyInfo().name : "GeoPima");
    const stamp = new Date().toISOString().slice(0, 10);
    return new NextResponse(new Uint8Array(body), {
      headers: {
        "Content-Type": contentTypes[format],
        "Content-Disposition": `attachment; filename="geopima-${dataset}-${stamp}.${EXT[format]}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    if (e instanceof ApiError) return NextResponse.json({ detail: e.message }, { status: e.status });
    throw e;
  }
}
