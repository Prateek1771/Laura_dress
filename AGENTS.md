---
description: VivahStyle agent instructions — read this before writing any code
globs: *
alwaysApply: true
---

# VivahStyle — Agent Instructions

## What This Project Is

VivahStyle is a **staff-operated in-store platform** for Indian wedding fashion boutiques. Store staff (stylists, cashiers, owners) use it on tablets and desktops inside the boutique. Customers never access it.

16 features, built one at a time. Check `context/progress-tracker.md` for the next feature before starting anything.

---

## Stack (Authoritative)

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 15, App Router | create-next-app produces 15.x |
| UI | React 19 + Tailwind CSS **v4** | `@theme` directive in `globals.css` — no `tailwind.config.js` for colors |
| Database + Storage | `@insforge/sdk` | NOT Supabase. See patterns below |
| Inventory Auto-Fill | `groq-sdk` + Groq Vision | `meta-llama/llama-4-scout-17b-16e-instruct`, server-only |
| Virtual Try-On | API4.AI | `API4AI_KEY` + `API4AI_ENDPOINT`, server-only |
| Analytics | `posthog-js` + `posthog-node` | Exactly 7 events — no more |
| Charts | `recharts` | Dashboard only |
| Validation | `zod` | Actions and route handlers |

**Tailwind override:** InsForge generic docs say "use Tailwind 3.4" — ignore that for this project. This project uses **Tailwind v4** with `@tailwindcss/postcss`. The `@theme` block in `globals.css` is the sole source of design tokens.

---

## Live Docs — Fetch Before Coding

**MANDATORY**: Before writing any InsForge integration code, call the MCP tool:

```
mcp__insforge__fetch-sdk-docs  { sdkFeature: "db" | "storage" | "auth", sdkLanguage: "typescript" }
mcp__insforge__fetch-docs      { docType: "instructions" | "storage-sdk" | "auth-sdk" }
```

Other live references:
- Next.js App Router: https://nextjs.org/docs/app
- Tailwind v4 `@theme`: https://tailwindcss.com/docs/theme
- Groq Vision: https://console.groq.com/docs/vision (model: `meta-llama/llama-4-scout-17b-16e-instruct`)

---

## InsForge SDK Patterns (from live MCP docs)

### Client setup

```typescript
// lib/insforge/client.ts — browser only (dress_id live search)
import { createClient } from '@insforge/sdk';
export const insforge = createClient({
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
  anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
});

// lib/insforge/server.ts — server components, actions, route handlers
import { createClient } from '@insforge/sdk';
export function createServerClient() {
  return createClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
    anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
  });
}
```

### Database queries

```typescript
const db = createServerClient().database;

// Select with filters
const { data, error } = await db
  .from('inventory_items')
  .select('id, dress_id, name, price, availability')
  .eq('active', true)
  .order('created_at', { ascending: false });

// Case-insensitive dress_id lookup
const { data: item } = await db
  .from('inventory_items')
  .select('*')
  .ilike('dress_id', dressId)
  .single();

// Insert returning the row
const { data: bill, error } = await db
  .from('bills')
  .insert({ staff_id, payment_mode, total_amount })
  .select()
  .single();

// Bulk insert (bill items)
await db.from('bill_items').insert(billItems);

// Update
await db.from('styling_sessions').update({ status: 'completed' }).eq('id', sessionId);

// Soft delete
await db.from('inventory_items').update({ active: false }).eq('id', itemId);
```

SDK returns `{ data, error }` on every call — always check `error` and throw inside try/catch.

### Storage

```typescript
const storage = createServerClient().storage;

// Upload inventory image (public bucket) — use returned url directly
const { data, error } = await storage
  .from('inventory-images')
  .upload(`${itemId}/${n}.jpg`, fileBlob);
const publicUrl = data.url; // direct URL, save to DB

// Upload customer photo (private bucket)
const { data } = await storage
  .from('customer-photos')
  .upload(`${sessionId}.jpg`, photoBlob);

// Download from private bucket (for API4.AI — pass blob directly, no signed URLs)
const { data: blob } = await storage
  .from('customer-photos')
  .download(`${sessionId}.jpg`);

// Delete
await storage.from('customer-photos').remove(`${sessionId}.jpg`);
```

