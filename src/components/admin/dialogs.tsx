import { Banknote, Building2, DoorClosed, FilePlus2, Pencil, Plus, UserCheck, UserMinus, UserPlus } from "lucide-react";
import { Field, FormDialog, SelectField } from "@/components/shared/form-dialog";
import {
  addLandlordAction, addPropertyAction, addUnitAction, assignPaymentAction, moveInAction, raiseInvoiceAction,
  refundDepositAction, setTenantStatusAction, updateAgencyAction, vacateAction,
} from "@/lib/actions/admin";
import { kes } from "@/lib/format";
import { periodLabel, recentPeriods, today } from "@/lib/dates";

const hidden = (name: string, value: string | number) => <input type="hidden" name={name} value={value} />;

export function MoveInDialog({ unit }: { unit: { id: number; name: string; rent: number } }) {
  return (
    <FormDialog
      trigger={<><UserPlus /> Move in a tenant</>}
      triggerVariant="default"
      title={`Move a tenant into ${unit.name}`}
      description={`Rent ${kes(unit.rent)} per month. The deposit is recorded and the first invoice is raised.`}
      action={moveInAction}
      submitLabel="Move in"
      wide
    >
      {hidden("unitId", unit.id)}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" name="name" className="sm:col-span-2" />
        <Field label="Phone" name="phone" type="tel" placeholder="0712 345 678" />
        <Field label="Email" name="email" type="email" />
        <Field label="Lease starts" name="startDate" type="date" defaultValue={today()} />
        <Field label="Lease ends" name="endDate" type="date" required={false} hint="Leave empty for an open lease." />
        <Field label="Rent due day" name="dueDay" type="number" defaultValue={5} hint="Day of the month, 1 to 28." />
      </div>
    </FormDialog>
  );
}

export function VacateDialog({ tenant }: { tenant: { id: number; name: string; balance: number } }) {
  return (
    <FormDialog
      trigger={<><DoorClosed /> Vacate</>}
      triggerVariant="outline"
      title={`Vacate ${tenant.name}?`}
      description={
        tenant.balance > 0
          ? `They still owe ${kes(tenant.balance)}. The balance stays on record. The lease ends today and the unit becomes vacant.`
          : "The lease ends today and the unit becomes vacant. Their deposit stays held until you refund it."
      }
      action={vacateAction}
      submitLabel="Vacate unit"
      destructive
    >
      {hidden("tenantId", tenant.id)}
    </FormDialog>
  );
}

export function SuspendDialog({ tenant }: { tenant: { id: number; name: string; status: string } }) {
  const suspended = tenant.status === "suspended";
  return (
    <FormDialog
      trigger={suspended ? <><UserCheck /> Reactivate</> : <><UserMinus /> Suspend</>}
      title={suspended ? `Reactivate ${tenant.name}?` : `Suspend ${tenant.name}?`}
      description={suspended ? "They go back to active status." : "They stay in their unit but are flagged as suspended."}
      action={setTenantStatusAction}
      submitLabel={suspended ? "Reactivate" : "Suspend"}
      destructive={!suspended}
    >
      {hidden("tenantId", tenant.id)}
      {hidden("status", suspended ? "active" : "suspended")}
    </FormDialog>
  );
}

export function RaiseInvoiceDialog({ tenant }: { tenant: { id: number; name: string } }) {
  return (
    <FormDialog
      trigger={<><FilePlus2 /> Raise invoice</>}
      title={`Raise an invoice for ${tenant.name}`}
      description="Uses the unit's current rent, water and garbage charges."
      action={raiseInvoiceAction}
      submitLabel="Raise invoice"
    >
      {hidden("tenantId", tenant.id)}
      <SelectField
        label="Billing period"
        name="period"
        defaultValue={recentPeriods().at(-1)}
        options={recentPeriods().reverse().map((p) => ({ value: p, label: periodLabel(p) }))}
      />
    </FormDialog>
  );
}

