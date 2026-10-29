import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Progress } from "@/components/shared/progress";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { kes } from "@/lib/format";
import { getMyProperties } from "@/lib/repo/landlord";

export const metadata: Metadata = { title: "Properties" };

// Reads the signed-in user's data from Django, so navigating here may wait for it.
export const instant = false;

export default async function LandlordProperties() {
  const rows = await getMyProperties();
  return (
    <>
      <PageHeader title="My properties" description={`${rows.length} properties managed for you`} />
      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((p) => (
          <Card key={p.id}>
            <CardHeader>
              <CardTitle className="flex items-start justify-between gap-2">
                <Link href={`/landlord/properties/${p.id}`} className="hover:underline">{p.name}</Link>
                <StatusBadge status={p.status} />
              </CardTitle>
              <p className="text-sm text-muted-foreground">{p.location}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-1 flex justify-between text-sm"><span>Occupancy</span><span className="tabular-nums text-muted-foreground">{p.occupiedCount}/{p.unitCount} units</span></div>
                <Progress value={p.occupancy} label={`${p.name} occupancy`} />
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-muted-foreground">Rent roll</dt><dd className="font-medium tabular-nums">{kes(p.monthlyRent)}</dd></div>
                <div><dt className="text-muted-foreground">Collected this month</dt><dd className="font-medium tabular-nums">{kes(p.collected)}</dd></div>
              </dl>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
