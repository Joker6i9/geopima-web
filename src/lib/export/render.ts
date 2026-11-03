import "server-only";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import writeXlsxFile from "write-excel-file/node";
import type { Cell, Column, ExportFormat, Table } from "./table";

const withTotals = (t: Table) => (t.totals ? [...t.rows, t.totals] : t.rows);

/** Cells that start with = + - @ are read as formulas by Excel; a leading quote makes them plain text. */
const safeText = (v: string) => (/^[=+\-@\t\r]/.test(v) ? `'${v}` : v);

function csvCell(v: Cell, c: Column | undefined) {
  if (v === null || v === "") return "";
  const s = typeof v === "number" ? String(v) : c?.kind === "date" ? v : safeText(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(t: Table): Buffer {
  const lines = [t.columns.map((c) => csvCell(c.header, undefined)).join(",")];
  for (const row of withTotals(t)) lines.push(row.map((v, i) => csvCell(v, t.columns[i])).join(","));
  // The byte-order mark makes Excel open the file as UTF-8 rather than guessing.
  return Buffer.from("﻿" + lines.join("\r\n") + "\r\n", "utf8");
}

export async function toXlsx(t: Table): Promise<Buffer> {
  const header = t.columns.map((c) => ({
    value: c.header, fontWeight: "bold" as const, backgroundColor: "#E8EEF4", align: c.kind === "money" || c.kind === "int" ? ("right" as const) : undefined,
  }));
  const body = withTotals(t).map((row, r, all) => {
    const isTotal = !!t.totals && r === all.length - 1;
    return row.map((v, i) => {
      const kind = t.columns[i]?.kind;
      const style = isTotal ? { fontWeight: "bold" as const } : {};
      if (v === null || v === "") return isTotal ? { value: "", ...style } : null;
      if (typeof v === "number") return { value: v, type: Number, format: kind === "money" ? "#,##0" : "0", ...style };
      if (kind === "date") return { value: new Date(`${v}T00:00:00Z`), type: Date, format: "dd mmm yyyy", ...style };
      return { value: safeText(v), ...style };
    });
  });
  return writeXlsxFile(
    [{ data: [header, ...body], sheet: t.title.slice(0, 31).replace(/[\\/?*[\]:]/g, " "), columns: t.columns.map((c) => ({ width: c.width ?? 16 })), stickyRowsCount: 1 }],
  ).toBuffer() as Promise<Buffer>;
}

const group = (n: number) => n.toLocaleString("en-US");
const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export function toPdf(t: Table, agency: string): Buffer {
  const doc = new jsPDF({ orientation: t.columns.length > 6 ? "landscape" : "portrait", unit: "pt", format: "a4" });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const margin = 36;

  doc.setFont("helvetica", "bold").setFontSize(14).text(agency, margin, 40);
  doc.setFont("helvetica", "bold").setFontSize(12).text(t.title, margin, 60);
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(110);
  const note = [t.subtitle, `Generated ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`].filter(Boolean).join(" · ");
  doc.text(note, margin, 74);

  const text = (v: Cell, c: Column) =>
    v === null ? "" : typeof v === "number" ? group(v) : c.kind === "date" ? shortDate(v) : v;
  const right = (c: Column) => c.kind === "money" || c.kind === "int";

  autoTable(doc, {
    startY: 88,
    margin: { left: margin, right: margin, bottom: 40 },
    head: [t.columns.map((c) => c.header)],
    body: t.rows.map((row) => row.map((v, i) => text(v, t.columns[i]))),
    foot: t.totals ? [t.totals.map((v, i) => text(v, t.columns[i]))] : undefined,
    styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak" },
    headStyles: { fillColor: [38, 70, 83], textColor: 255 },
    footStyles: { fillColor: [232, 238, 244], textColor: 20, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [247, 249, 251] },
    columnStyles: Object.fromEntries(t.columns.map((c, i) => [i, { halign: right(c) ? "right" : "left" }])),
    didParseCell: (d) => {
      if (d.section !== "body" && right(t.columns[d.column.index])) d.cell.styles.halign = "right";
    },
    // Repeat the header on every page and number the pages.
    didDrawPage: () => {
      const page = doc.getNumberOfPages();
      doc.setFontSize(8).setTextColor(130).text(`Page ${page}`, width - margin, height - 20, { align: "right" });
    },
  });
  return Buffer.from(doc.output("arraybuffer"));
}

export const contentTypes: Record<ExportFormat, string> = {
  csv: "text/csv; charset=utf-8",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pdf: "application/pdf",
};
