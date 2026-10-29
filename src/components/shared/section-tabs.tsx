import Link from "next/link";
import type { SectionTab } from "@/components/layout/nav";
import { cn } from "@/lib/utils";

/** Link-based tabs; the active one is whichever tab's href is a prefix of `current`. */
export function SectionTabs({ tabs, current, label }: { tabs: SectionTab[]; current: string; label: string }) {
  return (
    <nav aria-label={label} className="mb-6 flex gap-1 border-b">
      {tabs.map((t) => {
        const on = current === t.href || current.startsWith(`${t.href}/`);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={on ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm transition-colors",
              on ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
