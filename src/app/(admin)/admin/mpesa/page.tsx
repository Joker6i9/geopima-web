import { ExportMenu } from "@/components/shared/export-menu";
import type { Metadata } from "next";
import Link from "next/link";
import { AssignPaymentDialog, RecordPaymentDialog } from "@/components/admin/dialogs";
import { EmptyRow } from "@/components/shared/empty-row";
import { adminSections } from "@/components/layout/nav";
import { SectionTabs } from "@/components/shared/section-tabs";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { channelLabel, fmtDateTime, kes, phone } from "@/lib/format";
import { getConfiguration, getMpesa, getTenants } from "@/lib/repo/admin";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Payments" };

// Reads the signed-in user's data from Django, so navigating here may wait for it.
export const instant = false;

export default async function MpesaPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "" } = await searchParams;
  const [all, found, everyone, config] = await Promise.all([getMpesa(), getMpesa({ status }), getTenants(), getConfiguration()]);
  const owing = everyone.filter((t) => t.balance > 0).sort((a, b) => a.name.localeCompare(b.name));
  // Unmatched payments are the ones that need action, so they come first.
  const rows = [...found].sort((a, b) => Number(b.status === "unmatched") - Number(a.status === "unmatched"));
  const payers = everyone
    .filter((t) => t.status !== "vacated" || t.balance > 0)
    .sort((a, b) => Number(b.balance > 0) - Number(a.balance > 0) || a.name.localeCompare(b.name));
  const unmatched = all.filter((m) => m.status === "unmatched");
  const tabs = [
    { href: "/admin/mpesa", label: `All (${all.length})`, on: !status },
    { href: "/admin/mpesa?status=unmatched", label: `Unmatched (${unmatched.length})`, on: status === "unmatched" },
    { href: "/admin/mpesa?status=settled", label: "Settled", on: status === "settled" },
  ];

  return (
    <>
      <SectionTabs tabs={adminSections.money} current="/admin/mpesa" label="Money" />
      <PageHeader
        title="Payments"
        description={`${kes(all.reduce((s, m) => s + m.amount, 0))} received · ${kes(unmatched.reduce((s, m) => s + m.amount, 0))} needs reconciliation (${unmatched.length})`}
        actions={<div className="flex flex-wrap items-center gap-2"><ExportMenu dataset="payments" filters={{ status }} /><RecordPaymentDialog tenants={payers} banks={config.banks.map((b) => b.shortName)} /></div>}
      />
      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex flex-wrap gap-2">
            {tabs.map((t) => (
              <Link key={t.href} href={t.href} className={cn(buttonVariants({ variant: t.on ? "default" : "outline", size: "sm" }))}>{t.label}</Link>
            ))}
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead><TableHead>Received</TableHead><TableHead>Paid by</TableHead>
                <TableHead>Account ref</TableHead><TableHead>Matched tenant</TableHead>
                <TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead><TableHead className="sr-only">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && <EmptyRow cols={8} />}
              {rows.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-xs">{m.transId}</TableCell>
                  <TableCell>{fmtDateTime(m.time)}</TableCell>
                  <TableCell>
                    {m.channel === "mpesa" ? phone(m.msisdn) : channelLabel[m.channel]}
                    {m.channel !== "mpesa" && (m.paidTo || m.note) && <div className="text-xs text-muted-foreground">{[m.paidTo, m.note].filter(Boolean).join(" · ")}</div>}
                  </TableCell>
                  <TableCell>{m.billRef || <span className="text-muted-foreground">none</span>}</TableCell>
                  <TableCell>
                    {m.tenantId ? <Link href={`/admin/tenants/${m.tenantId}`} className="hover:underline">{m.tenantName}</Link> : "—"}
                    {m.unallocated ? <div className="text-xs text-muted-foreground">{kes(m.unallocated)} unallocated</div> : null}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{kes(m.amount)}</TableCell>
                  <TableCell><StatusBadge status={m.status} /></TableCell>
                  <TableCell className="text-right">{m.status === "unmatched" && <AssignPaymentDialog payment={m} tenants={owing} />}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
