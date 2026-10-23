import type { Metadata } from "next";
import Link from "next/link";
import { EmptyRow } from "@/components/shared/empty-row";
import { FilterBar } from "@/components/shared/filter-bar";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { kes, phone } from "@/lib/format";
import { getProperties, getTenants } from "@/lib/repo/admin";

export const metadata: Metadata = { title: "Tenants" };

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; property?: string }>;
}) {
  const { search = "", status = "", property = "" } = await searchParams;
  const [tenants, properties] = await Promise.all([getTenants({ search, status, property }), getProperties()]);

  return (
    <>
      <PageHeader title="Tenants" description={`${tenants.length} tenant${tenants.length === 1 ? "" : "s"}`} />
      <Card>
        <CardContent className="pt-6">
          <FilterBar
            action="/admin/tenants"
            search={search}
            placeholder="Search name, ID, unit or phone…"
            selects={[
              { name: "property", label: "All properties", value: property, options: properties.map((p) => ({ value: p.name, label: p.name })) },
              { name: "status", label: "All statuses", value: status, options: [
                { value: "active", label: "Active" }, { value: "suspended", label: "Suspended" }, { value: "vacated", label: "Vacated" },
              ] },
            ]}
          />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant ID</TableHead><TableHead>Name</TableHead><TableHead>Property / unit</TableHead>
                <TableHead>Phone</TableHead><TableHead className="text-right">Balance</TableHead><TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.length === 0 && <EmptyRow cols={6} />}
              {tenants.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs">{t.code}</TableCell>
                  <TableCell className="font-medium"><Link href={`/admin/tenants/${t.id}`} className="hover:underline">{t.name}</Link></TableCell>
                  <TableCell>{t.propertyName ? `${t.propertyName} · ${t.unitName}` : "—"}</TableCell>
                  <TableCell>{phone(t.phone)}</TableCell>
                  <TableCell className={`text-right tabular-nums ${t.balance > 0 ? "text-[var(--status-bad)] font-medium" : ""}`}>{kes(t.balance)}</TableCell>
                  <TableCell><StatusBadge status={t.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
