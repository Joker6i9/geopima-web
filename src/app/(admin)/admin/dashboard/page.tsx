import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CalendarClock, DoorOpen, Percent, Smartphone, Wallet } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fmtDate, kes } from "@/lib/format";
import { getDashboard } from "@/lib/repo/admin";
import { periodLabel } from "@/lib/dates";

export const metadata: Metadata = { title: "Dashboard" };

function Attention({
  href, icon: Icon, title, hint, tone, children,
}: {
  href: string;
  icon: typeof AlertTriangle;
  title: string;
  hint: string;
  tone?: "bad";
  children?: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border p-4">
      <Link href={href} className="group flex items-start gap-3">
        <Icon className={`mt-0.5 size-5 shrink-0 ${tone === "bad" ? "text-[var(--status-bad)]" : "text-muted-foreground"}`} />
        <div className="min-w-0">
          <div className="font-medium group-hover:underline">{title}</div>
          <div className="text-sm text-muted-foreground">{hint}</div>
        </div>
      </Link>
      {children && <ul className="mt-3 divide-y border-t text-sm">{children}</ul>}
    </section>
  );
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

// Reads the signed-in user's data from Django, so navigating here may wait for it.
export const instant = false;

export default async function DashboardPage() {
  const d = await getDashboard();

  return (
    <>
      <PageHeader title="Dashboard" description={`Portfolio overview for ${periodLabel(d.period)}.`} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Occupancy"
          value={`${Math.round((d.occupiedUnits / d.totalUnits) * 100)}%`}
          hint={`${d.occupiedUnits} of ${d.totalUnits} units`}
          icon={Percent}
        />
        <StatCard label="Collected this month" value={kes(d.collected)} hint={`of ${kes(d.billed)} billed`} icon={Wallet} />
        <StatCard
          label="Overdue balances"
          value={kes(d.overdue.amount)}
          hint={plural(d.overdue.count, "invoice")}
          icon={AlertTriangle}
          tone={d.overdue.count ? "bad" : undefined}
        />
        <StatCard label="Vacant units" value={d.vacantCount} hint="Ready to let" icon={DoorOpen} />
      </div>

      <Card className="mt-4">
        <CardHeader><CardTitle>Needs attention</CardTitle></CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <Attention
            href="/admin/mpesa?status=unmatched"
            icon={Smartphone}
            tone={d.unmatched.count ? "bad" : undefined}
            title={d.unmatched.count ? `${plural(d.unmatched.count, "unmatched payment")} · ${kes(d.unmatched.amount)}` : "No unmatched payments"}
            hint={d.unmatched.count ? "M-Pesa money not yet tied to a tenant" : "Every M-Pesa payment is matched"}
          />
          <Attention
            href="/admin/invoices?status=overdue"
            icon={AlertTriangle}
            tone={d.overdue.count ? "bad" : undefined}
            title={d.overdue.count ? `${plural(d.overdue.count, "overdue invoice")} · ${kes(d.overdue.amount)}` : "Nothing overdue"}
            hint="Past the due date with a balance"
          />
          <Attention
            href="/admin/properties"
            icon={DoorOpen}
            title={`${plural(d.vacantCount, "vacant unit")}`}
            hint="Open a unit to see its details"
          >
            {d.vacant.map((u) => (
              <li key={u.id}>
                <Link href={`/admin/properties/${u.propertyId}?status=vacant&unit=${u.id}`} className="flex justify-between gap-3 py-2 hover:bg-muted/50">
                  <span>{u.propertyName} · {u.name}</span>
                  <span className="tabular-nums text-muted-foreground">{kes(u.rent)}</span>
                </Link>
              </li>
            ))}
          </Attention>
          <Attention
            href="/admin/tenants"
            icon={CalendarClock}
            title={d.leasesEnding.length ? `${plural(d.leasesEnding.length, "lease")} ending soon` : "No leases ending soon"}
            hint={`Ending within ${d.leaseWarningDays} days`}
          >
            {d.leasesEnding.slice(0, 5).map((l) => (
              <li key={l.leaseId}>
                <Link href={`/admin/tenants/${l.tenantId}`} className="flex justify-between gap-3 py-2 hover:bg-muted/50">
                  <span>{l.tenantName} · {l.propertyName} {l.unitName}</span>
                  <span className="shrink-0 text-muted-foreground">{fmtDate(l.endDate)}</span>
                </Link>
              </li>
            ))}
          </Attention>
        </CardContent>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Largest balances this month</CardTitle></CardHeader>
          <CardContent className="divide-y">
            {d.topArrears.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No overdue balances this month.</p>}
            {d.topArrears.map((i) => (
              <Link key={i.id} href={`/admin/invoices/${i.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-muted/50">
                <div className="min-w-0">
                  <div className="truncate font-medium">{i.tenantName}</div>
                  <div className="text-xs text-muted-foreground">{i.propertyName} · {i.unitName} · {i.daysOverdue} days late</div>
                </div>
                <div className="text-right">
                  <div className="font-medium tabular-nums">{kes(i.balance)}</div>
                  <StatusBadge status={i.status} />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent M-Pesa payments</CardTitle></CardHeader>
          <CardContent className="divide-y">
            {d.recentPayments.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <div className="truncate font-medium">{m.tenantName ?? "Unmatched"}</div>
                  <div className="text-xs text-muted-foreground">{m.transId} · {fmtDate(m.time)}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium tabular-nums">{kes(m.amount)}</div>
                  <StatusBadge status={m.status} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
