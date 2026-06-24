import { cookies } from 'next/headers';
import { createHmac } from 'crypto';
import type { StaffRole } from '@/lib/constants';

export interface SessionPayload {
  staffId: string;
  name: string;
  role: StaffRole;
}

function sign(payload: string): string {
  return createHmac('sha256', process.env.SESSION_SECRET!)
    .update(payload)
    .digest('hex');
}

export function encodeSession(payload: SessionPayload): string {
  const data = JSON.stringify(payload);
  const encoded = Buffer.from(data).toString('base64');
  const sig = sign(encoded);
  return `${encoded}.${sig}`;
}

export function decodeSession(cookie: string): SessionPayload | null {
  const parts = cookie.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  if (sign(encoded) !== sig) return null;
  try {
    return JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get('vivah_session')?.value;
  if (!raw) return null;
  return decodeSession(raw);
}

export async function requireRole(roles: StaffRole[]): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error('Unauthenticated');
  if (!roles.includes(session.role)) throw new Error('Forbidden');
  return session;
}
