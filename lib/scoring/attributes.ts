import { HEAVY_WORDS, LUX_FABRICS, LUX_WORDS, TREND_WORDS } from './matrices';
import type { InventoryItem } from '@/lib/insforge/types';

export interface DerivedAttrs {
  embroideryLevel: number;
  luxuryScore: number;
  trendScore: number;
}

// Pure keyword-count derivation, ported from the reference design's models/outfit.py
// `_level`. VivahStyle items are structured, so we scan name + tags directly and credit
// the fabric enum for luxury, rather than flattening a free-text blob. Each capped 0–5.
function countWords(text: string, words: string[]): number {
  return Math.min(5, words.reduce((n, w) => (text.includes(w) ? n + 1 : n), 0));
}

export function deriveAttrs(item: InventoryItem): DerivedAttrs {
  const text = [item.name, ...item.tags].join(' ').toLowerCase();
  const luxFromFabric = item.fabric && LUX_FABRICS.includes(item.fabric) ? 1 : 0;
  return {
    embroideryLevel: countWords(text, HEAVY_WORDS),
    luxuryScore: Math.min(5, countWords(text, LUX_WORDS) + luxFromFabric),
    trendScore: countWords(text, TREND_WORDS),
  };
}
