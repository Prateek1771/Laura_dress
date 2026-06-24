# VivahStyle — UI Tokens

## How to Use

All design values live as CSS variables in `globals.css` using Tailwind v4's `@theme` directive. Components reference tokens via Tailwind utilities (e.g. `bg-primary`, `text-ink-secondary`). Never hardcode a hex value in a component — if a value is missing, add it here first.

## globals.css — Complete Token Definition

```css
@import "tailwindcss";

@theme {
  /* Surfaces */
  --color-ivory: #FAF7F2;          /* page background */
  --color-surface: #FFFFFF;        /* cards */
  --color-surface-soft: #F5EFE6;   /* table header rows, subtle fills */
  --color-border: #E8DFD3;         /* all borders and dividers */

  /* Brand */
  --color-primary: #7A1F2B;        /* deep maroon — buttons, active nav, links */
  --color-primary-hover: #641923;
  --color-primary-soft: #F7E9EB;   /* maroon tint backgrounds */
  --color-gold: #C9A227;           /* accents, active nav underline, AI-suggested border */
  --color-gold-soft: #F3E8C9;      /* gold tint backgrounds, "Auto Fill" indicator */

  /* Text */
  --color-ink: #2B2118;            /* headings, primary text (warm near-black) */
  --color-ink-secondary: #6F6258;  /* body secondary */
  --color-ink-muted: #9C8F84;      /* labels, placeholders, timestamps */

  /* Match score tiers */
  --color-score-excellent: #16A34A;  /* >= 90 */
  --color-score-strong: #D97706;     /* 75–89 */
  --color-score-good: #EA580C;       /* 60–74 */
  --color-score-track: #EFE8DC;      /* score bar background */

  /* Status */
  --color-status-info: #2563EB;      /* generating, reserved */
  --color-status-success: #16A34A;   /* ready, completed, in_stock */
  --color-status-warning: #D97706;   /* low_stock, pending */
  --color-status-danger: #DC2626;    /* out_of_stock, failed, errors */
  --color-status-neutral: #9C8F84;   /* inactive, cancelled */

  /* Payment mode badge accents */
  --color-pay-cash: #15803D;       /* green */
  --color-pay-upi: #6D28D9;        /* purple */
  --color-pay-card: #1D4ED8;       /* blue */
  --color-pay-netbanking: #0F766E; /* teal */

  /* Dashboard chart palette (in order) */
  --color-chart-1: #7A1F2B;  /* maroon — cash */
  --color-chart-2: #6D28D9;  /* purple — upi */
  --color-chart-3: #1D4ED8;  /* blue — card */
  --color-chart-4: #0F766E;  /* teal — net_banking */
  --color-chart-5: #9C8F84;  /* grey — other */

  /* Skin tone swatches (visual-only — exact values) */
  --color-tone-light: #F3D9C2;
  --color-tone-light-medium: #E8B98F;
  --color-tone-medium: #C98A5B;
  --color-tone-deep: #8D5524;

  /* Typography */
  --font-display: "Playfair Display", serif;
  --font-sans: "Inter", sans-serif;

  /* Radii */
  --radius-card: 12px;
  --radius-button: 8px;
  --radius-badge: 999px;
  --radius-input: 8px;
}
```

## Color Usage Guide

| UI element | Token |
|---|---|
| Page background | `ivory` |
| Card background | `surface` |
| Table header rows | `surface-soft` |
| Card borders, dividers, input borders | `border` |
| Primary button, active nav, links | `primary` |
| Primary button hover | `primary-hover` |
| Selected option background | `primary-soft` |
| Active nav underline, couple combo bars | `gold` |
| "✨ Auto Fill" indicator border, AI-suggested field indicator | `gold-soft` + `gold` left border |
| Headings, prices, table values | `ink` |
| Body secondary text | `ink-secondary` |
| Field labels (uppercase), placeholders, meta text | `ink-muted` |

## Match Score Colors

| Tier | Range | Token |
|---|---|---|
| Excellent | ≥ 90 | `score-excellent` |
| Strong | 75–89 | `score-strong` |
| Good | 60–74 | `score-good` |
| Bar track | — | `score-track` |

## Status Badge Colors

