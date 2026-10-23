import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Building2, Percent, Wallet } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Progress } from "@/components/shared/progress";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { BarsChart } from "@/components/shared/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fmtDate, kes } from "@/lib/format";
import { getDashboard } from "@/lib/repo/admin";
import { periodLabel } from "@/lib/mock/queries";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const d = await getDashboard();
  const chart = d.properties.map((p) => ({ property: p.name.split(" ")[0], total: p.unitCount, occupied: p.occupiedCount }));

  return (
    <>
      <PageHeader title="Dashboard" description={`Portfolio overview for ${periodLabel(d.period)}.`} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Properties" value={d.properties.length} icon={Building2} />
        <StatCard
          label="Occupancy"
          value={`${Math.round((d.occupiedUnits / d.totalUnits) * 100)}%`}
          hint={`${d.occupiedUnits} of ${d.totalUnits} units`}
          icon={Percent}
        />
        <StatCard
          label="Collected this month"
          value={kes(d.collected)}
          hint={`of ${kes(d.billed)} billed`}
          icon={Wallet}
        />
        <StatCard
          label="Unmatched payments"
          value={d.unmatched}
          hint="Need manual reconciliation"
          icon={AlertTriangle}
          tone={d.unmatched ? "bad" : undefined}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Units by property</CardTitle></CardHeader>
          <CardContent>
            <BarsChart
              label="Total and occupied units per property"
              data={chart}
              xKey="property"
              series={[
                { key: "total", name: "Total units", color: "var(--muted-foreground)" },
                { key: "occupied", name: "Occupied", color: "var(--primary)" },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Collections by charge</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            {d.collections.map((c) => (
              <div key={c.name}>
                <div className="mb-1 flex justify-between gap-2 text-sm">
                  <span>{c.name}</span>
                  <span className="text-muted-foreground tabular-nums">{kes(c.collected)} / {kes(c.total)}</span>
                </div>
                <Progress value={c.pct} label={`${c.name} collected`} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Largest balances this month</CardTitle></CardHeader>
          <CardContent className="divide-y">
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
