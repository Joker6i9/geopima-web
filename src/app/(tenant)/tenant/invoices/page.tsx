import type { Metadata } from "next";
import { InvoicesTable } from "@/components/shared/invoices-table";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { getMyInvoices } from "@/lib/repo/tenant";

export const metadata: Metadata = { title: "Invoices" };
export const instant = false;

export default async function TenantInvoices() {
  const rows = await getMyInvoices();
  return (
    <>
      <PageHeader title="My invoices" description="Every monthly invoice and what has been paid against it." />
      <Card><CardContent className="pt-6"><InvoicesTable rows={rows} basePath="/tenant/invoices" showTenant={false} /></CardContent></Card>
    </>
  );
}
