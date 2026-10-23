import type {
  Agency, Bank, Deposit, Invoice, Landlord, Lease, MpesaTx, Property, RoleDef,
  SmsTemplate, StaffUser, Tenant, Unit, VoteHead,
} from "../types";

/** Fixed reference date so demo data is stable across renders. */
export const TODAY = "2026-10-23";
export const PERIODS = ["2026-08", "2026-09", "2026-10"] as const;

export const agency: Agency = {
  name: "Pemwa Agency",
  slogan: "Your Comfort Our Concern",
  phone: "0725 768 616",
  email: "info@pemwa.example",
  address: "GPO 1254-00200, Nairobi",
  paybill: "522522",
};

export const landlords: Landlord[] = [
  { id: 1, code: "LL-001", name: "Mwangi Holdings", phone: "254722100100", email: "accounts@mwangi.example", bank: "KCB", accountNumber: "1102938475", isActive: true },
  { id: 2, code: "LL-002", name: "Njoroge & Sons", phone: "254733200200", email: "njoroge@sons.example", bank: "Equity", accountNumber: "0450198273", isActive: true },
  { id: 3, code: "LL-003", name: "Hadija Ali", phone: "254711300300", email: "hadija.ali@example.com", bank: "Co-op", accountNumber: "01129384756", isActive: true },
  { id: 4, code: "LL-004", name: "Otieno Family Trust", phone: "254700400400", email: "trust@otieno.example", bank: "NCBA", accountNumber: "7788990011", isActive: true },
  { id: 5, code: "LL-005", name: "Kiplagat Investments", phone: "254745500500", email: "info@kiplagat.example", bank: "Stanbic", accountNumber: "0100234567", isActive: false },
];

export const properties: Property[] = [
  { id: 1, code: "PR-001", name: "Riverside Apartments", landlordId: 1, location: "Kilimani, Nairobi", cluster: "Cluster A", commissionPct: 10, status: "active" },
  { id: 2, code: "PR-002", name: "Greenview Court", landlordId: 1, location: "Kasarani, Nairobi", cluster: "Cluster B", commissionPct: 8, status: "active" },
  { id: 3, code: "PR-003", name: "Sunrise Heights", landlordId: 2, location: "Ruaka, Kiambu", cluster: "Cluster A", commissionPct: 10, status: "active" },
  { id: 4, code: "PR-004", name: "Maple Gardens", landlordId: 3, location: "Syokimau, Machakos", cluster: "Cluster C", commissionPct: 10, status: "under_maintenance" },
  { id: 5, code: "PR-005", name: "Lakeside Villas", landlordId: 4, location: "Lavington, Nairobi", cluster: "Cluster A", commissionPct: 12, status: "active" },
  { id: 6, code: "PR-006", name: "Pioneer Plaza", landlordId: 5, location: "CBD, Nairobi", cluster: "Cluster B", commissionPct: 10, status: "inactive" },
];

const unitsPerProperty = [10, 8, 10, 8, 6, 6];
const baseRent = [32000, 18000, 25000, 15000, 60000, 45000];
const baseWater = [800, 500, 700, 500, 1200, 1000];
const baseGarbage = [300, 200, 300, 200, 500, 500];
const prefix = ["R", "G", "S", "M", "L", "P"];
const unitTypes = ["1 Bedroom", "2 Bedroom", "Bedsitter", "3 Bedroom"];

export const units: Unit[] = [];
properties.forEach((p, pi) => {
  for (let i = 0; i < unitsPerProperty[pi]; i++) {
    const rent = baseRent[pi] + (i % 3) * 2500;
    const vacant = i % 5 === 4;
    const maintenance = pi === 3 && i === unitsPerProperty[pi] - 1;
    units.push({
      id: units.length + 1,
      propertyId: p.id,
      name: `${prefix[pi]}${i + 1}`,
      type: pi === 5 ? "Office" : unitTypes[i % unitTypes.length],
      rent,
      water: baseWater[pi],
      garbage: baseGarbage[pi],
      deposit: rent,
      status: maintenance ? "maintenance" : vacant ? "vacant" : "occupied",
    });
  }
});

