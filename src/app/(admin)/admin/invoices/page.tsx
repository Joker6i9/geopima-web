import { ExportMenu } from "@/components/shared/export-menu";
import type { Metadata } from "next";
import { FilterBar } from "@/components/shared/filter-bar";
import { InvoicesTable } from "@/components/shared/invoices-table";
import { adminSections } from "@/components/layout/nav";
import { SectionTabs } from "@/components/shared/section-tabs";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { kes } from "@/lib/format";
import { periodLabel, recentPeriods } from "@/lib/dates";
import { getInvoices } from "@/lib/repo/admin";

export const metadata: Metadata = { title: "Invoices" };

// Reads the signed-in user's data from Django, so navigating here may wait for it.
export const instant = false;

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; period?: string }>;
}) {
  const { search = "", status = "", period = "" } = await searchParams;
  const rows = await getInvoices({ search, status, period });
  const outstanding = rows.reduce((s, i) => s + i.balance, 0);

  return (
    <>
      <SectionTabs tabs={adminSections.money} current="/admin/invoices" label="Money" />
      <PageHeader title="Invoices" description={`${rows.length} invoices · ${kes(outstanding)} outstanding`} actions={<ExportMenu dataset="invoices" filters={{ search, status, period }} />} />
      <Card>
        <CardContent className="pt-6">
          <FilterBar
            action="/admin/invoices"
            search={search}
            placeholder="Search invoice, tenant or unit…"
            selects={[
              { name: "period", label: "All periods", value: period, options: recentPeriods().reverse().map((p) => ({ value: p, label: periodLabel(p) })) },
              { name: "status", label: "All statuses", value: status, options: [
                { value: "paid", label: "Paid" }, { value: "partially_paid", label: "Partially paid" },
                { value: "overdue", label: "Overdue" }, { value: "unpaid", label: "Unpaid" },
              ] },
            ]}
          />
          <InvoicesTable rows={rows} basePath="/admin/invoices" />
        </CardContent>
      </Card>
    </>
  );
}
