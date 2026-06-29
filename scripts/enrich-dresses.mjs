// One-off: enrich women's inventory_items from the prototype's accurate Groq-vision
// metadata. Joins by name (== original image filename, minus extension). Fixes
// colors/occasions/fabric for scoring accuracy and fills a `details` jsonb blob for the
// detail page. Idempotent (UPDATE-based). Men have no clean name→metadata join → skipped.
// Run: node --env-file=.env.local scripts/enrich-dresses.mjs
import { createClient } from '@insforge/sdk';
import fs from 'node:fs';

const META_FILE =
  'C:/Users/hitli/OneDrive/Desktop/metadata/metadata/female_dress_metadata.json';

const COLORS = [
  'maroon', 'ivory', 'gold', 'royal_blue', 'emerald', 'coral', 'peach',
  'navy', 'lavender', 'blush', 'mustard', 'rust', 'teal', 'fuchsia',
  'crimson', 'champagne', 'olive', 'magenta', 'cobalt', 'copper',
  'burgundy', 'white', 'black', 'grey', 'pink', 'orange', 'yellow', 'green',
];
const COLOR_WORD = {
  red: 'crimson', scarlet: 'crimson', cherry: 'crimson', wine: 'burgundy',
  blue: 'navy', 'navy blue': 'navy', 'royal blue': 'royal_blue', 'sky blue': 'cobalt',
  purple: 'lavender', violet: 'lavender', silver: 'grey', gray: 'grey', grey: 'grey',
  beige: 'champagne', cream: 'ivory', 'off white': 'ivory', golden: 'gold',
  turquoise: 'teal', bronze: 'copper', tan: 'champagne', brown: 'rust',
};
const OCCASION = {
  wedding: 'wedding', weddings: 'wedding', reception: 'reception', receptions: 'reception',
  engagement: 'engagement', sangeet: 'sangeet', haldi: 'haldi', mehendi: 'mehendi',
  cocktail: 'cocktail', party: 'cocktail', 'red carpet': 'cocktail',
  festive: 'festive', festival: 'festive', festivals: 'festive', celebratory: 'festive',
  traditional: 'festive', 'traditional event': 'festive', 'special occasion': 'festive',
  'special occasions': 'festive', formal: 'reception', 'formal event': 'reception',
  'formal events': 'reception',
};

const norm = (s) => (s || '').trim().toLowerCase();
const titleize = (s) =>
  norm(s).replace(/\b\w/g, (c) => c.toUpperCase()).trim();

function normColor(raw) {
  let c = norm(raw);
  if (!c || c.startsWith('#')) return null;
  if (COLORS.includes(c)) return c;
  const us = c.replace(/\s+/g, '_');
  if (COLORS.includes(us)) return us;
  if (COLOR_WORD[c]) return COLOR_WORD[c];
  for (const tok of c.split(/ and |,|\/|\s+/)) {
    const t = tok.trim();
    if (COLORS.includes(t)) return t;
    if (COLOR_WORD[t]) return COLOR_WORD[t];
  }
  return null;
}
const normColors = (list) => [...new Set((list || []).map(normColor).filter(Boolean))];
const normOccasions = (list) => [...new Set((list || []).map((o) => OCCASION[norm(o)]).filter(Boolean))];

function normFabric(raw) {
  const c = norm(raw);
  if (!c) return null;
  if (c.includes('georgette')) return 'georgette';
  if (c.includes('chiffon')) return 'chiffon';
  if (c.includes('velvet')) return 'velvet';
  if (c.includes('brocade') || c.includes('banarasi')) return 'brocade';
  if (c.includes('net')) return 'net';
  if (c.includes('cotton') && c.includes('silk')) return 'cotton_silk';
  if (c.includes('silk') || c.includes('kanjivaram') || c.includes('chinon')) return 'silk';
  return 'other'; // organza/satin/tissue/linen/sequined — no enum slot
}

// strip extension + lowercase + collapse whitespace → join key
const keyOf = (s) => norm(s).replace(/\.(jpe?g|png|webp)$/i, '').replace(/\s+/g, ' ');

function buildDetails(m) {
  const arr = (a) => (a || []).map(titleize).filter(Boolean);
  const str = (s) => (norm(s) && norm(s) !== 'none' && norm(s) !== 'null' ? titleize(s) : null);
  const d = {
    style: str(m.style),
    fit: str(m.fit),
    pattern: str(m.pattern),
    texture: str(m.texture),
    neckline: str(m.neckline),
    sleeve_type: str(m.sleeve_type),
    length: str(m.length),
    embellishments: arr(m.embellishments),
    season: arr((m.season || []).filter((s) => norm(s) !== 'any' && norm(s) !== 'year-round')),
    secondary_colors: normColors(m.secondary_colors),
    description: m.description ? m.description.trim().replace(/^./, (c) => c.toUpperCase()) : null,
  };
  // drop empty keys so the detail page only renders what exists
  for (const k of Object.keys(d)) {
    if (d[k] == null || (Array.isArray(d[k]) && d[k].length === 0)) delete d[k];
  }
  return d;
}

// --- run -----------------------------------------------------------------
const meta = JSON.parse(fs.readFileSync(META_FILE, 'utf-8'));
const byKey = new Map(meta.map((m) => [keyOf(m.image_name), m]));

const client = createClient({
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL,
  anonKey: process.env.INSFORGE_API_KEY ?? process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY,
});
const db = client.database;

const { data: rows, error } = await db
  .from('inventory_items')
  .select('id, name, gender, colors, occasions, fabric, tags')
  .eq('gender', 'women');
if (error) { console.error('[enrich] fetch failed:', error); process.exit(1); }

let updated = 0, unmatched = 0;
for (const row of rows ?? []) {
  const m = byKey.get(keyOf(row.name));
  if (!m) { unmatched++; console.log(`  (skip) no metadata for "${row.name}"`); continue; }

  const colors = normColors([m.primary_color, ...(m.secondary_colors || [])]);
  const occasions = normOccasions(m.occasion);
  const fabric = normFabric(m.fabric);
  const patch = {
    colors: colors.length ? colors : row.colors,           // fall back if mapping empties
    occasions: occasions.length ? occasions : row.occasions,
    fabric: fabric && fabric !== 'other' ? fabric : row.fabric,
    details: buildDetails(m),
  };
  const upd = await db.from('inventory_items').update(patch).eq('id', row.id);
  if (upd.error) { console.error(`[enrich] update ${row.name} failed:`, upd.error); process.exit(1); }
  updated++;
  console.log(`  ✓ ${row.name}\n      colors=${patch.colors.join(',')}  occ=${patch.occasions.join(',')}  fabric=${patch.fabric}`);
}

console.log(`\nDone. updated ${updated}, unmatched ${unmatched} (of ${rows?.length ?? 0} women rows).`);
