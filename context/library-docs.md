# VivahStyle — Library Docs

## Before Using Any Library

Authority order when patterns conflict:

1. MCP tools / official docs fetched live
2. Installed skills (e.g. the `insforge` skill)
3. **This file**
4. Training knowledge (last resort)

These are project-specific patterns — they override general knowledge of each library.

---

## InsForge

### Client vs Server

```typescript
// lib/insforge/client.ts — browser (live dress_id lookup only)
import { createClient } from '@insforge/sdk';
export const insforge = createClient({
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
  anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
});

// lib/insforge/server.ts — server components, actions, route handlers
export function createServerClient() { /* same config, new instance per request */ }
```

### DB Queries

```typescript
const db = createServerClient().database;

// Select with filter
const { data: items } = await db
  .from('inventory_items')
  .select('*')
  .eq('active', true)
  .order('created_at', { ascending: false });

// Case-insensitive dress_id lookup (billing/returns)
const { data: item } = await db
  .from('inventory_items')
  .select('*')
  .ilike('dress_id', dressId)
  .single();

// Insert returning the row
const { data: bill } = await db
  .from('bills')
  .insert({ staff_id, payment_mode, total_amount, ... })
  .select()
  .single();

// Insert multiple (bill items)
await db.from('bill_items').insert(billItems);

// Aggregation for dashboard (sum)
const { data } = await db
  .from('bills')
  .select('total_amount')
  .gte('created_at', rangeStart);
// Sum client-side or use a DB function
```

**Rules:** check `error` on every call and throw into try/catch; never `select('*')` inside client components — pick columns explicitly; aggregation queries for the dashboard run server-side only.

### Storage

```typescript
const storage = createServerClient().storage;

// Upload inventory image (public bucket)
await storage.from('inventory-images').upload(`${itemId}/${n}.jpg`, file);
const url = storage.from('inventory-images').getPublicUrl(`${itemId}/0.jpg`);

// Upload customer photo (private bucket)
await storage.from('customer-photos').upload(`${sessionId}.jpg`, file);

// Signed URL for private buckets (short expiry for API4.AI call)
const { data } = await storage
  .from('customer-photos')
  .createSignedUrl(`${sessionId}.jpg`, 600); // 10 min

// Try-on preview upload
await storage.from('tryon-previews').upload(`${tryonId}.jpg`, buffer);
```

**Rules:** bucket path conventions from `architecture.md` are mandatory; private buckets never use `getPublicUrl`; customer photo replacement overwrites the same path.

---

## Groq Vision (Inventory Auto-Fill)

Docs: https://console.groq.com/docs/vision  
Model: `meta-llama/llama-4-scout-17b-16e-instruct`

### Endpoint

`POST https://api.groq.com/openai/v1/chat/completions`  
Auth: `Authorization: Bearer ${process.env.GROQ_API_KEY}`

### Request

```typescript
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

const AUTO_FILL_PROMPT = `You are a fashion inventory assistant for an Indian wedding boutique.
Analyse this dress image and extract structured details.
Return ONLY valid JSON with exactly this structure (no extra keys, no explanation):
{
  "name": "descriptive dress title (string)",
  "gender": "men" | "women",
  "category": one of [sherwani, indo_western, jodhpuri, kurta_jacket_set, kurta_set, short_kurta, kurta, suit_accessories, others, lehenga, saree, stitched_suit, accessories],
  "colors": ["color1"] using ONLY: maroon, ivory, gold, royal_blue, emerald, coral, peach, navy, lavender, blush, mustard, rust, teal, fuchsia, crimson, champagne, olive, magenta, cobalt, copper, burgundy, white, black, grey, pink, orange, yellow, green,
  "occasions": array from [wedding, reception, engagement, sangeet, haldi, mehendi, cocktail, festive, pre_wedding_shoot, other],
  "fabric": "silk" | "velvet" | "brocade" | "georgette" | "chiffon" | "cotton_silk" | "net" | "other",
  "tags": ["descriptive keyword"] (max 5),
  "suggestedPrice": number (in INR) or null
}`;

const completion = await groq.chat.completions.create({
  model: 'meta-llama/llama-4-scout-17b-16e-instruct',
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: AUTO_FILL_PROMPT },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
      ],
    },
  ],
  response_format: { type: 'json_object' },
  max_tokens: 512,
});

const raw = JSON.parse(completion.choices[0].message.content!);
```

### Response Validation

```typescript
// Validate and sanitise — drop unknown enum values, don't reject
function sanitiseAutoFill(raw: Record<string, unknown>): InventoryAutoFill {
  return {
    name: typeof raw.name === 'string' ? raw.name : '',
    gender: ['men', 'women'].includes(raw.gender as string) ? (raw.gender as Gender) : null,
    category: ALL_CATEGORIES.includes(raw.category as string) ? (raw.category as Category) : null,
    colors: Array.isArray(raw.colors)
      ? (raw.colors as string[]).filter((c) => COLORS.includes(c as Color))
      : [],
    occasions: Array.isArray(raw.occasions)
      ? (raw.occasions as string[]).filter((o) => OCCASIONS.includes(o as Occasion))
      : [],
    fabric: FABRICS.includes(raw.fabric as string) ? (raw.fabric as Fabric) : null,
    tags: Array.isArray(raw.tags) ? (raw.tags as string[]).slice(0, 5) : [],
    suggestedPrice: typeof raw.suggestedPrice === 'number' && raw.suggestedPrice > 0
      ? raw.suggestedPrice
      : null,
  };
}
```