export function AssignPaymentDialog({
  payment, tenants,
}: {
  payment: { id: number; transId: string; amount: number; billRef: string };
  tenants: { id: number; name: string; propertyName: string | null; unitName: string | null; balance: number }[];
}) {
  return (
    <FormDialog
      trigger={<><Banknote /> Assign</>}
      triggerVariant="default"
      triggerSize="xs"
      title={`Assign ${kes(payment.amount)} (${payment.transId})`}
      description={`Account reference: ${payment.billRef || "none"}. The money is applied to the tenant's oldest open invoices first.`}
      action={assignPaymentAction}
      submitLabel="Apply payment"
    >
      {hidden("mpesaId", payment.id)}
      <SelectField
        label="Tenant with an open balance"
        name="tenantId"
        placeholder="Choose a tenant…"
        options={tenants.map((t) => ({
          value: t.id,
          label: `${t.name} · ${t.propertyName ? `${t.propertyName} ${t.unitName}` : "vacated"} · owes ${kes(t.balance)}`,
        }))}
      />
    </FormDialog>
  );
}

export function RefundDepositDialog({ deposit }: { deposit: { id: string; code: string; amount: number; tenantName: string } }) {
  return (
    <FormDialog
      trigger={<>Refund</>}
      triggerSize="xs"
      title={`Refund ${kes(deposit.amount)} to ${deposit.tenantName}?`}
      description={`Marks deposit ${deposit.code} as refunded. Make the actual payment from your bank.`}
      action={refundDepositAction}
      submitLabel="Mark refunded"
    >
      {hidden("depositId", deposit.id)}
    </FormDialog>
  );
}

export function AddLandlordDialog() {
  return (
    <FormDialog
      trigger={<><Plus /> Add landlord</>}
      triggerVariant="default"
      title="Add a landlord"
      action={addLandlordAction}
      submitLabel="Add landlord"
      wide
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" name="name" className="sm:col-span-2" />
        <Field label="Phone" name="phone" type="tel" placeholder="0712 345 678" />
        <Field label="Email" name="email" type="email" />
        <Field label="Bank" name="bank" placeholder="KCB" />
        <Field label="Account number" name="accountNumber" />
      </div>
    </FormDialog>
  );
}

export function AddPropertyDialog({ landlords, landlordId }: { landlords: { id: number; name: string }[]; landlordId?: string }) {
  return (
    <FormDialog
      trigger={<><Building2 /> Add property</>}
      triggerVariant="default"
      title="Add a property"
      action={addPropertyAction}
      submitLabel="Add property"
      wide
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" name="name" className="sm:col-span-2" />
        <SelectField
          label="Landlord"
          name="landlordId"
          defaultValue={landlordId}
          options={landlords.map((l) => ({ value: l.id, label: l.name }))}
          className="sm:col-span-2"
        />
        <Field label="Location" name="location" placeholder="Kilimani, Nairobi" />
        <Field label="Cluster" name="cluster" placeholder="Cluster A" />
        <Field label="Commission %" name="commissionPct" type="number" defaultValue={10} />
      </div>
    </FormDialog>
  );
}

export function AddUnitDialog({ propertyId, propertyName }: { propertyId: number; propertyName: string }) {
  return (
    <FormDialog
      trigger={<><Plus /> Add unit</>}
      triggerVariant="default"
      title={`Add a unit to ${propertyName}`}
      description="New units start as vacant."
      action={addUnitAction}
      submitLabel="Add unit"
      wide
    >
      {hidden("propertyId", propertyId)}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Unit name" name="name" placeholder="A12" />
        <Field label="Type" name="type" placeholder="2 Bedroom" />
        <Field label="Monthly rent (KES)" name="rent" type="number" />
        <Field label="Deposit (KES)" name="deposit" type="number" />
        <Field label="Water (KES)" name="water" type="number" defaultValue={0} />
        <Field label="Garbage (KES)" name="garbage" type="number" defaultValue={0} />
      </div>
    </FormDialog>
  );
}

export function EditAgencyDialog({ agency }: { agency: { name: string; slogan: string; phone: string; email: string; address: string } }) {
  return (
    <FormDialog
      trigger={<><Pencil /> Edit</>}
      title="Edit agency profile"
      description="These details appear on invoices and in the tenant portal."
      action={updateAgencyAction}
      submitLabel="Save"
      wide
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" name="name" defaultValue={agency.name} />
        <Field label="Slogan" name="slogan" defaultValue={agency.slogan} />
        <Field label="Phone" name="phone" defaultValue={agency.phone} />
        <Field label="Email" name="email" type="email" defaultValue={agency.email} />
        <Field label="Address" name="address" defaultValue={agency.address} className="sm:col-span-2" />
      </div>
    </FormDialog>
  );
}

