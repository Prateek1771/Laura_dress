import Link from 'next/link';

import { Button } from '@/components/ui/Button';
import { FilterBar } from '@/components/inventory/FilterBar';
import { InventoryTable } from '@/components/inventory/InventoryTable';
import { createServerClient } from '@/lib/insforge/server';
import type { InventoryItem } from '@/lib/insforge/types';

function str(v: string | string[] | undefined): string {
  return typeof v === 'string' ? v : '';
}

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = str(sp.q).trim();
  const gender = str(sp.gender);
  const category = str(sp.category);
  const availability = str(sp.availability);
  const added = str(sp.added);
  const updated = str(sp.updated);

  const db = createServerClient().database;
  let query = db.from('inventory_items').select('*').eq('active', true);
  if (gender) query = query.eq('gender', gender);
  if (category) query = query.eq('category', category);
  if (availability) query = query.eq('availability', availability);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) console.error('[inventory] list query failed:', error);

  let items = (data ?? []) as InventoryItem[];
  if (q) {
    const needle = q.toLowerCase();
    // ponytail: in-memory text search across name+dress_id — SDK has no OR filter, inventory is small.
    items = items.filter(
      (i) => i.name.toLowerCase().includes(needle) || i.dress_id.toLowerCase().includes(needle),
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink">Inventory</h1>
        <Link href="/inventory/new">
          <Button>Add Item</Button>
        </Link>
      </div>

      {(added || updated) && (
        <div className="rounded-[--radius-card] border border-status-success/30 bg-[color-mix(in_srgb,var(--color-status-success)_8%,white)] px-4 py-2.5 text-sm text-status-success">
          {added ? `Item ${added} added.` : `Item ${updated} updated.`}
        </div>
      )}

      <FilterBar q={q} gender={gender} category={category} availability={availability} />

      <InventoryTable items={items} />
    </div>
  );
}
