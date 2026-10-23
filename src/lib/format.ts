export const kes = (n: number) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n);

export const fmtDate = (iso: string) =>
  new Date(iso.length <= 10 ? `${iso}T00:00:00Z` : `${iso}Z`).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  });

export const fmtDateTime = (iso: string) =>
  new Date(`${iso}Z`).toLocaleString("en-GB", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC",
  });

export const titleCase = (s: string) => s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

export const phone = (p: string) => (p.startsWith("254") ? `0${p.slice(3, 6)} ${p.slice(6, 9)} ${p.slice(9)}` : p);