const names = [
  "Grace Wanjiku", "Brian Otieno", "Amina Hassan", "Peter Kamau", "Mercy Achieng", "Daniel Mutua",
  "Faith Njeri", "Samuel Kiprop", "Lucy Wairimu", "John Odhiambo", "Esther Chebet", "Kevin Maina",
  "Ruth Nyambura", "Hassan Abdi", "Joyce Akinyi", "Martin Gitau", "Naomi Wekesa", "Victor Ouma",
  "Caroline Muthoni", "Isaac Langat", "Sharon Atieno", "Dennis Kariuki", "Zawadi Mwende", "Patrick Njuguna",
  "Beatrice Cherono", "Collins Owino", "Margaret Wangari", "Felix Barasa", "Irene Jepkemboi", "Stephen Mbugua",
  "Janet Moraa", "Eric Simiyu", "Diana Nafula", "Moses Kimani", "Tabitha Waithera", "Allan Rotich",
  "Veronica Auma", "George Muriuki", "Lilian Anyango", "Bernard Kiptoo",
];

const phone = (n: number) => `2547${String(10000000 + ((n * 7919123) % 89999999)).slice(0, 8)}`;

export const tenants: Tenant[] = [];
export const leases: Lease[] = [];
units
  .filter((u) => u.status === "occupied")
  .forEach((u, i) => {
    const name = names[i % names.length];
    const id = tenants.length + 1;
    tenants.push({
      id,
      code: `TN-${String(id).padStart(4, "0")}`,
      name,
      phone: phone(id),
      email: `${name.split(" ")[0].toLowerCase()}.${name.split(" ")[1].toLowerCase()}@example.com`,
      unitId: u.id,
      dueDay: 5,
      entryDate: `2025-${String((i % 12) + 1).padStart(2, "0")}-01`,
      status: id % 17 === 0 ? "suspended" : "active",
    });
    leases.push({
      id,
      tenantId: id,
      unitId: u.id,
      startDate: `2025-${String((i % 12) + 1).padStart(2, "0")}-01`,
      endDate: `2026-${String((i % 12) + 1).padStart(2, "0")}-28`,
      rent: u.rent,
      deposit: u.deposit,
      isActive: true,
    });
  });
// Past tenants who have moved out
["Rose Chelangat", "Tom Wafula", "Agnes Mumbi"].forEach((name, i) => {
  const id = tenants.length + 1;
  tenants.push({
    id, code: `TN-${String(id).padStart(4, "0")}`, name, phone: phone(id),
    email: `${name.split(" ")[0].toLowerCase()}@example.com`, unitId: null, dueDay: 5,
    entryDate: `2024-0${i + 3}-01`, status: "vacated",
  });
});

const paidShare = (j: number, period: string): number => {
  if (period === "2026-08") return j % 7 === 0 ? 0.5 : 1;
  if (period === "2026-09") return j % 7 === 0 ? 0 : j % 11 === 0 ? 0.7 : 1;
  return j % 3 !== 0 ? 1 : j % 5 === 1 ? 0.4 : j % 2 === 0 ? 0.6 : 0;
};

export const invoices: Invoice[] = [];
export const mpesa: MpesaTx[] = [];

tenants
  .filter((t) => t.unitId !== null)
  .forEach((t, j) => {
    const u = units.find((x) => x.id === t.unitId)!;
    PERIODS.forEach((period) => {
      const items = [{ description: "House rent", amount: u.rent }];
      if (u.water) items.push({ description: "Water", amount: u.water });
      if (u.garbage) items.push({ description: "Garbage collection", amount: u.garbage });
      const total = items.reduce((s, x) => s + x.amount, 0);
      const paid = Math.round((total * paidShare(j + 1, period)) / 100) * 100;
      const balance = total - paid;
      const dueDate = `${period}-0${t.dueDay}`;
      const id = invoices.length + 1;
      invoices.push({
        id,
        number: `INV${String(id).padStart(6, "0")}`,
        tenantId: t.id,
        unitId: u.id,
        period,
        issueDate: `${period}-01`,
        dueDate,
        items,
        total,
        paid,
        balance,
        status: balance === 0 ? "paid" : paid > 0 ? "partially_paid" : dueDate < TODAY ? "overdue" : "unpaid",
      });
      if (paid > 0) {
        const day = String(Math.min(2 + ((j + id) % 6), 9)).padStart(2, "0");
        mpesa.push({
          id: mpesa.length + 1,
          transId: `SJ${period.replace("-", "")}${String(id * 7919).slice(-5)}K`,
          amount: paid,
          msisdn: t.phone,
          billRef: u.name,
          time: `${period}-${day}T${String(8 + (id % 10)).padStart(2, "0")}:${String((id * 13) % 60).padStart(2, "0")}:00`,
          status: "settled",
          tenantId: t.id,
          invoiceId: id,
        });
      }
    });
  });

