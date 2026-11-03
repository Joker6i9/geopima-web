"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { sendMessageAction } from "@/lib/actions/admin";
import { kes } from "@/lib/format";
import { cn } from "@/lib/utils";

interface TenantInfo { id: number; name: string; phone: string; status: string; property: string | null; unit: string | null; balance: number }
interface LandlordInfo { id: number; name: string; phone: string; isActive: boolean }

type Audience = "owing" | "all" | "property" | "landlords";

const audiences: { value: Audience; label: string }[] = [
  { value: "owing", label: "Tenants who owe rent" },
  { value: "all", label: "All current tenants" },
  { value: "property", label: "Tenants in one property" },
  { value: "landlords", label: "Landlords" },
];

const tenantFields = [
  { key: "first_name", label: "First name" },
  { key: "unit", label: "Unit" },
  { key: "property", label: "Property" },
  { key: "balance", label: "Balance owed" },
  { key: "paybill", label: "Paybill" },
  { key: "agency", label: "Agency name" },
];
const landlordFields = [{ key: "first_name", label: "First name" }, { key: "agency", label: "Agency name" }];

const starters = [
  { label: "Rent reminder", text: "Dear {first_name}, your rent balance for {unit} is {balance}. Please pay to Paybill {paybill}, account {unit}. Thank you, {agency}." },
  { label: "General notice", text: "Dear {first_name}, " },
];

/** Characters left in the current SMS part (160 for one part, 153 each when a message runs to several). */
function smsParts(len: number) {
  return len <= 160 ? 1 : Math.ceil(len / 153);
}

