import { ExportMenu } from "@/components/shared/export-menu";
import type { Metadata } from "next";
import { FilterBar } from "@/components/shared/filter-bar";
import { adminSections } from "@/components/layout/nav";
import { SectionTabs } from "@/components/shared/section-tabs";
import { PageHeader } from "@/components/shared/page-header";
import { TenantsTable } from "@/components/shared/tenants-table";
import { Card, CardContent } from "@/components/ui/card";
import { getProperties, getTenants } from "@/lib/repo/admin";

export const metadata: Metadata = { title: "Tenants" };

// Reads the signed-in user's data from Django, so navigating here may wait for it.
export const instant = false;

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; property?: string }>;
}) {
  const { search = "", status = "", property = "" } = await searchParams;
  const [tenants, properties] = await Promise.all([getTenants({ search, status, property }), getProperties()]);

  return (
    <>
      <SectionTabs tabs={adminSections.people} current="/admin/tenants" label="People" />
      <PageHeader title="Tenants" description={`${tenants.length} tenant${tenants.length === 1 ? "" : "s"}`} actions={<ExportMenu dataset="tenants" filters={{ search, status, property }} />} />
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
          <TenantsTable rows={tenants} />
        </CardContent>
      </Card>
    </>
  );
}
