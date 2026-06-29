import { deriveAttrs } from './attributes';
import type { ScoredItem } from './types';

export type Bucket =
  | 'Best Overall'
  | 'Most Premium'
  | 'Most Trending'
  | 'Safest Choice'
  | "Editor's Pick"
  | 'Hidden Gem';

// Order is meaningful — buckets render left-to-right in this order.
export const BUCKETS: Bucket[] = [
  'Best Overall',
  'Most Premium',
  'Most Trending',
  'Safest Choice',
  "Editor's Pick",
  'Hidden Gem',
];

// Pure port of the reference design's ranker.categorize: pick one standout per bucket.
// ponytail: overlap allowed — the same item may win several buckets on a small catalogue;
// de-dup later if it looks repetitive.
function pickBy(scored: ScoredItem[], rank: (s: ScoredItem) => number): string {
  return scored.reduce((best, s) => (rank(s) > rank(best) ? s : best)).item.id;
}

export function categorize(scored: ScoredItem[]): Partial<Record<Bucket, string>> {
  if (!scored.length) return {};
  const attrs = new Map(scored.map((s) => [s.item.id, deriveAttrs(s.item)]));
  const a = (s: ScoredItem) => attrs.get(s.item.id)!;
  return {
    'Best Overall': pickBy(scored, (s) => s.matchScore),
    'Most Premium': pickBy(scored, (s) => a(s).luxuryScore * 1000 + s.matchScore),
    'Most Trending': pickBy(scored, (s) => a(s).trendScore * 1000 + s.matchScore),
    'Safest Choice': pickBy(scored, (s) => s.components.occasion * 1000 + s.matchScore),
    "Editor's Pick": pickBy(scored, (s) => a(s).embroideryLevel * 1000 + s.matchScore),
    'Hidden Gem': pickBy(scored, (s) => s.matchScore - a(s).trendScore * 3),
  };
}
