"use client";

import { useTransition } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Field, FormDialog, SelectField } from "@/components/shared/form-dialog";
import { Button } from "@/components/ui/button";
import {
  addBankAction, addStaffAction, addVoteHeadAction, deleteBankAction, moveVoteHeadAction, saveSmsTemplateAction,
  updateBankAction, updateStaffAction, updateVoteHeadAction,
} from "@/lib/actions/admin";
import type { Bank, StaffUser } from "@/lib/types";

const hidden = (name: string, value: string | number) => <input type="hidden" name={name} value={value} />;

function Check({ name, label, defaultChecked, hint }: { name: string; label: string; defaultChecked?: boolean; hint?: string }) {
  return (
    <div className="space-y-1">
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name={name} defaultChecked={defaultChecked} className="size-4 accent-[var(--primary)]" />
        {label}
      </label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/* ---------- collection banks ---------- */

function BankFields({ bank }: { bank?: Bank }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Bank" name="name" defaultValue={bank?.shortName} placeholder="KCB" />
      <Field label="Branch" name="branch" defaultValue={bank?.branch} />
      <Field label="Account name" name="accountName" defaultValue={bank?.accountName} />
      <Field label="Account number" name="accountNumber" defaultValue={bank?.accountNumber} />
      <Check name="onInvoice" label="Show on invoices" defaultChecked={bank?.onInvoice ?? true} hint="Tenants see this account on their invoice as a way to pay." />
    </div>
  );
}

export function AddBankDialog() {
  return (
    <FormDialog trigger={<><Plus /> Add bank</>} triggerSize="xs" title="Add a collection bank" action={addBankAction} submitLabel="Add bank" wide>
      <BankFields />
    </FormDialog>
  );
}

export function EditBankDialog({ bank }: { bank: Bank }) {
  return (
    <FormDialog trigger={<Pencil />} triggerVariant="ghost" triggerSize="xs" title={`Edit ${bank.shortName}`} action={updateBankAction} submitLabel="Save" wide>
      {hidden("bankId", bank.id)}
      <BankFields bank={bank} />
    </FormDialog>
  );
}

export function DeleteBankDialog({ bank }: { bank: Bank }) {
  return (
    <FormDialog
      trigger={<Trash2 />}
      triggerVariant="ghost"
      triggerSize="xs"
      title={`Remove ${bank.shortName} · ${bank.accountNumber}?`}
      description="It disappears from invoices. Payments already received are not affected."
      action={deleteBankAction}
      submitLabel="Remove"
      destructive
    >
      {hidden("bankId", bank.id)}
    </FormDialog>
  );
}

/* ---------- SMS templates ---------- */

export function EditSmsTemplateDialog({ category, label, text, enabled = true }: { category: string; label: string; text: string; enabled?: boolean }) {
  const receipt = category === "PAYMENT_NOTIF";
  return (
    <FormDialog
      trigger={<><Pencil /> {text ? "Edit" : "Write"}</>}
      triggerSize="xs"
      title={label}
      description={receipt ? "Sent to the tenant by itself every time a payment of theirs is recorded." : "Saved templates appear as starting points in Messages."}
      action={saveSmsTemplateAction}
      submitLabel="Save template"
      wide
    >
      {hidden("category", category)}
      <div className="space-y-1.5">
        <label htmlFor="text" className="text-sm font-medium">Message</label>
        <textarea
          id="text"
          name="text"
          required
          rows={5}
          maxLength={480}
          defaultValue={text}
          className="w-full rounded-lg border border-input bg-background px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <p className="text-xs text-muted-foreground">
          Words in braces are filled in for each person: {"{first_name}"}, {"{name}"}, {"{unit}"}, {"{property}"}, {"{balance}"}, {"{rent}"}, {"{paybill}"}, {"{agency}"}
          {receipt && <>, and for this one the payment: {"{amount}"}, {"{receipt}"}, {"{date}"}</>}.
        </p>
      </div>
      {receipt && <Check name="enabled" label="Send automatically when a payment is received" defaultChecked={enabled} hint="Untick to stop these texts. If this wording is empty or has a word we don't know, a standard message is sent instead." />}
    </FormDialog>
  );
}

/* ---------- vote heads (charges) ---------- */

export function AddVoteHeadDialog() {
  return (
    <FormDialog
      trigger={<><Plus /> Add charge</>}
      triggerSize="xs"
      title="Add a charge type"
      description="It goes to the end of the order in which payments are applied. Use the arrows to move it."
      action={addVoteHeadAction}
      submitLabel="Add charge"
    >
      <Field label="Name" name="name" placeholder="Security" />
    </FormDialog>
  );
}

export function EditVoteHeadDialog({ voteHead }: { voteHead: { id: string; name: string; active: boolean } }) {
  return (
    <FormDialog trigger={<Pencil />} triggerVariant="ghost" triggerSize="xs" title={`Edit ${voteHead.name}`} action={updateVoteHeadAction} submitLabel="Save">
      {hidden("voteHeadId", voteHead.id)}
      <Field label="Name" name="name" defaultValue={voteHead.name} />
      <Check name="active" label="In use" defaultChecked={voteHead.active} hint="Untick to stop using this charge without losing its history." />
    </FormDialog>
  );
}

export function MoveVoteHead({ id, first, last }: { id: string; first: boolean; last: boolean }) {
  const [pending, start] = useTransition();
  const move = (dir: "up" | "down") =>
    start(async () => {
      const r = await moveVoteHeadAction(id, dir);
      if (r && !r.ok) toast.error(r.message);
    });
  return (
    <span className="inline-flex">
      <Button type="button" variant="ghost" size="xs" aria-label="Move up" disabled={pending || first} onClick={() => move("up")}><ArrowUp /></Button>
      <Button type="button" variant="ghost" size="xs" aria-label="Move down" disabled={pending || last} onClick={() => move("down")}><ArrowDown /></Button>
    </span>
  );
}

/* ---------- staff ---------- */

export function AddStaffDialog({ roles }: { roles: string[] }) {
  return (
    <FormDialog
      trigger={<><Plus /> Add staff</>}
      triggerSize="xs"
      title="Add a staff member"
      description="They sign in with the username and password you set here. Ask them to keep the password private."
      action={addStaffAction}
      submitLabel="Add staff member"
      wide
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" name="fullName" className="sm:col-span-2" />
        <Field label="Username" name="username" placeholder="jane.mwangi" />
        <SelectField label="Role" name="role" options={roles.map((r) => ({ value: r, label: r }))} />
        <Field label="Email" name="email" type="email" />
        <Field label="Phone" name="phone" type="tel" placeholder="0712 345 678" />
        <Field label="Password" name="password" type="password" className="sm:col-span-2" hint="At least 8 characters." />
      </div>
    </FormDialog>
  );
}

export function EditStaffDialog({ user, roles }: { user: StaffUser; roles: string[] }) {
  return (
    <FormDialog trigger={<Pencil />} triggerVariant="ghost" triggerSize="xs" title={`Edit ${user.name}`} action={updateStaffAction} submitLabel="Save" wide>
      {hidden("userId", user.id)}
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Role" name="role" defaultValue={user.role} options={roles.map((r) => ({ value: r, label: r }))} />
        <Field label="New password" name="password" type="password" required={false} hint="Leave empty to keep the current one." />
        <div className="sm:col-span-2">
          <Check name="active" label="Can sign in" defaultChecked={user.active} hint="Untick to remove their access. Accounts are never deleted, so their history stays." />
        </div>
      </div>
    </FormDialog>
  );
}
