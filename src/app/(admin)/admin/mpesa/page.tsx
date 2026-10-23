import type { Metadata } from "next";
import Link from "next/link";
import { EmptyRow } from "@/components/shared/empty-row";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmtDateTime, kes, phone } from "@/lib/format";
import { getMpesa } from "@/lib/repo/admin";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "M-Pesa" };

export default async function MpesaPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "" } = await searchParams;
  const [all, rows] = await Promise.all([getMpesa(), getMpesa({ status })]);
  const unmatched = all.filter((m) => m.status === "unmatched");
  const tabs = [
    { href: "/admin/mpesa", label: `All (${all.length})`, on: !status },
    { href: "/admin/mpesa?status=unmatched", label: `Unmatched (${unmatched.length})`, on: status === "unmatched" },
    { href: "/admin/mpesa?status=settled", label: "Settled", on: status === "settled" },
  ];

  return (
    <>
      <PageHeader title="M-Pesa payments" description="Paybill C2B transactions and how they were applied." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Received" value={kes(all.reduce((s, m) => s + m.amount, 0))} hint={`${all.length} transactions`} />
        <StatCard label="Settled" value={kes(all.filter((m) => m.status === "settled").reduce((s, m) => s + m.amount, 0))} tone="good" />
        <StatCard label="Needs reconciliation" value={kes(unmatched.reduce((s, m) => s + m.amount, 0))} hint={`${unmatched.length} transactions`} tone={unmatched.length ? "bad" : undefined} />
      </div>

      <Card className="mt-4">
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
                <TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && <EmptyRow cols={7} />}
              {rows.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-xs">{m.transId}</TableCell>
                  <TableCell>{fmtDateTime(m.time)}</TableCell>
                  <TableCell>{phone(m.msisdn)}</TableCell>
                  <TableCell>{m.billRef || <span className="text-muted-foreground">none</span>}</TableCell>
                  <TableCell>{m.tenantId ? <Link href={`/admin/tenants/${m.tenantId}`} className="hover:underline">{m.tenantName}</Link> : "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{kes(m.amount)}</TableCell>
                  <TableCell><StatusBadge status={m.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
