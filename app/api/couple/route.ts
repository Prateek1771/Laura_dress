import { requireRole } from '@/lib/auth';
import { createServerClient } from '@/lib/insforge/server';
import { suggestPartnerOutfits, coupleCompatibility } from '@/lib/scoring/couple';
import type { SessionPreferences } from '@/lib/scoring/types';
import type { InventoryItem } from '@/lib/insforge/types';

export async function POST(req: Request) {
  try {
    await requireRole(['stylist', 'owner']);
    const { sessionId, itemId } = await req.json();
    if (typeof sessionId !== 'string' || typeof itemId !== 'string' || !sessionId || !itemId) {
      return Response.json({ ok: false, error: 'Missing session or item.' }, { status: 400 });
    }
    const db = createServerClient().database;

    const { data: session, error: sErr } = await db
      .from('styling_sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();
    if (sErr) throw sErr;
    if (!session) return Response.json({ ok: false, error: 'Session not found.' }, { status: 404 });

    const { data: anchorData, error: aErr } = await db
      .from('inventory_items')
      .select('*')
      .eq('id', itemId)
      .maybeSingle();
    if (aErr) throw aErr;
    if (!anchorData) return Response.json({ ok: false, error: 'Item not found.' }, { status: 404 });
    const anchor = anchorData as InventoryItem;

    const { data: itemsData, error: iErr } = await db
      .from('inventory_items')
      .select('*')
      .eq('active', true);
    if (iErr) throw iErr;
    const items = (itemsData ?? []) as InventoryItem[];

    const prefs: SessionPreferences = {
      id: session.id as string,
      shopping_for: session.shopping_for,
      occasions: session.occasions ?? [],
      category: session.category ?? null,
      skin_tone: session.skin_tone ?? null,
      price_range_min: session.price_range_min != null ? Number(session.price_range_min) : null,
      price_range_max: session.price_range_max != null ? Number(session.price_range_max) : null,
      wants_couple_combo: Boolean(session.wants_couple_combo),
    };

    // suggestPartnerOutfits returns the combined score; recompute the 3 sub-scores for display.
    const partners = suggestPartnerOutfits(anchor, prefs, items).map((s) => {
      const compat = coupleCompatibility(anchor, s.item);
      return {
        itemId: s.item.id,
        name: s.item.name,
        price: s.item.price,
        image: s.item.images[0] ?? null,
        overall: s.matchScore,
        colorHarmony: compat.colorHarmony,
        themeHarmony: compat.themeHarmony,
        fabricHarmony: compat.fabricHarmony,
      };
    });

    return Response.json({ ok: true, data: { partners } });
  } catch (error) {
    console.error('[couple] failed:', error);
    return Response.json({ ok: false, error: 'Could not find matching outfits.' }, { status: 500 });
  }
}
