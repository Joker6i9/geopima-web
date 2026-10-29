import Link from "next/link";
import { MoveInDialog, RaiseInvoiceDialog, VacateDialog } from "@/components/admin/dialogs";
import { StatusBadge } from "@/components/shared/status-badge";
import { fmtDate, kes, phone } from "@/lib/format";
import { periodLabel } from "@/lib/dates";
import type { getUnit } from "@/lib/repo/admin";

type UnitData = NonNullable<Awaited<ReturnType<typeof getUnit>>>;

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-baseline justify-between gap-4 py-1.5 text-sm">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="text-right font-medium tabular-nums">{children}</dd>
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section>
    <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</h3>
    {children}
  </section>
);

/** Server-rendered body of the unit side panel. */
export function UnitPanel({ data }: { data: UnitData }) {
  const { unit, tenant, lease, invoices, payments } = data;
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={unit.status} />
        <span className="mr-auto text-sm text-muted-foreground">{unit.type}</span>
        {unit.status === "vacant" && <MoveInDialog unit={unit} />}
        {tenant && <RaiseInvoiceDialog tenant={tenant} />}
        {tenant && <VacateDialog tenant={tenant} />}
      </div>

      <Section title="Monthly charges">
        <dl className="divide-y">
          <Row label="Rent">{kes(unit.rent)}</Row>
          <Row label="Water">{kes(unit.water)}</Row>
          <Row label="Garbage">{kes(unit.garbage)}</Row>
          <Row label="Total">{kes(unit.monthlyTotal)}</Row>
        </dl>
      </Section>

      {tenant ? (
        <>
          <Section title="Tenant">
            <dl className="divide-y">
              <Row label="Name"><Link href={`/admin/tenants/${tenant.id}`} className="hover:underline">{tenant.name}</Link></Row>
              <Row label="Phone">{phone(tenant.phone)}</Row>
              <Row label="Moved in">{fmtDate(tenant.entryDate)}</Row>
              <Row label="Lease">{lease ? `${fmtDate(lease.startDate)} → ${lease.endDate ? fmtDate(lease.endDate) : "open"}` : "None"}</Row>
              <Row label="Balance"><span className={tenant.balance > 0 ? "text-[var(--status-bad)]" : undefined}>{kes(tenant.balance)}</span></Row>
            </dl>
          </Section>

          <Section title="Recent invoices">
            {invoices.length === 0 ? <p className="py-2 text-sm text-muted-foreground">No invoices yet.</p> : (
              <ul className="divide-y">
                {invoices.map((i) => (
                  <li key={i.id}>
                    <Link href={`/admin/invoices/${i.id}`} className="flex items-center justify-between gap-3 py-2 text-sm hover:bg-muted/50">
                      <span>{periodLabel(i.period)}</span>
                      <span className="flex items-center gap-3"><span className="tabular-nums">{kes(i.balance)}</span><StatusBadge status={i.status} /></span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Recent payments">
            {payments.length === 0 ? <p className="py-2 text-sm text-muted-foreground">No payments yet.</p> : (
              <ul className="divide-y">
                {payments.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span><span className="font-mono text-xs">{m.transId}</span> · {fmtDate(m.time)}</span>
                    <span className="tabular-nums">{kes(m.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </>
      ) : (
        <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          {unit.status === "maintenance" ? "This unit is under maintenance and has no tenant." : "This unit is vacant."}
        </p>
      )}
    </>
  );
}
