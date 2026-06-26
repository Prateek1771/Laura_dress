'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { DressCard } from './DressCard';
import { CoupleMatchPanel, type PartnerMatch } from './CoupleMatchPanel';
import { TryOnGalleryModal } from '@/components/dress/TryOnGalleryModal';
import { ALL_CATEGORIES, COLORS } from '@/lib/constants';
import type { InventoryItem } from '@/lib/insforge/types';

const labelize = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'az', label: 'A–Z' },
];

export function ExploreClient({
  items,
  sessionId,
  wantsCombo = false,
  openGallery = false,
}: {
  items: InventoryItem[];
  sessionId: string | null;
  wantsCombo?: boolean;
  openGallery?: boolean;
}) {
  const [sort, setSort] = useState('newest');
  const [galleryOpen, setGalleryOpen] = useState(openGallery && Boolean(sessionId));
  const [gender, setGender] = useState('');
  const [category, setCategory] = useState('');
  const [colors, setColors] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [scores, setScores] = useState<Map<string, number> | null>(null);
  const [kidsMode, setKidsMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shopError, setShopError] = useState('');

  const [anchor, setAnchor] = useState<InventoryItem | null>(null);
  const coupleCache = useRef<Map<string, PartnerMatch[]>>(new Map());
  const comboOn = wantsCombo && Boolean(sessionId);

  const suggestActive = scores !== null;

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (gender && i.gender !== gender) return false;
      if (category && i.category !== category) return false;
      if (colors.length && !i.colors.some((c) => colors.includes(c))) return false;
      if (priceMin && i.price < Number(priceMin)) return false;
      if (priceMax && i.price > Number(priceMax)) return false;
      return true;
    });
  }, [items, gender, category, colors, priceMin, priceMax]);

  const ordered = useMemo(() => {
    const list = [...filtered];
    if (suggestActive && !kidsMode) {
      const matched = list.filter((i) => scores!.has(i.id)).sort((a, b) => scores!.get(b.id)! - scores!.get(a.id)!);
      const rest = list.filter((i) => !scores!.has(i.id));
      return [...matched, ...rest];
    }
    switch (sort) {
      case 'price_asc':
        return list.sort((a, b) => a.price - b.price);
      case 'price_desc':
        return list.sort((a, b) => b.price - a.price);
      case 'az':
        return list.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return list.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    }
  }, [filtered, sort, suggestActive, kidsMode, scores]);

  async function shopSuggested() {
    if (!sessionId) return;
    setShopError('');
    setLoading(true);
    try {
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      const body = await res.json();
      if (!body.ok) {
        setShopError(body.error);
        return;
      }
      if (body.data.shoppingFor === 'kids') {
        setKidsMode(true);
        setScores(new Map());
        return;
      }
      const m = new Map<string, number>();
      for (const s of body.data.scored as { itemId: string; matchScore: number }[]) m.set(s.itemId, s.matchScore);
      setScores(m);
    } catch {
      setShopError('Could not load suggestions. Try again.');
    } finally {
      setLoading(false);
    }
  }

  function clearSuggested() {
    setScores(null);
    setKidsMode(false);
  }

  const matchedCount = suggestActive && !kidsMode ? ordered.filter((i) => scores!.has(i.id)).length : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        {suggestActive ? (
          <Button variant="secondary" onClick={clearSuggested}>
            ✕ Clear Suggestions
          </Button>
        ) : (
          <Button onClick={shopSuggested} disabled={!sessionId || loading}>
            {loading ? 'Finding matches…' : '✨ Shop Suggested'}
          </Button>
        )}
        <div className="w-48">
          <Select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            options={SORTS}
            disabled={suggestActive && !kidsMode}
          />
        </div>
        <Button variant="ghost" onClick={() => setShowFilters((s) => !s)}>
          {showFilters ? 'Hide Filters' : 'Filters'}
        </Button>
        {sessionId && (
          <Button variant="ghost" onClick={() => setGalleryOpen(true)} title="Try-On Gallery">
            📷 Gallery
          </Button>
        )}
        <span className="ml-auto text-sm text-ink-muted">{ordered.length} items</span>
      </div>

      {!sessionId && (
        <div className="rounded-[--radius-card] border border-border bg-surface-soft px-4 py-2.5 text-sm text-ink-secondary">
          No active session —{' '}
          <Link href="/onboarding" className="font-semibold text-primary hover:underline">
            Start Onboarding →
          </Link>
        </div>
      )}
      {shopError && <p className="text-sm text-status-danger">{shopError}</p>}
      {kidsMode && (
        <div className="rounded-[--radius-card] border border-border bg-surface-soft px-4 py-2.5 text-sm text-ink-secondary">
          Score-based matching is not available for kids — browsing all items.
        </div>
      )}
      {suggestActive && !kidsMode && (
        <p className="text-sm text-ink-secondary">
          {matchedCount > 0
            ? `${matchedCount} matched outfits for this customer.`
            : "No dresses match this customer's preferences — try clearing the price range or broadening the occasion selection."}
        </p>
      )}

      {showFilters && (
        <div className="grid gap-4 rounded-[--radius-card] border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            label="Gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            options={[
              { value: '', label: 'All' },
              { value: 'men', label: 'Men' },
              { value: 'women', label: 'Women' },
            ]}
          />
          <Select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={[{ value: '', label: 'All' }, ...ALL_CATEGORIES.map((c) => ({ value: c, label: labelize(c) }))]}
          />
          <Input label="Min Price" type="number" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} />
          <Input label="Max Price" type="number" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} />
          <div className="sm:col-span-2 lg:col-span-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">Colors</span>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {COLORS.map((c) => {
                const on = colors.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColors(on ? colors.filter((x) => x !== c) : [...colors, c])}
                    className={`rounded-[--radius-badge] border px-2.5 py-1 text-xs capitalize transition-colors ${
                      on ? 'border-primary bg-primary-soft text-primary' : 'border-border text-ink-secondary hover:bg-surface-soft'
                    }`}
                  >
                    {labelize(c)}
                  </button>
                );
              })}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setGender('');
              setCategory('');
              setColors([]);
              setPriceMin('');
              setPriceMax('');
            }}
            className="justify-self-start text-sm font-medium text-primary hover:underline"
          >
            Clear All
          </button>
        </div>
      )}

      {ordered.length === 0 ? (
        <div className="rounded-[--radius-card] border border-dashed border-border py-16 text-center text-sm text-ink-muted">
          No dresses match your filters. Try clearing some filters.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {ordered.map((item) => {
            const score = suggestActive && !kidsMode ? scores!.get(item.id) ?? null : null;
            const dimmed = suggestActive && !kidsMode && !scores!.has(item.id);
            return (
              <DressCard
                key={item.id}
                item={item}
                sessionId={sessionId}
                score={score}
                dimmed={dimmed}
                onFindMatch={comboOn ? setAnchor : undefined}
              />
            );
          })}
        </div>
      )}

      {anchor && sessionId && (
        <CoupleMatchPanel
          anchor={anchor}
          sessionId={sessionId}
          cache={coupleCache.current}
          onClose={() => setAnchor(null)}
        />
      )}

      {galleryOpen && sessionId && (
        <TryOnGalleryModal sessionId={sessionId} onClose={() => setGalleryOpen(false)} />
      )}
    </div>
  );
}
