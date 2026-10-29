"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Building } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";
import { navs, portalLabel } from "./nav";

export function SidebarNav({ portal, onNavigate }: { portal: Role; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1 p-3" aria-label="Main">
      {navs[portal].map(({ label, href, icon: Icon, exact, also = [] }) => {
        const active = exact
          ? pathname === href
          : [href, ...also].some((h) => pathname === h || pathname.startsWith(`${h}/`));
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              active && "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Brand({ portal }: { portal: Role }) {
  return (
    <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
      <Building className="size-6 text-sidebar-primary" />
      <div className="leading-tight">
        <div className="text-lg font-semibold tracking-tight">GeoPima</div>
        <div className="text-[11px] uppercase tracking-wider text-sidebar-foreground/60">{portalLabel[portal]}</div>
      </div>
    </div>
  );
}

export function Sidebar({ portal }: { portal: Role }) {
  return (
    <aside className="hidden w-60 shrink-0 bg-sidebar text-sidebar-foreground md:block">
      <div className="sticky top-0">
        <Brand portal={portal} />
        <Suspense fallback={<div className="p-3" aria-hidden />}>
          <SidebarNav portal={portal} />
        </Suspense>
      </div>
    </aside>
  );
}
