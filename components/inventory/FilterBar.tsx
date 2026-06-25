import Link from 'next/link';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ALL_CATEGORIES, AVAILABILITY } from '@/lib/constants';

const labelize = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

interface FilterBarProps {
  q: string;
  gender: string;
  category: string;
  availability: string;
}

// Plain GET form — no client JS; the server page reads the resulting searchParams.
export function FilterBar({ q, gender, category, availability }: FilterBarProps) {
  return (
    <form method="get" className="flex flex-wrap items-end gap-3">
      <div className="min-w-48 flex-1">
        <Input label="Search" name="q" defaultValue={q} placeholder="Name or dress ID" />
      </div>
      <Select
        label="Gender"
        name="gender"
        defaultValue={gender}
        options={[
          { value: '', label: 'All' },
          { value: 'men', label: 'Men' },
          { value: 'women', label: 'Women' },
        ]}
      />
      <Select
        label="Category"
        name="category"
        defaultValue={category}
        options={[{ value: '', label: 'All' }, ...ALL_CATEGORIES.map((c) => ({ value: c, label: labelize(c) }))]}
      />
      <Select
        label="Stock"
        name="availability"
        defaultValue={availability}
        options={[{ value: '', label: 'All' }, ...AVAILABILITY.map((a) => ({ value: a, label: labelize(a) }))]}
      />
      <Button type="submit" variant="secondary" size="sm">
        Filter
      </Button>
      <Link
        href="/inventory"
        className="px-2 py-2 text-sm font-medium text-ink-muted hover:text-ink"
      >
        Clear
      </Link>
    </form>
  );
}
