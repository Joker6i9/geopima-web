import type { Metadata } from "next";
import { FilterBar } from "@/components/shared/filter-bar";
import { PageHeader } from "@/components/shared/page-header";
import { UnitsTable } from "@/components/shared/units-table";
import { Card, CardContent } from "@/components/ui/card";
import { getProperties, getUnits } from "@/lib/repo/admin";

export const metadata: Metadata = { title: "Units" };

export default async function UnitsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; property?: string; status?: string }>;
}) {
  const { search = "", property = "", status = "" } = await searchParams;
  const [units, properties] = await Promise.all([getUnits({ search, property, status }), getProperties()]);

  return (
    <>
      <PageHeader title="Units" description={`${units.length} units`} />
      <Card>
        <CardContent className="pt-6">
          <FilterBar
            action="/admin/units"
            search={search}
            placeholder="Search unit, property, tenant…"
            selects={[
              { name: "property", label: "All properties", value: property, options: properties.map((p) => ({ value: String(p.id), label: p.name })) },
              { name: "status", label: "All statuses", value: status, options: [
                { value: "occupied", label: "Occupied" }, { value: "vacant", label: "Vacant" }, { value: "maintenance", label: "Maintenance" },
              ] },
            ]}
          />
          <UnitsTable rows={units} />
        </CardContent>
      </Card>
    </>
  );
}
