import type { Metadata } from "next";
import Link from "next/link";
import { adminSections } from "@/components/layout/nav";
import { SectionTabs } from "@/components/shared/section-tabs";
import { AddLandlordDialog } from "@/components/admin/dialogs";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { phone } from "@/lib/format";
import { getLandlords } from "@/lib/repo/admin";

export const metadata: Metadata = { title: "Landlords" };

// Reads the signed-in user's data from Django, so navigating here may wait for it.
export const instant = false;

export default async function LandlordsPage() {
  const rows = await getLandlords();
  return (
    <>
      <SectionTabs tabs={adminSections.people} current="/admin/landlords" label="People" />
      <PageHeader title="Landlords" description={`${rows.length} landlords`} actions={<AddLandlordDialog />} />
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Phone</TableHead>
                <TableHead>Bank</TableHead><TableHead className="text-right">Properties</TableHead>
                <TableHead className="text-right">Units</TableHead><TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-mono text-xs">{l.code}</TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/admin/landlords/${l.id}`} className="hover:underline">{l.name}</Link>
                  </TableCell>
                  <TableCell>{phone(l.phone)}</TableCell>
                  <TableCell>{l.bank} · {l.accountNumber}</TableCell>
                  <TableCell className="text-right tabular-nums">{l.propertyCount}</TableCell>
                  <TableCell className="text-right tabular-nums">{l.unitCount}</TableCell>
                  <TableCell><StatusBadge status={l.isActive ? "active" : "inactive"} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
