import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, CheckCircle2, Smartphone } from "lucide-react";
import { CopyButton } from "@/components/shared/copy-button";
import { InvoicesTable } from "@/components/shared/invoices-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fmtDate, fmtDateTime, kes } from "@/lib/format";
import { today } from "@/lib/dates";
import { getHome } from "@/lib/repo/tenant";

export const metadata: Metadata = { title: "Home" };

// Reads the signed-in user's data from Django, so navigating here may wait for it.
export const instant = false;

export default async function TenantHome() {
  const h = await getHome();
  const { tenant: t, nextDue, balance } = h;
  const late = nextDue && nextDue.dueDate < today();

  return (
    <>
      <PageHeader title={`Hello, ${t.name.split(" ")[0]}`} description={`${t.propertyName} · Unit ${t.unitName} · ${t.code}`} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="flex flex-wrap items-center justify-between gap-6 pt-6">
            {balance > 0 && nextDue ? (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Amount due</p>
                  <p className="text-4xl font-semibold tabular-nums">{kes(balance)}</p>
                  <p className={`mt-2 flex items-center gap-1.5 text-sm ${late ? "text-[var(--status-bad)]" : "text-muted-foreground"}`}>
                    <CalendarClock className="size-4" />
                    {late ? `Overdue since ${fmtDate(nextDue.dueDate)}` : `Due ${fmtDate(nextDue.dueDate)}`}
                  </p>
                </div>
                <Link href="/tenant/pay" className={buttonVariants({ size: "lg" })}><Smartphone /> How to pay</Link>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-10 text-[var(--status-good)]" />
                <div>
                  <p className="text-xl font-semibold">You are all paid up</p>
                  <p className="text-sm text-muted-foreground">Rent is due on day {t.dueDay} of each month.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Pay by M-Pesa</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <div><div className="text-xs text-muted-foreground">Paybill</div><div className="text-lg font-semibold tabular-nums">{h.paybill}</div></div>
              <CopyButton value={h.paybill} label="paybill number" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <div><div className="text-xs text-muted-foreground">Account number</div><div className="text-lg font-semibold">{t.unitName}</div></div>
              <CopyButton value={t.unitName ?? ""} label="account number" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader><CardTitle>Recent invoices</CardTitle></CardHeader>
          <CardContent><InvoicesTable rows={h.invoices.slice(0, 3)} basePath="/tenant/invoices" showTenant={false} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Recent payments</CardTitle></CardHeader>
          <CardContent className="divide-y">
            {h.payments.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No payments yet.</p>}
            {h.payments.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                <div><div className="font-medium tabular-nums">{kes(p.amount)}</div><div className="text-xs text-muted-foreground">{p.transId} · {fmtDateTime(p.time)}</div></div>
                <StatusBadge status="settled" label="Received" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
