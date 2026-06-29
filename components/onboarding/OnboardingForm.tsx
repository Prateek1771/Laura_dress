'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Reveal } from '@/components/motion/Reveal';
import { SHOPPING_FOR, OCCASIONS, MEN_CATEGORIES, WOMEN_CATEGORIES, SKIN_TONES } from '@/lib/constants';
import { createSession } from '@/app/(app)/onboarding/actions';

type ShoppingFor = (typeof SHOPPING_FOR)[number];
type SkinTone = (typeof SKIN_TONES)[number];

const SHOPPING_LABELS: Record<ShoppingFor, string> = {
  male: 'Men',
  female: 'Women',
  couple: 'Couple',
  kids: 'Kids',
};

const labelize = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const toOptions = (vals: readonly string[]) => vals.map((v) => ({ value: v, label: labelize(v) }));

export function OnboardingForm() {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [shoppingFor, setShoppingFor] = useState<ShoppingFor>('female');
  const [occasions, setOccasions] = useState<string[]>([]);
  const [category, setCategory] = useState('');
  const [groomCategory, setGroomCategory] = useState('');
  const [brideCategory, setBrideCategory] = useState('');
  const [wantsCombo, setWantsCombo] = useState(false);
  const [skinTone, setSkinTone] = useState<SkinTone | ''>('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const showCategory = shoppingFor === 'male' || shoppingFor === 'female';
  const categoryOptions = toOptions(shoppingFor === 'male' ? MEN_CATEGORIES : WOMEN_CATEGORIES);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!occasions.length) {
      setError('Pick at least one occasion.');
      return;
    }
    setSaving(true);
    try {
      const result = await createSession({
        customerName: name,
        customerAge: age ? Number(age) : null,
        shoppingFor,
        occasions: occasions as never,
        category: showCategory && category ? (category as never) : null,
        skinTone: skinTone || null,
        wantsCoupleCombo: wantsCombo,
        priceMin: priceMin ? Number(priceMin) : null,
        priceMax: priceMax ? Number(priceMax) : null,
      });
      if (result && !result.ok) setError(result.error);
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Reveal stagger className="flex flex-col gap-5">
      <Card className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Age (optional)" type="number" min={0} value={age} onChange={(e) => setAge(e.target.value)} />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">Shopping For</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {SHOPPING_FOR.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setShoppingFor(s)}
                className={`rounded-[--radius-card] border px-3 py-4 text-sm font-semibold transition-colors ${
                  shoppingFor === s ? 'border-primary bg-primary-soft text-primary' : 'border-border text-ink-secondary hover:bg-surface-soft'
                }`}
              >
                {SHOPPING_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
            Occasions <span className="text-status-danger">*</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {OCCASIONS.map((o) => {
              const on = occasions.includes(o);
              return (
                <button
                  key={o}
                  type="button"
                  onClick={() => setOccasions(on ? occasions.filter((x) => x !== o) : [...occasions, o])}
                  className={`rounded-[--radius-badge] border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                    on ? 'border-primary bg-primary-soft text-primary' : 'border-border text-ink-secondary hover:bg-surface-soft'
                  }`}
                >
                  {labelize(o)}
                </button>
              );
            })}
          </div>
        </div>

        {showCategory && (
          <Select
            label="Category / Style Preference"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Any style"
            options={categoryOptions}
          />
        )}

        {shoppingFor === 'couple' && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Groom's Style"
                value={groomCategory}
                onChange={(e) => setGroomCategory(e.target.value)}
                placeholder="Any style"
                options={toOptions(MEN_CATEGORIES)}
              />
              <Select
                label="Bride's Style"
                value={brideCategory}
                onChange={(e) => setBrideCategory(e.target.value)}
                placeholder="Any style"
                options={toOptions(WOMEN_CATEGORIES)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-ink-secondary">
              <input type="checkbox" checked={wantsCombo} onChange={(e) => setWantsCombo(e.target.checked)} />
              Find matching outfits for the couple
            </label>
          </>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Min Price (₹)"
            type="number"
            min={0}
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
          />
          <Input
            label="Max Price (₹)"
            type="number"
            min={0}
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            hint="Leave blank to show all price points"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">Skin Tone</span>
          <p className="text-xs text-ink-secondary">Optional — helps us suggest flattering colors.</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {SKIN_TONES.map((t) => {
              const on = skinTone === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSkinTone(on ? '' : t)}
                  className={`flex flex-col items-center gap-1.5 rounded-[--radius-card] border p-2 text-xs font-semibold capitalize transition-colors ${
                    on ? 'border-primary bg-primary-soft text-primary' : 'border-border text-ink-secondary hover:bg-surface-soft'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/skintones/${t}.jpeg`}
                    alt={`${t} skin tone`}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  {labelize(t)}
                </button>
              );
            })}
          </div>
        </div>
      </Card>
      </Reveal>

      {error && <p className="text-sm text-status-danger">{error}</p>}
      <Button type="submit" size="lg" disabled={saving}>
        {saving ? 'Starting…' : 'Start Exploring'}
      </Button>
    </form>
  );
}
