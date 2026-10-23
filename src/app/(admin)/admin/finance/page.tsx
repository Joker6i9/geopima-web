import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { Progress } from "@/components/shared/progress";
import { StatCard } from "@/components/shared/stat-card";
import { BarsChart } from "@/components/shared/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { kes } from "@/lib/format";
import { getFinance } from "@/lib/repo/admin";

export const metadata: Metadata = { title: "Finance" };

export default async function FinancePage() {
  const f = await getFinance();
  const worst = Math.max(...f.ageing.map((a) => a.amount), 1);
  return (
    <>
      <PageHeader title="Finance" description="Billing, collections and arrears, August to October 2026." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Billed" value={kes(f.totalBilled)} />
        <StatCard label="Collected" value={kes(f.totalCollected)} hint={`${Math.round((f.totalCollected / f.totalBilled) * 100)}% of billed`} tone="good" />
        <StatCard label="Arrears" value={kes(f.totalArrears)} tone="bad" />
        <StatCard label="Deposits held" value={kes(f.depositsHeld)} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Billed vs collected</CardTitle></CardHeader>
          <CardContent>
            <BarsChart
              money label="Billed and collected amounts per month"
              data={f.monthly} xKey="period"
              series={[
                { key: "billed", name: "Billed", color: "var(--muted-foreground)" },
                { key: "collected", name: "Collected", color: "var(--primary)" },
              ]}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Arrears ageing</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            {f.ageing.map((a) => (
              <div key={a.label}>
                <div className="mb-1 flex justify-between text-sm"><span>{a.label}</span><span className="tabular-nums text-muted-foreground">{kes(a.amount)}</span></div>
                <Progress value={(a.amount / worst) * 100} label={`${a.label} arrears`} />
              </div>
            ))}
            <p className="text-xs text-muted-foreground">Days since the invoice due date.</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