export function MessageComposer({
  tenants, landlords, properties, templates, paybill, agency,
}: {
  tenants: TenantInfo[];
  landlords: LandlordInfo[];
  properties: string[];
  templates: { category: string; text: string }[];
  paybill: string;
  agency: string;
}) {
  const [audience, setAudience] = useState<Audience>("owing");
  const [property, setProperty] = useState("");
  const [message, setMessage] = useState(starters[0].text);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [, submit] = useActionState(async (_: unknown, fd: FormData) => {
    const result = await sendMessageAction(null, fd);
    if (result?.ok) {
      toast.success(result.message);
      setConfirming(false);
      setError("");
    } else setError(result?.message ?? "");
    return result;
  }, null);

  const toLandlords = audience === "landlords";
  const recipients = useMemo(() => {
    if (toLandlords) return landlords.filter((l) => l.isActive);
    const current = tenants.filter((t) => t.status !== "vacated");
    if (audience === "all") return current;
    if (audience === "property") return current.filter((t) => t.property === property);
    return tenants.filter((t) => t.balance > 0);
  }, [audience, property, tenants, landlords, toLandlords]);
  const reachable = recipients.filter((r) => r.phone);
  const missing = recipients.length - reachable.length;

  const fields = toLandlords ? landlordFields : tenantFields;
  const allowed = new Set(fields.map((f) => f.key).concat("name"));
  const unknown = [...new Set([...message.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))].filter((k) => !allowed.has(k));

  const first = reachable[0];
  const preview = first ? fill(message, first) : message;

  function fill(text: string, r: TenantInfo | LandlordInfo) {
    const t = "balance" in r ? r : null;
    const values: Record<string, string> = {
      name: r.name, first_name: r.name.split(" ")[0], agency, paybill, unit: t?.unit ?? "", property: t?.property ?? "",
      balance: kes(Math.max(t?.balance ?? 0, 0)), tenant_id: "", rent: "",
    };
    return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in values ? values[k] : m));
  }

  const ready = reachable.length > 0 && message.trim() && unknown.length === 0 && (audience !== "property" || property);

  function send() {
    const fd = new FormData();
    fd.set("message", message);
    fd.set(toLandlords ? "landlords" : "tenants", reachable.map((r) => r.id).join(","));
    startTransition(() => submit(fd));
  }

  const addText = (t: string) => setMessage((m) => m + t);

  return (
    <Card>
      <CardHeader>
        <CardTitle>New message</CardTitle>
        <CardDescription>Pick who gets it, write the message, check the preview, and send.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          <section className="space-y-2">
            <h3 className="text-sm font-medium">1. Who should get it?</h3>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Recipients">
              {audiences.map((a) => (
                <Button
                  key={a.value}
                  type="button"
                  size="sm"
                  role="radio"
                  aria-checked={audience === a.value}
                  variant={audience === a.value ? "default" : "outline"}
                  onClick={() => { setAudience(a.value); setConfirming(false); }}
                >
                  {a.label}
                </Button>
              ))}
            </div>
            {audience === "property" && (
              <select
                aria-label="Property"
                value={property}
                onChange={(e) => setProperty(e.target.value)}
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
              >
                <option value="">Choose a property…</option>
                {properties.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            )}
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">{reachable.length}</strong> {reachable.length === 1 ? "person" : "people"} will get this
              {missing > 0 && <> · {missing} skipped (no phone number)</>}
            </p>
            {reachable.length > 0 && (
              <details className="text-sm text-muted-foreground">
                <summary className="cursor-pointer">See the list</summary>
                <ul className="mt-1 max-h-40 overflow-y-auto">
                  {reachable.map((r) => (
                    <li key={r.id}>
                      {r.name}
                      {"balance" in r && r.balance > 0 && <span className="text-xs"> · owes {kes(r.balance)}</span>}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-medium">2. Write the message</h3>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">Start from:</span>
              {starters.filter((s) => !toLandlords || !s.text.includes("{balance}")).map((s) => (
                <Button key={s.label} type="button" size="xs" variant="outline" onClick={() => setMessage(s.text)}>{s.label}</Button>
              ))}
              {templates.map((t) => (
                <Button key={t.category} type="button" size="xs" variant="outline" onClick={() => setMessage(t.text)}>{t.category}</Button>
              ))}
            </div>
            <textarea
              aria-label="Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              maxLength={640}
              className="w-full rounded-lg border border-input bg-background px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-muted-foreground">Insert:</span>
              {fields.map((f) => (
                <Button key={f.key} type="button" size="xs" variant="ghost" className="h-6 px-2" onClick={() => addText(`{${f.key}}`)}>{f.label}</Button>
              ))}
            </div>
            {unknown.length > 0 && (
              <p role="alert" className="text-sm text-destructive">
                {unknown.map((u) => `{${u}}`).join(", ")} can&apos;t be filled in{toLandlords ? " for landlords" : ""}. Use the Insert buttons.
              </p>
            )}
          </section>
        </div>

        <div className="space-y-4">
          <section className="space-y-2">
            <h3 className="text-sm font-medium">3. Preview{first ? ` (as ${first.name} would see it)` : ""}</h3>
            <div className="min-h-24 whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-muted px-4 py-3 text-sm">{message.trim() ? preview : "Your message appears here."}</div>
            <p className={cn("text-xs", preview.length > 160 ? "text-[var(--status-warn)]" : "text-muted-foreground")}>
              {preview.length} characters · {smsParts(preview.length)} SMS per person
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-medium">4. Send</h3>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            {!confirming ? (
              <Button type="button" disabled={!ready} onClick={() => setConfirming(true)}>
                <Send /> Send to {reachable.length} {reachable.length === 1 ? "person" : "people"}
              </Button>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm">Send now to {reachable.length} {reachable.length === 1 ? "person" : "people"}?</span>
                <Button type="button" disabled={pending} onClick={send}>{pending ? "Sending…" : "Yes, send"}</Button>
                <Button type="button" variant="outline" disabled={pending} onClick={() => setConfirming(false)}>Cancel</Button>
              </div>
            )}
          </section>
        </div>
      </CardContent>
    </Card>
  );
}
