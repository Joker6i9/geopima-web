import Link from "next/link";
import { EmptyRow } from "@/components/shared/empty-row";
import { StatusBadge } from "@/components/shared/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmtDate, kes } from "@/lib/format";
import { periodLabel } from "@/lib/dates";

interface Row {
  id: string; number: string; period: string; dueDate: string; total: number; paid: number; balance: number;
  status: string; tenantName: string; unitName: string; propertyName: string;
}

export function InvoicesTable({ rows, basePath, showTenant = true }: { rows: Row[]; basePath: string; showTenant?: boolean }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          {showTenant && <TableHead>Tenant</TableHead>}
          <TableHead>Period</TableHead>
          <TableHead>Due</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead className="text-right">Paid</TableHead>
          <TableHead className="text-right">Balance</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 && <EmptyRow cols={showTenant ? 8 : 7} />}
        {rows.map((i) => (
          <TableRow key={i.id}>
            <TableCell>
              <Link href={`${basePath}/${i.id}`} className="font-mono text-xs font-medium hover:underline">{i.number}</Link>
            </TableCell>
            {showTenant && (
              <TableCell>
                {i.tenantName}
                <div className="text-xs text-muted-foreground">{i.propertyName} · {i.unitName}</div>
              </TableCell>
            )}
            <TableCell>{periodLabel(i.period)}</TableCell>
            <TableCell>{fmtDate(i.dueDate)}</TableCell>
            <TableCell className="text-right tabular-nums">{kes(i.total)}</TableCell>
            <TableCell className="text-right tabular-nums">{kes(i.paid)}</TableCell>
            <TableCell className="text-right font-medium tabular-nums">{kes(i.balance)}</TableCell>
            <TableCell><StatusBadge status={i.status} /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
