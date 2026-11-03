import { Banknote, Building2, HandCoins, Smartphone, DoorClosed, FilePlus2, Pencil, Plus, UserCheck, UserMinus, UserPlus } from "lucide-react";
import { Field, FormDialog, SelectField } from "@/components/shared/form-dialog";
import {
  addLandlordAction, addPropertyAction, addUnitAction, assignPaymentAction, moveInAction, raiseInvoiceAction,
  recordPaymentAction, refundDepositAction, requestPaymentAction, setTenantStatusAction, updateAgencyAction, updateLandlordAction, updatePropertyAction,
  updateTenantAction, updateUnitAction, vacateAction,
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
        <Field label="ID number" name="idNumber" required={false} />
        <Field label="Second contact" name="secondaryContact" type="tel" required={false} hint="Next of kin or another number." />
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

export function AddUnitDialog({
  propertyId, propertyName, defaults,
}: {
  propertyId: number;
  propertyName: string;
  /** The property's standard charges, filled in so a new unit is quick to add. */
  defaults?: { deposit: number; water: number; garbage: number };
}) {
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
        <Field label="Deposit (KES)" name="deposit" type="number" defaultValue={defaults?.deposit ?? 0} />
        <Field label="Water (KES)" name="water" type="number" defaultValue={defaults?.water ?? 0} />
        <Field label="Garbage (KES)" name="garbage" type="number" defaultValue={defaults?.garbage ?? 0} />
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


/** Record cash, a bank transfer or a cheque. With `tenant` it is fixed (and the balance suggested); otherwise the user picks one. */
export function RecordPaymentDialog({
  tenant, tenants = [], banks, amount, variant = "default",
}: {
  tenant?: { id: number; name: string };
  tenants?: { id: number; name: string; propertyName: string | null; unitName: string | null; balance: number }[];
  banks: string[];
  /** Suggested amount, usually what the tenant owes. */
  amount?: number;
  variant?: "default" | "outline";
}) {
  return (
    <FormDialog
      trigger={<><HandCoins /> Record payment</>}
      triggerVariant={variant}
      title={tenant ? `Record a payment from ${tenant.name}` : "Record a payment"}
      description="For cash, bank transfers and cheques. It is applied to the tenant's oldest open invoices first; M-Pesa payments arrive by themselves."
      action={recordPaymentAction}
      submitLabel="Record payment"
      wide
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {tenant ? hidden("tenantId", tenant.id) : (
          <SelectField
            label="Tenant"
            name="tenantId"
            className="sm:col-span-2"
            placeholder="Choose a tenant…"
            options={tenants.map((t) => ({
              value: t.id,
              label: `${t.name} · ${t.propertyName ? `${t.propertyName} ${t.unitName}` : "vacated"}${t.balance > 0 ? ` · owes ${kes(t.balance)}` : ""}`,
            }))}
          />
        )}
        <Field label="Amount received (KES)" name="amount" type="number" defaultValue={amount && amount > 0 ? amount : undefined} />
        <Field label="Date received" name="date" type="date" defaultValue={today()} />
        <SelectField
          label="Paid by"
          name="channel"
          defaultValue="cash"
          options={[{ value: "cash", label: "Cash" }, { value: "bank", label: "Bank transfer" }, { value: "cheque", label: "Cheque" }]}
        />
        <SelectField label="Paid into" name="paidTo" required={false} placeholder="Not applicable" options={banks.map((b) => ({ value: b, label: b }))} />
        <Field label="Reference" name="reference" required={false} className="sm:col-span-2" hint="Bank reference or cheque number. Needed for bank and cheque, not for cash." />
        <Field label="Note" name="note" required={false} className="sm:col-span-2" />
      </div>
    </FormDialog>
  );
}

export function EditTenantDialog({ tenant }: { tenant: { id: number; name: string; phone: string; email: string; idNumber: string; secondaryContact: string; dueDay: number } }) {
  return (
    <FormDialog trigger={<><Pencil /> Edit</>} title={`Edit ${tenant.name}`} description="Contact details and the day rent is due." action={updateTenantAction} submitLabel="Save" wide>
      {hidden("tenantId", tenant.id)}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" name="name" defaultValue={tenant.name} className="sm:col-span-2" />
        <Field label="Phone" name="phone" type="tel" defaultValue={tenant.phone} />
        <Field label="Email" name="email" type="email" defaultValue={tenant.email} />
        <Field label="ID number" name="idNumber" defaultValue={tenant.idNumber} required={false} />
        <Field label="Second contact" name="secondaryContact" type="tel" defaultValue={tenant.secondaryContact} required={false} hint="Next of kin or another number." />
        <Field label="Rent due day" name="dueDay" type="number" defaultValue={tenant.dueDay} hint="Day of the month, 1 to 28." />
      </div>
    </FormDialog>
  );
}

export function EditLandlordDialog({ landlord }: { landlord: { id: number; name: string; phone: string; email: string; bank: string; accountNumber: string } }) {
  return (
    <FormDialog trigger={<><Pencil /> Edit</>} title={`Edit ${landlord.name}`} action={updateLandlordAction} submitLabel="Save" wide>
      {hidden("landlordId", landlord.id)}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" name="name" defaultValue={landlord.name} className="sm:col-span-2" />
        <Field label="Phone" name="phone" type="tel" defaultValue={landlord.phone} />
        <Field label="Email" name="email" type="email" defaultValue={landlord.email} />
        <Field label="Bank" name="bank" defaultValue={landlord.bank} />
        <Field label="Account number" name="accountNumber" defaultValue={landlord.accountNumber} />
      </div>
    </FormDialog>
  );
}

export function EditPropertyDialog({
  property, landlords,
}: {
  property: { code: string; name: string; landlordId: number; location: string; cluster: string; commissionPct: number; defaults: { deposit: number; water: number; garbage: number } };
  landlords: { id: number; name: string }[];
}) {
  return (
    <FormDialog trigger={<><Pencil /> Edit</>} title={`Edit ${property.name}`} action={updatePropertyAction} submitLabel="Save" wide>
      {hidden("code", property.code)}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" name="name" defaultValue={property.name} className="sm:col-span-2" />
        <SelectField label="Landlord" name="landlordId" defaultValue={property.landlordId} options={landlords.map((l) => ({ value: l.id, label: l.name }))} className="sm:col-span-2" />
        <Field label="Location" name="location" defaultValue={property.location} />
        <Field label="Cluster" name="cluster" defaultValue={property.cluster} />
        <Field label="Commission %" name="commissionPct" type="number" defaultValue={property.commissionPct} className="sm:col-span-2" />
        <p className="text-sm font-medium sm:col-span-2">Standard charges for new units</p>
        <Field label="Deposit (KES)" name="deposit" type="number" defaultValue={property.defaults.deposit} />
        <Field label="Water (KES)" name="water" type="number" defaultValue={property.defaults.water} />
        <Field label="Garbage (KES)" name="garbage" type="number" defaultValue={property.defaults.garbage} hint="Used to fill in the Add unit form. Existing units are not changed." />
      </div>
    </FormDialog>
  );
}

export function EditUnitDialog({ unit }: { unit: { id: number; name: string; type: string; rent: number; water: number; garbage: number; deposit: number } }) {
  return (
    <FormDialog
      trigger={<><Pencil /> Edit</>}
      title={`Edit unit ${unit.name}`}
      description="New rent and charges apply from the next invoice. Invoices already raised and the current lease do not change."
      action={updateUnitAction}
      submitLabel="Save"
      wide
    >
      {hidden("unitId", unit.id)}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Type" name="type" defaultValue={unit.type} className="sm:col-span-2" />
        <Field label="Monthly rent (KES)" name="rent" type="number" defaultValue={unit.rent} />
        <Field label="Deposit (KES)" name="deposit" type="number" defaultValue={unit.deposit} />
        <Field label="Water (KES)" name="water" type="number" defaultValue={unit.water} />
        <Field label="Garbage (KES)" name="garbage" type="number" defaultValue={unit.garbage} />
      </div>
    </FormDialog>
  );
}

/** Sends an M-Pesa PIN prompt to the tenant's phone; the money arrives through the normal payment flow. */
export function RequestPaymentDialog({ tenant, amount }: { tenant: { id: number; name: string; phone: string }; amount?: number }) {
  return (
    <FormDialog
      trigger={<><Smartphone /> Request M-Pesa payment</>}
      triggerVariant="outline"
      title={`Ask ${tenant.name} to pay by M-Pesa`}
      description="A PIN prompt appears on their phone. When they enter it, the payment is recorded and applied to their oldest open invoices automatically."
      action={requestPaymentAction}
      submitLabel="Send request"
    >
      {hidden("tenantId", tenant.id)}
      <Field label="Amount (KES)" name="amount" type="number" defaultValue={amount && amount > 0 ? amount : undefined} />
      <Field label="Phone to prompt" name="phone" type="tel" defaultValue={tenant.phone.replace(/^254/, "0")} hint="Any Safaricom number. Defaults to the tenant's." />
    </FormDialog>
  );
}
