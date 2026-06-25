'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { formatINR } from '@/lib/format';
import { recordReturn } from '@/app/(app)/returns/actions';

interface LookupItem {
  id: string;
  dress_id: string;
  name: string;
  price: number;
  images: string[];
}

export function ReturnsForm() {
  const [dressId, setDressId] = useState('');
  const [item, setItem] = useState<LookupItem | null>(null);
  const [notes, setNotes] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [finding, setFinding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function find(e: React.FormEvent) {
    e.preventDefault();
    const q = dressId.trim();
    if (!q) return;
    setLookupError('');
    setItem(null);
    setFinding(true);
    try {
      const res = await fetch(`/api/inventory/lookup?dressId=${encodeURIComponent(q)}`);
      const body = await res.json();
      if (!body.ok) {
        setLookupError(body.error);
        return;
      }
      setItem(body.data as LookupItem);
    } catch {
      setLookupError('Lookup failed. Try again.');
    } finally {
      setFinding(false);
    }
  }

  async function submit() {
    if (!item) return;
    setError('');
    setSaving(true);
    try {
      const result = await recordReturn({ dressId: item.dress_id, notes: notes || undefined });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDone(result.data.name);
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setDone(null);
    setItem(null);
    setDressId('');
    setNotes('');
    setError('');
    setLookupError('');
  }

  if (done) {
    return (
      <Card className="flex flex-col gap-4">
        <div className="rounded-[--radius-card] border border-status-success/30 bg-[color-mix(in_srgb,var(--color-status-success)_8%,white)] px-4 py-3 text-sm text-status-success">
          Return recorded for {done}.
        </div>
        <button type="button" onClick={reset} className="self-start text-sm font-medium text-primary hover:underline">
          Record Another
        </button>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-4">
      <form onSubmit={find} className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            label="Dress ID"
            value={dressId}
            onChange={(e) => setDressId(e.target.value)}
            placeholder="e.g. SARE-0001"
          />
        </div>
        <Button type="submit" variant="secondary" disabled={finding}>
          {finding ? 'Finding…' : 'Find'}
        </Button>
      </form>
      {lookupError && <p className="text-sm text-status-danger">{lookupError}</p>}

      {item && (
        <>
          <div className="flex items-center gap-3 rounded-[--radius-card] border border-border p-3">
            {item.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.images[0]} alt="" className="h-14 w-14 rounded object-cover" />
            ) : (
              <div className="h-14 w-14 rounded bg-surface-soft" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{item.name}</p>
              <Badge variant="dress-id">{item.dress_id}</Badge>
            </div>
            <span className="text-sm font-semibold text-ink">{formatINR(item.price)}</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="notes"
              className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted"
            >
              Notes (optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="rounded-[--radius-input] border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft"
            />
          </div>

          {error && <p className="text-sm text-status-danger">{error}</p>}
          <Button onClick={submit} disabled={saving}>
            {saving ? 'Saving…' : 'Record Return'}
          </Button>
        </>
      )}
    </Card>
  );
}
