import { ExportMenu } from "@/components/shared/export-menu";
import type { Metadata } from "next";
import { adminSections } from "@/components/layout/nav";
import { SectionTabs } from "@/components/shared/section-tabs";
import { RefundDepositDialog } from "@/components/admin/dialogs";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { kes } from "@/lib/format";
import { getDeposits } from "@/lib/repo/admin";

export const metadata: Metadata = { title: "Deposits" };

// Reads the signed-in user's data from Django, so navigating here may wait for it.
export const instant = false;

export default async function DepositsPage() {
  const rows = await getDeposits();
  const held = rows.filter((d) => d.status === "held");
  return (
    <>
      <SectionTabs tabs={adminSections.money} current="/admin/deposits" label="Money" />
      <PageHeader
        title="Deposits"
        description={`${kes(held.reduce((s, d) => s + d.amount, 0))} held across ${held.length} deposits · ${kes(rows.filter((d) => d.status === "refunded").reduce((s, d) => s + d.amount, 0))} refunded`}
        actions={<ExportMenu dataset="deposits" />}
      />
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Code</TableHead><TableHead>Tenant</TableHead><TableHead>Property / unit</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead><TableHead className="sr-only">Actions</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-mono text-xs">{d.code}</TableCell>
                  <TableCell className="font-medium">{d.tenantName}</TableCell>
                  <TableCell>{d.propertyName ? `${d.propertyName} · ${d.unitName}` : "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{kes(d.amount)}</TableCell>
                  <TableCell><StatusBadge status={d.status} /></TableCell>
                  <TableCell className="text-right">{d.status === "held" && d.tenantStatus === "vacated" && <RefundDepositDialog deposit={d} />}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
