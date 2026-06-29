import type { Occasion, Color, Fabric, SkinTone } from '@/lib/constants';

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

// Skin-tone → flattering colors. Derived from the reference design's
// recommendation_engine/rules/skin_rules.json `best` lists, mapped into the canonical
// COLORS enum (navy blue→navy, royal blue→royal_blue, wine→burgundy, cream→ivory,
// red→crimson, turquoise→teal; names with no enum equivalent like `purple` dropped).
// Tunable knob — colors only, no avoid-penalty in V1.
export const SKIN_TONE_COLORS: Record<SkinTone, Color[]> = {
  fair: ['navy', 'emerald', 'burgundy', 'maroon', 'royal_blue', 'black'],
  wheatish: ['emerald', 'burgundy', 'maroon', 'royal_blue', 'gold', 'mustard', 'rust', 'teal'],
  medium: ['burgundy', 'emerald', 'royal_blue', 'maroon', 'gold', 'orange', 'crimson'],
  tan: ['white', 'ivory', 'gold', 'coral', 'teal', 'magenta', 'crimson'],
  deep: ['white', 'ivory', 'gold', 'yellow', 'crimson', 'cobalt', 'fuchsia'],
};

// Occasion → flattering palette. Ported from the reference design's
// recommendation_engine/rules/occasion_rules.json, mapped into the canonical COLORS enum
// (red→crimson, wine→burgundy, navy blue→navy, royal blue→royal_blue, cream→ivory; names
// with no enum equivalent dropped: turmeric, purple, beige, pastel). Partial so unmapped
// occasions (e.g. `other`) fall through to graceful noData in scoreColor. Tunable knob.
export const OCCASION_COLORS: Partial<Record<Occasion, Color[]>> = {
  wedding: ['crimson', 'maroon', 'burgundy', 'emerald', 'gold', 'royal_blue', 'magenta'],
  reception: ['burgundy', 'black', 'navy', 'emerald', 'gold', 'champagne'],
  engagement: ['burgundy', 'royal_blue', 'emerald', 'gold', 'champagne'], // VivahStyle-only; reception-like
  sangeet: ['royal_blue', 'magenta', 'emerald', 'burgundy'],
  haldi: ['mustard', 'yellow', 'orange', 'ivory'],
  mehendi: ['green', 'olive', 'emerald', 'yellow', 'teal'],
  cocktail: ['black', 'burgundy', 'royal_blue', 'emerald', 'magenta'], // prototype "party"
  festive: ['crimson', 'orange', 'gold', 'maroon', 'magenta', 'green'],
  pre_wedding_shoot: ['blush', 'peach', 'ivory', 'lavender', 'teal', 'coral'], // light/casual-ish
};

// Keyword tables for derived outfit attributes (ported from the reference design's
// models/outfit.py). Used by lib/scoring/attributes.ts to sort Netflix buckets.
export const HEAVY_WORDS = ['embroider', 'sequin', 'bead', 'zari', 'stone', 'heavy', 'embellish', 'zardozi', 'mirror'];
export const LUX_FABRICS: Fabric[] = ['silk', 'velvet', 'brocade'];
export const LUX_WORDS = ['kanjivaram', 'banarasi', 'designer', 'premium', 'tissue', 'organza'];
export const TREND_WORDS = ['sequin', 'designer', 'modern', 'contemporary', 'satin', 'crepe', 'fusion', 'trendy'];

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
