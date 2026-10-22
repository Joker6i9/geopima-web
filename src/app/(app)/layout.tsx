import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { isDemo } from "@/lib/api";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header demo={isDemo} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
