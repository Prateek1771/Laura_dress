import Link from 'next/link';

import { Badge } from '@/components/ui/Badge';
import { formatINR } from '@/lib/format';
import type { InventoryItem } from '@/lib/insforge/types';

const labelize = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const STOCK_DOT: Record<string, string> = {
  in_stock: 'bg-status-success',
  low_stock: 'bg-status-warning',
  out_of_stock: 'bg-status-danger',
};

interface DressCardProps {
  item: InventoryItem;
  sessionId: string | null;
  score?: number | null;
  dimmed?: boolean;
  onFindMatch?: (item: InventoryItem) => void;
}

export function DressCard({ item, sessionId, score, dimmed, onFindMatch }: DressCardProps) {
  const href = `/explore/${item.id}${sessionId ? `?session=${sessionId}` : ''}`;
  return (
    <Link
      href={href}
      className={`group flex flex-col overflow-hidden rounded-[--radius-card] border border-border bg-surface transition-opacity ${
        dimmed ? 'opacity-50' : ''
      }`}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-surface-soft">
        {item.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.images[0]} alt={item.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-ink-muted">No image</div>
        )}
        {typeof score === 'number' && (
          <span className="absolute left-2 top-2">
            <Badge variant="default">{score}% Match</Badge>
          </span>
        )}
        {onFindMatch && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onFindMatch(item);
            }}
            className="absolute bottom-2 right-2 rounded-full bg-surface/90 px-3 py-1 text-xs font-semibold text-primary shadow-sm backdrop-blur hover:bg-surface"
          >
            ✨ Find Match
          </button>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="line-clamp-2 font-display text-sm font-semibold text-ink">{item.name}</h3>
        <div className="flex items-center gap-2">
          <Badge variant="neutral">{labelize(item.category)}</Badge>
          <span className={`h-2 w-2 rounded-full ${STOCK_DOT[item.availability] ?? 'bg-status-neutral'}`} />
        </div>
        <p className="mt-auto font-semibold text-ink">{formatINR(item.price)}</p>
      </div>
    </Link>
  );
}
