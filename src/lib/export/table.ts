/** A table ready to download: what every export format is drawn from. */
export type Cell = string | number | null;

export interface Column {
  header: string;
  /** money and int are numbers (right-aligned, summable in Excel); date is YYYY-MM-DD. */
  kind?: "text" | "money" | "int" | "date";
  /** Excel column width in characters. */
  width?: number;
}

export interface Table {
  title: string;
  /** Plain-language note about the filters applied, shown under the title. */
  subtitle?: string;
  columns: Column[];
  rows: Cell[][];
  /** A final row of totals, with null where a column has no total. */
  totals?: Cell[];
}

export type ExportFormat = "csv" | "xlsx" | "pdf";

export const isFormat = (v: string | null): v is ExportFormat => v === "csv" || v === "xlsx" || v === "pdf";