**Note on try-on flow:** The InsForge SDK does not expose `createSignedUrl`. For the API4.AI try-on call (Feature 13), download the customer photo server-side as a Blob and append it to the multipart FormData directly instead of passing a signed URL.

---

## InsForge MCP Tools (infrastructure only — not app code)

| Tool | Use for |
|---|---|
| `mcp__insforge__run-raw-sql` | Run DB migrations, create tables |
| `mcp__insforge__create-bucket` | Create storage buckets |
| `mcp__insforge__get-table-schema` | Inspect existing schema |
| `mcp__insforge__fetch-sdk-docs` | Get latest TypeScript SDK docs |
| `mcp__insforge__fetch-docs` | Get latest platform docs |
| `mcp__insforge__list-buckets` | Check existing buckets |

---

## Non-Negotiable Rules

1. All enum strings from `lib/constants.ts` — never type a category, occasion, or payment mode inline.
2. All prices via `formatINR()` from `lib/format.ts`.
3. `lib/scoring/` is pure — no DB calls, no fetch, no `Date.now()`, no randomness.
4. `requireRole()` from `lib/auth.ts` at the top of every server action AND route handler.
5. `GROQ_API_KEY`, `API4AI_KEY`, `SESSION_SECRET` are server-only — never in client bundles.
6. No hex values in components — tokens only (from `context/ui-tokens.md` / `globals.css`).
7. Playfair Display for headings only; Inter for everything else.
8. No component libraries (shadcn, MUI, Radix). No state managers. No LLM for recommendations.
9. `revalidatePath()` after every mutation that changes a visible list.
10. Leave the app demoable after every feature; update `context/progress-tracker.md` in the same change.

---

## Authentication Pattern

This project uses **custom HMAC cookie auth**, NOT InsForge's built-in auth system.

- Cookie: `vivah_session = { staffId, name, role }` signed with `SESSION_SECRET`
- Login: `POST /api/auth/login` — verify store code, bcrypt.compare() password, set httpOnly cookie, maxAge: 28800
- `requireRole(roles)` in `lib/auth.ts` reads and verifies cookie on every request
- `middleware.ts` redirects unauthenticated/wrong-role users
- Role → route group: `stylist` → `(stylist)`, `cashier` → `(cashier)`, `owner` → `(admin)`

Do NOT use `@insforge/react` auth hooks — they're for InsForge's built-in auth, not our custom flow.

---

## Folder Structure

```
app/
  page.tsx                    → Store gate (Feature 02)
  (admin)/                    → Owner: dashboard, inventory, settings
  (cashier)/                  → Cashier: billing, returns
  (stylist)/                  → Stylist: onboarding, explore
  api/auth/ inventory/ recommendations/ tryon/
components/
  ui/                         → Button, Card, Badge, Input, Select, ScoreBar, ImageGallery
  layout/                     → Navbar, Shell
  inventory/ billing/ explore/ dress/ onboarding/ dashboard/
lib/
  insforge/client.ts server.ts storage.ts types.ts
  scoring/engine.ts couple.ts matrices.ts types.ts
  auth.ts constants.ts format.ts posthog.ts
middleware.ts
globals.css                   → @theme tokens (Tailwind v4)
```

---

## Context Docs Reference

| Doc | Read when |
|---|---|
| `context/project-overview.md` | Understanding user flows and PostHog events |
| `context/architecture.md` | DB schema, storage buckets, system boundaries |
| `context/build-plan.md` | Feature specs with exact UI and logic |
| `context/code-standards.md` | TypeScript rules, component structure, error handling |
| `context/ui-tokens.md` | Every design token and how to use it |
| `context/ui-registry.md` | Existing components — reuse before building |
| `context/library-docs.md` | Groq, API4.AI, PostHog, scoring engine contracts |
| `context/progress-tracker.md` | Current feature, decisions made |
