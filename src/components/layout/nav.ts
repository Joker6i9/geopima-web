import {
  Building2, FileText, LayoutDashboard, Receipt, ScrollText, Settings, Smartphone, Users, Wallet,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/types";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Match only the exact path (for portal home pages). */
  exact?: boolean;
  /** Extra path prefixes that keep this item highlighted (pages grouped under it via section tabs). */
  also?: string[];
}

export interface SectionTab { label: string; href: string }

/** Admin pages that share one nav item are tied together by tabs at the top of each page. */
export const adminSections = {
  people: [
    { label: "Tenants", href: "/admin/tenants" },
    { label: "Landlords", href: "/admin/landlords" },
    { label: "Messages", href: "/admin/messages" },
  ],
  money: [
    { label: "Invoices", href: "/admin/invoices" },
    { label: "Payments", href: "/admin/mpesa" },
    { label: "Deposits", href: "/admin/deposits" },
    { label: "Reports", href: "/admin/finance" },
  ],
} satisfies Record<string, SectionTab[]>;

export const portalLabel: Record<Role, string> = {
  admin: "Agency console",
  tenant: "Tenant portal",
  landlord: "Landlord portal",
};

export const navs: Record<Role, NavItem[]> = {
  admin: [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Properties", href: "/admin/properties", icon: Building2 },
    { label: "People", href: "/admin/tenants", icon: Users, also: ["/admin/landlords", "/admin/messages"] },
    { label: "Money", href: "/admin/invoices", icon: Wallet, also: ["/admin/mpesa", "/admin/deposits", "/admin/finance"] },
    { label: "Settings", href: "/admin/configuration", icon: Settings },
  ],
  tenant: [
    { label: "Home", href: "/tenant", icon: LayoutDashboard, exact: true },
    { label: "Invoices", href: "/tenant/invoices", icon: FileText },
    { label: "Payments", href: "/tenant/payments", icon: Receipt },
    { label: "Pay rent", href: "/tenant/pay", icon: Smartphone },
    { label: "My lease", href: "/tenant/lease", icon: ScrollText },
  ],
  landlord: [
    { label: "Overview", href: "/landlord", icon: LayoutDashboard, exact: true },
    { label: "Properties", href: "/landlord/properties", icon: Building2 },
    { label: "Statements", href: "/landlord/statements", icon: ScrollText },
  ],
};
