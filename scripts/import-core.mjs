// One-off: import the prototype's full core image set (female + male) into InsForge with
// accurate Groq-vision metadata. Perfect 1:1 join by image_name — no inference. Idempotent:
// UPDATE if a row with the same `name` exists, else INSERT + upload. Couples are excluded
// (inspiration gallery only). Run: node --env-file=.env.local scripts/import-core.mjs
import { createClient } from '@insforge/sdk';
import fs from 'node:fs';
import path from 'node:path';

const CORE = 'C:/Users/hitli/OneDrive/Desktop/metadata/core';
const META = 'C:/Users/hitli/OneDrive/Desktop/metadata/metadata';

// --- enums + maps (mirrors lib/constants.ts + enrich-dresses.mjs) --------
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
const CATEGORY_PREFIXES = {
  sherwani: 'SHER', indo_western: 'INDO', jodhpuri: 'JODH', kurta_jacket_set: 'KJST',
  kurta_set: 'KSET', short_kurta: 'SKRT', kurta: 'KURT', suit_accessories: 'SACC',
  others: 'OTHR', lehenga: 'LEHE', saree: 'SARE', stitched_suit: 'SUIT', accessories: 'ACCS',
};
const PRICE = {
  saree: 18000, stitched_suit: 12000, lehenga: 45000,
  sherwani: 42000, indo_western: 26000, kurta_jacket_set: 13000,
};

const norm = (s) => (s || '').trim().toLowerCase();
const titleize = (s) => norm(s).replace(/\b\w/g, (c) => c.toUpperCase()).trim();

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
  if (!c) return 'other';
  if (c.includes('georgette')) return 'georgette';
  if (c.includes('chiffon')) return 'chiffon';
  if (c.includes('velvet')) return 'velvet';
  if (c.includes('brocade') || c.includes('banarasi')) return 'brocade';
  if (c.includes('net')) return 'net';
  if (c.includes('cotton') && c.includes('silk')) return 'cotton_silk';
  if (c.includes('silk') || c.includes('kanjivaram') || c.includes('chinon')) return 'silk';
  return 'other';
}

// Filename first — the vision garment_type mislabels some suits as "lehenga".
function womenCategory(name, gt) {
  const g = `${norm(name)} ${norm(gt)}`;
  if (/(suit|salwar|kameez|palazzo|plazo|anarkali)/.test(g)) return 'stitched_suit';
  if (g.includes('lehenga')) return 'lehenga';
  if (g.includes('saree') || g.includes('sari')) return 'saree';
  return 'saree';
}
function menCategory(gt) {
  const g = norm(gt);
  if (g.includes('sherwani')) return 'sherwani';
  if (/(waistcoat|vest|kurta)/.test(g)) return 'kurta_jacket_set';
  return 'sherwani';
}

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
    season: arr((m.season || []).filter((s) => !['any', 'year-round', 'all seasons'].includes(norm(s)))),
    secondary_colors: normColors(m.secondary_colors),
    description: m.description ? m.description.trim().replace(/^./, (c) => c.toUpperCase()) : null,
  };
  for (const k of Object.keys(d)) {
    if (d[k] == null || (Array.isArray(d[k]) && d[k].length === 0)) delete d[k];
  }
  return d;
}

const stripExt = (s) => s.replace(/\.(jpe?g|png|webp)$/i, '').trim();
const contentType = (f) => (/\.png$/i.test(f) ? 'image/png' : 'image/jpeg');

// --- build the work list -------------------------------------------------
function load(file, dir, gender, nameFn, sizes) {
  const meta = JSON.parse(fs.readFileSync(path.join(META, file), 'utf-8'));
  return meta.map((m) => {
    const { name, category } = nameFn(m);
    const colors = normColors([m.primary_color, ...(m.secondary_colors || [])]);
    const occasions = normOccasions(m.occasion);
    return {
      name,
      gender, category,
      colors: colors.length ? colors : ['gold'],
      occasions: occasions.length ? occasions : ['wedding', 'reception'],
      fabric: normFabric(m.fabric),
      tags: Array.isArray(m.keywords) ? m.keywords : [],
      details: buildDetails(m),
      price: PRICE[category] ?? 15000,
      sizes,
      src: path.join(dir, m.image_name),
    };
  });
}

