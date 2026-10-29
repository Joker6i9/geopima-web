import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyRow } from "@/components/shared/empty-row";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { kes } from "@/lib/format";

interface Row {
  id: number; name: string; type: string; propertyName: string; rent: number; water: number; garbage: number;
  status: string; tenantId: number | null; tenantName: string | null;
}

/** Units list used by property detail pages; tenant links only for staff. */
export function UnitsTable({
  rows, showProperty = true, linkTenants = true, unitHref,
}: {
  rows: Row[];
  showProperty?: boolean;
  linkTenants?: boolean;
  /** When set, the unit name opens its detail panel. */
  unitHref?: (id: number) => string;
}) {
  const cols = showProperty ? 7 : 6;
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
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 && <EmptyRow cols={cols} />}
        {rows.map((u) => (
          <TableRow key={u.id}>
            <TableCell className="font-medium">
              {unitHref ? <Link href={unitHref(u.id)} scroll={false} className="hover:underline">{u.name}</Link> : u.name}
            </TableCell>
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
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
