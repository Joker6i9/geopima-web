import type { Metadata } from "next";
import { FilterBar } from "@/components/shared/filter-bar";
import { InvoicesTable } from "@/components/shared/invoices-table";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { kes } from "@/lib/format";
import { PERIODS } from "@/lib/mock/seed";
import { periodLabel } from "@/lib/mock/queries";
import { getInvoices } from "@/lib/repo/admin";

export const metadata: Metadata = { title: "Invoices" };

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
      <PageHeader title="Invoices" description={`${rows.length} invoices · ${kes(outstanding)} outstanding`} />
      <Card>
        <CardContent className="pt-6">
          <FilterBar
            action="/admin/invoices"
            search={search}
            placeholder="Search invoice, tenant or unit…"
            selects={[
              { name: "period", label: "All periods", value: period, options: [...PERIODS].reverse().map((p) => ({ value: p, label: periodLabel(p) })) },
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
