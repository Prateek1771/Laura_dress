# VivahStyle — Code Standards

## Engineering Mindset

1. Ship the feature in front of you — no speculative abstractions for "later".
2. Smallest change that fully works. Vertical slices over horizontal layers.
3. Reuse before writing: check `ui-registry.md` and existing `lib/` code first.
4. Every enum string comes from `lib/constants.ts` — never retype a category, payment mode, or status inline.
5. If a rule here conflicts with general best practice, this file wins.
6. Leave the app demoable after every feature; update `progress-tracker.md` in the same change.
7. When a spec is ambiguous, pick the simplest interpretation and note it in `progress-tracker.md` → Decisions.

## TypeScript

- `strict: true`. No `any` — use `unknown` and narrow.
- Types live next to their domain: DB row types in `lib/insforge/types.ts`, scoring types in `lib/scoring/types.ts`.
- Derive literal unions from `lib/constants.ts` arrays: `type Occasion = (typeof OCCASIONS)[number]`.
- All async functions handled — no floating promises.
- Prefer `interface` for object shapes, `type` for unions.

## Next.js 16 Conventions

- App Router only. React 19. Server Components by default; `'use client'` only for interactivity (onboarding form, explore filters, billing cart, try-on modal).
- Data fetching in Server Components or server actions — client components receive data via props.
- Mutations: server actions for form-driven writes (`createSession`, `createBill`, `recordReturn`, staff CRUD); route handlers only for `auth`, `autofill`, `recommendations`, `tryon`.
- `revalidatePath()` after every mutation that changes a visible list.
- No client-side fetching of InsForge data except dress_id lookup (billing/returns live search) and Shop Suggested activation.

## File and Folder Naming

| Thing | Convention | Example |
|---|---|---|
| Folders, routes | kebab-case | `inventory/new/` |
| Component files | PascalCase | `DressCard.tsx` |
| lib modules | kebab-case | `session-code.ts` |
| Server actions | camelCase verbs in `actions.ts` per route group | `createBill()` |
| DB tables / columns | snake_case plural / snake_case | `bill_items.unit_price` |
| Constants | SCREAMING_SNAKE | `MATCH_THRESHOLD_GOOD` |

## Component Structure

Import order — blank line between groups:

```typescript
// 1. React / Next
import { useState } from 'react';
import Image from 'next/image';
// 2. External packages
// 3. lib
import { OCCASIONS } from '@/lib/constants';
// 4. Components
import { Badge } from '@/components/ui/Badge';
// 5. Types
import type { ScoredItem } from '@/lib/scoring/types';
```

One component per file. Props interface named `<Component>Props`, declared above the component.

## API Route Handlers

```typescript
export async function POST(req: Request) {
  try {
    const body = await req.json();
    // validate → act → respond
    return Response.json({ ok: true, data });
  } catch (error) {
    console.error('[scope] action failed:', error);
    return Response.json(
      { ok: false, error: 'Plain-language error message.' },
      { status: 500 }
    );
  }
}
```

- Always try/catch. Log with `[scope]` prefix. Scopes: `auth`, `autofill`, `recommendations`, `tryon`.
- Response envelope: `{ ok: boolean, data?, error? }`.
- Re-verify role from cookie inside every handler and server action (middleware alone is not enough).

## Server Actions

```typescript
'use server';

export async function createBill(input: CreateBillInput) {
  const staff = await requireRole(['cashier', 'owner']);
  try {
    // compute totals server-side — never trust client math
    ...
    revalidatePath('/billing');
    return { ok: true as const, data };
  } catch (error) {
    console.error('[checkout] createBill failed:', error);
    return { ok: false as const, error: 'Could not save the bill.' };
  }
}
```

`requireRole()` from `lib/auth.ts` at the top of every action. Money math (tax, totals) is server-side only.

## Scoring Engine Rules

- `lib/scoring/` is pure: no imports from `lib/insforge`, no `fetch`, no `Date.now()`, no randomness. Same inputs → same outputs always.
- All weights, matrices, thresholds are named constants — no magic numbers inside functions.
- Unit tests required for: hard filters, each score component, threshold boundary values (59/60, 74/75, 89/90), couple harmony matrices.

## InsForge Usage

- Browser (`lib/insforge/client.ts`): live dress_id search only.
- Server (`lib/insforge/server.ts`): everything else.
- Storage uploads via `lib/insforge/storage.ts` helpers that enforce the bucket path conventions in `architecture.md`.
- Full query patterns: `library-docs.md`.

## Groq Auto-Fill Rules

