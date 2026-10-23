import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Progress } from "@/components/shared/progress";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { kes } from "@/lib/format";
import { getProperties } from "@/lib/repo/admin";

export const metadata: Metadata = { title: "Properties" };

export default async function PropertiesPage() {
  const rows = await getProperties();
  return (
    <>
      <PageHeader title="Properties" description={`${rows.length} properties across ${new Set(rows.map((r) => r.landlordId)).size} landlords`} />
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead><TableHead>Landlord</TableHead><TableHead>Cluster</TableHead>
                <TableHead className="min-w-40">Occupancy</TableHead><TableHead className="text-right">Rent roll</TableHead>
                <TableHead className="text-right">Commission</TableHead><TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link href={`/admin/properties/${p.id}`} className="font-medium hover:underline">{p.name}</Link>
                    <div className="text-xs text-muted-foreground">{p.location}</div>
                  </TableCell>
                  <TableCell>{p.landlordName}</TableCell>
                  <TableCell>{p.cluster}</TableCell>
                  <TableCell>
                    <div className="mb-1 text-xs tabular-nums text-muted-foreground">{p.occupiedCount}/{p.unitCount} units · {p.occupancy}%</div>
                    <Progress value={p.occupancy} label={`${p.name} occupancy`} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{kes(p.monthlyRent)}</TableCell>
                  <TableCell className="text-right tabular-nums">{p.commissionPct}%</TableCell>
                  <TableCell><StatusBadge status={p.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
