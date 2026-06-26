import { ExploreClient } from '@/components/explore/ExploreClient';
import { createServerClient } from '@/lib/insforge/server';
import type { InventoryItem } from '@/lib/insforge/types';

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const sessionId = typeof sp.session === 'string' ? sp.session : null;
  const openGallery = sp.gallery === '1';

  const db = createServerClient().database;
  const { data, error } = await db
    .from('inventory_items')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false });
  if (error) console.error('[explore] list query failed:', error);
  const items = (data ?? []) as InventoryItem[];

  let wantsCombo = false;
  if (sessionId) {
    const { data: sess } = await db
      .from('styling_sessions')
      .select('wants_couple_combo')
      .eq('id', sessionId)
      .maybeSingle();
    wantsCombo = Boolean(sess?.wants_couple_combo);
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-2xl font-semibold text-ink">Explore</h1>
      <ExploreClient items={items} sessionId={sessionId} wantsCombo={wantsCombo} openGallery={openGallery} />
    </div>
  );
}
