import { cn } from "@/lib/utils";
import { titleCase } from "@/lib/format";

type Tone = "good" | "warn" | "bad" | "idle";

const tones: Record<string, Tone> = {
  paid: "good", sent: "good", active: "good", settled: "good", occupied: "good",
  partially_paid: "warn", vacant: "warn", maintenance: "warn", under_maintenance: "warn", held: "warn", unpaid: "warn", test: "warn",
  overdue: "bad", failed: "bad", suspended: "bad", unmatched: "bad", inactive: "bad",
  vacated: "idle", refunded: "idle",
};

const toneClass: Record<Tone, string> = {
  good: "bg-[var(--status-good-bg)] text-[var(--status-good)]",
  warn: "bg-[var(--status-warn-bg)] text-[var(--status-warn)]",
  bad: "bg-[var(--status-bad-bg)] text-[var(--status-bad)]",
  idle: "bg-[var(--status-idle-bg)] text-[var(--status-idle)]",
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium",
        toneClass[tones[status] ?? "idle"],
      )}
    >
      {label ?? titleCase(status)}
    </span>
  );
}
