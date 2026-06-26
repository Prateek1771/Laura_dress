'use server';

import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { requireRole } from '@/lib/auth';
import { createServerClient } from '@/lib/insforge/server';
import { STAFF_ROLES } from '@/lib/constants';

type Result = { ok: true } | { ok: false; error: string };

async function settingsId(db: ReturnType<typeof createServerClient>['database']): Promise<string | null> {
  const { data } = await db.from('store_settings').select('id').limit(1).maybeSingle();
  return (data?.id as string) ?? null;
}

export async function updateTax(percent: number): Promise<Result> {
  await requireRole(['owner']);
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    return { ok: false, error: 'Tax percent must be between 0 and 100.' };
  }
  const db = createServerClient().database;
  const id = await settingsId(db);
  if (!id) return { ok: false, error: 'Store settings not found.' };
  const { error } = await db.from('store_settings').update({ tax_percent: percent }).eq('id', id);
  if (error) return { ok: false, error: 'Could not save tax percent.' };
  revalidatePath('/settings');
  return { ok: true };
}

export async function regenerateStoreCode(): Promise<{ ok: true; code: string } | { ok: false; error: string }> {
  await requireRole(['owner']);
  const db = createServerClient().database;
  const id = await settingsId(db);
  if (!id) return { ok: false, error: 'Store settings not found.' };
  const suffix = Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
  const code = `VIVAH${suffix}`;
  const { error } = await db.from('store_settings').update({ store_code: code }).eq('id', id);
  if (error) return { ok: false, error: 'Could not regenerate the code.' };
  revalidatePath('/settings');
  return { ok: true, code };
}

const staffSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  role: z.enum(STAFF_ROLES),
  password: z.string().min(4, 'Password must be at least 4 characters.'),
});

export async function addStaff(input: { name: string; role: string; password: string }): Promise<Result> {
  await requireRole(['owner']);
  const parsed = staffSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid staff details.' };
  }
  const { name, role, password } = parsed.data;
  const db = createServerClient().database;

  // Passwords double as login credentials (no usernames) — they must be unique. bcrypt hashes
  // aren't directly comparable, so compare the candidate against each existing hash. O(n), fine for a boutique.
  const { data: existing, error: exErr } = await db.from('staff').select('password_hash');
  if (exErr) return { ok: false, error: 'Could not verify the password.' };
  for (const s of (existing ?? []) as { password_hash: string }[]) {
    if (await bcrypt.compare(password, s.password_hash)) {
      return { ok: false, error: 'Password already in use by another staff member.' };
    }
  }

  const password_hash = await bcrypt.hash(password, 10);
  const { error } = await db.from('staff').insert({ name, role, password_hash, active: true });
  if (error) return { ok: false, error: 'Could not add staff member.' };
  revalidatePath('/settings');
  return { ok: true };
}

export async function toggleStaff(id: string, active: boolean): Promise<Result> {
  await requireRole(['owner']);
  const db = createServerClient().database;
  const { error } = await db.from('staff').update({ active }).eq('id', id);
  if (error) return { ok: false, error: 'Could not update staff member.' };
  revalidatePath('/settings');
  return { ok: true };
}
