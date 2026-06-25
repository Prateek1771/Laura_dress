'use server';

import { revalidatePath } from 'next/cache';

import { z } from 'zod';

import { requireRole } from '@/lib/auth';
import { createServerClient } from '@/lib/insforge/server';
import { captureServerEvent } from '@/lib/posthog';

const schema = z.object({
  dressId: z.string().trim().min(1),
  notes: z.string().trim().optional(),
});

type Result = { ok: true; data: { name: string } } | { ok: false; error: string };

export async function recordReturn(input: z.infer<typeof schema>): Promise<Result> {
  const staff = await requireRole(['cashier', 'owner']);
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Enter a dress ID.' };
  const { dressId, notes } = parsed.data;

  try {
    const db = createServerClient().database;
    const { data: item, error: lookupErr } = await db
      .from('inventory_items')
      .select('id, name')
      .ilike('dress_id', dressId)
      .eq('active', true)
      .maybeSingle();
    if (lookupErr) throw lookupErr;
    if (!item) return { ok: false, error: 'No dress found with that ID.' };

    const { error } = await db
      .from('returns')
      .insert({ item_id: item.id, staff_id: staff.staffId, notes: notes ?? null });
    if (error) throw error;

    void captureServerEvent(staff.staffId, 'return_recorded', {
      itemId: item.id,
      staffId: staff.staffId,
    });

    revalidatePath('/returns');
    revalidatePath('/dashboard');
    return { ok: true, data: { name: item.name as string } };
  } catch (error) {
    console.error('[returns] recordReturn failed:', error);
    return { ok: false, error: 'Could not record the return. Try again.' };
  }
}
