import { isDemo } from "@/lib/env";
import type { Role } from "@/lib/types";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

export function PortalShell({ portal, children }: { portal: Role; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar portal={portal} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header portal={portal} demo={isDemo} />
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
