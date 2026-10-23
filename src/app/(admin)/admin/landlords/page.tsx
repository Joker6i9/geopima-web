import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { phone } from "@/lib/format";
import { getLandlords } from "@/lib/repo/admin";

export const metadata: Metadata = { title: "Landlords" };

export default async function LandlordsPage() {
  const rows = await getLandlords();
  return (
    <>
      <PageHeader title="Landlords" description={`${rows.length} landlords`} />
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
