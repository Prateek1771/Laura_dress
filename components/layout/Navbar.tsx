'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { LogoutButton } from './LogoutButton';
import type { StaffRole } from '@/lib/constants';

interface NavLink {
  href: string;
  label: string;
}

// Role → nav links (RoleNav merged here — one source, no separate file).
const LINKS: Record<StaffRole, NavLink[]> = {
  stylist: [
    { href: '/onboarding', label: 'Onboarding' },
    { href: '/explore', label: 'Explore' },
  ],
  cashier: [
    { href: '/billing', label: 'Billing' },
    { href: '/returns', label: 'Returns' },
  ],
  owner: [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/inventory', label: 'Inventory' },
    { href: '/billing', label: 'Billing' },
    { href: '/returns', label: 'Returns' },
    { href: '/settings', label: 'Settings' },
  ],
};

interface NavbarProps {
  name: string;
  role: StaffRole;
}

export function Navbar({ name, role }: NavbarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const links = LINKS[role];

  const linkClass = (href: string) =>
    `rounded-[--radius-button] px-3 py-2 text-sm font-medium transition-colors ${
      pathname.startsWith(href)
        ? 'bg-surface-soft text-primary'
        : 'text-ink-secondary hover:bg-surface-soft'
    }`;

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href={links[0].href} className="font-display text-xl font-semibold text-ink">
            VivahStyle
          </Link>
          <nav className="hidden gap-1 md:flex">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className={linkClass(l.href)}>
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-ink-muted sm:inline">{name}</span>
          <div className="hidden md:block">
            <LogoutButton />
          </div>
          <button
            type="button"
            className="rounded-[--radius-button] px-3 py-2 text-ink-secondary hover:bg-surface-soft md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            ☰
          </button>
        </div>
      </div>
      {open && (
        <nav className="flex flex-col gap-1 border-t border-border px-4 py-2 md:hidden">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={linkClass(l.href)} onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          <div className="pt-2">
            <LogoutButton />
          </div>
        </nav>
      )}
    </header>
  );
}
