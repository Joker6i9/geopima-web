"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface Series {
  key: string;
  name: string;
  color: string;
}

const compact = (n: number) =>
  new Intl.NumberFormat("en-KE", { notation: "compact", maximumFractionDigits: 1 }).format(n);

export function BarsChart({
  data, xKey, series, money = false, label, height = 288,
}: {
  data: Record<string, string | number>[];
  xKey: string;
  series: Series[];
  money?: boolean;
  label: string;
  height?: number;
}) {
  return (
    <div style={{ height }} className="w-full" role="img" aria-label={label}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey={xKey} tickLine={false} axisLine={false} fontSize={13} />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={money ? 48 : 32}
            fontSize={13}
            tickFormatter={money ? compact : undefined}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            formatter={(v) => (money ? `KES ${Number(v).toLocaleString("en-KE")}` : v)}
          />
          <Legend />
          {series.map((s) => (
            <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
