import { Download } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

const formats = [
  { value: "xlsx", label: "Excel" },
  { value: "csv", label: "CSV" },
  { value: "pdf", label: "PDF" },
] as const;

/** Download links for the table on this page. Pass the page's filters so the file matches what is on screen. */
export function ExportMenu({ dataset, filters = {} }: { dataset: string; filters?: Record<string, string | undefined> }) {
  const query = (format: string) => {
    const q = new URLSearchParams({ format });
    for (const [k, v] of Object.entries(filters)) if (v) q.set(k, v);
    return `/api/export/${dataset}?${q}`;
  };
  return (
    <div role="group" aria-label="Download this table" className="inline-flex items-center gap-1">
      <Download className="size-4 text-muted-foreground" aria-hidden />
      {formats.map((f) => (
        // A plain link: the response is a file download, so no client routing.
        <a key={f.value} href={query(f.value)} download className={buttonVariants({ variant: "outline", size: "xs" })}>{f.label}</a>
      ))}
    </div>
  );
}
