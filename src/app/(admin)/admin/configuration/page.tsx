import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { DetailList } from "@/components/shared/detail-list";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { phone } from "@/lib/format";
import { getConfiguration } from "@/lib/repo/admin";

export const metadata: Metadata = { title: "Configuration" };

export default async function ConfigurationPage() {
  const c = await getConfiguration();
  return (
    <>
      <PageHeader title="Configuration" description="Agency profile, staff access, banks and message templates." />
      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Agency profile</CardTitle><CardDescription>{c.agency.slogan}</CardDescription></CardHeader>
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

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Staff</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {c.staff.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}<div className="text-xs font-normal text-muted-foreground">{s.username} · {phone(s.phone)}</div></TableCell>
                      <TableCell>{s.role}</TableCell>
                      <TableCell><StatusBadge status={s.active ? "active" : "inactive"} /></TableCell>
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
            <CardHeader><CardTitle>Collection banks</CardTitle></CardHeader>
            <CardContent className="divide-y">
              {c.banks.map((b) => (
                <div key={b.id} className="flex items-start justify-between gap-3 py-3">
                  <div>
                    <div className="font-medium">{b.shortName} · {b.branch}</div>
                    <div className="text-sm text-muted-foreground">{b.accountName} · {b.accountNumber}</div>
                  </div>
                  {b.onInvoice && <StatusBadge status="active" label="On invoices" />}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Vote heads</CardTitle><CardDescription>Order in which payments are applied.</CardDescription></CardHeader>
            <CardContent>
              <ol className="divide-y">
                {c.voteHeads.map((v) => (
                  <li key={v.id} className="flex items-center justify-between py-2.5">
                    <span><span className="mr-3 inline-block w-5 text-right tabular-nums text-muted-foreground">{v.priority}</span>{v.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">{v.code}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>SMS templates</CardTitle><CardDescription>Placeholders in braces are filled in when a message is sent.</CardDescription></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {c.smsTemplates.map((t) => (
              <div key={t.category} className="rounded-md border p-4">
                <div className="mb-1 text-sm font-medium">{t.category}</div>
                <p className="text-sm text-muted-foreground">{t.text}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
