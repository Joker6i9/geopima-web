import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RaiseInvoiceDialog, SuspendDialog, VacateDialog } from "@/components/admin/dialogs";
import { DetailList } from "@/components/shared/detail-list";
import { InvoicesTable } from "@/components/shared/invoices-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmtDate, fmtDateTime, kes, phone } from "@/lib/format";
import { getTenant } from "@/lib/repo/admin";

export const metadata: Metadata = { title: "Tenant" };

// Reads the signed-in user's data from Django, so navigating here may wait for it.
export const instant = false;

export default async function TenantPage({ params }: { params: Promise<{ id: string }> }) {
  const d = await getTenant(Number((await params).id));
  if (!d) notFound();
  const { tenant: t, lease, invoices, payments, deposit } = d;

  return (
    <>
      <PageHeader title={t.name} description={`Tenant ${t.code}`} actions={
        <div className="flex flex-wrap items-center gap-2">
          {t.status !== "vacated" && <RaiseInvoiceDialog tenant={t} />}
          {t.status !== "vacated" && <SuspendDialog tenant={t} />}
          {t.status !== "vacated" && <VacateDialog tenant={t} />}
          <StatusBadge status={t.status} />
        </div>
      } />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Balance" value={kes(t.balance)} tone={t.balance > 0 ? "bad" : "good"} />
        <StatCard label="Monthly rent" value={lease ? kes(lease.rent) : "—"} />
        <StatCard label="Deposit" value={deposit ? kes(deposit.amount) : "—"} hint={deposit ? `Status: ${deposit.status}` : undefined} />
      </div>

      <Card className="mt-4">
        <CardHeader><CardTitle>Details</CardTitle></CardHeader>
        <CardContent>
          <DetailList items={[
            { label: "Phone", value: phone(t.phone) },
            { label: "Email", value: t.email },
            { label: "Unit", value: t.propertyName ? `${t.propertyName} · ${t.unitName}` : "Vacated" },
            { label: "Landlord", value: t.landlordName },
            { label: "Moved in", value: fmtDate(t.entryDate) },
            { label: "Rent due day", value: `Day ${t.dueDay}` },
            { label: "Lease", value: lease ? `${fmtDate(lease.startDate)} → ${lease.endDate ? fmtDate(lease.endDate) : "open"}` : "None" },
          ]} />
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader><CardTitle>Invoices</CardTitle></CardHeader>
        <CardContent><InvoicesTable rows={invoices} basePath="/admin/invoices" showTenant={false} /></CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader><CardTitle>Payments</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Transaction</TableHead><TableHead>Received</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
            <TableBody>
              {payments.length === 0 && <TableRow><TableCell colSpan={3} className="py-8 text-center text-muted-foreground">No payments yet.</TableCell></TableRow>}
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.transId}</TableCell>
                  <TableCell>{fmtDateTime(p.time)}</TableCell>
                  <TableCell className="text-right tabular-nums">{kes(p.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
