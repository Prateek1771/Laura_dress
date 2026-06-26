'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export interface GalleryTryon {
  id: string;
  itemId: string;
  name: string;
  image: string | null;
  createdAt: string;
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

// Full-screen try-on gallery overlay. Shared by the explore top bar and dress-detail header.
export function TryOnGalleryModal({ sessionId, onClose }: { sessionId: string; onClose: () => void }) {
  const [tryons, setTryons] = useState<GalleryTryon[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/tryon?sessionId=${sessionId}`);
        const body = await res.json();
        if (!alive) return;
        if (body.ok) setTryons(body.data.tryons);
        else setError(body.error);
      } catch {
        if (alive) setError('Could not load the gallery.');
      }
    })();
    return () => {
      alive = false;
    };
  }, [sessionId]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink/60 p-4" onClick={onClose}>
      <div
        className="mx-auto flex h-full w-full max-w-2xl flex-col overflow-hidden rounded-[--radius-card] bg-surface"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border p-5">
          <h2 className="font-display text-lg font-semibold text-ink">Try-On Gallery</h2>
          <button onClick={onClose} className="text-xl leading-none text-ink-muted hover:text-ink">
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto p-5">
          {error && <p className="text-sm text-status-danger">{error}</p>}
          {!tryons && !error && <p className="text-sm text-ink-secondary">Loading…</p>}
          {tryons && tryons.length === 0 && (
            <p className="text-sm text-ink-muted">No try-ons yet. Tap ✨ Preview My Look on any dress.</p>
          )}
          {tryons?.map((t) => (
            <div key={t.id} className="flex gap-3 rounded-[--radius-card] border border-border p-3">
              <div className="h-32 w-24 flex-none overflow-hidden rounded-[--radius-input] bg-surface-soft">
                {t.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.image} alt={t.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] text-ink-muted">No image</div>
                )}
              </div>
              <div className="h-32 w-24 flex-none overflow-hidden rounded-[--radius-input] bg-surface-soft">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/tryon/${t.id}/image`} alt={`${t.name} preview`} className="h-full w-full object-cover" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <h3 className="line-clamp-2 font-display text-sm font-semibold text-ink">{t.name}</h3>
                <p className="text-xs text-ink-muted">{fmtDate(t.createdAt)}</p>
                <Link
                  href={`/explore/${t.itemId}?session=${sessionId}`}
                  className="mt-auto text-sm font-semibold text-primary hover:underline"
                >
                  Try Another Dress →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
