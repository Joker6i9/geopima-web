import type { Metadata } from "next";
import { Building2, Home, Percent, Wallet } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOccupancy, getPaymentSummaries } from "@/lib/api";
import { kes } from "@/lib/format";
import { OccupancyChart } from "./occupancy-chart";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const [occupancy, payments] = await Promise.all([getOccupancy(), getPaymentSummaries()]);

  const rows = occupancy.properties.map((property, i) => ({
    property,
    total: occupancy.total_units[i],
    occupied: occupancy.occupied_units[i],
  }));
  const totalUnits = rows.reduce((s, r) => s + r.total, 0);
  const occupied = rows.reduce((s, r) => s + r.occupied, 0);
  const collected = payments.reduce((s, p) => s + p.collected, 0);

  const stats = [
    { label: "Properties", value: rows.length, icon: Building2 },
    { label: "Total units", value: totalUnits, icon: Home },
    { label: "Occupancy", value: `${totalUnits ? Math.round((occupied / totalUnits) * 100) : 0}%`, icon: Percent },
    { label: "Collected this month", value: kes(collected), icon: Wallet },
  ];

  return (
    <>
      <PageHeader title="Dashboard" description="Occupancy and collections at a glance." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center justify-between pt-6">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-2xl font-semibold">{value}</p>
              </div>
              <Icon className="size-8 text-muted-foreground/50" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Units by property</CardTitle>
          </CardHeader>
          <CardContent>
            <OccupancyChart data={rows} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Collections</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {payments.map((p) => (
              <div key={p.name}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{p.name}</span>
                  <span className="text-muted-foreground">
                    {kes(p.collected)} / {kes(p.total)}
                  </span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-valuenow={p.pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${p.name} collected`}
                >
                  <div className="h-full rounded-full bg-primary" style={{ width: `${p.pct}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
