export type Role = "admin" | "tenant" | "landlord";

export interface Agency {
  name: string;
  slogan: string;
  phone: string;
  email: string;
  address: string;
  paybill: string;
}

export interface Landlord {
  id: number;
  code: string;
  name: string;
  phone: string;
  email: string;
  bank: string;
  accountNumber: string;
  isActive: boolean;
  /** Already has a portal login. */
  hasLogin: boolean;
}

export type PropertyStatus = "active" | "inactive" | "under_maintenance";

export interface Property {
  id: number;
  code: string;
  name: string;
  landlordId: number;
  location: string;
  cluster: string;
  commissionPct: number;
  /** Charges a new unit in this property starts with. */
  defaults: { deposit: number; water: number; garbage: number };
  status: PropertyStatus;
}

export type UnitStatus = "occupied" | "vacant" | "maintenance";

export interface Unit {
  id: number;
  propertyId: number;
  name: string;
  type: string;
  rent: number;
  water: number;
  garbage: number;
  deposit: number;
  status: UnitStatus;
}

export type TenantStatus = "active" | "vacated" | "suspended";

export interface Tenant {
  id: number;
  code: string;
  name: string;
  phone: string;
  email: string;
  idNumber: string;
  /** Next of kin or a second number. */
  secondaryContact: string;
  /** Already has a portal login. */
  hasLogin: boolean;
  unitId: number | null;
  dueDay: number;
  entryDate: string;
  status: TenantStatus;
}

export interface Lease {
  id: number;
  tenantId: number;
  unitId: number;
  startDate: string;
  endDate: string | null;
  rent: number;
  deposit: number;
  isActive: boolean;
}

export type InvoiceStatus = "unpaid" | "partially_paid" | "paid" | "overdue";

export interface InvoiceItem {
  description: string;
  amount: number;
}

export interface Invoice {
  id: string;
  number: string;
  tenantId: number;
  unitId: number;
  /** YYYY-MM */
  period: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  total: number;
  paid: number;
  balance: number;
  status: InvoiceStatus;
}

export type PaymentChannel = "mpesa" | "cash" | "bank" | "cheque";

export interface MpesaTx {
  id: number;
  transId: string;
  amount: number;
  msisdn: string;
  billRef: string;
  /** ISO date-time */
  time: string;
  status: "settled" | "unmatched";
  /** How it was paid; staff record the non-M-Pesa ones by hand. */
  channel: PaymentChannel;
  /** Bank the money went into (manual payments). */
  paidTo: string;
  note: string;
  tenantId: number | null;
  invoiceId: string | null;
  /** How a reconciled payment was split across invoices (oldest first). */
  allocations?: { invoiceId: string; amount: number }[];
  /** Part of the payment that exceeded the tenant's open invoices. */
  unallocated?: number;
}

export type DepositStatus = "held" | "refunded";

export interface Deposit {
  id: string;
  code: string;
  tenantId: number;
  unitId: number | null;
  amount: number;
  status: DepositStatus;
}

export interface VoteHead {
  id: string;
  code: string;
  name: string;
  priority: number;
  active: boolean;
}

export interface StaffUser {
  id: number;
  name: string;
  username: string;
  role: string;
  phone: string;
  active: boolean;
}

export interface RoleDef {
  name: string;
  permissions: number;
  users: number;
}

export interface Bank {
  id: number;
  shortName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
  onInvoice: boolean;
}

export interface SmsTemplate {
  category: string;
  text: string;
  /** Receipt template only: send it automatically when a payment is recorded. */
  enabled: boolean;
}
