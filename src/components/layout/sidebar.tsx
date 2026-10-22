"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building } from "lucide-react";
import { cn } from "@/lib/utils";
import { nav } from "./nav";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1 p-3">
      {nav.map(({ label, href, icon: Icon, soon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              active && "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
              soon && "opacity-60",
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="flex-1">{label}</span>
            {soon && <span className="text-[10px] uppercase tracking-wide">soon</span>}
          </Link>
        );
      })}
    </nav>
  );
}

export function Brand() {
  return (
    <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-5">
      <Building className="size-5 text-sidebar-primary" />
      <span className="text-lg font-semibold tracking-tight">GeoPima</span>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 bg-sidebar text-sidebar-foreground md:block">
      <Brand />
      <SidebarNav />
    </aside>
  );
}
