import { Badge } from '@/components/ui/Badge';
import { formatINR, formatDateTime } from '@/lib/format';
import type { PaymentMode } from '@/lib/constants';

export interface RecentBill {
  id: string;
  bill_number: number;
  payment_mode: PaymentMode;
  total_amount: number;
  created_at: string;
  staff?: { name: string } | null;
  bill_items?: { inventory_items?: { dress_id: string } | null }[] | null;
}

const PAY_VARIANT: Record<PaymentMode, 'pay-cash' | 'pay-upi' | 'pay-card' | 'pay-netbanking'> = {
  cash: 'pay-cash',
  upi: 'pay-upi',
  card: 'pay-card',
  net_banking: 'pay-netbanking',
};

export function RecentBillsTable({ bills }: { bills: RecentBill[] }) {
  if (!bills.length) {
    return (
      <div className="rounded-[--radius-card] border border-dashed border-border py-12 text-center text-sm text-ink-muted">
        No bills in this range yet.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-[--radius-card] border border-border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-soft text-left text-[11px] uppercase tracking-wide text-ink-muted">
            <th className="px-3 py-2.5 font-semibold">Date</th>
            <th className="px-3 py-2.5 font-semibold">Dress IDs</th>
            <th className="px-3 py-2.5 font-semibold">Payment</th>
            <th className="px-3 py-2.5 font-semibold">Amount</th>
            <th className="px-3 py-2.5 font-semibold">Cashier</th>
          </tr>
        </thead>
        <tbody>
          {bills.map((b) => {
            const ids = (b.bill_items ?? [])
              .map((bi) => bi.inventory_items?.dress_id)
              .filter((x): x is string => Boolean(x));
            return (
              <tr key={b.id} className="border-b border-border last:border-0">
                <td className="px-3 py-2.5 text-ink-secondary">{formatDateTime(b.created_at)}</td>
                <td className="px-3 py-2.5 text-ink-muted">
                  {ids.slice(0, 2).join(', ')}
                  {ids.length > 2 ? ` +${ids.length - 2}` : ''}
                </td>
                <td className="px-3 py-2.5">
                  <Badge variant={PAY_VARIANT[b.payment_mode]}>{b.payment_mode.replace('_', ' ')}</Badge>
                </td>
                <td className="px-3 py-2.5 font-semibold text-ink">{formatINR(b.total_amount)}</td>
                <td className="px-3 py-2.5 text-ink-secondary">{b.staff?.name ?? '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
