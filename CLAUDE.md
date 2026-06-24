# VivahStyle — Claude Code Configuration

## Project Context

VivahStyle is a staff-operated in-store platform for Indian wedding fashion boutiques. It is **not an ecommerce site** — customers never use it directly.

Read these docs before starting any feature:

| Doc | Purpose |
|---|---|
| `context/project-overview.md` | What the app is, user types, pages, flows |
| `context/architecture.md` | Stack, folder structure, DB schema, API patterns |
| `context/build-plan.md` | Feature specs (01–16) with exact UI and logic |
| `context/code-standards.md` | TypeScript rules, file naming, component structure, error handling |
| `context/ui-tokens.md` | All design tokens — use these, never hardcode hex values |
| `context/ui-registry.md` | Existing components — check before building a new one |
| `context/library-docs.md` | InsForge, Groq, API4.AI, PostHog usage patterns |
| `context/progress-tracker.md` | What's done, decisions made, notes for next session |

## Stack

- Next.js 16, App Router, React 19
- Tailwind CSS v4 (tokens in `globals.css` via `@theme`)
- InsForge (`@insforge/sdk`) — database + storage
- Groq Vision — inventory auto-fill
- API4.AI — virtual try-on
- PostHog — analytics (exactly 7 events, defined in `project-overview.md`)

## Build Approach

1. Work feature by feature following `context/build-plan.md` (Features 01–16).
2. Check `context/progress-tracker.md` to find the next feature before asking.
3. After each feature, mark it `[x]` in `progress-tracker.md` and record any decisions.
4. Leave the app demoable after every feature.

## Non-Negotiable Rules

- All enum strings come from `lib/constants.ts` — never retype a category, occasion, or payment mode inline.
- All prices rendered with `formatINR()` from `lib/format.ts`.
- `lib/scoring/` is pure: no DB, no fetch, no `Date.now()`, no randomness.
- Role checks in `middleware.ts` AND in every server action/route handler (`requireRole()`).
- `GROQ_API_KEY` and `API4AI_KEY` are server-only — never in client bundles.
- No hex values in components — tokens only (see `context/ui-tokens.md`).
- Playfair Display for headings only; Inter for everything else.
- No component libraries (shadcn, MUI). No state managers. No LLM SDK for recommendations.

## Folder Structure (abbreviated)

```
app/
  page.tsx                  → Store gate
  (admin)/                  → Owner routes
  (cashier)/                → Cashier routes
  (stylist)/                → Stylist routes
  api/auth/ inventory/ recommendations/ tryon/
components/ui/ layout/ inventory/ billing/ explore/ dress/ onboarding/ dashboard/
lib/
  insforge/client.ts server.ts storage.ts
  scoring/engine.ts couple.ts matrices.ts
  auth.ts constants.ts format.ts posthog.ts
middleware.ts
```

## Authentication

- Cookie `vivah_session = { staffId, name, role }` signed with HMAC (`SESSION_SECRET`).
- `requireRole()` from `lib/auth.ts` — call at the top of every action and handler.
- Role → route group: `stylist` → `(stylist)`, `cashier` → `(cashier)`, `owner` → `(admin)`.

## Environment Variables

```
NEXT_PUBLIC_INSFORGE_URL
NEXT_PUBLIC_INSFORGE_ANON_KEY
API4AI_KEY               (server only)
API4AI_ENDPOINT          (server only)
GROQ_API_KEY             (server only)
SESSION_SECRET           (server only)
NEXT_PUBLIC_POSTHOG_KEY
NEXT_PUBLIC_POSTHOG_HOST
```

## Live Docs — Always Fetch Before Coding

Do NOT rely on training knowledge for these libraries. Fetch live docs every session:

| Library | How to fetch |
|---|---|
| InsForge SDK (db) | `mcp__insforge__fetch-sdk-docs { sdkFeature: "db", sdkLanguage: "typescript" }` |
| InsForge SDK (storage) | `mcp__insforge__fetch-sdk-docs { sdkFeature: "storage", sdkLanguage: "typescript" }` |
| InsForge overview | `mcp__insforge__fetch-docs { docType: "instructions" }` |
| Next.js App Router | https://nextjs.org/docs/app |
| Tailwind v4 `@theme` | https://tailwindcss.com/docs/theme |
| Groq Vision | https://console.groq.com/docs/vision |

## Tailwind Version

This project uses **Tailwind CSS v4** with `@tailwindcss/postcss`. The `@theme` block in `app/globals.css` replaces `tailwind.config.js` for all color and radius tokens. InsForge's generic docs say "use Tailwind 3.4" — **ignore that**; this project's spec overrides it.

## Agent Reference

See `AGENTS.md` for the full agent-facing reference including live InsForge SDK patterns, MCP tool usage, storage patterns, and the custom HMAC auth flow.
