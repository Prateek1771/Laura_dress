'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Reveal } from '@/components/motion/Reveal';
import type { StaffRole } from '@/lib/constants';

const ROLE_HOME: Record<StaffRole, string> = {
  owner: '/dashboard',
  cashier: '/billing',
  stylist: '/onboarding',
};

// Demo creds (also in README + scripts/seed.mjs). Single-store in-store app, fine to expose.
const DEMO_STORE = 'VIVAH01';
const DEMO = [
  { label: 'Owner', pwd: 'owner123' },
  { label: 'Cashier', pwd: 'cashier123' },
  { label: 'Stylist', pwd: 'stylist123' },
];

export default function StorePage() {
  const router = useRouter();
  const [storeCode, setStoreCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function login(code: string, pwd: string) {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeCode: code, password: pwd }),
      });
      const body = await res.json();
      if (!body.ok) {
        setError(body.error ?? 'Could not sign you in.');
        return;
      }
      router.replace(ROLE_HOME[body.data.role as StaffRole]);
    } catch {
      setError('Could not reach the server. Try again.');
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    login(storeCode, password);
  }

  function quickLogin(pwd: string) {
    setStoreCode(DEMO_STORE);
    setPassword(pwd);
    login(DEMO_STORE, pwd);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ivory px-4">
      <Reveal className="w-full max-w-sm">
      <Card className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="font-display text-3xl font-semibold text-ink">VivahStyle</h1>
          <p className="mt-1 text-sm text-ink-muted">Staff sign in</p>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Input
            label="Store Code"
            value={storeCode}
            onChange={(e) => setStoreCode(e.target.value)}
            autoCapitalize="characters"
            autoComplete="off"
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          {error && <p className="text-[12px] text-status-danger">{error}</p>}
          <Button type="submit" size="lg" disabled={loading}>
            {loading ? 'Signing in…' : 'Enter Store'}
          </Button>
        </form>
        <div className="mt-6 border-t border-border pt-4">
          <span className="text-xs text-ink-muted">Demo quick login</span>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {DEMO.map((d) => (
              <Button key={d.label} variant="secondary" disabled={loading} onClick={() => quickLogin(d.pwd)}>
                {d.label}
              </Button>
            ))}
          </div>
        </div>
      </Card>
      </Reveal>
    </main>
  );
}
