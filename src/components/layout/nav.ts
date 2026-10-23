import {
  Building2, CreditCard, FileText, Home, Landmark, LayoutDashboard, Receipt,
  ScrollText, Settings, Smartphone, Users, Wallet, type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/types";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Match only the exact path (for portal home pages). */
  exact?: boolean;
}

export const portalLabel: Record<Role, string> = {
  admin: "Agency console",
  tenant: "Tenant portal",
  landlord: "Landlord portal",
};

export const navs: Record<Role, NavItem[]> = {
  admin: [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Landlords", href: "/admin/landlords", icon: Landmark },
    { label: "Properties", href: "/admin/properties", icon: Building2 },
    { label: "Units", href: "/admin/units", icon: Home },
    { label: "Tenants", href: "/admin/tenants", icon: Users },
    { label: "Invoices", href: "/admin/invoices", icon: FileText },
    { label: "M-Pesa", href: "/admin/mpesa", icon: Smartphone },
    { label: "Deposits", href: "/admin/deposits", icon: Wallet },
    { label: "Finance", href: "/admin/finance", icon: CreditCard },
    { label: "Configuration", href: "/admin/configuration", icon: Settings },
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
