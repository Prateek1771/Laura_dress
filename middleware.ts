import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decodeSession } from '@/lib/auth';

const ROLE_HOME: Record<string, string> = {
  owner: '/dashboard',
  cashier: '/billing',
  stylist: '/onboarding',
};

const PROTECTED_PREFIXES: Record<string, string[]> = {
  '/(admin)': ['owner'],
  '/dashboard': ['owner'],
  '/inventory': ['owner'],
  '/settings': ['owner'],
  '/(cashier)': ['cashier', 'owner'],
  '/billing': ['cashier', 'owner'],
  '/returns': ['cashier', 'owner'],
  '/(stylist)': ['stylist', 'owner'],
  '/onboarding': ['stylist', 'owner'],
  '/explore': ['stylist', 'cashier', 'owner'],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/' || pathname === '/guidelines' || pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const raw = request.cookies.get('vivah_session')?.value;
  const session = raw ? decodeSession(raw) : null;

  if (!session) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  for (const [prefix, roles] of Object.entries(PROTECTED_PREFIXES)) {
    if (pathname.startsWith(prefix) && !roles.includes(session.role)) {
      const home = ROLE_HOME[session.role] ?? '/';
      return NextResponse.redirect(new URL(home, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
