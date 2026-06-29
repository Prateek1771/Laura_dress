'use server';

import { redirect } from 'next/navigation';

import { z } from 'zod';

import { requireRole } from '@/lib/auth';
import { createServerClient } from '@/lib/insforge/server';
import { captureServerEvent } from '@/lib/posthog';
import { SHOPPING_FOR, OCCASIONS, ALL_CATEGORIES, SKIN_TONES } from '@/lib/constants';

const schema = z.object({
  customerName: z.string().trim().min(1, 'Customer name is required.'),
  customerAge: z.coerce.number().int().min(0).max(120).nullable(),
  shoppingFor: z.enum(SHOPPING_FOR),
  occasions: z.array(z.enum(OCCASIONS)).min(1, 'Pick at least one occasion.'),
  category: z.enum(ALL_CATEGORIES).nullable(),
  skinTone: z.enum(SKIN_TONES).nullable(),
  wantsCoupleCombo: z.boolean(),
  priceMin: z.coerce.number().min(0).nullable(),
  priceMax: z.coerce.number().min(0).nullable(),
});

export type CreateSessionInput = z.input<typeof schema>;

export async function createSession(input: CreateSessionInput): Promise<{ ok: false; error: string }> {
  const staff = await requireRole(['stylist', 'owner']);
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the form and try again.' };
  }
  const d = parsed.data;

  let sessionId = '';
  try {
    const db = createServerClient().database;
    // Couple/Kids carry no single category (couple prefs are a Phase 3 concern).
    const category = d.shoppingFor === 'male' || d.shoppingFor === 'female' ? d.category : null;
    const { data: row, error } = await db
      .from('styling_sessions')
      .insert({
        staff_id: staff.staffId,
        customer_name: d.customerName,
        customer_age: d.customerAge,
        shopping_for: d.shoppingFor,
        occasions: d.occasions,
        category,
        skin_tone: d.skinTone,
        wants_couple_combo: d.shoppingFor === 'couple' ? d.wantsCoupleCombo : false,
        price_range_min: d.priceMin,
        price_range_max: d.priceMax,
        status: 'active',
      })
      .select()
      .single();
    if (error || !row) throw error ?? new Error('Session insert returned no row');
    sessionId = row.id as string;

    void captureServerEvent(staff.staffId, 'session_started', {
      sessionId,
      shoppingFor: d.shoppingFor,
      occasions: d.occasions,
    });
  } catch (error) {
    console.error('[onboarding] createSession failed:', error);
    return { ok: false, error: 'Could not start the session. Try again.' };
  }

  redirect(`/explore?session=${sessionId}`);
}