| Status | Token |
|---|---|
| in_stock, ready, completed | `status-success` |
| low_stock, generating | `status-warning` |
| out_of_stock, failed | `status-danger` |
| inactive, cancelled | `status-neutral` |

## Payment Mode Badge Colors

| Mode | Token |
|---|---|
| cash | `pay-cash` |
| upi | `pay-upi` |
| card | `pay-card` |
| net_banking | `pay-netbanking` |

Badges: 10% tint background of the token + full token text.

## Typography

| Element | Font | Size | Weight | Line height | Color |
|---|---|---|---|---|---|
| Page title (h1) | Playfair Display | 28px | 600 | 1.2 | `ink` |
| Section heading (h2) | Playfair Display | 20px | 600 | 1.3 | `ink` |
| Dress name on detail page | Playfair Display | 24px | 600 | 1.25 | `ink` |
| Card title | Playfair Display | 16px | 600 | 1.3 | `ink` |
| Body | Inter | 14px | 400 | 1.5 | `ink-secondary` |
| Emphasis / table values / prices | Inter | 14px | 600 | 1.5 | `ink` |
| Field label | Inter | 11px uppercase 0.06em tracking | 600 | 1.2 | `ink-muted` |
| Secondary / meta / timestamps | Inter | 12px | 400 | 1.4 | `ink-muted` |
| Stat card value | Inter | 26px | 700 | 1.1 | `ink` |
| Dress_id badge | Inter | 12px | 600 | 1.2 | `ink-secondary` (monospaced figures) |

## Spacing

| Token | Value | Use |
|---|---|---|
| `space-page-x` | 24px (tablet) / 32px (desktop) | Page horizontal padding |
| `space-section` | 32px | Between page sections |
| `space-card` | 20px | Card internal padding |
| `space-grid-gap` | 16px | Card and table row gaps |
| `space-field-gap` | 16px | Between form fields |
| Header height | 64px | Navbar |

## Component Tokens

### Cards
`surface` bg · 1px `border` · 12px radius · 20px padding · shadow `0 1px 3px rgb(43 33 24 / 0.06)`.

### Buttons
- **Primary:** `primary` bg, white text, 8px radius, 12px×20px padding, Inter 14px/600. Hover `primary-hover`. Disabled 40% opacity.
- **Secondary:** `surface` bg, `primary` text, 1px `border`. Hover `surface-soft` bg.
- Minimum 44px tall on stylist/tablet pages.

### Input Fields
`surface` bg · 1px `border` · 8px radius · 10px×12px padding · Inter 14px `ink` · placeholder `ink-muted`. Focus: `primary` border + 2px `primary-soft` ring.

### AI-Suggested Field Indicator
Field has `gold` left border (2px) + `gold-soft` bg tint when value was auto-filled by Groq. Indicator disappears when user edits the field.

### Badges
Pill (999px radius) · 4px×10px padding · Inter 11px/600 uppercase · tinted background + token text.

### Dress_id Badge
`surface-soft` bg · `ink-secondary` text · monospaced figures · 11px · same pill shape.

### Match Score Bar
6px tall · `score-track` background · fill colored by tier · pill rounded · percentage label right (Inter 13px/700 in tier color) · tier word below in `ink-muted` 11px.

### Couple Compatibility Ring
56px ring, stroke by tier. Three mini-bars (Color · Theme · Fabric): 4px tall, `score-track` track, `gold` fill.

### Payment Mode Badge
Pill with the respective `pay-*` token. Used in bills table and invoice summary.

### Inventory Table Row
12px vertical padding · `border-b` divider · hover `ivory` bg. Thumbnail 40×40 `object-cover` with 6px radius. Stock dot: 8px circle in status token color.

### Dashboard Stat Cards
Card base + label (11px uppercase `ink-muted`) over value (26px/700 `ink`) + optional trend tag.

## Invariants

1. No hex values in components — tokens only.
2. Match score colors: only the three tier tokens. No intermediate colors.
3. Playfair Display is for page headings, section headings, dress names on the detail page, and card titles only — never body, buttons, badges, tables, or form inputs.
4. AI-suggested field indicator uses `gold` left border — never any other color.
5. All prices rendered with `₹` + Indian digit grouping via `formatINR()` in `lib/format.ts`.
6. Payment mode badges always use the `pay-*` token — never the generic status tokens.
