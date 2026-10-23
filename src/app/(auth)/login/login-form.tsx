"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Building2, Loader2, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { homeFor } from "@/lib/roles";
import type { Role } from "@/lib/types";

const demoLogins: { username: string; label: string; hint: string; icon: typeof User }[] = [
  { username: "admin", label: "Agency staff", hint: "Run the whole portfolio", icon: Building2 },
  { username: "tenant", label: "Tenant", hint: "Balance, invoices, how to pay", icon: User },
  { username: "landlord", label: "Landlord", hint: "Properties and statements", icon: Users },
];

export function LoginForm({ demo }: { demo: boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function signIn(username: string, password: string) {
    setError("");
    setPending(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.detail ?? "Sign in failed.");
        return;
      }
      router.replace(homeFor(data.role as Role));
      router.refresh();
    } catch {
      setError("Could not connect. If the server was asleep, wait 30 seconds and retry.");
    } finally {
      setPending(false);
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    void signIn(String(form.get("username")), String(form.get("password")));
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input id="username" name="username" autoComplete="username" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" autoComplete="current-password" required />
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      {demo && (
        <div className="space-y-2 border-t pt-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Try the demo as</p>
          <div className="grid gap-2">
            {demoLogins.map(({ username, label, hint, icon: Icon }) => (
              <button
                key={username}
                type="button"
                disabled={pending}
                onClick={() => signIn(username, "demo")}
                className="flex items-center gap-3 rounded-md border bg-background px-3 py-2 text-left text-sm transition-colors hover:border-primary hover:bg-muted disabled:opacity-50"
              >
                <Icon className="size-5 shrink-0 text-primary" />
                <span>
                  <span className="block font-medium">{label}</span>
                  <span className="block text-xs text-muted-foreground">{hint}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
