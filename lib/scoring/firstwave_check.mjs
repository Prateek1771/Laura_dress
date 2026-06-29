// Standalone self-check for first-wave scoring (#3 occasion color, #5 buckets + #4 attrs).
// No test runner in this project. Run: node lib/scoring/firstwave_check.mjs
// Follows the project pattern (skin_color_check.mjs): import the authoritative data tables
// from matrices.ts (type-only imports there, so it loads under node's TS stripping) and
// mirror the small pure logic the real engine runs.
import assert from 'node:assert/strict';
import {
  SKIN_TONE_COLORS,
  OCCASION_COLORS,
  COLOR_WEIGHTS,
  HEAVY_WORDS,
  LUX_FABRICS,
  LUX_WORDS,
  TREND_WORDS,
} from './matrices.ts';

// --- #3 scoreColor: mirror of engine.scoreColor ---
const scoreColor = (skin_tone, occasions, colors) => {
  const palette = new Set(skin_tone ? SKIN_TONE_COLORS[skin_tone] : []);
  for (const occ of occasions) for (const c of OCCASION_COLORS[occ] ?? []) palette.add(c);
  if (palette.size === 0) return COLOR_WEIGHTS.noData;
  return colors.some((c) => palette.has(c)) ? COLOR_WEIGHTS.match : COLOR_WEIGHTS.none;
};

assert.equal(scoreColor(null, ['haldi'], ['mustard']), 20, 'haldi+mustard, no skin → 20 (occasion color)');
assert.equal(scoreColor(null, ['haldi'], ['black']), 0, 'haldi+black, no skin → 0 (not in palette)');
assert.equal(scoreColor(null, ['other'], ['black']), 15, 'only `other` + no skin → flat 15 (back-compat)');
assert.equal(scoreColor('fair', ['other'], ['emerald']), 20, 'skin palette still applies when occasion unmapped');

// --- #4 deriveAttrs: mirror of attributes.deriveAttrs ---
const countWords = (text, words) => Math.min(5, words.reduce((n, w) => (text.includes(w) ? n + 1 : n), 0));
const deriveAttrs = (item) => {
  const text = [item.name, ...item.tags].join(' ').toLowerCase();
  const luxFromFabric = item.fabric && LUX_FABRICS.includes(item.fabric) ? 1 : 0;
  return {
    embroideryLevel: countWords(text, HEAVY_WORDS),
    luxuryScore: Math.min(5, countWords(text, LUX_WORDS) + luxFromFabric),
    trendScore: countWords(text, TREND_WORDS),
  };
};

const silkItem = { name: 'Heavy Zari Embroidered Lehenga', tags: ['designer', 'sequin work'], fabric: 'silk' };
const plainItem = { name: 'Plain Cotton Kurta', tags: ['simple'], fabric: null };
const lux = deriveAttrs(silkItem);
assert.ok(lux.luxuryScore >= 1, 'silk + designer → luxury >= 1');
assert.ok(lux.embroideryLevel >= 1, 'zari/embroider/stone → embroidery >= 1');
assert.ok(lux.trendScore >= 1, 'designer/sequin → trend >= 1');
for (const v of Object.values(lux)) assert.ok(v >= 0 && v <= 5, 'attrs capped 0–5');
assert.equal(deriveAttrs(plainItem).luxuryScore, 0, 'plain cotton → luxury 0');

// --- #5 categorize: mirror of buckets.categorize ---
const pickBy = (scored, rank) => scored.reduce((best, s) => (rank(s) > rank(best) ? s : best)).item.id;
const categorize = (scored) => {
  if (!scored.length) return {};
  const attrs = new Map(scored.map((s) => [s.item.id, deriveAttrs(s.item)]));
  const a = (s) => attrs.get(s.item.id);
  return {
    'Best Overall': pickBy(scored, (s) => s.matchScore),
    'Most Premium': pickBy(scored, (s) => a(s).luxuryScore * 1000 + s.matchScore),
    'Most Trending': pickBy(scored, (s) => a(s).trendScore * 1000 + s.matchScore),
    'Safest Choice': pickBy(scored, (s) => s.components.occasion * 1000 + s.matchScore),
    "Editor's Pick": pickBy(scored, (s) => a(s).embroideryLevel * 1000 + s.matchScore),
    'Hidden Gem': pickBy(scored, (s) => s.matchScore - a(s).trendScore * 3),
  };
};

const mk = (id, matchScore, occ, item) => ({ item: { id, ...item }, matchScore, components: { occasion: occ } });
const scored = [
  mk('a', 95, 35, silkItem),
  mk('b', 70, 18, plainItem),
  mk('c', 80, 35, { name: 'Modern Satin Gown', tags: ['trendy', 'fusion'], fabric: null }),
];
const buckets = categorize(scored);
const ids = new Set(['a', 'b', 'c']);
for (const [label, id] of Object.entries(buckets)) assert.ok(ids.has(id), `${label} → real itemId`);
assert.equal(buckets['Best Overall'], 'a', 'Best Overall = max matchScore');
assert.equal(buckets['Most Trending'], 'c', 'Most Trending = highest trend item');
assert.deepEqual(categorize([]), {}, 'empty scored → empty buckets');

console.log('OK: occasion color + deriveAttrs + categorize all pass');