- Groq call happens only inside `POST /api/inventory/autofill` — never client-side.
- Downscale image client-side before sending: max 1024px long edge, max 4MB (API limit).
- Validate the JSON response: drop unknown enum values silently; only apply `suggestedPrice` if > 0.
- One automatic retry on network/5xx failure; surface the error state after that.
- Scope: `[autofill]` in log messages.

## Error Handling

Log: `console.error('[scope] what failed:', error)`. User-facing error strings are plain language — never vendor error messages or stack traces.

## PostHog Events

Exactly these seven, fired once at the described moment:

| Event | When | Properties |
|---|---|---|
| `staff_logged_in` | After successful login | `role` |
| `session_started` | After `createSession()` succeeds | `sessionId`, `shoppingFor`, `occasions` (array) |
| `recommendations_generated` | After scoring + insert completes | `sessionId`, `count`, `topScore` |
| `dress_viewed` | Dress detail page mounted | `sessionId` (if present in URL), `itemId` |
| `tryon_generated` | When try-on reaches `ready` or `failed` | `sessionId`, `itemId`, `success` |
| `bill_created` | After `createBill()` succeeds | `billId`, `paymentMode`, `total`, `itemCount` |
| `return_recorded` | After `recordReturn()` succeeds | `itemId`, `staffId` |

Server-side events: use `posthog-node` client with `await posthog.shutdown()` (see `library-docs.md`).

## Environment Variables

| Variable | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_INSFORGE_URL` | client + server | InsForge base URL |
| `NEXT_PUBLIC_INSFORGE_ANON_KEY` | client + server | InsForge anon key |
| `API4AI_KEY` | server only | Virtual try-on API key |
| `API4AI_ENDPOINT` | server only | Try-on endpoint URL |
| `GROQ_API_KEY` | server only | Groq vision API key for inventory auto-fill |
| `SESSION_SECRET` | server only | HMAC key for `vivah_session` cookie |
| `NEXT_PUBLIC_POSTHOG_KEY` | client + server | PostHog project key |
| `NEXT_PUBLIC_POSTHOG_HOST` | client + server | PostHog host |

`API4AI_KEY` and `GROQ_API_KEY` must never appear in client bundles.

## Constants (`lib/constants.ts`)

Single source of truth for every enum and threshold:

```typescript
export const SHOPPING_FOR = ['male', 'female', 'couple', 'kids'] as const;

export const OCCASIONS = [
  'wedding', 'reception', 'engagement', 'sangeet',
  'haldi', 'mehendi', 'cocktail', 'festive',
  'pre_wedding_shoot', 'other',
] as const;

export const MEN_CATEGORIES = [
  'sherwani', 'indo_western', 'jodhpuri', 'kurta_jacket_set',
  'kurta_set', 'short_kurta', 'kurta', 'suit_accessories', 'others',
] as const;

export const WOMEN_CATEGORIES = [
  'lehenga', 'saree', 'stitched_suit', 'accessories',
] as const;

export const PAYMENT_MODES = ['cash', 'upi', 'card', 'net_banking'] as const;

export const COLORS = [
  'maroon', 'ivory', 'gold', 'royal_blue', 'emerald', 'coral', 'peach',
  'navy', 'lavender', 'blush', 'mustard', 'rust', 'teal', 'fuchsia',
  'crimson', 'champagne', 'olive', 'magenta', 'cobalt', 'copper',
  'burgundy', 'white', 'black', 'grey', 'pink', 'orange', 'yellow', 'green',
] as const;

export const MATCH_THRESHOLD_EXCELLENT = 90;
export const MATCH_THRESHOLD_STRONG = 75;
export const MATCH_THRESHOLD_GOOD = 60;
```

DB enum strings in `architecture.md` must match these exactly.

Price formatting: `formatINR()` in `lib/format.ts` — `₹` + Indian digit grouping. Used everywhere a ₹ value is displayed.

## Import Aliases

`@/*` → project root. No relative imports climbing more than one level.

## Comments

Only for non-obvious constraints or workarounds. No narrating what code does.

## Approved Dependencies

| Package | Purpose |
|---|---|
| `next`, `react`, `react-dom` | Framework |
| `tailwindcss` v4 | Styling |
| `@insforge/sdk` | DB / storage |
| `groq-sdk` | Groq vision API for inventory auto-fill |
| `posthog-js`, `posthog-node` | Analytics |
| `recharts` | Dashboard charts |
| `zod` | Input validation in actions/handlers |
| `@number-flow/react` *(optional)* | Animated stat values |

No LLM SDK for recommendations (scoring is deterministic). No component libraries (shadcn, MUI). No state managers.
