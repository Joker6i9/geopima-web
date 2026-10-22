"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface OccupancyRow {
  property: string;
  total: number;
  occupied: number;
}

export function OccupancyChart({ data }: { data: OccupancyRow[] }) {
  return (
    <div className="h-72 w-full" role="img" aria-label="Units and occupied units per property">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="property" tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
          <Tooltip />
          <Legend />
          <Bar dataKey="total" name="Total units" fill="oklch(0.85 0.03 258)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="occupied" name="Occupied" fill="oklch(0.28 0.07 258)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
