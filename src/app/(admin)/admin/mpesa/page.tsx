import type { Metadata } from "next";
import Link from "next/link";
import { AssignPaymentDialog } from "@/components/admin/dialogs";
import { EmptyRow } from "@/components/shared/empty-row";
import { adminSections } from "@/components/layout/nav";
import { SectionTabs } from "@/components/shared/section-tabs";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmtDateTime, kes, phone } from "@/lib/format";
import { getMpesa, getTenants } from "@/lib/repo/admin";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "M-Pesa" };

// Reads the signed-in user's data from Django, so navigating here may wait for it.
export const instant = false;

export default async function MpesaPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "" } = await searchParams;
  const [all, found, everyone] = await Promise.all([getMpesa(), getMpesa({ status }), getTenants()]);
  const owing = everyone.filter((t) => t.balance > 0).sort((a, b) => a.name.localeCompare(b.name));
  // Unmatched payments are the ones that need action, so they come first.
  const rows = [...found].sort((a, b) => Number(b.status === "unmatched") - Number(a.status === "unmatched"));
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
        title="M-Pesa payments"
        description={`${kes(all.reduce((s, m) => s + m.amount, 0))} received · ${kes(unmatched.reduce((s, m) => s + m.amount, 0))} needs reconciliation (${unmatched.length})`}
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
                <TableHead>Transaction</TableHead><TableHead>Received</TableHead><TableHead>Sender</TableHead>
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
                  <TableCell>{phone(m.msisdn)}</TableCell>
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
