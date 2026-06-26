import { requireRole } from '@/lib/auth';
import { createServerClient } from '@/lib/insforge/server';
import { captureServerEvent } from '@/lib/posthog';
import { recommend } from '@/lib/scoring/engine';
import type { SessionPreferences } from '@/lib/scoring/types';
import type { InventoryItem } from '@/lib/insforge/types';

export async function POST(req: Request) {
  try {
    const staff = await requireRole(['stylist', 'owner']);
    const { sessionId } = await req.json();
    if (typeof sessionId !== 'string' || !sessionId) {
      return Response.json({ ok: false, error: 'Missing session.' }, { status: 400 });
    }
    const db = createServerClient().database;

    const { data: session, error: sErr } = await db
      .from('styling_sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();
    if (sErr) throw sErr;
    if (!session) return Response.json({ ok: false, error: 'Session not found.' }, { status: 404 });

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
      price_range_min: session.price_range_min != null ? Number(session.price_range_min) : null,
      price_range_max: session.price_range_max != null ? Number(session.price_range_max) : null,
      wants_couple_combo: Boolean(session.wants_couple_combo),
    };

    const scored = recommend(prefs, items);

    // Soft-replace (architecture invariant): insert new rows first, then delete prior ones.
    const beforeTs = new Date().toISOString();
    if (scored.length) {
      const rows = scored.map((s, i) => ({
        session_id: sessionId,
        item_id: s.item.id,
        match_score: s.matchScore,
        match_reasons: s.matchReasons,
        rank: i + 1,
      }));
      const { error: insErr } = await db.from('recommendations').insert(rows);
      if (insErr) throw insErr;
    }
    await db.from('recommendations').delete().eq('session_id', sessionId).lt('created_at', beforeTs);

    void captureServerEvent(staff.staffId, 'recommendations_generated', {
      sessionId,
      count: scored.length,
      topScore: scored[0]?.matchScore ?? 0,
    });

    return Response.json({
      ok: true,
      data: {
        shoppingFor: session.shopping_for,
        scored: scored.map((s) => ({
          itemId: s.item.id,
          matchScore: s.matchScore,
          matchReasons: s.matchReasons,
          tier: s.tier,
        })),
      },
    });
  } catch (error) {
    console.error('[recommendations] failed:', error);
    return Response.json({ ok: false, error: 'Could not generate recommendations.' }, { status: 500 });
  }
}