### Rules

- Image: downscale client-side to max 1024px long edge before encoding. Base64 limit: 4MB.
- One automatic retry on network/5xx failure. After that: return `{ ok: false, error: 'Couldn\'t read this image.' }`.
- Unknown enum values are silently dropped (field left blank for owner to fill).
- `suggestedPrice` only applied if > 0 and only populates the price field if it's currently empty.
- Groq API key is server-only — never send `imageBase64` to a client-side Groq call.
- Log failures: `console.error('[autofill] Groq call failed:', error)`.

---

## API4.AI Virtual Try-On

Docs: https://api4.ai/docs/virtual-try-on

### Endpoint

| Mode | Endpoint |
|---|---|
| Demo (dev) | `https://demo.api4ai.cloud/virtual-try-on/v1/results` |
| RapidAPI | `https://virtual-try-on7.p.rapidapi.com/v1/results` |

Set `API4AI_ENDPOINT` and `API4AI_KEY` in env. Verify which auth header your key uses at Feature 13:
- RapidAPI key → `X-RapidAPI-Key: <key>`
- Direct api4.ai key → `A4A-CLIENT-ID: <key>`
- Demo endpoint → no auth header needed

### Request

```typescript
const form = new FormData();
form.append('url', personSignedUrl);      // customer photo (10-min signed URL)
form.append('url-apparel', garmentPublicUrl); // inventory image (public URL)

const res = await fetch(process.env.API4AI_ENDPOINT!, {
  method: 'POST',
  headers: { [API4AI_HEADER_NAME]: process.env.API4AI_KEY! },
  body: form,
  signal: AbortSignal.timeout(60_000),
});
```

### Response (verified against demo endpoint)

```json
{
  "results": [
    {
      "status": { "code": "ok", "message": "Success" },
      "entities": [
        {
          "kind": "image",
          "name": "person-in-apparel",
          "image": "<base64-encoded JPEG>"
        }
      ]
    }
  ]
}
```

Extract path: `data.results[0].entities[0].image` → base64 JPEG → `Buffer.from(b64, 'base64')` → upload to `tryon-previews/{tryonId}.jpg`.

Check `data.results[0].status.code === 'ok'` before reading entities.

### Rules

- Timeout: 60s. One automatic retry on network/5xx. After that: `tryons.status = 'failed'` — never leave `generating`.
- UI shows shimmer loading state during generation (~10–30s). Never block navigation.
- Downscale person photos client-side to max 1024px before upload to the customer-photos bucket.
- API4.AI key is server-only.

---

## PostHog

### Client (browser)

```typescript
// lib/posthog.ts
import posthog from 'posthog-js';

export function initPostHog() {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST!,
    capture_pageview: true,
  });
}
```

Init once in a client provider in the root layout. Identify staff after login:
`posthog.identify(staffId, { role, name })`.

### Server (events from actions/handlers)

```typescript
import { PostHog } from 'posthog-node';
const ph = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  host: process.env.NEXT_PUBLIC_POSTHOG_HOST!,
});
ph.capture({ distinctId: staffId, event: 'bill_created', properties: { ... } });
await ph.shutdown(); // REQUIRED — events are lost in serverless without it
```

**Rules:** only the seven events in `code-standards.md`; always `await shutdown()` on server; fire and forget inside try/catch — never block the user response on PostHog.

---

## Scoring Engine (internal — `lib/scoring`)

### Contract

```typescript
// lib/scoring/engine.ts
recommend(session: SessionPreferences, items: InventoryItem[]): ScoredItem[]
// → all items with score ≥ 60, sorted desc, no hard count cap

scoreItem(session: SessionPreferences, item: InventoryItem): ScoredItem
// → { item, matchScore: 0–100, matchReasons: string[], tier: 'excellent'|'strong'|'good' }

// lib/scoring/couple.ts
coupleCompatibility(a: InventoryItem, b: InventoryItem):
  { colorHarmony: number; themeHarmony: number; fabricHarmony: number; overall: number }
// overall = 0.5 × colorHarmony + 0.3 × themeHarmony + 0.2 × fabricHarmony

suggestPartnerOutfits(anchor: InventoryItem, session: SessionPreferences, items: InventoryItem[]): ScoredItem[]
// → top 5 partner items
```

### Rules

- Pure functions only — no DB, no fetch, no clock, no randomness.
- Weights and matrices defined in `lib/scoring/matrices.ts` + `lib/constants.ts`; exact values in `build-plan.md` Features 10 and 14.
- `matchReasons` are template strings from score components — never free-form.
- Any weight/matrix change must update `build-plan.md` and add a note to `progress-tracker.md` → Decisions.
