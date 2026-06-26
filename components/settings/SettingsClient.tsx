'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { STAFF_ROLES, type StaffRole } from '@/lib/constants';
import { updateTax, regenerateStoreCode, addStaff, toggleStaff } from '@/app/(app)/settings/actions';

const labelize = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

interface StoreInfo {
  storeName: string;
  storeCode: string;
  currency: string;
  taxPercent: number;
}
interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  active: boolean;
}

export function SettingsClient({ store, staff }: { store: StoreInfo; staff: StaffMember[] }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <StoreSection store={store} />
      <StaffSection staff={staff} />
    </div>
  );
}

function StoreSection({ store }: { store: StoreInfo }) {
  const [code, setCode] = useState(store.storeCode);
  const [tax, setTax] = useState(String(store.taxPercent));
  const [copied, setCopied] = useState(false);
  const [savingTax, setSavingTax] = useState(false);
  const [taxMsg, setTaxMsg] = useState('');
  const [regenerating, setRegenerating] = useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be blocked */
    }
  }

  async function saveTax() {
    setSavingTax(true);
    setTaxMsg('');
    const res = await updateTax(Number(tax));
    setTaxMsg(res.ok ? 'Saved.' : res.error);
    setSavingTax(false);
  }

  async function regenerate() {
    if (!window.confirm('This will log out all staff. Confirm?')) return;
    setRegenerating(true);
    const res = await regenerateStoreCode();
    if (res.ok) setCode(res.code);
    setRegenerating(false);
  }

  return (
    <Card className="flex flex-col gap-5">
      <h2 className="font-display text-lg font-semibold text-ink">Store</h2>

      <Field label="Store Name">
        <p className="text-sm text-ink">{store.storeName}</p>
      </Field>

      <Field label="Store Code">
        <div className="flex flex-wrap items-center gap-2">
          <code className="rounded-[--radius-input] bg-surface-soft px-2.5 py-1 text-sm font-semibold text-ink">{code}</code>
          <Button variant="secondary" size="sm" onClick={copyCode}>
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          <Button variant="ghost" size="sm" onClick={regenerate} disabled={regenerating}>
            {regenerating ? 'Regenerating…' : 'Regenerate Code'}
          </Button>
        </div>
        <p className="mt-1 text-xs text-ink-muted">Regenerating the code requires all staff to log out and re-enter.</p>
      </Field>

      <Field label="Currency">
        <p className="text-sm text-ink">₹ INR</p>
      </Field>

      <div className="flex flex-col gap-1.5">
        <Input
          label="Tax Percent (GST)"
          type="number"
          min={0}
          max={100}
          step="0.5"
          value={tax}
          onChange={(e) => setTax(e.target.value)}
        />
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={saveTax} disabled={savingTax}>
            {savingTax ? 'Saving…' : 'Save Tax'}
          </Button>
          {taxMsg && <span className="text-sm text-ink-secondary">{taxMsg}</span>}
        </div>
      </div>
    </Card>
  );
}

function StaffSection({ staff }: { staff: StaffMember[] }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<StaffRole>('stylist');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function submit() {
    setError('');
    setSaving(true);
    const res = await addStaff({ name, role, password });
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setName('');
    setPassword('');
    setRole('stylist');
    setAdding(false);
  }

  async function toggle(member: StaffMember) {
    setBusyId(member.id);
    await toggleStaff(member.id, !member.active);
    setBusyId(null);
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-ink">Staff</h2>
        <Button size="sm" variant={adding ? 'ghost' : 'secondary'} onClick={() => setAdding((a) => !a)}>
          {adding ? 'Cancel' : 'Add Staff'}
        </Button>
      </div>

      {adding && (
        <div className="flex flex-col gap-3 rounded-[--radius-card] border border-border bg-surface-soft p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Select
              label="Role"
              value={role}
              onChange={(e) => setRole(e.target.value as StaffRole)}
              options={STAFF_ROLES.map((r) => ({ value: r, label: labelize(r) }))}
            />
          </div>
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hint="Must be unique across all staff."
          />
          {error && <p className="text-sm text-status-danger">{error}</p>}
          <Button size="sm" onClick={submit} disabled={saving}>
            {saving ? 'Adding…' : 'Add Staff Member'}
          </Button>
        </div>
      )}

      <div className="flex flex-col divide-y divide-border">
        {staff.map((m) => (
          <div key={m.id} className="flex items-center justify-between gap-3 py-2.5">
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-medium text-ink">{m.name}</span>
              <Badge variant="neutral">{labelize(m.role)}</Badge>
              {!m.active && <Badge variant="danger">Inactive</Badge>}
            </div>
            <Button variant="ghost" size="sm" onClick={() => toggle(m)} disabled={busyId === m.id}>
              {m.active ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        ))}
        {staff.length === 0 && <p className="py-3 text-sm text-ink-muted">No staff yet.</p>}
      </div>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">{label}</span>
      {children}
    </div>
  );
}
