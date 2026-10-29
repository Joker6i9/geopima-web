"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Hit { kind: string; title: string; subtitle: string; href: string }

/** ⌘K / Ctrl+K (or "/") search across tenants, units, properties, landlords, invoices and payments. */
export function AdminSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<{ q: string; hits: Hit[] }>({ q: "", hits: [] });
  const [active, setActive] = useState(0);

  const q = query.trim();
  const enough = q.length >= 2;
  const hits = enough ? result.hits : [];
  const loading = enough && result.q !== q;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName));
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!enough) return;
    let stale = false;
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`).catch(() => null);
      const data = res?.ok ? ((await res.json()) as { hits: Hit[] }) : { hits: [] };
      if (!stale) { setResult({ q, hits: data.hits }); setActive(0); }
    }, 150);
    return () => { stale = true; clearTimeout(timer); };
  }, [q, enough]);

  function go(hit: Hit) {
    setOpen(false);
    router.push(hit.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, hits.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    if (e.key === "Enter" && hits[active]) { e.preventDefault(); go(hits[active]); }
  }

  return (
    <>
      <Button variant="outline" size="sm" className="w-48 justify-start text-muted-foreground sm:w-64" onClick={() => setOpen(true)}>
        <Search /> <span className="flex-1 text-left">Search…</span>
        <kbd className="hidden rounded border px-1.5 font-mono text-[10px] sm:inline">⌘K</kbd>
      </Button>
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQuery(""); }}>
        <DialogContent className="top-[20%] translate-y-0 gap-0 p-0 sm:max-w-lg" showCloseButton={false}>
          <DialogTitle className="sr-only">Search</DialogTitle>
          <DialogDescription className="sr-only">Find tenants, units, properties, landlords, invoices and payments.</DialogDescription>
          <div className="flex items-center gap-2 border-b px-3">
            <Search className="size-4 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search tenants, units, invoices, M-Pesa codes…"
              aria-label="Search"
              className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <ul role="listbox" className="max-h-80 overflow-y-auto p-1.5">
            {!enough && <li className="px-3 py-6 text-center text-sm text-muted-foreground">Type at least 2 characters.</li>}
            {enough && !loading && hits.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted-foreground">Nothing found for “{query}”.</li>}
            {hits.map((h, i) => (
              <li key={`${h.kind}-${h.href}`} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  onClick={() => go(h)}
                  onMouseMove={() => setActive(i)}
                  className={cn("flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm", i === active && "bg-muted")}
                >
                  <span className="w-16 shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{h.kind}</span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{h.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{h.subtitle}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}
