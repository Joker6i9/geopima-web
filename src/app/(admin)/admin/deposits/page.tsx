import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { kes } from "@/lib/format";
import { getDeposits } from "@/lib/repo/admin";

export const metadata: Metadata = { title: "Deposits" };

export default async function DepositsPage() {
  const rows = await getDeposits();
  const held = rows.filter((d) => d.status === "held");
  return (
    <>
      <PageHeader title="Deposits" description="Security deposits held for tenants." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Held" value={kes(held.reduce((s, d) => s + d.amount, 0))} hint={`${held.length} deposits`} />
        <StatCard label="Refunded" value={kes(rows.filter((d) => d.status === "refunded").reduce((s, d) => s + d.amount, 0))} />
        <StatCard label="Total records" value={rows.length} />
      </div>
      <Card className="mt-4">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Code</TableHead><TableHead>Tenant</TableHead><TableHead>Property / unit</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-mono text-xs">{d.code}</TableCell>
                  <TableCell className="font-medium">{d.tenantName}</TableCell>
                  <TableCell>{d.propertyName ? `${d.propertyName} · ${d.unitName}` : "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{kes(d.amount)}</TableCell>
                  <TableCell><StatusBadge status={d.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
