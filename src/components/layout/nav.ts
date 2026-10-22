import {
  Building2, CreditCard, FileText, Home, Landmark, LayoutDashboard,
  Settings, Smartphone, Users, Wallet, type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Pages not yet migrated from the legacy frontend. */
  soon?: boolean;
}

export const nav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Landlords", href: "/landlords", icon: Landmark, soon: true },
  { label: "Properties", href: "/properties", icon: Building2, soon: true },
  { label: "Units", href: "/units", icon: Home, soon: true },
  { label: "Tenants", href: "/tenants", icon: Users },
  { label: "Invoices", href: "/invoices", icon: FileText, soon: true },
  { label: "M-Pesa", href: "/mpesa", icon: Smartphone, soon: true },
  { label: "Deposits", href: "/deposits", icon: Wallet, soon: true },
  { label: "Finance", href: "/finance", icon: CreditCard, soon: true },
  { label: "Configuration", href: "/configuration", icon: Settings, soon: true },
];
