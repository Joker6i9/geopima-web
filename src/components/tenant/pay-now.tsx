"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, Smartphone, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checkPaymentAction, startPaymentAction, type StkStatus } from "@/lib/actions/tenant";
import { kes } from "@/lib/format";

type Phase = { name: "idle" } | { name: "starting" } | { name: "waiting"; id: number } | { name: "done"; status: Exclude<StkStatus, "pending">; message: string };

const POLL_MS = 3000;
const GIVE_UP_MS = 150_000;

const outcome: Record<string, string> = {
  success: "Payment received. Your invoice is updated.",
  cancelled: "You cancelled the request on your phone. Nothing was charged.",
  timeout: "The request timed out before a PIN was entered. Nothing was charged.",
  failed: "The payment did not go through. Nothing was charged.",
};

/** One-tap rent payment: Safaricom puts a PIN prompt on the phone, and this page follows it to the end. */
export function PayNow({ phone, balance }: { phone: string; balance: number }) {
  const [amount, setAmount] = useState(balance > 0 ? String(balance) : "");
  const [number, setNumber] = useState(phone);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<Phase>({ name: "idle" });
  const startedAt = useRef(0);

  // Follow a waiting request until Safaricom has answered.
  const waitingId = phase.name === "waiting" ? phase.id : null;
  useEffect(() => {
    if (waitingId === null) return;
    const timer = setInterval(async () => {
      const r = await checkPaymentAction(waitingId);
      if (r.status !== "pending") setPhase({ name: "done", status: r.status, message: r.message });
      else if (Date.now() - startedAt.current > GIVE_UP_MS) setPhase({ name: "done", status: "timeout", message: "" });
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [waitingId]);

  async function start(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPhase({ name: "starting" });
    const r = await startPaymentAction({ amount, phone: number });
    if (!r.ok) {
      setError(r.message);
      setPhase({ name: "idle" });
      return;
    }
    startedAt.current = Date.now();
    setPhase({ name: "waiting", id: r.id });
  }

  if (phase.name === "waiting" || phase.name === "done") {
    const done = phase.name === "done";
    const ok = done && phase.status === "success";
    return (
      <div role="status" aria-live="polite" className="space-y-4 text-center">
        {!done && <Loader2 className="mx-auto size-10 animate-spin text-muted-foreground" aria-hidden />}
        {ok && <CheckCircle2 className="mx-auto size-10 text-[var(--status-good)]" aria-hidden />}
        {done && !ok && <XCircle className="mx-auto size-10 text-[var(--status-bad)]" aria-hidden />}
        <p className="text-lg font-medium">
          {done ? outcome[phase.status] : `Check your phone (${number}) and enter your M-Pesa PIN.`}
        </p>
        {!done && <p className="text-sm text-muted-foreground">We are waiting for M-Pesa to confirm {kes(Number(amount))}. This page updates by itself.</p>}
        {done && !ok && phase.message && <p className="text-sm text-muted-foreground">{phase.message}</p>}
        {done && <Button type="button" variant={ok ? "outline" : "default"} onClick={() => setPhase({ name: "idle" })}>{ok ? "Make another payment" : "Try again"}</Button>}
      </div>
    );
  }

  return (
    <form onSubmit={start} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="pay-amount">Amount (KES)</Label>
        <Input id="pay-amount" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} required placeholder="e.g. 15000" />
        {balance > 0 && <p className="text-xs text-muted-foreground">{kes(balance)} clears your balance.</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pay-phone">M-Pesa phone number</Label>
        <Input id="pay-phone" type="tel" value={number} onChange={(e) => setNumber(e.target.value)} required />
        <p className="text-xs text-muted-foreground">The prompt appears on this phone. It can be any Safaricom number.</p>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={phase.name === "starting"}>
        <Smartphone /> {phase.name === "starting" ? "Sending request…" : "Pay with M-Pesa"}
      </Button>
    </form>
  );
}
