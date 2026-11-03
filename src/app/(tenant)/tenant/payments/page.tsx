import { ExportMenu } from "@/components/shared/export-menu";
import type { Metadata } from "next";
import { EmptyRow } from "@/components/shared/empty-row";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmtDateTime, kes } from "@/lib/format";
import { getMyPayments } from "@/lib/repo/tenant";

export const metadata: Metadata = { title: "Payments" };

// Reads the signed-in user's data from Django, so navigating here may wait for it.
export const instant = false;

export default async function TenantPayments() {
  const rows = await getMyPayments();
  return (
    <>
      <PageHeader title="Payment history" description={`${rows.length} payments received`} actions={<ExportMenu dataset="payments" />} />
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow><TableHead>M-Pesa code</TableHead><TableHead>Received</TableHead><TableHead>Account</TableHead><TableHead className="text-right">Amount</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && <EmptyRow cols={4}>No payments yet.</EmptyRow>}
              {rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.transId}</TableCell>
                  <TableCell>{fmtDateTime(p.time)}</TableCell>
                  <TableCell>{p.billRef}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{kes(p.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
