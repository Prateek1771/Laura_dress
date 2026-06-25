'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ImageUploader } from './ImageUploader';
import {
  MEN_CATEGORIES,
  WOMEN_CATEGORIES,
  OCCASIONS,
  COLORS,
  FABRICS,
  AVAILABILITY,
} from '@/lib/constants';
import type { InventoryItem } from '@/lib/insforge/types';

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '38', '40', '42', '44', '46'];

const labelize = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const toOptions = (vals: readonly string[]) => vals.map((v) => ({ value: v, label: labelize(v) }));

const AI_BORDER = 'border-l-4 border-l-gold';

function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res((r.result as string).split(',')[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

interface ItemFormProps {
  action: (formData: FormData) => Promise<{ ok: false; error: string }>;
  item?: InventoryItem;
}

export function ItemForm({ action, item }: ItemFormProps) {
  const router = useRouter();
  const [name, setName] = useState(item?.name ?? '');
  const [price, setPrice] = useState(item ? String(item.price) : '');
  const [gender, setGender] = useState<'men' | 'women'>(item?.gender ?? 'men');
  const [category, setCategory] = useState(item?.category ?? '');
  const [fabric, setFabric] = useState(item?.fabric ?? '');
  const [occasions, setOccasions] = useState<string[]>(item?.occasions ?? []);
  const [colors, setColors] = useState<string[]>(item?.colors ?? []);
  const [sizes, setSizes] = useState<string[]>(item?.sizes ?? []);
  const [tags, setTags] = useState<string[]>(item?.tags ?? []);
  const [tagDraft, setTagDraft] = useState('');
  const [existingImages, setExistingImages] = useState<string[]>(item?.images ?? []);
  const [files, setFiles] = useState<File[]>([]);
  const [aiFields, setAiFields] = useState<Set<string>>(new Set());
  const [analysing, setAnalysing] = useState(false);
  const [aiError, setAiError] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const categoryOptions = toOptions(gender === 'men' ? MEN_CATEGORIES : WOMEN_CATEGORIES);

  function onGenderChange(next: 'men' | 'women') {
    setGender(next);
    const allowed = (next === 'men' ? MEN_CATEGORIES : WOMEN_CATEGORIES) as readonly string[];
    if (!allowed.includes(category)) setCategory('');
  }

  function clearAi(key: string) {
    setAiFields((prev) => {
      if (!prev.has(key)) return prev;
      const n = new Set(prev);
      n.delete(key);
      return n;
    });
  }

  function addTag() {
    const t = tagDraft.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagDraft('');
  }

  async function autoFill() {
    if (!files.length) return;
    setAiError('');
    setAnalysing(true);
    try {
      const b64 = await fileToBase64(files[0]);
      const res = await fetch('/api/inventory/autofill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: b64 }),
      });
      const body = await res.json();
      if (!body.ok) {
        setAiError(body.error ?? "Couldn't read this image. Fill in manually.");
        return;
      }
      const d = body.data;
      const filled = new Set<string>();
      if (d.name) {
        setName(d.name);
        filled.add('name');
      }
      if (d.gender) setGender(d.gender);
      if (d.category) {
        setCategory(d.category);
        filled.add('category');
      }
      if (d.colors?.length) setColors(d.colors);
      if (d.occasions?.length) setOccasions(d.occasions);
      if (d.fabric) {
        setFabric(d.fabric);
        filled.add('fabric');
      }
      if (d.tags?.length) setTags(d.tags);
      if (d.suggestedPrice && !price) {
        setPrice(String(d.suggestedPrice));
        filled.add('price');
      }
      setAiFields(filled);
    } catch {
      setAiError("Couldn't read this image. Fill in manually.");
    } finally {
      setAnalysing(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    if (!category) {
      setError('Pick a category.');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData(e.currentTarget);
      fd.set('gender', gender);
      fd.set('category', category);
      fd.set('occasions', JSON.stringify(occasions));
      fd.set('colors', JSON.stringify(colors));
      fd.set('sizes', JSON.stringify(sizes));
      fd.set('tags', JSON.stringify(tags));
      fd.set('existingImages', JSON.stringify(existingImages));
      fd.delete('images');
      for (const f of files) fd.append('images', f);

      const result = await action(fd);
      if (result && !result.ok) setError(result.error);
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {item && <input type="hidden" name="id" defaultValue={item.id} />}

      <Card className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Dress ID"
            name="dress_id"
            defaultValue={item?.dress_id ?? ''}
            placeholder="Auto-generated if left blank"
            hint={item ? undefined : 'Leave blank to auto-generate (e.g. SHER-0001).'}
          />
          <Input
            label="Title"
            name="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearAi('name');
            }}
            className={aiFields.has('name') ? AI_BORDER : ''}
            required
          />
        </div>

        <ImageUploader
          existing={existingImages}
          onExistingChange={setExistingImages}
          files={files}
          onFilesChange={setFiles}
        />
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={autoFill}
            disabled={!files.length || analysing}
            title={files.length ? 'Read details from the first image' : 'Add an image first'}
          >
            {analysing ? 'Analysing…' : '✨ Auto Fill'}
          </Button>
          {aiFields.size > 0 && !aiError && (
            <span className="text-xs text-ink-muted">Gold-marked fields are AI suggestions — review them.</span>
          )}
          {aiError && <span className="text-xs text-status-danger">{aiError}</span>}
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">Gender</span>
            <div className="flex gap-2">
              {(['men', 'women'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => onGenderChange(g)}
                  className={`flex-1 rounded-[--radius-button] border px-3 py-2.5 text-sm font-medium capitalize transition-colors ${
                    gender === g ? 'border-primary bg-primary-soft text-primary' : 'border-border text-ink-secondary'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <Select
            label="Category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              clearAi('category');
            }}
            className={aiFields.has('category') ? AI_BORDER : ''}
            placeholder="Select category"
            options={categoryOptions}
          />
          <Input label="Quantity" name="quantity" type="number" min={0} defaultValue={item?.quantity ?? 1} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Price (₹)"
            name="price"
            type="number"
            min={0}
            step="1"
            value={price}
            onChange={(e) => {
              setPrice(e.target.value);
              clearAi('price');
            }}
            className={aiFields.has('price') ? AI_BORDER : ''}
            required
          />
          <Select
            label="Fabric"
            name="fabric"
            value={fabric}
            onChange={(e) => {
              setFabric(e.target.value);
              clearAi('fabric');
            }}
            className={aiFields.has('fabric') ? AI_BORDER : ''}
            placeholder="Select fabric"
            options={toOptions(FABRICS)}
          />
          <Select
            label="Availability"
            name="availability"
            defaultValue={item?.availability ?? 'in_stock'}
            options={toOptions(AVAILABILITY)}
          />
        </div>
      </Card>

      <Card className="flex flex-col gap-5">
        <ChipGroup label="Occasions" options={OCCASIONS} selected={occasions} onToggle={setOccasions} />
        <ChipGroup label="Colors" options={COLORS} selected={colors} onToggle={setColors} />
        <ChipGroup label="Sizes" options={SIZE_OPTIONS} selected={sizes} onToggle={setSizes} />

        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">Tags</span>
          <div className="flex gap-2">
            <input
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="Type a tag and press Enter"
              className="flex-1 rounded-[--radius-input] border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft"
            />
            <Button type="button" variant="secondary" size="sm" onClick={addTag}>
              Add
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-2">
              {tags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTags(tags.filter((x) => x !== t))}
                  className="rounded-[--radius-badge] bg-surface-soft px-2.5 py-1 text-xs text-ink-secondary"
                >
                  {t} ×
                </button>
              ))}
            </div>
          )}
        </div>
      </Card>

      {error && <p className="text-sm text-status-danger">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : item ? 'Save Changes' : 'Add Item'}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push('/inventory')}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function ChipGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onToggle: (next: string[]) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const on = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onToggle(on ? selected.filter((x) => x !== opt) : [...selected, opt])}
              className={`rounded-[--radius-badge] border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                on ? 'border-primary bg-primary-soft text-primary' : 'border-border text-ink-secondary hover:bg-surface-soft'
              }`}
            >
              {labelize(opt)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
