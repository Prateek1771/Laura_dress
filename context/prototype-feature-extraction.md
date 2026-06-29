# Prototype Feature Extraction — `metadata/` Stylist → VivahStyle

## Purpose

A separate Python/Streamlit prototype ("Ethnic Fashion Stylist") lives at
`C:\Users\hitli\OneDrive\Desktop\metadata\`. It is a 7-stage decision-support recommender:

```
Profile → NL intent → Color intelligence → Retrieval → Multi-factor scoring → Ranking → Explanation
```

It is richer than VivahStyle's current rule scoring. This doc **catalogues the reusable
features** and maps each to a concrete VivahStyle integration so we can pick what to build
later. No code is changed by this document.

**Preserve the prototype's own layering rule** (`metadata/note.txt`):

> The AI should **never directly recommend dresses**. It should only understand the user's
> intent. The business logic decides the recommendations.

This matches VivahStyle's invariants: `lib/scoring/` is pure (architecture.md invariant 3)
and CLAUDE.md's "No LLM SDK for recommendations". Every integration below keeps AI at the
edges (intent parsing, explanation prose) and rule logic at the core (scoring).

---

## Already covered — do **not** re-port

| Capability | Where it already lives in VivahStyle |
|---|---|
| Occasion / budget / availability scoring | `lib/scoring/engine.ts` + `matrices.ts` |
| Basic couple color/theme/fabric harmony | `lib/scoring/couple.ts`, `matrices.ts` |
| Groq Vision auto-fill (simpler schema) | Feature 04 — `POST /api/inventory/autofill` |
| Manual skin-tone cards + color score | shipped last session — `SKIN_TONE_COLORS` in `matrices.ts`, `scoreColor()` |

---

## Cross-cutting integration constraints

Every feature below must respect these. They are stated once here and referenced per-feature.

1. **Scoring stays pure.** `lib/scoring/` may not fetch, touch the DB, use `Date.now()`,
   or call an LLM. So NL parsing, selfie detection, and AI explanations live in **API
   routes / server actions** that produce plain values (tags, enums, strings); those
   values are passed into the pure scoring functions. The prototype already works this way.

2. **Colors must map to the canonical enum.** The prototype uses free-text colors
   (`navy blue`, `wine`, `cream`, `royal blue`). VivahStyle's `COLORS` in
   `lib/constants.ts` is a fixed list. Any ported color rule must be translated into that
   enum — exactly as `SKIN_TONE_COLORS` already was. Reuse the prototype's synonym table
   (`recommendation_engine/services/color_engine.py` → `SYNONYMS` / `normalize_color`) as
   the source of the mapping (`navy→navy`, `wine→burgundy`, `cream→ivory`, `red→crimson`,
   `royal blue→royal_blue`, `turquoise→teal`; drop names with no enum equivalent, e.g.
   `purple`, `beige`, `mint`, `silver`).

3. **The 100-point score budget is fixed.** Current split (`lib/scoring/matrices.ts`):
   occasion **35** / budget **30** / color **20** / availability **15** = 100. The
   prototype's split is different (occasion 30 / color 25 / skin 20 / style 15 /
   preference 10 / trend 5). **Adding any new component (style, preference, trend) means
   redistributing the 100 points** — this is a deliberate design decision, not a drop-in.
   Defer choosing the exact redistribution until the component is actually built.

4. **Groq is server-only.** Reuse the Feature 04 pattern and model
   `meta-llama/llama-4-scout-17b-16e-instruct`. Keys never reach the client.

5. **No new dependencies, state managers, or component libraries** (CLAUDE.md).

---

## Feature catalogue (index)

| # | Feature | Prototype source | VivahStyle target | Effort | Priority |
|---|---|---|---|---|---|
| 1 | NL preference parsing | `services/stylist_ai.py`, `rules/style_rules.json` | `POST /api/stylist/parse` + onboarding field | M | **1st wave** |
| 2 | Selfie → skin tone + undertone | `services/stylist_ai.py` | `POST /api/stylist/skin-tone` | M | later |
| 3 | Occasion-aware color | `rules/occasion_rules.json`, `services/color_engine.py` | `OCCASION_COLORS` + `scoreColor()` | S–M | **1st wave** |
| 4 | Derived outfit attributes | `models/outfit.py` | pure helpers in `lib/scoring/` | M | enables #5, #7 |
| 5 | Netflix-style buckets | `services/ranker.py` | pure `categorize()` + `/explore` rows | M | **1st wave** (needs #4) |
| 6 | "Similar outfits" | `services/retrieval.py` | pure `similar()` + dress detail | S | later |
| 7 | Style + preference scoring | `services/scorer.py` | new components in `engine.ts` | M | later |
| 8 | AI explanation reasons | `services/stylist_ai.py`, `services/explain.py` | `POST /api/stylist/explain` | S–M | later |
| 9 | Richer metadata / auto-fill | `core/metadata.py` | extend Feature 04 + columns | L | later |
| 10 | Couple refinements | `services/scorer.py`, `ranker.py`, `rules/couple_rules.json` | `lib/scoring/couple.ts` + Feature 14 | M | later |

---

## 1. NL preference parsing  ·  **1st wave**

- **What it does:** Turns a free-text wish ("royal but not flashy") into structured tags
  `{ style, brightness, avoid: [colors] }`. Groq parses it; a keyword-rule fallback
  (`nl_keywords` in `style_rules.json`) runs when there's no key or the call fails.
- **Prototype source:** `services/stylist_ai.py` → `parse_preference` / `_rule_parse`;
  `rules/style_rules.json` (`nl_keywords` map, e.g. `"regal" → {style: royal, brightness: dark}`,
  `"not too bright" → {brightness: low, avoid: [yellow, orange, neon]}`).
- **Adds to VivahStyle:** the prototype's signature "feels like a stylist, not a search
  form" capability. Tags feed later scoring (#7) and explanations (#8).
- **Target / shape:**
  - New `POST /api/stylist/parse { text }` → `{ style, brightness, avoid[] }`. Groq with a
    rule fallback (port `nl_keywords` to a TS constant). Server-only key (constraint 4).
  - Free-text input ("Describe what you want") in `components/onboarding/OnboardingForm.tsx`,
    submitted via `createSession`.
  - Persist parsed tags on `styling_sessions` (new `style`, `brightness` text cols + an
    `avoid_colors` jsonb), mirroring how `skin_tone` was added.
  - Add `STYLES` / `BRIGHTNESS` enums to `lib/constants.ts`; map `avoid` colors via
    constraint 2.
- **Gotchas:** scoring stays pure (constraint 1) — the route writes tags, scoring reads
  them. Using the tags in the score is feature #7 (needs the budget rebalance, constraint 3).
  Parsing alone is shippable without touching weights (tags can drive a soft filter or just
  display first).
- **Effort:** M.

## 2. Selfie → skin tone + undertone  ·  later

- **What it does:** Detects `{ tone, undertone }` from a selfie via Groq vision; UI falls
  back to manual selection if unavailable.
- **Prototype source:** `services/stylist_ai.py` → `detect_skin` (same call shape as
  `core/metadata.py`).
- **Adds to VivahStyle:** `note.txt` calls this the *recommended* way to capture skin tone
  (Option 1), reducing the friction of the manual cards shipped last session. It
  **complements**, not replaces, those cards (they remain the fallback).
- **Target / shape:** `POST /api/stylist/skin-tone { imageBase64 }` →
  `{ tone, undertone }`; pre-selects the existing skin-tone card in `OnboardingForm.tsx`.
  Captures `undertone` only if feature #7/#3 use it.
- **Gotchas:** tone must be one of VivahStyle's 5 buckets (`fair/wheatish/medium/tan/deep`)
  — the prototype also emits `dusky`; map `dusky→deep` or `→medium`. Privacy: onboarding
  already has a consent line for customer photos (Feature 12) — reuse it.
- **Effort:** M.

## 3. Occasion-aware color  ·  **1st wave**

- **What it does:** Each occasion has its own flattering palette; the recommended palette
  is the **merge of skin-tone colors and occasion colors** (colors in both rank highest).
- **Prototype source:** `rules/occasion_rules.json` (e.g. `haldi → [mustard, yellow,
  orange, cream, turmeric]`, `reception → [wine, black, navy blue, emerald, gold,
  champagne]`); `services/color_engine.py` → `recommend_palette(skin, occasion)`.
- **Adds to VivahStyle:** today `scoreColor()` is skin-tone-only. This makes the 20-point
  color score reflect **the event**, not just complexion — a mustard outfit scores well
  for haldi even if it's not a top skin-tone color.
- **Target / shape:** add `OCCASION_COLORS: Record<Occasion, Color[]>` to
  `lib/scoring/matrices.ts` (mapped via constraint 2); extend the **pure** `scoreColor()`
  in `engine.ts` to award the match when an item color is in `SKIN_TONE_COLORS[tone] ∪
  OCCASION_COLORS[occasion]` (optionally a higher tier for an item color in *both*).
- **Gotchas:** stays inside the existing 20-point color slot — no budget rebalance needed
  (unlike #7), so it composes cleanly with the shipped skin-tone work. Session has multiple
  occasions (jsonb array) — union across them. Map occasion names to the `OCCASIONS` enum
  (`pre_wedding_shoot` etc.).
- **Effort:** S–M.

## 4. Derived outfit attributes  ·  enables #5 and #7

- **What it does:** Derives `color_family` (jewel/pastel/earthy/neutral/bright),
  `undertone` (warm/cool/neutral), and 0–5 `embroidery_level` / `luxury_score` /
  `formality_score` / `trend_score` from an item's colors + text by keyword counting.
- **Prototype source:** `models/outfit.py` → `COLOR_FAMILY`, `WARM`/`COOL`, `HEAVY_WORDS`,
  `LUX_WORDS`, `TREND_WORDS`, `_level`, `_family_of`, `_undertone_of`.
- **Adds to VivahStyle:** the substrate for Netflix buckets (#5) and style/preference
  scoring (#7). Without it, "Most Premium"/"Most Trending" have nothing to sort on.
- **Target / shape:** pure helpers in `lib/scoring/` deriving from `inventory_items`
  (`colors`, `fabric`, `tags`, `name`). Either compute on the fly in scoring or precompute
  once at auto-fill time and store columns. Keep keyword lists in `matrices.ts`/constants.
- **Gotchas:** VivahStyle items have structured `fabric`/`tags` (cleaner than the
  prototype's free-text flattening) — derivation can read fields directly instead of
  scanning a text blob. Pure (constraint 1).
- **Effort:** M.

## 5. Netflix-style buckets  ·  **1st wave** (depends on #4)

- **What it does:** From the scored list, picks one standout per category: **Best Overall,
  Most Premium, Most Trending, Safest Choice, Editor's Pick, Hidden Gem** (Hidden Gem =
  good score but low trend).
- **Prototype source:** `services/ranker.py` → `categorize`.
- **Adds to VivahStyle:** high-impact explore-page UX — curated rows above the full grid,
  matching the note's "Recommendation Types like Netflix".
- **Target / shape:** pure `categorize(scored)` in `lib/scoring/`; render curated rows in
  `components/explore/ExploreClient.tsx` (or the explore page) above the existing grid,
  shown when Shop Suggested is active.
- **Gotchas:** needs #4's derived attributes (premium/trend/embroidery) to sort on. A
  small catalogue may surface the same item in several buckets — de-dup or allow overlap
  (the prototype allows overlap).
- **Effort:** M.

## 6. "Similar outfits"  ·  later

- **What it does:** Ranks a pool by shared-attribute overlap (garment type, color family,
  style, occasion) — no embeddings.
- **Prototype source:** `services/retrieval.py` → `similar`.
- **Adds to VivahStyle:** powers a real "Try Another" / "You may also like" on the dress
  detail page (Feature 11/13 currently has a placeholder "Try Another").
- **Target / shape:** pure `similar(item, pool, k)` in `lib/scoring/`; called from the
  dress detail page server component.
- **Gotchas:** overlap uses `color_family` → light dependency on #4 (or substitute exact
  color/category overlap to ship without #4). Pure.
- **Effort:** S.

## 7. Style + preference scoring  ·  later

- **What it does:** New score components — style match, brightness fit, favorite/disliked
  colors, embroidery-vs-style adjustments (e.g. penalize heavy embroidery for "minimal").
- **Prototype source:** `services/scorer.py` → `_style_score`, `_preference_score`,
  `BRIGHTNESS_FAMILY`.
- **Adds to VivahStyle:** consumes #1's tags to actually move rankings.
- **Target / shape:** new weighted components in `engine.ts`.
- **Gotchas:** **requires the 100-point rebalance (constraint 3)** and #1 (tags) + #4
  (color_family/embroidery). This is why it's later — it's the convergence of #1 and #4.
- **Effort:** M.

## 8. AI explanation reasons  ·  later

- **What it does:** Replaces template reasons with 3–4 stylist-voice bullets ("Emerald
  flatters wheatish skin"); Groq with a rule-template fallback.
- **Prototype source:** `services/stylist_ai.py` → `explain`; `services/explain.py` →
  `reasons`, `scorecard`, `stars`.
- **Adds to VivahStyle:** upgrades `buildReasons()` output (currently fixed templates) on
  the dress detail / score section.
- **Target / shape:** `POST /api/stylist/explain { session, item, subscores }` → bullets;
  rule fallback ports `explain.reasons`. The star **scorecard** is a nice pure display
  helper (`scorecard`/`stars`) usable independently.
- **Gotchas:** keep scoring pure — explanation reads the already-computed subscores, it
  doesn't score. Don't let prose drive ranking.
- **Effort:** S–M.

## 9. Richer metadata / auto-fill  ·  later

- **What it does:** A much larger inventory schema (fit, pattern, texture, neckline,
  sleeve_type, length, closure, embellishments, season, keywords) generated by Groq vision,
  with resumable batch processing.
- **Prototype source:** `core/metadata.py` (batch generator + schema);
  `metadata/*_dress_metadata.json` (example output).
- **Adds to VivahStyle:** richer attributes improve #4 derivation, #6 similarity, and
  filtering. The batch/resume pattern is useful for bulk-importing an existing catalogue.
- **Target / shape:** extend the Feature 04 prompt and add `inventory_items` columns; or a
  one-off bulk-import script using the resume pattern.
- **Gotchas:** **biggest change** — DB columns, form fields, auto-fill prompt, and
  sanitisation all grow. Add fields incrementally (only what scoring/filters actually use)
  rather than the whole schema at once.
- **Effort:** L.

## 10. Couple refinements  ·  later

- **What it does:** Derives compatible groom colors from the bride's color
  (`couple_rules.json`, e.g. `wine → [beige, champagne, cream, gold, black]`); adds a
  contrast sub-score; caps repeats per bride when ranking pairs.
- **Prototype source:** `services/scorer.py` → `score_couple`; `services/ranker.py` →
  `rank_couples`; `services/color_engine.py` → `groom_palette`; `rules/couple_rules.json`.
- **Adds to VivahStyle:** sharpens Feature 14 (couple combo) — directional bride→groom
  palettes and more varied results.
- **Target / shape:** extend `lib/scoring/couple.ts` (matrix already exists) with a
  bride→groom palette map + contrast term; apply per-anchor de-dup in the couple panel.
- **Gotchas:** map `couple_rules` colors to the enum (constraint 2); keep pure.
- **Effort:** M.

---

## Recommended first wave

Build order (the three the user flagged), chosen so each ships independently and the
dependency chain is respected:

1. **#3 Occasion-aware color** — smallest, self-contained, no score-budget change (stays in
   the existing 20-pt color slot), and directly extends the just-shipped skin-tone work.
2. **#1 NL preference parsing** — capture + parse + persist tags and *display* them first;
   it's shippable before the tags drive scoring. Unlocks #7 and #8 later.
3. **#4 → #5 Netflix buckets** — #5 needs #4's derived attributes, so build #4 (pure
   helpers) then #5 (categorize + explore rows). Highest UX payoff.

Deferred until their prerequisites land: #7 (needs #1 + #4 + the 100-pt rebalance), #2, #6,
#8, #9, #10.

## Out of scope

- The prototype's Streamlit UI (`app.py`) — VivahStyle is Next.js; only the **logic** ports.
- `main.py` (a stub), the prototype's image corpus, and `.venv/`.
- Committing a final score-weight redistribution — decide that when #3/#7 are built, not now.
