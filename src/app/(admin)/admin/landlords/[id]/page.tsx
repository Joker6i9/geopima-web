import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddPropertyDialog, EditLandlordDialog } from "@/components/admin/dialogs";
import { LoginDialog } from "@/components/admin/login-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { DetailList } from "@/components/shared/detail-list";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { kes, phone } from "@/lib/format";
import { getLandlord } from "@/lib/repo/admin";

export const metadata: Metadata = { title: "Landlord" };

// Reads the signed-in user's data from Django, so navigating here may wait for it.
export const instant = false;

export default async function LandlordPage({ params }: { params: Promise<{ id: string }> }) {
  const data = await getLandlord(Number((await params).id));
  if (!data) notFound();
  const { landlord: l, properties } = data;

  return (
    <>
      <PageHeader title={l.name} description={`Landlord ${l.code}`} actions={<div className="flex items-center gap-2"><EditLandlordDialog landlord={l} /><LoginDialog kind="landlord" id={l.id} name={l.name} hasLogin={l.hasLogin} /><StatusBadge status={l.isActive ? "active" : "inactive"} /></div>} />
      <Card>
        <CardContent className="pt-6">
          <DetailList items={[
            { label: "Phone", value: phone(l.phone) },
            { label: "Email", value: l.email },
            { label: "Bank", value: `${l.bank} · ${l.accountNumber}` },
          ]} />
        </CardContent>
      </Card>
      <Card className="mt-4">
        <CardHeader><CardTitle>Properties</CardTitle><CardAction><AddPropertyDialog landlords={[{ id: l.id, name: l.name }]} landlordId={String(l.id)} /></CardAction></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead><TableHead>Location</TableHead>
                <TableHead className="text-right">Units</TableHead><TableHead className="text-right">Occupancy</TableHead>
                <TableHead className="text-right">Commission</TableHead><TableHead className="text-right">Collected</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium"><Link href={`/admin/properties/${p.id}`} className="hover:underline">{p.name}</Link></TableCell>
                  <TableCell>{p.location}</TableCell>
                  <TableCell className="text-right tabular-nums">{p.unitCount}</TableCell>
                  <TableCell className="text-right tabular-nums">{p.occupancy}%</TableCell>
                  <TableCell className="text-right tabular-nums">{p.commissionPct}%</TableCell>
                  <TableCell className="text-right tabular-nums">{kes(p.collected)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
