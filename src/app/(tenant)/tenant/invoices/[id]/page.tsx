import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { InvoiceDocument } from "@/components/shared/invoice-document";
import { buttonVariants } from "@/components/ui/button";
import { getMyInvoice } from "@/lib/repo/tenant";

export const metadata: Metadata = { title: "Invoice" };

export default async function TenantInvoice({ params }: { params: Promise<{ id: string }> }) {
  const detail = await getMyInvoice(Number((await params).id));
  return (
    <>
      <Link href="/tenant/invoices" className={buttonVariants({ variant: "ghost", size: "sm", className: "mb-4" })}>
        <ArrowLeft /> All invoices
      </Link>
      <InvoiceDocument detail={detail} />
    </>
  );
}
