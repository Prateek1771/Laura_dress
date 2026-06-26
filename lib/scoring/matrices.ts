import type { Occasion, Color, Fabric } from '@/lib/constants';

export const OCCASION_WEIGHTS = {
  exact: 35,
  adjacent: 18,
  none: 0,
} as const;

export const BUDGET_WEIGHTS = {
  inRange: 30,
  nearRange: 15,
  noRange: 25,
  none: 0,
} as const;

export const COLOR_WEIGHTS = {
  match: 20,
  noData: 15,
  none: 0,
} as const;

export const AVAILABILITY_WEIGHTS = {
  in_stock: 15,
  low_stock: 8,
  out_of_stock: 0,
} as const;

export const ADJACENT_OCCASIONS: Partial<Record<Occasion, Occasion[]>> = {
  wedding: ['reception'],
  reception: ['wedding', 'engagement'],
  engagement: ['reception'],
  sangeet: ['cocktail'],
  cocktail: ['sangeet'],
  haldi: ['mehendi'],
  mehendi: ['haldi'],
  festive: ['cocktail'],
  pre_wedding_shoot: ['engagement'],
};

export const COLOR_HARMONY_MATRIX: Partial<Record<Color, Partial<Record<Color, number>>>> = {
  maroon: { ivory: 95, gold: 95 },
  royal_blue: { gold: 90, ivory: 90 },
  emerald: { champagne: 88, gold: 88 },
  lavender: { grey: 82, blush: 82, champagne: 82 },
  blush: { champagne: 82 },
};

// Known clashes (only pairs whose colors exist in COLORS). Spec also lists red↔cream
// and lime↔red, but those colors aren't in the canonical COLORS list, so they're omitted.
export const COLOR_CLASH_PAIRS: [Color, Color][] = [['orange', 'magenta']];

export const COLOR_CLASH_SCORE = 25;
export const COLOR_SAME_SCORE = 75;
export const COLOR_UNLISTED_SCORE = 50;

export const FABRIC_HARMONY_MATRIX: Partial<Record<Fabric, Partial<Record<Fabric, number>>>> = {
  silk: { silk: 95, brocade: 95 },
  velvet: { silk: 88 },
  georgette: { chiffon: 85 },
  chiffon: { georgette: 85 },
};

export const BUDGET_NEAR_RANGE_FACTOR = 0.2;

export const COUPLE_WEIGHTS = {
  color: 0.5,
  theme: 0.3,
  fabric: 0.2,
} as const;

export const INDIVIDUAL_VS_COUPLE_WEIGHTS = {
  couple: 0.6,
  individual: 0.4,
} as const;
