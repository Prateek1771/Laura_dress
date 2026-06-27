// One-off: import local dress assets into InsForge (storage + inventory_items).
// Reuses the same enums/prefixes as the app. Idempotent — skips items whose
// name already exists. Run: node --env-file=.env.local scripts/import-dresses.mjs
import { createClient } from '@insforge/sdk';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(process.cwd(), 'dresses');

const COLORS = [
  'maroon', 'ivory', 'gold', 'royal_blue', 'emerald', 'coral', 'peach',
  'navy', 'lavender', 'blush', 'mustard', 'rust', 'teal', 'fuchsia',
  'crimson', 'champagne', 'olive', 'magenta', 'cobalt', 'copper',
  'burgundy', 'white', 'black', 'grey', 'pink', 'orange', 'yellow', 'green',
];
const CATEGORY_PREFIXES = {
  sherwani: 'SHER', indo_western: 'INDO', kurta_set: 'KSET',
  lehenga: 'LEHE', saree: 'SARE', stitched_suit: 'SUIT',
};

// Map descriptive colour words → nearest enum colour.
const COLOR_WORD = {
  red: 'crimson', scarlet: 'crimson', cherry: 'crimson', ruby: 'fuchsia',
  punch: 'fuchsia', berry: 'royal_blue', blue: 'navy', 'french navy': 'navy',
  midnight: 'black', coal: 'black', dove: 'royal_blue', iris: 'lavender',
  purple: 'lavender', cream: 'ivory', beige: 'champagne', daisy: 'white',
  golden: 'gold', gold: 'gold', tangerine: 'orange', pineapple: 'yellow',
  pistachio: 'green', pastel: 'green', olive: 'olive', 'dusty rose': 'blush',
  hot: 'fuchsia', coin: 'grey', metallic: 'grey', scarletred: 'crimson',
};
function inferColors(name) {
  const n = name.toLowerCase();
  const out = new Set();
  for (const c of COLORS) if (n.includes(c.replace('_', ' '))) out.add(c);
  for (const [word, c] of Object.entries(COLOR_WORD)) if (n.includes(word)) out.add(c);
  const arr = [...out].slice(0, 3);
  return arr.length ? arr : ['gold'];
}
function inferCategory(name) {
  const n = name.toLowerCase();
  if (n.includes('lehenga')) return 'lehenga';
  if (n.includes('saree')) return 'saree';
  if (/(suit|salwar|plazo|palazzo|anarkali|shrug)/.test(n)) return 'stitched_suit';
  return 'stitched_suit';
}
function inferFabric(name) {
  const n = name.toLowerCase();
  if (n.includes('cotton silk')) return 'cotton_silk';
  if (n.includes('georgette')) return 'georgette';
  if (n.includes('chiffon')) return 'chiffon';
  if (n.includes('velvet')) return 'velvet';
  if (n.includes('brocade') || n.includes('banarasi')) return 'brocade';
  if (n.includes('net')) return 'net';
  if (n.includes('silk') || n.includes('kanjivaram') || n.includes('chinon')) return 'silk';
  return 'other';
}
const PRICE = {
  saree: 18000, stitched_suit: 12000, lehenga: 45000,
  sherwani: 42000, indo_western: 26000, kurta_set: 13000,
};

// --- build the work list -------------------------------------------------
const womenDir = path.join(ROOT, 'womens_dresses1');
const womenFiles = fs.readdirSync(womenDir).filter((f) => f.endsWith('.jpg')).slice(0, 16);
const women = womenFiles.map((file) => {
  const name = file.replace(/\.jpg$/i, '').trim();
  const category = inferCategory(name);
  return {
    name, gender: 'women', category,
    colors: inferColors(name), fabric: inferFabric(name),
    sizes: ['S', 'M', 'L', 'XL'], price: PRICE[category],
    src: path.join(womenDir, file),
  };
});

// Men's folders are numbered (possibly multiple angles); take a spaced subset.
const MEN_CATS = ['sherwani', 'indo_western', 'kurta_set'];
const MEN_COLORS = [['maroon', 'gold'], ['ivory', 'gold'], ['navy'], ['emerald']];
function menPicks(dir, indices) {
  const all = fs.readdirSync(path.join(ROOT, dir)).filter((f) => f.endsWith('.jpg'));
  const byNum = all
    .map((f) => ({ f, n: parseInt(f, 10) }))
    .filter((x) => Number.isFinite(x.n))
    .sort((a, b) => a.n - b.n);
  return indices.map((i) => byNum[i]?.f).filter(Boolean).map((f) => path.join(ROOT, dir, f));
}
const menSrcs = [...menPicks('mens_dress_1', [0, 4, 8, 12]), ...menPicks('mens dress_2', [0, 4, 8, 12])];
const men = menSrcs.map((src, i) => {
  const category = MEN_CATS[i % MEN_CATS.length];
  return {
    name: `Men's ${category.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())} ${i + 1}`,
    gender: 'men', category, colors: MEN_COLORS[i % MEN_COLORS.length],
    fabric: i % 2 ? 'velvet' : 'silk', sizes: ['38', '40', '42', '44'],
    price: PRICE[category], src,
  };
});

const items = [...women, ...men];

// --- client --------------------------------------------------------------
const client = createClient({
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL,
  anonKey: process.env.INSFORGE_API_KEY ?? process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY,
});
const db = client.database;
const storage = client.storage;

function die(error, what) {
  if (error) { console.error(`[import] ${what} failed:`, error); process.exit(1); }
}

// existing names (idempotency) + per-prefix max sequence
const existing = await db.from('inventory_items').select('name, dress_id');
die(existing.error, 'existing lookup');
const existingNames = new Set((existing.data ?? []).map((r) => r.name));
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

let created = 0, skipped = 0;
for (const it of items) {
  if (existingNames.has(it.name)) { skipped++; continue; }
  const dress_id = nextDressId(it.category);

  const row = await db.from('inventory_items').insert({
    name: it.name, dress_id, gender: it.gender, category: it.category,
    occasions: ['wedding', 'reception'], colors: it.colors, sizes: it.sizes,
    tags: [], fabric: it.fabric, price: it.price, quantity: 5,
    availability: 'in_stock', images: [],
  }).select().single();
  die(row.error, `insert ${it.name}`);

  const blob = new Blob([fs.readFileSync(it.src)], { type: 'image/jpeg' });
  const up = await storage.from('inventory-images').upload(`${row.data.id}/0.jpg`, blob);
  if (up.error || !up.data) {
    await db.from('inventory_items').delete().eq('id', row.data.id);
    die(up.error ?? new Error('no url'), `upload ${it.name}`);
  }
  const upd = await db.from('inventory_items').update({ images: [up.data.url] }).eq('id', row.data.id);
  die(upd.error, `image url update ${it.name}`);

  created++;
  console.log(`  ${dress_id}  ${it.gender.padEnd(5)} ${it.category.padEnd(13)} ${it.name}`);
}

console.log(`\nDone. created ${created}, skipped ${skipped} (already existed).`);
