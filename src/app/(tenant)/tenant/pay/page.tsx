import type { Metadata } from "next";
import { CopyButton } from "@/components/shared/copy-button";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { kes } from "@/lib/format";
import { getHome } from "@/lib/repo/tenant";

export const metadata: Metadata = { title: "Pay rent" };

// Reads the signed-in user's data from Django, so navigating here may wait for it.
export const instant = false;

export default async function PayPage() {
  const h = await getHome();
  const account = h.tenant.unitName ?? "";
  const steps = [
    "Open M-Pesa on your phone and choose Lipa na M-Pesa, then Paybill.",
    `Enter business number ${h.paybill}.`,
    `Enter account number ${account}.`,
    `Enter the amount${h.balance > 0 ? ` (${kes(h.balance)} clears your balance)` : ""} and your M-Pesa PIN.`,
    "You will get an M-Pesa confirmation and an SMS from us. Your invoice updates automatically.",
  ];

  return (
    <>
      <PageHeader title="Pay rent" description="Pay from any phone with M-Pesa Paybill." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Your payment details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-md border p-4">
              <div><div className="text-xs uppercase tracking-wide text-muted-foreground">Business number</div><div className="text-3xl font-semibold tabular-nums">{h.paybill}</div></div>
              <CopyButton value={h.paybill} label="business number" />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-md border p-4">
              <div><div className="text-xs uppercase tracking-wide text-muted-foreground">Account number</div><div className="text-3xl font-semibold">{account}</div></div>
              <CopyButton value={account} label="account number" />
            </div>
            <p className="text-sm text-muted-foreground">Use your unit number as the account so the payment is matched to you straight away.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Steps</CardTitle></CardHeader>
          <CardContent>
            <ol className="list-decimal space-y-3 pl-5">
              {steps.map((s) => <li key={s}>{s}</li>)}
            </ol>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
