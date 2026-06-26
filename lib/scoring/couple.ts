import {
  COUPLE_WEIGHTS,
  INDIVIDUAL_VS_COUPLE_WEIGHTS,
  FABRIC_HARMONY_MATRIX,
  COLOR_HARMONY_MATRIX,
  COLOR_CLASH_PAIRS,
  COLOR_CLASH_SCORE,
  COLOR_SAME_SCORE,
  COLOR_UNLISTED_SCORE,
} from './matrices';
import { scoreItem } from './engine';
import type { CoupleCompatibility, SessionPreferences, ScoredItem } from './types';
import type { InventoryItem } from '@/lib/insforge/types';
import type { Color, Fabric } from '@/lib/constants';

function isClash(x: Color, y: Color): boolean {
  return COLOR_CLASH_PAIRS.some(([p, q]) => (p === x && q === y) || (p === y && q === x));
}

function pairHarmony(x: Color, y: Color): number {
  const listed = COLOR_HARMONY_MATRIX[x]?.[y] ?? COLOR_HARMONY_MATRIX[y]?.[x];
  if (listed !== undefined) return listed;
  if (x === y) return COLOR_SAME_SCORE;
  if (isClash(x, y)) return COLOR_CLASH_SCORE;
  return COLOR_UNLISTED_SCORE;
}

// Best harmony across every color in a vs every color in b (most flattering pairing wins).
function colorHarmonyScore(a: InventoryItem, b: InventoryItem): number {
  const colorsA = a.colors as Color[];
  const colorsB = b.colors as Color[];
  if (!colorsA.length || !colorsB.length) return COLOR_UNLISTED_SCORE;
  let best = 0;
  for (const x of colorsA) for (const y of colorsB) best = Math.max(best, pairHarmony(x, y));
  return best;
}

function themeHarmonyScore(a: InventoryItem, b: InventoryItem): number {
  const shared = a.occasions.filter((o) => b.occasions.includes(o)).length;
  const total = new Set([...a.occasions, ...b.occasions]).size;
  if (!total) return 70;
  const overlap = shared / total;
  if (overlap === 1) return 100;
  if (overlap > 0) return 70;
  return 40;
}

function fabricHarmonyScore(a: InventoryItem, b: InventoryItem): number {
  const fa = a.fabric as Fabric | null;
  const fb = b.fabric as Fabric | null;
  if (!fa || !fb) return 50;
  const matrixA = FABRIC_HARMONY_MATRIX[fa];
  if (matrixA && fb in matrixA) return matrixA[fb]!;
  const matrixB = FABRIC_HARMONY_MATRIX[fb];
  if (matrixB && fa in matrixB) return matrixB[fa]!;
  return 50;
}

export function coupleCompatibility(a: InventoryItem, b: InventoryItem): CoupleCompatibility {
  const colorHarmony = colorHarmonyScore(a, b);
  const themeHarmony = themeHarmonyScore(a, b);
  const fabricHarmony = fabricHarmonyScore(a, b);
  const overall =
    COUPLE_WEIGHTS.color * colorHarmony +
    COUPLE_WEIGHTS.theme * themeHarmony +
    COUPLE_WEIGHTS.fabric * fabricHarmony;
  return { colorHarmony, themeHarmony, fabricHarmony, overall: Math.round(overall) };
}

export function suggestPartnerOutfits(
  anchor: InventoryItem,
  session: SessionPreferences,
  items: InventoryItem[],
): ScoredItem[] {
  const partnerGender = anchor.gender === 'men' ? 'women' : 'men';
  const partnerSession: SessionPreferences = { ...session };

  return items
    .filter((item) => item.active && item.availability !== 'out_of_stock' && item.gender === partnerGender)
    .map((item) => {
      const compat = coupleCompatibility(anchor, item);
      const individual = scoreItem(partnerSession, item);
      const combinedScore = Math.round(
        INDIVIDUAL_VS_COUPLE_WEIGHTS.couple * compat.overall +
          INDIVIDUAL_VS_COUPLE_WEIGHTS.individual * individual.matchScore,
      );
      return {
        item,
        matchScore: combinedScore,
        matchReasons: individual.matchReasons,
        tier: individual.tier,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);
}
