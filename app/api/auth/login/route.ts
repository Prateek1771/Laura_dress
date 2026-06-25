import { cookies } from 'next/headers';

import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { createServerClient } from '@/lib/insforge/server';
import { encodeSession } from '@/lib/auth';
import { captureServerEvent } from '@/lib/posthog';
import type { StaffRole } from '@/lib/constants';

const schema = z.object({
  storeCode: z.string().min(1),
  password: z.string().min(1),
});

interface StaffRow {
  id: string;
  name: string;
  role: StaffRole;
  password_hash: string;
}

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return Response.json({ ok: false, error: 'Enter a store code and password.' }, { status: 400 });
    }
    const { storeCode, password } = parsed.data;
    const db = createServerClient().database;

    const store = await db
      .from('store_settings')
      .select('store_code')
      .eq('store_code', storeCode)
      .maybeSingle();
    if (store.error) throw store.error;

    const staff = await db
      .from('staff')
      .select('id, name, role, password_hash')
      .eq('active', true);
    if (staff.error) throw staff.error;

    // Generic message for any failure — never reveal which field was wrong.
    let matched: StaffRow | null = null;
    if (store.data) {
      for (const s of (staff.data ?? []) as StaffRow[]) {
        if (await bcrypt.compare(password, s.password_hash)) {
          matched = s;
          break;
        }
      }
    }
    if (!matched) {
      return Response.json({ ok: false, error: 'Invalid store code or password.' }, { status: 401 });
    }

    const cookie = await encodeSession({ staffId: matched.id, name: matched.name, role: matched.role });
    const cookieStore = await cookies();
    cookieStore.set('vivah_session', cookie, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 28800,
    });

    // Fire and forget — never block login on analytics.
    void captureServerEvent(matched.id, 'staff_logged_in', { role: matched.role });

    return Response.json({ ok: true, data: { role: matched.role } });
  } catch (error) {
    console.error('[auth] login failed:', error);
    return Response.json({ ok: false, error: 'Could not sign you in. Try again.' }, { status: 500 });
  }
}
