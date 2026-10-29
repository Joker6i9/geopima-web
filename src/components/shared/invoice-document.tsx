import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmtDate, fmtDateTime, kes } from "@/lib/format";
import { periodLabel } from "@/lib/dates";

interface Detail {
  invoice: {
    number: string; period: string; issueDate: string; dueDate: string; status: string; total: number; paid: number; balance: number;
    items: { description: string; amount: number }[]; tenantName: string; tenantCode: string; unitName: string; propertyName: string;
  };
  payments: { id: number; transId: string; time: string; amount: number }[];
  agency: { name: string; address: string; phone: string; email: string; paybill: string };
}

export function InvoiceDocument({ detail }: { detail: Detail }) {
  const { invoice: i, payments, agency } = detail;
  return (
    <Card className="mx-auto max-w-3xl">
      <CardContent className="space-y-8 pt-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xl font-semibold">{agency.name}</div>
            <div className="text-sm text-muted-foreground">{agency.address}</div>
            <div className="text-sm text-muted-foreground">{agency.phone} · {agency.email}</div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Invoice</div>
            <div className="font-mono text-lg font-semibold">{i.number}</div>
            <StatusBadge status={i.status} />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Billed to</div>
            <div className="font-medium">{i.tenantName}</div>
            <div className="text-sm text-muted-foreground">{i.tenantCode}</div>
            <div className="text-sm text-muted-foreground">{i.propertyName} · Unit {i.unitName}</div>
          </div>
          <dl className="grid grid-cols-2 gap-y-1 text-sm sm:text-right">
            <dt className="text-muted-foreground">Period</dt><dd className="font-medium">{periodLabel(i.period)}</dd>
            <dt className="text-muted-foreground">Issued</dt><dd>{fmtDate(i.issueDate)}</dd>
            <dt className="text-muted-foreground">Due</dt><dd className="font-medium">{fmtDate(i.dueDate)}</dd>
          </dl>
        </div>

        <Table>
          <TableHeader>
            <TableRow><TableHead>Description</TableHead><TableHead className="text-right">Amount</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {i.items.map((it) => (
              <TableRow key={it.description}>
                <TableCell>{it.description}</TableCell>
                <TableCell className="text-right tabular-nums">{kes(it.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow><TableCell>Total</TableCell><TableCell className="text-right tabular-nums">{kes(i.total)}</TableCell></TableRow>
            <TableRow><TableCell>Paid</TableCell><TableCell className="text-right tabular-nums">{kes(i.paid)}</TableCell></TableRow>
            <TableRow><TableCell className="font-semibold">Balance due</TableCell><TableCell className="text-right text-base font-semibold tabular-nums">{kes(i.balance)}</TableCell></TableRow>
          </TableFooter>
        </Table>

        {payments.length > 0 && (
          <div>
            <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Payments received</div>
            <ul className="divide-y text-sm">
              {payments.map((p) => (
                <li key={p.id} className="flex justify-between gap-3 py-2">
                  <span>{p.transId} · {fmtDateTime(p.time)}</span>
                  <span className="font-medium tabular-nums">{kes(p.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="border-t pt-4 text-sm text-muted-foreground">
          Pay via M-Pesa Paybill <strong className="text-foreground">{agency.paybill}</strong>, account number <strong className="text-foreground">{i.unitName}</strong>.
        </p>
      </CardContent>
    </Card>
  );
}
