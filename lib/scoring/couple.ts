import { COUPLE_WEIGHTS, INDIVIDUAL_VS_COUPLE_WEIGHTS, FABRIC_HARMONY_MATRIX, COLOR_SAME_SCORE, COLOR_UNLISTED_SCORE } from './matrices';
import { scoreItem } from './engine';
import type { CoupleCompatibility, SessionPreferences, ScoredItem } from './types';
import type { InventoryItem } from '@/lib/insforge/types';
import type { Color, Fabric } from '@/lib/constants';

function colorHarmonyScore(a: InventoryItem, b: InventoryItem): number {
  const colorsA = a.colors as Color[];
  const colorsB = b.colors as Color[];
  if (!colorsA.length || !colorsB.length) return COLOR_UNLISTED_SCORE;
  if (colorsA.some((c) => colorsB.includes(c))) return COLOR_SAME_SCORE;
  return COLOR_UNLISTED_SCORE;
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
