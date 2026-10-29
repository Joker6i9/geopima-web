import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddUnitDialog } from "@/components/admin/dialogs";
import { InvoicesTable } from "@/components/shared/invoices-table";
import { PageHeader } from "@/components/shared/page-header";
import { SectionTabs } from "@/components/shared/section-tabs";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { TenantsTable } from "@/components/shared/tenants-table";
import { UnitPanel } from "@/components/shared/unit-panel";
import { UnitSheet } from "@/components/shared/unit-sheet";
import { UnitsTable } from "@/components/shared/units-table";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { kes } from "@/lib/format";
import { getInvoices, getProperty, getTenants, getUnit } from "@/lib/repo/admin";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Property" };

const TABS = ["units", "tenants", "invoices"] as const;
type Tab = (typeof TABS)[number];
const STATUSES = ["occupied", "vacant", "maintenance"];

// Reads the signed-in user's data from Django, so navigating here may wait for it.
export const instant = false;

export default async function PropertyPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; status?: string; unit?: string }>;
}) {
  const id = Number((await params).id);
  const sp = await searchParams;
  const tab: Tab = TABS.find((t) => t === sp.tab) ?? "units";
  const status = STATUSES.includes(sp.status ?? "") ? sp.status! : "";

  const data = await getProperty(id);
  if (!data) notFound();
  const { property: p, units } = data;

  const base = `/admin/properties/${id}`;
  const href = (q: Record<string, string>) => {
    const qs = new URLSearchParams(Object.entries(q).filter(([, v]) => v)).toString();
    return qs ? `${base}?${qs}` : base;
  };

  const unitDetail = sp.unit ? await getUnit(Number(sp.unit)) : null;
  // Ignore ?unit= ids that belong to another property.
  const openUnit = unitDetail && unitDetail.unit.propertyId === id ? unitDetail : null;

  const [tenants, invoices] = await Promise.all([
    tab === "tenants" ? getTenants({ property: p.name }) : [],
    tab === "invoices" ? getInvoices({ propertyId: id }) : [],
  ]);
  const shown = status ? units.filter((u) => u.status === status) : units;
  const count = (s: string) => units.filter((u) => u.status === s).length;
  const chips = [
    { value: "", label: `All (${units.length})` },
    { value: "occupied", label: `Occupied (${count("occupied")})` },
    { value: "vacant", label: `Vacant (${count("vacant")})` },
    { value: "maintenance", label: `Maintenance (${count("maintenance")})` },
  ];

  return (
    <>
      <PageHeader
        title={p.name}
        description={`${p.location} · ${p.cluster}`}
        actions={
          <div className="flex items-center gap-3 text-sm">
            <Link href={`/admin/landlords/${p.landlordId}`} className="text-muted-foreground hover:underline">{p.landlordName}</Link>
            <StatusBadge status={p.status} />
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Units" value={p.unitCount} hint={`${p.occupiedCount} occupied · ${count("vacant")} vacant`} />
        <StatCard label="Occupancy" value={`${p.occupancy}%`} />
        <StatCard label="Rent roll" value={kes(p.monthlyRent)} hint="per month, occupied units" />
        <StatCard label="Collected this month" value={kes(p.collected)} hint={`of ${kes(p.billed)} billed`} />
      </div>

      <div className="mt-6">
        <SectionTabs
          label="Property sections"
          current={href({ tab: tab === "units" ? "" : tab })}
          tabs={[
            { label: `Units (${units.length})`, href: href({}) },
            { label: "Tenants", href: href({ tab: "tenants" }) },
            { label: "Invoices", href: href({ tab: "invoices" }) },
          ]}
        />
        <Card>
          <CardContent className="pt-6">
            {tab === "units" && (
              <>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  {chips.map((c) => (
                    <Link
                      key={c.value}
                      href={href({ status: c.value })}
                      className={cn(buttonVariants({ variant: status === c.value ? "default" : "outline", size: "sm" }))}
                    >
                      {c.label}
                    </Link>
                  ))}
                  <div className="ml-auto"><AddUnitDialog propertyId={id} propertyName={p.name} /></div>
                </div>
                <UnitsTable rows={shown} showProperty={false} unitHref={(uid) => href({ status, unit: String(uid) })} />
              </>
            )}
            {tab === "tenants" && <TenantsTable rows={tenants} showProperty={false} />}
            {tab === "invoices" && <InvoicesTable rows={invoices} basePath="/admin/invoices" />}
          </CardContent>
        </Card>
      </div>

      {openUnit && (
        <UnitSheet
          title={`Unit ${openUnit.unit.name}`}
          description={p.name}
          closeHref={href({ status })}
        >
          <UnitPanel data={openUnit} />
        </UnitSheet>
      )}
    </>
  );
}
