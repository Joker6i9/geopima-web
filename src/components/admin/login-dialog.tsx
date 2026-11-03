"use client";

import { useState, useTransition } from "react";
import { Copy, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { issueLoginAction, type LoginResult } from "@/lib/actions/admin";

/** Gives a tenant or landlord a portal login. The password is shown once, here, and cannot be looked up again. */
export function LoginDialog({ kind, id, name, hasLogin }: { kind: "tenant" | "landlord"; id: number; name: string; hasLogin: boolean }) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<LoginResult | null>(null);
  const [pending, start] = useTransition();
  const portal = kind === "tenant" ? "tenant" : "landlord";

  const run = () => start(async () => setResult(await issueLoginAction(kind, id)));
  const copy = (r: Extract<LoginResult, { ok: true }>) => {
    navigator.clipboard.writeText(`GeoPima login\nUsername: ${r.username}\nPassword: ${r.password}`).then(
      () => toast.success("Copied."), () => toast.error("Could not copy. Select the text instead."),
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setResult(null); }}>
      <DialogTrigger render={<Button variant="outline" />}><KeyRound /> {hasLogin ? "Reset login" : "Create login"}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{hasLogin ? `Reset ${name}'s password` : `Create a login for ${name}`}</DialogTitle>
          <DialogDescription>
            {result?.ok
              ? "Give these details to them now. The password is not stored in readable form, so it cannot be shown again."
              : `They will sign in to the ${portal} portal with a username and password.${hasLogin ? " Their old password stops working." : ""}`}
          </DialogDescription>
        </DialogHeader>
        {result?.ok && (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-md border bg-muted/40 p-4 text-sm">
            <dt className="text-muted-foreground">Username</dt><dd className="font-mono font-medium select-all">{result.username}</dd>
            <dt className="text-muted-foreground">Password</dt><dd className="font-mono font-medium select-all">{result.password}</dd>
          </dl>
        )}
        {result && !result.ok && <p role="alert" className="text-sm text-destructive">{result.message}</p>}
        <DialogFooter>
          {result?.ok ? (
            <>
              <Button variant="outline" onClick={() => copy(result)}><Copy /> Copy</Button>
              <Button onClick={() => setOpen(false)}>Done</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={run} disabled={pending}>{pending ? "Working…" : hasLogin ? "Reset password" : "Create login"}</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
