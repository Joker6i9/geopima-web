import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyRow } from "@/components/shared/empty-row";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { kes } from "@/lib/format";

interface Row {
  id: number; name: string; type: string; propertyName: string; rent: number; water: number; garbage: number;
  status: string; tenantId: number | null; tenantName: string | null;
}

/** Units list used by the admin Units page and property detail; tenant links only for staff. */
export function UnitsTable({ rows, showProperty = true, linkTenants = true }: { rows: Row[]; showProperty?: boolean; linkTenants?: boolean }) {
  const cols = showProperty ? 8 : 7;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Unit</TableHead>
          {showProperty && <TableHead>Property</TableHead>}
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Rent</TableHead>
          <TableHead className="text-right">Water + garbage</TableHead>
          <TableHead>Tenant</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="sr-only">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 && <EmptyRow cols={cols} />}
        {rows.map((u) => (
          <TableRow key={u.id}>
            <TableCell className="font-medium">{u.name}</TableCell>
            {showProperty && <TableCell>{u.propertyName}</TableCell>}
            <TableCell>{u.type}</TableCell>
            <TableCell className="text-right tabular-nums">{kes(u.rent)}</TableCell>
            <TableCell className="text-right tabular-nums">{kes(u.water + u.garbage)}</TableCell>
            <TableCell>
              {u.tenantName ? (
                linkTenants && u.tenantId ? <Link href={`/admin/tenants/${u.tenantId}`} className="hover:underline">{u.tenantName}</Link> : u.tenantName
              ) : "—"}
            </TableCell>
            <TableCell><StatusBadge status={u.status} /></TableCell>
            <TableCell />
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
