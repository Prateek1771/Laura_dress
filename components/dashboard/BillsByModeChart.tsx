'use client';

import { useEffect, useState } from 'react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { formatINR } from '@/lib/format';

// SVG fill attributes can't use CSS variables, so resolve the chart tokens at runtime.
const FALLBACK = ['#7A1F2B', '#6D28D9', '#1D4ED8', '#0F766E'];

export function BillsByModeChart({ data }: { data: { label: string; amount: number }[] }) {
  const [colors, setColors] = useState<string[]>(FALLBACK);
  useEffect(() => {
    const s = getComputedStyle(document.documentElement);
    const resolved = [1, 2, 3, 4].map((i) => s.getPropertyValue(`--color-chart-${i}`).trim() || FALLBACK[i - 1]);
    setColors(resolved);
  }, []);

  const hasData = data.some((d) => d.amount > 0);
  if (!hasData) {
    return <p className="py-12 text-center text-sm text-ink-muted">No revenue in this range yet.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ left: 16, right: 24 }}>
        <XAxis type="number" tickFormatter={(v) => formatINR(v)} tick={{ fontSize: 11, fill: 'var(--color-ink-muted)' }} />
        <YAxis
          type="category"
          dataKey="label"
          width={90}
          tick={{ fontSize: 12, fill: 'var(--color-ink-secondary)' }}
        />
        <Tooltip
          formatter={(value) => formatINR(Number(value))}
          cursor={{ fill: 'var(--color-surface-soft)' }}
          contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 12 }}
        />
        <Bar dataKey="amount" radius={[0, 4, 4, 0]} isAnimationActive={false}>
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
