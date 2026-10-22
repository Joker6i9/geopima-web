import type { OccupancyMetrics, PaymentSummary, Tenant } from "./types";

export const mockOccupancy: OccupancyMetrics = {
  properties: ["Block A", "Block B", "Block C", "Block D"],
  total_units: [40, 25, 30, 15],
  occupied_units: [35, 20, 28, 10],
};

export const mockPayments: PaymentSummary[] = [
  { name: "Rent", collected: 450000, total: 500000, pct: 90 },
  { name: "Water", collected: 18000, total: 20000, pct: 90 },
  { name: "Garbage", collected: 5000, total: 10000, pct: 50 },
];

const names = [
  "Grace Wanjiku", "Brian Otieno", "Amina Hassan", "Peter Kamau",
  "Mercy Achieng", "Daniel Mutua", "Faith Njeri", "Samuel Kiprop",
  "Lucy Wairimu", "John Odhiambo", "Esther Chebet", "Kevin Maina",
];
const properties = ["Block A", "Block B", "Block C", "Block D"];
const statuses = ["active", "active", "active", "suspended", "vacated"] as const;

export const mockTenants: Tenant[] = names.map((name, i) => ({
  id: i + 1,
  tenant_id: `PROP-${(10000 + i * 137).toString(16).toUpperCase()}`,
  name,
  email: `${name.split(" ")[0].toLowerCase()}@example.com`,
  phone_number: `2547${(12000000 + i * 1234567).toString().slice(0, 8)}`,
  property_name: properties[i % properties.length],
  unit_name: `${properties[i % properties.length].slice(-1)}${(i % 9) + 1}`,
  landlord_name: "Mwangi Holdings",
  entry_date: `2025-${String((i % 12) + 1).padStart(2, "0")}-01`,
  due_date: 5,
  status: statuses[i % statuses.length],
}));
