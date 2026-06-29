// Standalone scoring self-check (no test runner in this project).
// Run: node lib/scoring/skin_color_check.mjs
import assert from 'node:assert/strict';
import { SKIN_TONE_COLORS, COLOR_WEIGHTS } from './matrices.ts';
import { COLORS } from '../constants.ts';

// Mirror of engine.scoreColor — same branch the real engine runs.
const scoreColor = (skin_tone, colors) => {
  if (!skin_tone) return COLOR_WEIGHTS.noData;
  const liked = SKIN_TONE_COLORS[skin_tone];
  return colors.some((c) => liked.includes(c)) ? COLOR_WEIGHTS.match : COLOR_WEIGHTS.none;
};

assert.equal(scoreColor(null, ['blush']), 15, 'no skin tone → flat 15 (unchanged behavior)');
assert.equal(scoreColor('fair', ['emerald']), 20, 'fair likes emerald → 20');
assert.equal(scoreColor('fair', ['orange']), 0, 'fair does not like orange → 0');
assert.equal(scoreColor('deep', ['gold']), 20, 'deep likes gold → 20');

const valid = new Set(COLORS);
for (const [tone, list] of Object.entries(SKIN_TONE_COLORS))
  for (const c of list) assert.ok(valid.has(c), `${tone}: '${c}' is not in COLORS`);

console.log('OK: scoreColor branch + SKIN_TONE_COLORS data all pass');
