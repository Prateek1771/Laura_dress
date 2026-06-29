export const SHOPPING_FOR = ['male', 'female', 'couple', 'kids'] as const;

export const OCCASIONS = [
  'wedding',
  'reception',
  'engagement',
  'sangeet',
  'haldi',
  'mehendi',
  'cocktail',
  'festive',
  'pre_wedding_shoot',
  'other',
] as const;

export const MEN_CATEGORIES = [
  'sherwani',
  'indo_western',
  'jodhpuri',
  'kurta_jacket_set',
  'kurta_set',
  'short_kurta',
  'kurta',
  'suit_accessories',
  'others',
] as const;

export const WOMEN_CATEGORIES = [
  'lehenga',
  'saree',
  'stitched_suit',
  'accessories',
] as const;

export const ALL_CATEGORIES = [...MEN_CATEGORIES, ...WOMEN_CATEGORIES] as const;

export const PAYMENT_MODES = ['cash', 'upi', 'card', 'net_banking'] as const;

export const COLORS = [
  'maroon', 'ivory', 'gold', 'royal_blue', 'emerald', 'coral', 'peach',
  'navy', 'lavender', 'blush', 'mustard', 'rust', 'teal', 'fuchsia',
  'crimson', 'champagne', 'olive', 'magenta', 'cobalt', 'copper',
  'burgundy', 'white', 'black', 'grey', 'pink', 'orange', 'yellow', 'green',
] as const;

export const SKIN_TONES = ['fair', 'wheatish', 'medium', 'tan', 'deep'] as const;

export const FABRICS = [
  'silk', 'velvet', 'brocade', 'georgette', 'chiffon',
  'cotton_silk', 'net', 'other',
] as const;

export const AVAILABILITY = ['in_stock', 'low_stock', 'out_of_stock'] as const;

export const STAFF_ROLES = ['owner', 'cashier', 'stylist'] as const;

export const TRYON_STATUSES = ['generating', 'ready', 'failed'] as const;

export const SESSION_STATUSES = ['active', 'completed'] as const;

export const MATCH_THRESHOLD_EXCELLENT = 90;
export const MATCH_THRESHOLD_STRONG = 75;
export const MATCH_THRESHOLD_GOOD = 60;

export const CATEGORY_PREFIXES: Record<string, string> = {
  sherwani: 'SHER',
  indo_western: 'INDO',
  jodhpuri: 'JODH',
  kurta_jacket_set: 'KJST',
  kurta_set: 'KSET',
  short_kurta: 'SKRT',
  kurta: 'KURT',
  suit_accessories: 'SACC',
  others: 'OTHR',
  lehenga: 'LEHE',
  saree: 'SARE',
  stitched_suit: 'SUIT',
  accessories: 'ACCS',
};

export type ShoppingFor = (typeof SHOPPING_FOR)[number];
export type Occasion = (typeof OCCASIONS)[number];
export type MenCategory = (typeof MEN_CATEGORIES)[number];
export type WomenCategory = (typeof WOMEN_CATEGORIES)[number];
export type Category = (typeof ALL_CATEGORIES)[number];
export type PaymentMode = (typeof PAYMENT_MODES)[number];
export type Color = (typeof COLORS)[number];
export type SkinTone = (typeof SKIN_TONES)[number];
export type Fabric = (typeof FABRICS)[number];
export type Availability = (typeof AVAILABILITY)[number];
export type StaffRole = (typeof STAFF_ROLES)[number];
export type TryonStatus = (typeof TRYON_STATUSES)[number];
export type SessionStatus = (typeof SESSION_STATUSES)[number];