// Women keep their descriptive filename as the display name; men's files are bare numbers
// ("0.jpg"), so synthesize a readable name from colour + garment, kept unique via the number.
const womenItem = (m) => ({ name: stripExt(m.image_name), category: womenCategory(m.image_name, m.garment_type) });
const menItem = (m) => {
  const category = menCategory(m.garment_type);
  const label = category === 'kurta_jacket_set' ? 'Kurta Jacket Set' : 'Sherwani';
  const color = titleize(m.primary_color) || 'Classic';
  return { name: `${color} ${label} ${stripExt(m.image_name)}`, category };
};

const items = [
  ...load('female_dress_metadata.json', path.join(CORE, 'female'), 'women', womenItem, ['S', 'M', 'L', 'XL']),
  ...load('mens_dress_metadata.json', path.join(CORE, 'male'), 'men', menItem, ['38', '40', '42', '44']),
];

// --- client --------------------------------------------------------------
const client = createClient({
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL,
  anonKey: process.env.INSFORGE_API_KEY ?? process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY,
});
const db = client.database;
const storage = client.storage;

function die(error, what) {
  if (error) { console.error(`[import-core] ${what} failed:`, error); process.exit(1); }
}

// existing rows (idempotency by name) + per-prefix max sequence
const existing = await db.from('inventory_items').select('id, name, dress_id, images');
die(existing.error, 'existing lookup');
const byName = new Map((existing.data ?? []).map((r) => [r.name, r]));
const seq = {};
for (const r of existing.data ?? []) {
  const [pfx, num] = String(r.dress_id).split('-');
  const n = parseInt(num, 10);
  if (Number.isFinite(n)) seq[pfx] = Math.max(seq[pfx] ?? 0, n);
}
function nextDressId(category) {
  const pfx = CATEGORY_PREFIXES[category] ?? 'ITEM';
  seq[pfx] = (seq[pfx] ?? 0) + 1;
  return `${pfx}-${String(seq[pfx]).padStart(4, '0')}`;
}

async function ensureImage(id, src, current) {
  if (Array.isArray(current) && current.length) return; // already has an image
  if (!fs.existsSync(src)) { console.warn(`  ! missing file ${src}`); return; }
  const blob = new Blob([fs.readFileSync(src)], { type: contentType(src) });
  const up = await storage.from('inventory-images').upload(`${id}/0.jpg`, blob);
  if (up.error || !up.data) die(up.error ?? new Error('no url'), `upload ${id}`);
  const upd = await db.from('inventory_items').update({ images: [up.data.url] }).eq('id', id);
  die(upd.error, `image url update ${id}`);
}

let inserted = 0, updated = 0;
for (const it of items) {
  const meta = {
    gender: it.gender, category: it.category, occasions: it.occasions,
    colors: it.colors, sizes: it.sizes, tags: it.tags, fabric: it.fabric,
    price: it.price, details: it.details,
  };
  const found = byName.get(it.name);
  if (found) {
    const upd = await db.from('inventory_items').update(meta).eq('id', found.id);
    die(upd.error, `update ${it.name}`);
    await ensureImage(found.id, it.src, found.images);
    updated++;
    console.log(`  ~ ${found.dress_id}  ${it.gender.padEnd(5)} ${it.category.padEnd(16)} ${it.name}`);
  } else {
    const dress_id = nextDressId(it.category);
    const row = await db.from('inventory_items').insert({
      name: it.name, dress_id, quantity: 5, availability: 'in_stock', images: [], ...meta,
    }).select().single();
    die(row.error, `insert ${it.name}`);
    await ensureImage(row.data.id, it.src, []);
    inserted++;
    console.log(`  + ${dress_id}  ${it.gender.padEnd(5)} ${it.category.padEnd(16)} ${it.name}`);
  }
}

console.log(`\nDone. inserted ${inserted}, updated ${updated}, total ${items.length}.`);
