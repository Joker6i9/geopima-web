import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getTenants } from "@/lib/api";
import type { TenantStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Tenants" };

const statusStyle: Record<TenantStatus, "default" | "secondary" | "destructive"> = {
  active: "default",
  suspended: "destructive",
  vacated: "secondary",
};

const statuses: (TenantStatus | "")[] = ["", "active", "suspended", "vacated"];

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const { search = "", status = "" } = await searchParams;
  const tenants = await getTenants(search, status);

  return (
    <>
      <PageHeader title="Tenants" description={`${tenants.length} tenant${tenants.length === 1 ? "" : "s"}`} />
      <Card>
        <CardContent className="pt-6">
          <form className="mb-4 flex flex-wrap gap-2" role="search">
            <Input name="search" defaultValue={search} placeholder="Search name, ID or unit…" className="max-w-xs" />
            <select
              name="status"
              defaultValue={status}
              aria-label="Filter by status"
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s ? s[0].toUpperCase() + s.slice(1) : "All statuses"}
                </option>
              ))}
            </select>
            <Button type="submit">Filter</Button>
            {(search || status) && (
              <Link href="/tenants" className={buttonVariants({ variant: "ghost" })}>
                Clear
              </Link>
            )}
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Property / Unit</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Rent due</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    No tenants match your filters.
                  </TableCell>
                </TableRow>
              )}
              {tenants.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs">{t.tenant_id}</TableCell>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>
                    {t.property_name ?? "—"} · {t.unit_name ?? "—"}
                  </TableCell>
                  <TableCell>{t.phone_number}</TableCell>
                  <TableCell>Day {t.due_date}</TableCell>
                  <TableCell>
                    <Badge variant={statusStyle[t.status]} className="capitalize">
                      {t.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
