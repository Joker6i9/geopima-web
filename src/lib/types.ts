export type TenantStatus = "active" | "vacated" | "suspended";

export interface Tenant {
  id: number;
  tenant_id: string;
  name: string;
  email: string | null;
  phone_number: string;
  property_name: string | null;
  unit_name: string | null;
  landlord_name: string | null;
  entry_date: string;
  due_date: number;
  status: TenantStatus;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface OccupancyMetrics {
  properties: string[];
  total_units: number[];
  occupied_units: number[];
}

export interface PaymentSummary {
  name: string;
  collected: number;
  total: number;
  pct: number;
}
