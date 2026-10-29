"use client";

import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { Role } from "@/lib/types";
import { AdminSearch } from "./search";
import { Brand, SidebarNav } from "./sidebar";

export function Header({ portal }: { portal: Role }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="flex h-16 items-center gap-3 border-b bg-background px-4">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={<Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu" />}
        >
          <Menu />
        </SheetTrigger>
        <SheetContent side="left" className="w-64 bg-sidebar p-0 text-sidebar-foreground">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Brand portal={portal} />
          <Suspense fallback={null}>
            <SidebarNav portal={portal} onNavigate={() => setOpen(false)} />
          </Suspense>
        </SheetContent>
      </Sheet>
      <div className="flex-1">{portal === "admin" && <AdminSearch />}</div>
      <Button variant="ghost" size="sm" onClick={logout}>
        <LogOut /> Sign out
      </Button>
    </header>
  );
}
