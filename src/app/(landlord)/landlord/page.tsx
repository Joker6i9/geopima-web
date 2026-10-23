import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Percent, Wallet } from "lucide-react";
import { BarsChart } from "@/components/shared/charts";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { kes } from "@/lib/format";
import { periodLabel } from "@/lib/mock/queries";
import { getOverview } from "@/lib/repo/landlord";

export const metadata: Metadata = { title: "Overview" };

export default async function LandlordHome() {
  const o = await getOverview();
  const now = o.statements.filter((s) => s.period === o.period);
  const sum = (k: "billed" | "collected" | "commission" | "net") => now.reduce((n, s) => n + s[k], 0);
  const units = o.properties.reduce((n, p) => n + p.unitCount, 0);
  const occupied = o.properties.reduce((n, p) => n + p.occupiedCount, 0);

  return (
    <>
      <PageHeader title={o.landlord.name} description={`Your portfolio in ${periodLabel(o.period)}.`} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Properties" value={o.properties.length} hint={`${units} units`} icon={Building2} />
        <StatCard label="Occupancy" value={`${units ? Math.round((occupied / units) * 100) : 0}%`} hint={`${occupied} occupied`} icon={Percent} />
        <StatCard label="Rent collected" value={kes(sum("collected"))} hint={`of ${kes(sum("billed"))} billed`} icon={Wallet} />
        <StatCard label="Net payable to you" value={kes(sum("net"))} hint={`after ${kes(sum("commission"))} commission`} tone="good" />
      </div>

      <Card className="mt-4">
        <CardHeader><CardTitle>Billed vs collected by property</CardTitle></CardHeader>
        <CardContent>
          <BarsChart
            money label="Billed and collected rent per property this month"
            data={now.map((s) => ({ property: s.property.split(" ")[0], billed: s.billed, collected: s.collected }))}
            xKey="property"
            series={[
              { key: "billed", name: "Billed", color: "var(--muted-foreground)" },
              { key: "collected", name: "Collected", color: "var(--primary)" },
            ]}
          />
        </CardContent>
      </Card>
      <p className="mt-4 text-sm text-muted-foreground">
        See each month in <Link href="/landlord/statements" className="text-primary underline">Statements</Link>.
      </p>
    </>
  );
}
