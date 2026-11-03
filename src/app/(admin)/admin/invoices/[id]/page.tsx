import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { InvoiceDocument } from "@/components/shared/invoice-document";
import { buttonVariants } from "@/components/ui/button";
import { RecordPaymentDialog } from "@/components/admin/dialogs";
import { getConfiguration, getInvoice } from "@/lib/repo/admin";

export const metadata: Metadata = { title: "Invoice" };

// Reads the signed-in user's data from Django, so navigating here may wait for it.
export const instant = false;

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const [detail, config] = await Promise.all([getInvoice((await params).id), getConfiguration()]);
  if (!detail) notFound();
  const { invoice } = detail;
  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-2">
        <Link href="/admin/invoices" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ArrowLeft /> All invoices
        </Link>
        {invoice.balance > 0 && (
          <RecordPaymentDialog tenant={{ id: invoice.tenantId, name: invoice.tenantName }} amount={invoice.balance} banks={config.banks.map((b) => b.shortName)} />
        )}
      </div>
      <InvoiceDocument detail={detail} />
    </>
  );
}
