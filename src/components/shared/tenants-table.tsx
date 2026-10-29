import Link from "next/link";
import { EmptyRow } from "@/components/shared/empty-row";
import { StatusBadge } from "@/components/shared/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { kes, phone } from "@/lib/format";

interface Row {
  id: number; code: string; name: string; phone: string; status: string; balance: number;
  propertyName: string | null; unitName: string | null;
}

export function TenantsTable({ rows, showProperty = true }: { rows: Row[]; showProperty?: boolean }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tenant ID</TableHead><TableHead>Name</TableHead>
          <TableHead>{showProperty ? "Property / unit" : "Unit"}</TableHead>
          <TableHead>Phone</TableHead><TableHead className="text-right">Balance</TableHead><TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 && <EmptyRow cols={6} />}
        {rows.map((t) => (
          <TableRow key={t.id}>
            <TableCell className="font-mono text-xs">{t.code}</TableCell>
            <TableCell className="font-medium"><Link href={`/admin/tenants/${t.id}`} className="hover:underline">{t.name}</Link></TableCell>
            <TableCell>{t.propertyName ? (showProperty ? `${t.propertyName} · ${t.unitName}` : t.unitName) : "—"}</TableCell>
            <TableCell>{phone(t.phone)}</TableCell>
            <TableCell className={`text-right tabular-nums ${t.balance > 0 ? "text-[var(--status-bad)] font-medium" : ""}`}>{kes(t.balance)}</TableCell>
            <TableCell><StatusBadge status={t.status} /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
