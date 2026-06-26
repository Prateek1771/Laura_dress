'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { ScoreBar } from '@/components/ui/ScoreBar';
import { formatINR } from '@/lib/format';
import type { InventoryItem } from '@/lib/insforge/types';

export interface PartnerMatch {
  itemId: string;
  name: string;
  price: number;
  image: string | null;
  overall: number;
  colorHarmony: number;
  themeHarmony: number;
  fabricHarmony: number;
}

// Caches partner results per anchor item for the session — re-opening doesn't re-fetch.
type Cache = Map<string, PartnerMatch[]>;

export function CoupleMatchPanel({
  anchor,
  sessionId,
  cache,
  onClose,
}: {
  anchor: InventoryItem;
  sessionId: string;
  cache: Cache;
  onClose: () => void;
}) {
  const [partners, setPartners] = useState<PartnerMatch[] | null>(cache.get(anchor.id) ?? null);
  const [loading, setLoading] = useState(!cache.has(anchor.id));
  const [error, setError] = useState('');

  useEffect(() => {
    if (cache.has(anchor.id)) {
      setPartners(cache.get(anchor.id)!);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    setError('');
    (async () => {
      try {
        const res = await fetch('/api/couple', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, itemId: anchor.id }),
        });
        const body = await res.json();
        if (!alive) return;
        if (!body.ok) {
          setError(body.error);
          return;
        }
        cache.set(anchor.id, body.data.partners);
        setPartners(body.data.partners);
      } catch {
        if (alive) setError('Could not find matching outfits.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [anchor.id, sessionId, cache]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/50" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-md flex-col overflow-y-auto bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border p-5">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">Matching Outfits for This Look</h2>
            <p className="mt-0.5 text-xs text-ink-muted">Paired with {anchor.name}</p>
          </div>
          <button onClick={onClose} className="text-xl leading-none text-ink-muted hover:text-ink">
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-4 p-5">
          {loading && <p className="text-sm text-ink-secondary">Finding the best pairings…</p>}
          {error && <p className="text-sm text-status-danger">{error}</p>}
          {partners && partners.length === 0 && !loading && (
            <p className="text-sm text-ink-muted">No matching partner outfits found for this look.</p>
          )}
          {partners?.map((p) => (
            <div key={p.itemId} className="flex gap-3 rounded-[--radius-card] border border-border p-3">
              <div className="relative h-28 w-20 flex-none overflow-hidden rounded-[--radius-input] bg-surface-soft">
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] text-ink-muted">No image</div>
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/explore/${p.itemId}?session=${sessionId}`}
                      className="line-clamp-2 font-display text-sm font-semibold text-ink hover:underline"
                    >
                      {p.name}
                    </Link>
                    <p className="text-sm font-semibold text-ink">{formatINR(p.price)}</p>
                  </div>
                  <Ring value={p.overall} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <MiniBar label="Color" value={p.colorHarmony} />
                  <MiniBar label="Theme" value={p.themeHarmony} />
                  <MiniBar label="Fabric" value={p.fabricHarmony} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Compatibility ring via pure CSS conic-gradient (no chart lib, tokens only).
function Ring({ value }: { value: number }) {
  return (
    <div
      className="relative flex h-12 w-12 flex-none items-center justify-center rounded-full"
      style={{
        background: `conic-gradient(var(--color-primary) ${value * 3.6}deg, var(--color-score-track) 0deg)`,
      }}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-[11px] font-bold text-ink">
        {value}%
      </div>
    </div>
  );
}

function MiniBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-12 flex-none text-[10px] font-semibold uppercase tracking-wide text-ink-muted">{label}</span>
      <div className="flex-1">
        <ScoreBar score={value} showLabel={false} showTier={false} />
      </div>
      <span className="w-7 flex-none text-right text-[11px] text-ink-secondary">{value}</span>
    </div>
  );
}
