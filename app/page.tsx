'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { STAFF_ROLES, type StaffRole } from '@/lib/constants';

const ROLE_HOME: Record<StaffRole, string> = {
  owner: '/dashboard',
  cashier: '/billing',
  stylist: '/onboarding',
};

// ponytail: demo-only credentials, drop before real deploy
const DEMO_STORE_CODE = 'VIVAH01';

export default function StorePage() {
  const router = useRouter();
  const [storeCode, setStoreCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function signIn(code: string, pass: string) {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeCode: code, password: pass }),
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
    void signIn(storeCode, password);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ivory px-4">
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
          <p className="mb-2 text-center text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
            Demo quick login
          </p>
          <div className="flex gap-2">
            {STAFF_ROLES.map((role) => (
              <Button
                key={role}
                type="button"
                variant="secondary"
                size="sm"
                className="flex-1 capitalize"
                disabled={loading}
                onClick={() => signIn(DEMO_STORE_CODE, `${role}123`)}
              >
                {role}
              </Button>
            ))}
          </div>
        </div>
      </Card>
    </main>
  );
}
