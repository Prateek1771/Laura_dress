import Link from 'next/link';

import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/dashboard/StatCard';
import { BillsByModeChart } from '@/components/dashboard/BillsByModeChart';
import { RecentBillsTable, type RecentBill } from '@/components/dashboard/RecentBillsTable';
import { Reveal } from '@/components/motion/Reveal';
import { createServerClient } from '@/lib/insforge/server';
import { formatINR } from '@/lib/format';
import { PAYMENT_MODES, type PaymentMode } from '@/lib/constants';

const RANGES = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'all', label: 'All Time' },
] as const;

const MODE_LABEL: Record<PaymentMode, string> = {
  cash: 'Cash',
  upi: 'UPI',
  card: 'Card',
  net_banking: 'Net Banking',
};

// Rolling windows (today = since local midnight, week = 7d, month = 30d).
function rangeStart(range: string): string | null {
  const now = new Date();
  if (range === 'today') {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }
  if (range === 'week') return new Date(now.getTime() - 7 * 864e5).toISOString();
  if (range === 'all') return null;
  return new Date(now.getTime() - 30 * 864e5).toISOString(); // month (default)
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const range = typeof sp.range === 'string' && RANGES.some((r) => r.key === sp.range) ? sp.range : 'month';
  const start = rangeStart(range);
  const db = createServerClient().database;

  let billsQuery = db
    .from('bills')
    .select('id, bill_number, payment_mode, total_amount, created_at, staff(name), bill_items(inventory_items(dress_id))')
    .order('created_at', { ascending: false });
  if (start) billsQuery = billsQuery.gte('created_at', start);
  const billsRes = await billsQuery;
  if (billsRes.error) console.error('[dashboard] bills query failed:', billsRes.error);
  // PostgREST types to-one embeds as arrays, but returns objects at runtime — cast through unknown.
  const bills = (billsRes.data ?? []) as unknown as RecentBill[];

  let returnsQuery = db.from('returns').select('id');
  if (start) returnsQuery = returnsQuery.gte('created_at', start);
  const returnsRes = await returnsQuery;
  const returnsCount = returnsRes.data?.length ?? 0;

  const stockRes = await db.from('inventory_items').select('availability').eq('active', true);
  const stock = (stockRes.data ?? []) as { availability: string }[];
  const stockCount = (a: string) => stock.filter((s) => s.availability === a).length;

  const revenue = bills.reduce((s, b) => s + Number(b.total_amount), 0);
  const billCount = bills.length;
  const aov = billCount ? Math.round(revenue / billCount) : 0;

  const byMode = PAYMENT_MODES.map((m) => ({
    label: MODE_LABEL[m],
    amount: bills.filter((b) => b.payment_mode === m).reduce((s, b) => s + Number(b.total_amount), 0),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-ink">Dashboard</h1>
        <div className="flex flex-wrap gap-2">
          {RANGES.map((r) => (
            <Link
              key={r.key}
              href={`/dashboard?range=${r.key}`}
              className={`rounded-[--radius-badge] border px-3 py-1.5 text-xs font-medium transition-colors ${
                range === r.key
                  ? 'border-primary bg-primary-soft text-primary'
                  : 'border-border text-ink-secondary hover:bg-surface-soft'
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      <Reveal stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Revenue" value={formatINR(revenue)} />
        <StatCard label="Total Bills" value={String(billCount)} />
        <StatCard label="Avg Order Value" value={formatINR(aov)} />
        <StatCard label="Returns" value={String(returnsCount)} />
      </Reveal>

      <Card className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold text-ink">Revenue by Payment Mode</h2>
        <BillsByModeChart data={byMode} />
      </Card>

      <div className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold text-ink">Recent Bills</h2>
        <RecentBillsTable bills={bills.slice(0, 10)} />
      </div>

      <Reveal stagger className="grid gap-4 sm:grid-cols-3">
        <StatCard label="In Stock" value={String(stockCount('in_stock'))} />
        <StatCard label="Low Stock" value={String(stockCount('low_stock'))} />
        <StatCard label="Out of Stock" value={String(stockCount('out_of_stock'))} />
      </Reveal>
    </div>
  );
}
