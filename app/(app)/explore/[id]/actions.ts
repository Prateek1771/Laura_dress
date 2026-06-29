'use server';

import { requireRole } from '@/lib/auth';
import { createServerClient } from '@/lib/insforge/server';
import { uploadCustomerPhoto } from '@/lib/insforge/storage';

// Try-on needs a session to attach the photo + record the result. When a dress is opened
// without an active styling session (e.g. browsing inventory directly), spin up a
// lightweight "walk-in" session on demand so Preview My Look still works.
export async function createAdhocSession(
  shoppingFor: 'male' | 'female',
): Promise<{ ok: true; sessionId: string } | { ok: false; error: string }> {
  const staff = await requireRole(['stylist', 'owner']);
  try {
    const db = createServerClient().database;
    const { data, error } = await db
      .from('styling_sessions')
      .insert({
        staff_id: staff.staffId,
        customer_name: 'Walk-in Preview',
        shopping_for: shoppingFor,
        occasions: [],
        status: 'active',
      })
      .select('id')
      .single();
    if (error || !data) throw error ?? new Error('Ad-hoc session insert returned no row');
    return { ok: true, sessionId: data.id as string };
  } catch (error) {
    console.error('[tryon] createAdhocSession failed:', error);
    return { ok: false, error: 'Could not start a preview session.' };
  }
}

export async function saveCustomerPhoto(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  await requireRole(['stylist', 'owner']);
  const sessionId = formData.get('sessionId');
  const file = formData.get('photo');
  if (typeof sessionId !== 'string' || !sessionId || !(file instanceof File)) {
    return { ok: false, error: 'Missing photo.' };
  }
  try {
    const url = await uploadCustomerPhoto(sessionId, file);
    const db = createServerClient().database;
    const { error } = await db.from('styling_sessions').update({ customer_photo_url: url }).eq('id', sessionId);
    if (error) throw error;
    return { ok: true };
  } catch (error) {
    console.error('[tryon] saveCustomerPhoto failed:', error);
    return { ok: false, error: 'Could not save the photo. Try again.' };
  }
}
