import Link from 'next/link';

import { Badge } from '@/components/ui/Badge';
import { formatINR } from '@/lib/format';
import { AVAILABILITY } from '@/lib/constants';
import type { InventoryItem } from '@/lib/insforge/types';
import { deactivateItem, setAvailability } from '@/app/(app)/inventory/actions';

const labelize = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const STOCK_VARIANT: Record<string, 'success' | 'warning' | 'danger'> = {
  in_stock: 'success',
  low_stock: 'warning',
  out_of_stock: 'danger',
};

export function InventoryTable({ items }: { items: InventoryItem[] }) {
  if (!items.length) {
    return (
      <div className="rounded-[--radius-card] border border-dashed border-border py-16 text-center text-sm text-ink-muted">
        No items yet. Add your first dress to get started.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[--radius-card] border border-border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-soft text-left text-[11px] uppercase tracking-wide text-ink-muted">
            <th className="px-3 py-2.5 font-semibold">Dress ID</th>
            <th className="px-3 py-2.5 font-semibold">Image</th>
            <th className="px-3 py-2.5 font-semibold">Title</th>
            <th className="px-3 py-2.5 font-semibold">Qty</th>
            <th className="px-3 py-2.5 font-semibold">Type</th>
            <th className="px-3 py-2.5 font-semibold">Tags</th>
            <th className="px-3 py-2.5 font-semibold">Colors</th>
            <th className="px-3 py-2.5 font-semibold">Price</th>
            <th className="px-3 py-2.5 font-semibold">Stock</th>
            <th className="px-3 py-2.5 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-border last:border-0">
              <td className="px-3 py-2.5">
                <Badge variant="dress-id">{item.dress_id}</Badge>
              </td>
              <td className="px-3 py-2.5">
                {item.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.images[0]} alt="" className="h-10 w-10 rounded object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded bg-surface-soft" />
                )}
              </td>
              <td className="px-3 py-2.5 font-medium text-ink">{item.name}</td>
              <td className="px-3 py-2.5 text-ink-secondary">{item.quantity}</td>
              <td className="px-3 py-2.5">
                <Badge variant="neutral">{labelize(item.category)}</Badge>
              </td>
              <td className="px-3 py-2.5 text-ink-muted">
                {item.tags.slice(0, 2).join(', ')}
                {item.tags.length > 2 ? ` +${item.tags.length - 2}` : ''}
              </td>
              <td className="px-3 py-2.5 text-ink-muted">
                {item.colors.map(labelize).slice(0, 2).join(', ')}
                {item.colors.length > 2 ? ` +${item.colors.length - 2}` : ''}
              </td>
              <td className="px-3 py-2.5 font-semibold text-ink">{formatINR(item.price)}</td>
              <td className="px-3 py-2.5">
                <form action={setAvailability} className="flex items-center gap-1.5">
                  <input type="hidden" name="id" value={item.id} />
                  <Badge variant={STOCK_VARIANT[item.availability] ?? 'neutral'}>
                    {labelize(item.availability)}
                  </Badge>
                  <select
                    key={item.availability}
                    name="availability"
                    defaultValue={item.availability}
                    className="rounded border border-border bg-surface px-1 py-1 text-xs text-ink-secondary"
                  >
                    {AVAILABILITY.map((a) => (
                      <option key={a} value={a}>
                        {labelize(a)}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="text-xs font-medium text-primary hover:underline">
                    Set
                  </button>
                </form>
              </td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-3">
                  <Link href={`/inventory/${item.id}/edit`} className="text-sm font-medium text-primary hover:underline">
                    Edit
                  </Link>
                  <form action={deactivateItem}>
                    <input type="hidden" name="id" value={item.id} />
                    <button type="submit" className="text-sm font-medium text-status-danger hover:underline">
                      Deactivate
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
