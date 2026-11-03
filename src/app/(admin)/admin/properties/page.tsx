import { ExportMenu } from "@/components/shared/export-menu";
import type { Metadata } from "next";
import Link from "next/link";
import { AddPropertyDialog } from "@/components/admin/dialogs";
import { FilterBar } from "@/components/shared/filter-bar";
import { PageHeader } from "@/components/shared/page-header";
import { Progress } from "@/components/shared/progress";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { kes } from "@/lib/format";
import { getLandlords, getProperties } from "@/lib/repo/admin";

export const metadata: Metadata = { title: "Properties" };

// Reads the signed-in user's data from Django, so navigating here may wait for it.
export const instant = false;

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; landlord?: string }>;
}) {
  const { search = "", landlord = "" } = await searchParams;
  const [all, landlords] = await Promise.all([getProperties(), getLandlords()]);
  const q = search.toLowerCase();
  const rows = all.filter(
    (p) =>
      (!landlord || String(p.landlordId) === landlord) &&
      (!q || [p.name, p.location, p.cluster, p.landlordName].some((v) => v.toLowerCase().includes(q))),
  );
  return (
    <>
      <PageHeader title="Properties" description={`${rows.length} properties across ${new Set(rows.map((r) => r.landlordId)).size} landlords`} actions={<div className="flex flex-wrap items-center gap-2"><ExportMenu dataset="properties" /><AddPropertyDialog landlords={landlords} /></div>} />
      <Card>
        <CardContent className="pt-6">
          <FilterBar
            action="/admin/properties"
            search={search}
            placeholder="Search property, location or landlord…"
            selects={[{ name: "landlord", label: "All landlords", value: landlord, options: landlords.map((l) => ({ value: String(l.id), label: l.name })) }]}
          />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead><TableHead>Landlord</TableHead><TableHead>Cluster</TableHead>
                <TableHead className="min-w-40">Occupancy</TableHead><TableHead className="text-right">Vacant</TableHead><TableHead className="text-right">Rent roll</TableHead>
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
                  <TableCell className="text-right tabular-nums">
                    {p.unitCount - p.occupiedCount > 0
                      ? <Link href={`/admin/properties/${p.id}?status=vacant`} className="hover:underline">{p.unitCount - p.occupiedCount}</Link>
                      : 0}
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
