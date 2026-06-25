'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { z } from 'zod';

import { requireRole } from '@/lib/auth';
import { createServerClient } from '@/lib/insforge/server';
import { uploadInventoryImage } from '@/lib/insforge/storage';
import {
  ALL_CATEGORIES,
  CATEGORY_PREFIXES,
  OCCASIONS,
  COLORS,
  FABRICS,
  AVAILABILITY,
} from '@/lib/constants';

type ActionError = { ok: false; error: string };

const itemSchema = z.object({
  dress_id: z.string().trim().toUpperCase().optional().or(z.literal('')),
  name: z.string().trim().min(1, 'Title is required.'),
  quantity: z.coerce.number().int().min(0),
  gender: z.enum(['men', 'women']),
  category: z.enum(ALL_CATEGORIES),
  occasions: z.array(z.enum(OCCASIONS)),
  colors: z.array(z.enum(COLORS)),
  sizes: z.array(z.string()),
  tags: z.array(z.string()),
  fabric: z.enum(FABRICS).nullable(),
  price: z.coerce.number().min(0),
  availability: z.enum(AVAILABILITY),
});

function jsonArray(formData: FormData, key: string): unknown {
  const raw = formData.get(key);
  if (typeof raw !== 'string' || raw === '') return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function parseItem(formData: FormData) {
  const fabricRaw = formData.get('fabric');
  return itemSchema.safeParse({
    dress_id: formData.get('dress_id') ?? '',
    name: formData.get('name') ?? '',
    quantity: formData.get('quantity') ?? 1,
    gender: formData.get('gender'),
    category: formData.get('category'),
    occasions: jsonArray(formData, 'occasions'),
    colors: jsonArray(formData, 'colors'),
    sizes: jsonArray(formData, 'sizes'),
    tags: jsonArray(formData, 'tags'),
    fabric: fabricRaw === '' || fabricRaw === null ? null : fabricRaw,
    price: formData.get('price') ?? 0,
    availability: formData.get('availability') ?? 'in_stock',
  });
}

// ponytail: best-effort sequence; the DB unique index is the real guard (retry-once on conflict).
async function nextDressId(
  db: ReturnType<typeof createServerClient>['database'],
  category: string,
): Promise<string> {
  const prefix = CATEGORY_PREFIXES[category] ?? 'ITEM';
  const { data, error } = await db
    .from('inventory_items')
    .select('dress_id')
    .like('dress_id', `${prefix}-%`);
  if (error) throw error;
  const max = (data ?? []).reduce((m: number, row: { dress_id: string }) => {
    const n = Number.parseInt(row.dress_id.split('-')[1] ?? '0', 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(4, '0')}`;
}

async function uploadAll(itemId: string, files: File[], startIndex: number): Promise<string[]> {
  const urls: string[] = [];
  for (let i = 0; i < files.length; i++) {
    urls.push(await uploadInventoryImage(itemId, startIndex + i, files[i]));
  }
  return urls;
}

function imageFiles(formData: FormData): File[] {
  return formData
    .getAll('images')
    .filter((f): f is File => f instanceof File && f.size > 0);
}

export async function createItem(formData: FormData): Promise<ActionError> {
  await requireRole(['owner']);
  const parsed = parseItem(formData);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid item details.' };
  }
  const input = parsed.data;
  const db = createServerClient().database;

  let dressId = '';
  try {
    if (input.dress_id) {
      const { data: clash, error } = await db
        .from('inventory_items')
        .select('id')
        .ilike('dress_id', input.dress_id)
        .maybeSingle();
      if (error) throw error;
      if (clash) return { ok: false, error: `Dress ID ${input.dress_id} is already in use.` };
      dressId = input.dress_id;
    } else {
      dressId = await nextDressId(db, input.category);
    }

    const { dress_id: _ignore, ...rest } = input;
    void _ignore;
    const { data: row, error: insertErr } = await db
      .from('inventory_items')
      .insert({ ...rest, dress_id: dressId, images: [] })
      .select()
      .single();
    if (insertErr || !row) throw insertErr ?? new Error('Insert returned no row');

    // Roll back the row if image upload fails, so a failed save never leaves an orphan item.
    try {
      const urls = await uploadAll(row.id as string, imageFiles(formData), 0);
      if (urls.length) {
        const { error: updErr } = await db
          .from('inventory_items')
          .update({ images: urls })
          .eq('id', row.id);
        if (updErr) throw updErr;
      }
    } catch (uploadError) {
      await db.from('inventory_items').delete().eq('id', row.id);
      throw uploadError;
    }
  } catch (error) {
    console.error('[inventory] createItem failed:', error);
    return { ok: false, error: 'Could not save the item. Try again.' };
  }

  revalidatePath('/inventory');
  redirect(`/inventory?added=${encodeURIComponent(dressId)}`);
}

export async function updateItem(formData: FormData): Promise<ActionError> {
  await requireRole(['owner']);
  const id = formData.get('id');
  if (typeof id !== 'string' || !id) return { ok: false, error: 'Missing item id.' };

  const parsed = parseItem(formData);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid item details.' };
  }
  const input = parsed.data;
  const db = createServerClient().database;

  let dressId = input.dress_id ?? '';
  try {
    if (input.dress_id) {
      const { data: clash, error } = await db
        .from('inventory_items')
        .select('id')
        .ilike('dress_id', input.dress_id)
        .neq('id', id)
        .maybeSingle();
      if (error) throw error;
      if (clash) return { ok: false, error: `Dress ID ${input.dress_id} is already in use.` };
    }

    const existing = (jsonArray(formData, 'existingImages') as unknown[]).filter(
      (u): u is string => typeof u === 'string',
    );
    const newUrls = await uploadAll(id, imageFiles(formData), existing.length);

    const { dress_id, ...rest } = input;
    const { error: updErr } = await db
      .from('inventory_items')
      .update({ ...rest, dress_id: dress_id || undefined, images: [...existing, ...newUrls] })
      .eq('id', id);
    if (updErr) throw updErr;
    dressId = dress_id || dressId;
  } catch (error) {
    console.error('[inventory] updateItem failed:', error);
    return { ok: false, error: 'Could not update the item. Try again.' };
  }

  revalidatePath('/inventory');
  redirect(`/inventory?updated=${encodeURIComponent(dressId || 'item')}`);
}

export async function deactivateItem(formData: FormData): Promise<void> {
  await requireRole(['owner']);
  const id = formData.get('id');
  if (typeof id !== 'string' || !id) return;
  try {
    const db = createServerClient().database;
    const { error } = await db.from('inventory_items').update({ active: false }).eq('id', id);
    if (error) throw error;
  } catch (error) {
    console.error('[inventory] deactivateItem failed:', error);
  }
  revalidatePath('/inventory');
}

export async function setAvailability(formData: FormData): Promise<void> {
  await requireRole(['owner']);
  const id = formData.get('id');
  const availability = formData.get('availability');
  if (typeof id !== 'string' || !id) return;
  const valid = (AVAILABILITY as readonly string[]).includes(availability as string);
  if (!valid) return;
  try {
    const db = createServerClient().database;
    const { error } = await db
      .from('inventory_items')
      .update({ availability })
      .eq('id', id);
    if (error) throw error;
  } catch (error) {
    console.error('[inventory] setAvailability failed:', error);
  }
  revalidatePath('/inventory');
}
