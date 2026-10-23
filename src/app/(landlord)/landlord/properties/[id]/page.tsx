import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { UnitsTable } from "@/components/shared/units-table";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { kes } from "@/lib/format";
import { getMyProperty } from "@/lib/repo/landlord";

export const metadata: Metadata = { title: "Property" };

export default async function LandlordProperty({ params }: { params: Promise<{ id: string }> }) {
  const { property: p, units } = await getMyProperty(Number((await params).id));
  return (
    <>
      <Link href="/landlord/properties" className={buttonVariants({ variant: "ghost", size: "sm", className: "mb-4" })}><ArrowLeft /> All properties</Link>
      <PageHeader title={p.name} description={p.location} actions={<StatusBadge status={p.status} />} />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Occupancy" value={`${p.occupancy}%`} hint={`${p.occupiedCount} of ${p.unitCount} units`} />
        <StatCard label="Rent roll" value={kes(p.monthlyRent)} hint="per month" />
        <StatCard label="Collected this month" value={kes(p.collected)} hint={`of ${kes(p.billed)}`} />
      </div>
      <Card className="mt-4">
        <CardHeader><CardTitle>Units</CardTitle></CardHeader>
        <CardContent><UnitsTable rows={units} showProperty={false} linkTenants={false} /></CardContent>
      </Card>
    </>
  );
}
