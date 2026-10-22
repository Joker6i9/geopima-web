import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { nav } from "@/components/layout/nav";

export function generateStaticParams() {
  return nav.filter((n) => n.soon).map((n) => ({ module: n.href.slice(1) }));
}

export default async function ComingSoon({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  const item = nav.find((n) => n.soon && n.href === `/${module}`);
  if (!item) notFound();

  return (
    <>
      <PageHeader title={item.label} />
      <Card>
        <CardContent className="py-16 text-center text-muted-foreground">
          This module is being migrated from the legacy frontend.
        </CardContent>
      </Card>
    </>
  );
}
