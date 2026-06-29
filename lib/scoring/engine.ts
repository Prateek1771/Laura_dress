import {
  MATCH_THRESHOLD_GOOD,
  MATCH_THRESHOLD_STRONG,
  MATCH_THRESHOLD_EXCELLENT,
} from '@/lib/constants';
import {
  OCCASION_WEIGHTS,
  BUDGET_WEIGHTS,
  COLOR_WEIGHTS,
  AVAILABILITY_WEIGHTS,
  ADJACENT_OCCASIONS,
  BUDGET_NEAR_RANGE_FACTOR,
  SKIN_TONE_COLORS,
  OCCASION_COLORS,
} from './matrices';
import type { Color } from '@/lib/constants';
import type { SessionPreferences, ScoredItem, ScoreTier, ScoreComponents } from './types';
import type { InventoryItem } from '@/lib/insforge/types';

function tierFromScore(score: number): ScoreTier {
  if (score >= MATCH_THRESHOLD_EXCELLENT) return 'excellent';
  if (score >= MATCH_THRESHOLD_STRONG) return 'strong';
  return 'good';
}

function scoreOccasion(session: SessionPreferences, item: InventoryItem): number {
  if (!session.occasions.length) return OCCASION_WEIGHTS.exact;
  const itemOccasions = item.occasions;
  for (const occ of session.occasions) {
    if (itemOccasions.includes(occ)) return OCCASION_WEIGHTS.exact;
  }
  for (const occ of session.occasions) {
    const adjacent = ADJACENT_OCCASIONS[occ] ?? [];
    if (adjacent.some((a) => itemOccasions.includes(a))) return OCCASION_WEIGHTS.adjacent;
  }
  return OCCASION_WEIGHTS.none;
}

function scoreBudget(session: SessionPreferences, item: InventoryItem): number {
  const { price_range_min, price_range_max } = session;
  if (price_range_min === null && price_range_max === null) return BUDGET_WEIGHTS.noRange;
  const min = price_range_min ?? 0;
  const max = price_range_max ?? Infinity;
  if (item.price >= min && item.price <= max) return BUDGET_WEIGHTS.inRange;
  const nearMin = min * (1 - BUDGET_NEAR_RANGE_FACTOR);
  const nearMax = max * (1 + BUDGET_NEAR_RANGE_FACTOR);
  if (item.price >= nearMin && item.price <= nearMax) return BUDGET_WEIGHTS.nearRange;
  return BUDGET_WEIGHTS.none;
}

function scoreColor(session: SessionPreferences, item: InventoryItem): number {
  // Palette = flattering skin-tone colors ∪ occasion colors. No skin tone + no mapped
  // occasion → flat noData (unchanged behavior for skipped / kids / couple / `other` rows).
  const palette = new Set<Color>(session.skin_tone ? SKIN_TONE_COLORS[session.skin_tone] : []);
  for (const occ of session.occasions) for (const c of OCCASION_COLORS[occ] ?? []) palette.add(c);
  if (palette.size === 0) return COLOR_WEIGHTS.noData;
  return item.colors.some((c) => palette.has(c)) ? COLOR_WEIGHTS.match : COLOR_WEIGHTS.none;
}

function scoreAvailability(item: InventoryItem): number {
  return AVAILABILITY_WEIGHTS[item.availability] ?? 0;
}

function buildReasons(components: ScoreComponents): string[] {
  const reasons: string[] = [];
  if (components.occasion >= OCCASION_WEIGHTS.exact)
    reasons.push('Matches your occasion perfectly');
  else if (components.occasion >= OCCASION_WEIGHTS.adjacent)
    reasons.push('Works well for your occasion');
  if (components.budget >= BUDGET_WEIGHTS.inRange) reasons.push('Within your budget');
  else if (components.budget >= BUDGET_WEIGHTS.nearRange) reasons.push('Close to your budget');
  if (components.color >= COLOR_WEIGHTS.match) reasons.push('A flattering color for the occasion');
  if (components.availability === AVAILABILITY_WEIGHTS.in_stock) reasons.push('In stock');
  else if (components.availability === AVAILABILITY_WEIGHTS.low_stock) reasons.push('Limited stock');
  return reasons;
}

export function scoreItem(session: SessionPreferences, item: InventoryItem): ScoredItem {
  const components: ScoreComponents = {
    occasion: scoreOccasion(session, item),
    budget: scoreBudget(session, item),
    color: scoreColor(session, item),
    availability: scoreAvailability(item),
  };
  const matchScore = Math.min(
    100,
    components.occasion + components.budget + components.color + components.availability,
  );
  return {
    item,
    matchScore,
    matchReasons: buildReasons(components),
    tier: tierFromScore(matchScore),
    components,
  };
}

const ZERO_COMPONENTS: ScoreComponents = { occasion: 0, budget: 0, color: 0, availability: 0 };

function passesHardFilters(session: SessionPreferences, item: InventoryItem): boolean {
  if (!item.active) return false;
  if (item.availability === 'out_of_stock') return false;
  if (session.shopping_for === 'male' && item.gender !== 'men') return false;
  if (session.shopping_for === 'female' && item.gender !== 'women') return false;
  if (
    session.category &&
    session.shopping_for !== 'couple' &&
    item.category !== session.category
  )
    return false;
  return true;
}

export function recommend(
  session: SessionPreferences,
  items: InventoryItem[],
): ScoredItem[] {
  if (session.shopping_for === 'kids') {
    return items
      .filter((i) => i.active && i.availability !== 'out_of_stock')
      .map((item) => ({
        item,
        matchScore: 0,
        matchReasons: [],
        tier: 'good' as ScoreTier,
        components: ZERO_COMPONENTS,
      }));
  }

  return items
    .filter((item) => passesHardFilters(session, item))
    .map((item) => scoreItem(session, item))
    .filter((s) => s.matchScore >= MATCH_THRESHOLD_GOOD)
    .sort((a, b) => b.matchScore - a.matchScore);
}