[["R99", 32000], ["254700111222", 18500], ["", 4000], ["G7", 7000]].forEach(([ref, amount], i) => {
  mpesa.push({
    id: mpesa.length + 1,
    transId: `SJ2610UNM${i}Q`,
    amount: amount as number,
    msisdn: `2547${60000000 + i * 1111111}`,
    billRef: ref as string,
    time: `2026-10-${String(14 + i * 2)}T1${i}:20:00`,
    status: "unmatched",
    tenantId: null,
    invoiceId: null,
  });
});
mpesa.sort((a, b) => b.time.localeCompare(a.time));
mpesa.forEach((m, i) => (m.id = i + 1));

export const deposits: Deposit[] = tenants.map((t, i) => {
  const u = units.find((x) => x.id === t.unitId);
  return {
    id: i + 1,
    code: `DEP-${String(i + 1).padStart(4, "0")}`,
    tenantId: t.id,
    unitId: u?.id ?? null,
    amount: u?.deposit ?? 20000 + i * 1000,
    status: t.status === "vacated" ? "refunded" : "held",
  };
});

export const voteHeads: VoteHead[] = [
  { id: 1, code: "RENT", name: "House rent", priority: 1, active: true },
  { id: 2, code: "WATER", name: "Water", priority: 2, active: true },
  { id: 3, code: "GARB", name: "Garbage collection", priority: 3, active: true },
  { id: 4, code: "SEC", name: "Security", priority: 4, active: true },
  { id: 5, code: "DEP", name: "Deposit", priority: 5, active: true },
];

export const staff: StaffUser[] = [
  { id: 1, name: "Peter Mwaniki", username: "pmwaniki", role: "Super Admin", phone: "254725768616", active: true },
  { id: 2, name: "Alice Wambui", username: "awambui", role: "Admin", phone: "254722333444", active: true },
  { id: 3, name: "Kennedy Oduor", username: "koduor", role: "Accountant", phone: "254733555666", active: true },
  { id: 4, name: "Susan Naliaka", username: "snaliaka", role: "Secretary", phone: "254711777888", active: false },
];

export const roles: RoleDef[] = [
  { name: "Super Admin", permissions: 42, users: 1 },
  { name: "Admin", permissions: 36, users: 1 },
  { name: "Accountant", permissions: 18, users: 1 },
  { name: "Secretary", permissions: 12, users: 1 },
  { name: "Tenant", permissions: 5, users: tenants.length },
  { name: "Landlord", permissions: 4, users: landlords.length },
];

export const banks: Bank[] = [
  { id: 1, shortName: "KCB", accountName: "Pemwa Agency Collections", accountNumber: "1209384756", branch: "Moi Avenue", onInvoice: true },
  { id: 2, shortName: "Equity", accountName: "Pemwa Agency Ltd", accountNumber: "0170192837465", branch: "Kenyatta Avenue", onInvoice: false },
];

export const smsTemplates: SmsTemplate[] = [
  { category: "Fee reminder", text: "Dear {name}, your rent of KES {amount} for {period} is due on {due_date}. Pay via Paybill {paybill}, account {unit}." },
  { category: "Payment notification", text: "Dear {name}, we received KES {amount} for unit {unit}. Balance: KES {balance}. Thank you." },
  { category: "Discount", text: "Dear {name}, a discount of KES {amount} has been applied to invoice {invoice}." },
  { category: "New tenant welcome", text: "Welcome to {property}, {name}. Your tenant ID is {tenant_id}. Rent is due on day {due_day} of each month." },
];

/** Tenant and landlord accounts used by the demo logins. */
export const DEMO_TENANT_ID = 3;
export const DEMO_LANDLORD_ID = 1;
