import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { InvoiceDocument } from "@/components/shared/invoice-document";
import { buttonVariants } from "@/components/ui/button";
import { getInvoice } from "@/lib/repo/admin";

export const metadata: Metadata = { title: "Invoice" };

// Reads the signed-in user's data from Django, so navigating here may wait for it.
export const instant = false;

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const detail = await getInvoice((await params).id);
  if (!detail) notFound();
  return (
    <>
      <Link href="/admin/invoices" className={buttonVariants({ variant: "ghost", size: "sm", className: "mb-4" })}>
        <ArrowLeft /> All invoices
      </Link>
      <InvoiceDocument detail={detail} />
    </>
  );
}
