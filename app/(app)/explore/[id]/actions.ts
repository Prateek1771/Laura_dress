'use server';

import { requireRole } from '@/lib/auth';
import { createServerClient } from '@/lib/insforge/server';
import { uploadCustomerPhoto } from '@/lib/insforge/storage';

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
