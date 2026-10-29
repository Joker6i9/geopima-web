import type { Metadata } from "next";
import { DetailList } from "@/components/shared/detail-list";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fmtDate, kes } from "@/lib/format";
import { getMyLease } from "@/lib/repo/tenant";

export const metadata: Metadata = { title: "My lease" };

// Reads the signed-in user's data from Django, so navigating here may wait for it.
export const instant = false;

export default async function LeasePage() {
  const { tenant: t, lease, deposit, agency } = await getMyLease();
  return (
    <>
      <PageHeader title="My lease" description={`${t.propertyName} · Unit ${t.unitName}`} actions={lease && <StatusBadge status={lease.isActive ? "active" : "inactive"} />} />
      <div className="grid gap-4">
        <Card>
          <CardHeader><CardTitle>Tenancy</CardTitle></CardHeader>
          <CardContent>
            {lease ? (
              <DetailList items={[
                { label: "Start date", value: fmtDate(lease.startDate) },
                { label: "End date", value: lease.endDate ? fmtDate(lease.endDate) : "Open ended" },
                { label: "Monthly rent", value: kes(lease.rent) },
                { label: "Rent due", value: `Day ${t.dueDay} of the month` },
                { label: "Deposit", value: deposit ? `${kes(deposit.amount)} (${deposit.status})` : kes(lease.deposit) },
                { label: "Landlord", value: t.landlordName },
              ]} />
            ) : <p className="text-muted-foreground">No active lease.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Managing agent</CardTitle></CardHeader>
          <CardContent>
            <DetailList items={[
              { label: "Agency", value: agency.name },
              { label: "Phone", value: agency.phone },
              { label: "Email", value: agency.email },
            ]} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
