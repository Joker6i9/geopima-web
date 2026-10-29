/** Today as YYYY-MM-DD, read per call so a long-running server never works from a stale date. */
export const today = () => new Date().toISOString().slice(0, 10);

/** The current billing month, YYYY-MM. */
export const currentPeriod = () => today().slice(0, 7);

/** The last `count` billing months, oldest first, ending with the current one. */
export function recentPeriods(count = 6) {
  const [y, m] = currentPeriod().split("-").map(Number);
  return Array.from({ length: count }, (_, i) => {
    const total = y * 12 + (m - 1) - (count - 1 - i);
    return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
  });
}

export const periodLabel = (period: string) =>
  new Date(`${period}-01T00:00:00`).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
