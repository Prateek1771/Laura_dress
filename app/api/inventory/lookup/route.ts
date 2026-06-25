import { requireRole } from '@/lib/auth';
import { createServerClient } from '@/lib/insforge/server';

// Privileged server-side dress_id lookup for Billing/Returns. We use this instead of the
// browser anon client because anon DB perms are unreliable (Feature 03 decision).
export async function GET(req: Request) {
  try {
    await requireRole(['cashier', 'owner']);
    const dressId = new URL(req.url).searchParams.get('dressId')?.trim();
    if (!dressId) {
      return Response.json({ ok: false, error: 'Enter a dress ID.' }, { status: 400 });
    }
    const db = createServerClient().database;
    const { data, error } = await db
      .from('inventory_items')
      .select('id, dress_id, name, price, images, availability')
      .ilike('dress_id', dressId)
      .eq('active', true)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return Response.json({ ok: false, error: 'No dress found with that ID.' }, { status: 404 });
    }
    return Response.json({ ok: true, data });
  } catch (error) {
    console.error('[billing] lookup failed:', error);
    return Response.json({ ok: false, error: 'Lookup failed. Try again.' }, { status: 500 });
  }
}
