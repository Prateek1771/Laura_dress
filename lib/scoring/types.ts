import type { Occasion, Color, Fabric, ShoppingFor, Category, SkinTone } from '@/lib/constants';
import type { InventoryItem } from '@/lib/insforge/types';

export type ScoreTier = 'excellent' | 'strong' | 'good';

export interface SessionPreferences {
  id: string;
  shopping_for: ShoppingFor;
  occasions: Occasion[];
  category: Category | null;
  skin_tone: SkinTone | null;
  price_range_min: number | null;
  price_range_max: number | null;
  wants_couple_combo: boolean;
}

export interface ScoredItem {
  item: InventoryItem;
  matchScore: number;
  matchReasons: string[];
  tier: ScoreTier;
  components: ScoreComponents;
}

export interface CoupleCompatibility {
  colorHarmony: number;
  themeHarmony: number;
  fabricHarmony: number;
  overall: number;
}

export interface ScoreComponents {
  occasion: number;
  budget: number;
  color: number;
  availability: number;
}
