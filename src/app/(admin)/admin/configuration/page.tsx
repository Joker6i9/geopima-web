import type { Metadata } from "next";
import { EditAgencyDialog } from "@/components/admin/dialogs";
import {
  AddBankDialog, AddStaffDialog, AddVoteHeadDialog, DeleteBankDialog, EditBankDialog, EditSmsTemplateDialog,
  EditStaffDialog, EditVoteHeadDialog, MoveVoteHead,
} from "@/components/admin/settings-dialogs";
import { PageHeader } from "@/components/shared/page-header";
import { DetailList } from "@/components/shared/detail-list";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { phone, titleCase } from "@/lib/format";
import { getConfiguration, getMpesaIntegration } from "@/lib/repo/admin";
import { MpesaSetup } from "@/components/admin/mpesa-setup";

export const metadata: Metadata = { title: "Configuration" };

// Reads the signed-in user's data from Django, so navigating here may wait for it.
export const instant = false;

const smsCategories = ["FEE_REMINDER", "PAYMENT_NOTIF", "DISCOUNT", "WELCOME"];
const smsLabels: Record<string, string> = {
  FEE_REMINDER: "Rent reminder", PAYMENT_NOTIF: "Payment received", DISCOUNT: "Discount given", WELCOME: "Welcome to a new tenant",
};

export default async function ConfigurationPage() {
  const [c, mpesa] = await Promise.all([getConfiguration(), getMpesaIntegration()]);
  const roleNames = c.roles.map((r) => r.name);
  const smsKeys = [...smsCategories, ...c.smsTemplates.map((t) => t.category).filter((k) => !smsCategories.includes(k))];
  return (
    <>
      <PageHeader title="Configuration" description="Agency profile, staff, banks, charges and message templates." />
      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Agency profile</CardTitle><CardDescription>{c.agency.slogan}</CardDescription><CardAction><EditAgencyDialog agency={c.agency} /></CardAction></CardHeader>
          <CardContent>
            <DetailList items={[
              { label: "Name", value: c.agency.name },
              { label: "Phone", value: c.agency.phone },
              { label: "Email", value: c.agency.email },
              { label: "Address", value: c.agency.address },
              { label: "Paybill", value: c.agency.paybill },
            ]} />
          </CardContent>
        </Card>

        {mpesa && <MpesaSetup m={mpesa} />}

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Staff</CardTitle><CardAction><AddStaffDialog roles={roleNames} /></CardAction></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead className="sr-only">Edit</TableHead></TableRow></TableHeader>
                <TableBody>
                  {c.staff.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}<div className="text-xs font-normal text-muted-foreground">{s.username} · {phone(s.phone)}</div></TableCell>
                      <TableCell>{s.role}</TableCell>
                      <TableCell><StatusBadge status={s.active ? "active" : "inactive"} /></TableCell>
                      <TableCell className="text-right"><EditStaffDialog user={s} roles={roleNames} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Roles</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Role</TableHead><TableHead className="text-right">Permissions</TableHead><TableHead className="text-right">Users</TableHead></TableRow></TableHeader>
                <TableBody>
                  {c.roles.map((r) => (
                    <TableRow key={r.name}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.permissions}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.users}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Collection banks</CardTitle><CardDescription>Accounts tenants can pay into.</CardDescription><CardAction><AddBankDialog /></CardAction></CardHeader>
            <CardContent className="divide-y">
              {c.banks.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No banks yet.</p>}
              {c.banks.map((b) => (
                <div key={b.id} className="flex items-start justify-between gap-3 py-3">
                  <div>
                    <div className="font-medium">{b.shortName} · {b.branch}</div>
                    <div className="text-sm text-muted-foreground">{b.accountName} · {b.accountNumber}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {b.onInvoice && <StatusBadge status="active" label="On invoices" />}
                    <EditBankDialog bank={b} />
                    <DeleteBankDialog bank={b} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Vote heads</CardTitle><CardDescription>Charge types, in the order a payment pays them off. The first is paid first.</CardDescription><CardAction><AddVoteHeadDialog /></CardAction></CardHeader>
            <CardContent>
              <ol className="divide-y">
                {c.voteHeads.map((v, i) => (
                  <li key={v.id} className="flex items-center justify-between py-1.5">
                    <span className={v.active ? "" : "text-muted-foreground line-through"}>
                      <span className="mr-3 inline-block w-5 text-right tabular-nums text-muted-foreground">{i + 1}</span>{v.name}
                    </span>
                    <span className="flex items-center gap-1">
                      {!v.active && <StatusBadge status="inactive" label="Not in use" />}
                      <MoveVoteHead id={v.id} first={i === 0} last={i === c.voteHeads.length - 1} />
                      <EditVoteHeadDialog voteHead={v} />
                    </span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>SMS templates</CardTitle><CardDescription>Ready-made wording for Messages. Words in braces, like {"{first_name}"}, are filled in for each person.</CardDescription></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {smsKeys.map((k) => {
              const saved = c.smsTemplates.find((t) => t.category === k);
              const text = saved?.text ?? "";
              const auto = k === "PAYMENT_NOTIF";
              const on = saved?.enabled ?? true;
              const label = smsLabels[k] ?? titleCase(k.toLowerCase());
              return (
                <div key={k} className="flex flex-col justify-between gap-3 rounded-md border p-4">
                  <div>
                    <div className="mb-1 text-sm font-medium">{label}</div>
                    <p className="text-sm text-muted-foreground">{text || (auto ? "Standard message: “Dear {first_name}, we received {amount} on {date} (ref {receipt}). Your balance is {balance}.”" : "Not written yet.")}</p>
                    {auto && <div className="mt-2"><StatusBadge status={on ? "active" : "inactive"} label={on ? "Sent automatically" : "Off"} /></div>}
                  </div>
                  <div><EditSmsTemplateDialog category={k} label={label} text={text} enabled={on} /></div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
