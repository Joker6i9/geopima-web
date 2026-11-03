import { CheckCircle2, CircleAlert } from "lucide-react";
import { FormDialog } from "@/components/shared/form-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { registerMpesaUrlsAction } from "@/lib/actions/admin";
import { fmtDateTime } from "@/lib/format";
import type { MpesaIntegration } from "@/lib/repo/admin";

const Check = ({ ok, children }: { ok: boolean; children: React.ReactNode }) => (
  <li className="flex items-start gap-2 text-sm">
    {ok
      ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--status-good)]" aria-label="Done" />
      : <CircleAlert className="mt-0.5 size-4 shrink-0 text-[var(--status-warn)]" aria-label="Needs attention" />}
    <span>{children}</span>
  </li>
);

const code = (names: string[]) => names.map((n, i) => <span key={n}>{i > 0 && ", "}<code className="rounded bg-muted px-1 text-xs">{n}</code></span>);

/** Is real M-Pesa connected? Shows what is still missing, and registers the paybill's addresses with Safaricom. */
export function MpesaSetup({ m }: { m: MpesaIntegration }) {
  const urlsReady = m.missing_for_urls.length === 0;
  const promptsReady = m.missing_for_prompts.length === 0;
  return (
    <Card>
      <CardHeader>
        <CardTitle>M-Pesa connection</CardTitle>
        <CardDescription>How payments reach the system. {m.environment === "production" ? "Live with Safaricom." : "Using Safaricom's test (sandbox) environment: no real money moves."}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          <Check ok={urlsReady}>
            {urlsReady ? <>Paybill <strong>{m.paybill}</strong> and Daraja credentials are set.</> : <>Still to set on the server: {code(m.missing_for_urls)}.</>}
          </Check>
          <Check ok={m.https}>
            {m.https ? "The system's public address is https." : <>Safaricom only calls back to an <strong>https</strong> address. Set <code className="rounded bg-muted px-1 text-xs">MPESA_PUBLIC_URL</code> to the server&apos;s public https address.</>}
          </Check>
          <Check ok={promptsReady}>
            {promptsReady ? "Tenants can pay with an M-Pesa prompt on their phone." : <>Pay-from-phone prompts also need {code(m.missing_for_prompts.filter((n) => !m.missing_for_urls.includes(n)))}.</>}
          </Check>
          <Check ok={!!m.last_payment_at}>
            {m.last_payment_at ? <>Last M-Pesa payment received {fmtDateTime(m.last_payment_at.slice(0, 19))}.</> : "No M-Pesa payment has been received yet."}
          </Check>
        </ul>

        {m.callback_urls.confirmation && (
          <div className="space-y-1 rounded-md border p-3 text-xs text-muted-foreground">
            <div>Confirmation address: <span className="break-all font-mono">{m.callback_urls.confirmation}</span></div>
            <div>Validation address: <span className="break-all font-mono">{m.callback_urls.validation}</span></div>
            <div>The secret part of each address is hidden here.</div>
          </div>
        )}

        {urlsReady && m.https ? (
          <FormDialog
            trigger="Connect paybill to this system"
            triggerVariant="default"
            title="Register with Safaricom?"
            description="This tells Safaricom to send every payment to this paybill to the system. Do it once, and again only if the server's address changes. It is safe to repeat."
            action={registerMpesaUrlsAction}
            submitLabel="Register"
          >
            {null}
          </FormDialog>
        ) : (
          <p className="text-sm text-muted-foreground">Finish the items above, then the Connect button appears here.</p>
        )}
      </CardContent>
    </Card>
  );
}
