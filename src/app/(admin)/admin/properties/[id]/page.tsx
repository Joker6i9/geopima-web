import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { UnitsTable } from "@/components/shared/units-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { kes } from "@/lib/format";
import { getProperty } from "@/lib/repo/admin";

export const metadata: Metadata = { title: "Property" };

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const data = await getProperty(Number((await params).id));
  if (!data) notFound();
  const { property: p, units } = data;

  return (
    <>
      <PageHeader title={p.name} description={`${p.location} · ${p.landlordName} · ${p.cluster}`} actions={<StatusBadge status={p.status} />} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Units" value={p.unitCount} hint={`${p.occupiedCount} occupied`} />
        <StatCard label="Occupancy" value={`${p.occupancy}%`} />
        <StatCard label="Rent roll" value={kes(p.monthlyRent)} hint="per month, occupied units" />
        <StatCard label="Collected this month" value={kes(p.collected)} hint={`of ${kes(p.billed)} billed`} />
      </div>
      <Card className="mt-4">
        <CardHeader><CardTitle>Units</CardTitle></CardHeader>
        <CardContent><UnitsTable rows={units} showProperty={false} /></CardContent>
      </Card>
    </>
  );
}
