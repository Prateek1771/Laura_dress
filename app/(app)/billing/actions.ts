'use server';

import { revalidatePath } from 'next/cache';

import { z } from 'zod';

import { requireRole } from '@/lib/auth';
import { createServerClient } from '@/lib/insforge/server';
import { captureServerEvent } from '@/lib/posthog';
import { PAYMENT_MODES } from '@/lib/constants';

const schema = z.object({
  items: z.array(z.object({ dressId: z.string().min(1), quantity: z.coerce.number().int().min(1) })).min(1),
  paymentMode: z.enum(PAYMENT_MODES),
  paymentRef: z.string().trim().optional(),
  customerName: z.string().trim().optional(),
});

export type CreateBillInput = z.infer<typeof schema>;

export interface InvoiceLine {
  dress_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
}
export interface Invoice {
  billNumber: number;
  paymentMode: string;
  paymentRef: string | null;
  customerName: string | null;
  lines: InvoiceLine[];
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
}

type Result = { ok: true; data: Invoice } | { ok: false; error: string };

export async function createBill(input: CreateBillInput): Promise<Result> {
  const staff = await requireRole(['cashier', 'owner']);
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Add at least one item and a payment mode.' };
  const { items, paymentMode, paymentRef, customerName } = parsed.data;

  try {
    const db = createServerClient().database;

    const settings = await db.from('store_settings').select('tax_percent').maybeSingle();
    if (settings.error) throw settings.error;
    const taxPercent = Number(settings.data?.tax_percent ?? 0);

    // Re-fetch each item server-side; never trust client prices.
    const lines: (InvoiceLine & { item_id: string })[] = [];
    for (const { dressId, quantity } of items) {
      const { data: row, error } = await db
        .from('inventory_items')
        .select('id, dress_id, name, price')
        .ilike('dress_id', dressId)
        .eq('active', true)
        .maybeSingle();
      if (error) throw error;
      if (!row) return { ok: false, error: `Dress ID ${dressId} not found.` };
      const unit = Number(row.price);
      lines.push({
        item_id: row.id as string,
        dress_id: row.dress_id as string,
        name: row.name as string,
        quantity,
        unit_price: unit,
        total: unit * quantity,
      });
    }

    const subtotal = lines.reduce((s, l) => s + l.total, 0);
    const tax = Math.round(subtotal * (taxPercent / 100));
    const total = subtotal + tax;

    const { data: bill, error: billErr } = await db
      .from('bills')
      .insert({
        staff_id: staff.staffId,
        payment_mode: paymentMode,
        payment_ref: paymentMode === 'upi' || paymentMode === 'card' ? paymentRef ?? null : null,
        customer_name: paymentMode === 'cash' ? customerName ?? null : null,
        total_amount: total,
      })
      .select()
      .single();
    if (billErr || !bill) throw billErr ?? new Error('Bill insert returned no row');

    const { error: itemsErr } = await db.from('bill_items').insert(
      lines.map((l) => ({
        bill_id: bill.id,
        item_id: l.item_id,
        quantity: l.quantity,
        unit_price: l.unit_price,
        total_amount: l.total,
      })),
    );
    if (itemsErr) throw itemsErr;

    void captureServerEvent(staff.staffId, 'bill_created', {
      billId: bill.id,
      paymentMode,
      total,
      itemCount: lines.length,
    });

    revalidatePath('/billing');
    revalidatePath('/dashboard');

    return {
      ok: true,
      data: {
        billNumber: bill.bill_number as number,
        paymentMode,
        paymentRef: bill.payment_ref as string | null,
        customerName: bill.customer_name as string | null,
        lines: lines.map(({ item_id: _i, ...l }) => l),
        subtotal,
        tax,
        total,
        createdAt: bill.created_at as string,
      },
    };
  } catch (error) {
    console.error('[billing] createBill failed:', error);
    return { ok: false, error: 'Could not save the bill. Try again.' };
  }
}
