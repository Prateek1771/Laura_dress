import { notFound } from 'next/navigation';

import { ItemForm } from '@/components/inventory/ItemForm';
import { createServerClient } from '@/lib/insforge/server';
import type { InventoryItem } from '@/lib/insforge/types';
import { updateItem } from '../../actions';

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = createServerClient().database;
  const { data, error } = await db
    .from('inventory_items')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) console.error('[inventory] edit fetch failed:', error);
  if (!data) notFound();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <h1 className="font-display text-2xl font-semibold text-ink">Edit Item</h1>
      <ItemForm action={updateItem} item={data as InventoryItem} />
    </div>
  );
}
