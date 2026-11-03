import type { Metadata } from "next";
import { adminSections } from "@/components/layout/nav";
import { MessageComposer } from "@/components/admin/message-composer";
import { EmptyRow } from "@/components/shared/empty-row";
import { PageHeader } from "@/components/shared/page-header";
import { SectionTabs } from "@/components/shared/section-tabs";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmtDateTime, phone } from "@/lib/format";
import { getConfiguration, getLandlords, getMessages, getProperties, getTenants } from "@/lib/repo/admin";

export const metadata: Metadata = { title: "Messages" };

// Reads the signed-in user's data from Django, so navigating here may wait for it.
export const instant = false;

export default async function MessagesPage() {
  const [log, tenants, landlords, properties, config] = await Promise.all([
    getMessages(), getTenants(), getLandlords(), getProperties(), getConfiguration(),
  ]);

  return (
    <>
      <SectionTabs tabs={adminSections.people} current="/admin/messages" label="People" />
      <PageHeader title="Messages" description="Send a text message to tenants or landlords, and see what was sent." />
      {!log ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">Your role does not include sending messages.</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {!log.live && (
            <p role="status" className="rounded-lg bg-[var(--status-warn-bg)] px-4 py-3 text-sm text-[var(--status-warn)]">
              <strong>Test mode.</strong> No SMS provider is connected, so messages are recorded below but not delivered. Set <code>SMS_PROVIDER</code> and the provider keys on the server to send for real.
            </p>
          )}
          <MessageComposer
            tenants={tenants.map((t) => ({ id: t.id, name: t.name, phone: t.phone, status: t.status, property: t.propertyName, unit: t.unitName, balance: t.balance }))}
            landlords={landlords.map((l) => ({ id: l.id, name: l.name, phone: l.phone, isActive: l.isActive }))}
            properties={properties.map((p) => p.name)}
            templates={config.smsTemplates.filter((t) => t.category !== "PAYMENT_NOTIF")}
            paybill={config.agency.paybill}
            agency={config.agency.name}
          />
          <Card>
            <CardHeader><CardTitle>Recent messages</CardTitle><CardDescription>The latest 50.</CardDescription></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Sent</TableHead><TableHead>To</TableHead><TableHead>Message</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {log.messages.length === 0 && <EmptyRow cols={4}>No messages yet.</EmptyRow>}
                  {log.messages.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="whitespace-nowrap">{fmtDateTime(m.created_at)}{m.sent_by_name && <div className="text-xs text-muted-foreground">{m.sent_by_name}</div>}</TableCell>
                      <TableCell>{m.recipient_name}<div className="text-xs text-muted-foreground">{phone(m.phone)}</div></TableCell>
                      <TableCell className="max-w-md whitespace-normal text-sm">{m.body}</TableCell>
                      <TableCell>
                        <StatusBadge status={m.status} label={m.status === "test" ? "Test only" : undefined} />
                        {m.error && <div className="text-xs text-destructive">{m.error}</div>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
