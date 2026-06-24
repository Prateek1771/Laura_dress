'use client';

export default function GuidelinesPage() {
  return (
    <>
      <style>{`
:root {
  --ivory: #FAF7F2; --surface: #FFFFFF; --surface-soft: #F5EFE6;
  --border: #E8DFD3; --primary: #7A1F2B; --primary-h: #641923;
  --primary-soft: #F7E9EB; --gold: #C9A227; --gold-soft: #F3E8C9;
  --ink: #2B2118; --ink-2: #6F6258; --ink-m: #9C8F84;
  --s-excel: #16A34A; --s-strong: #D97706; --s-good: #EA580C;
  --s-track: #EFE8DC; --st-info: #2563EB; --st-success: #16A34A;
  --st-warning: #D97706; --st-danger: #DC2626; --st-neutral: #9C8F84;
  --pay-cash: #15803D; --pay-upi: #6D28D9; --pay-card: #1D4ED8; --pay-nb: #0F766E;
  --r-card: 12px; --r-btn: 8px; --r-badge: 999px; --r-input: 8px;
}
.vs-body { background: var(--ivory); color: var(--ink); font-family: "Segoe UI", system-ui, sans-serif; font-size: 14px; line-height: 1.6; }
.vs-body *, .vs-body *::before, .vs-body *::after { box-sizing: border-box; margin: 0; padding: 0; }
.sticky-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; background: rgba(250,247,242,0.92); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border); padding: 0 32px; height: 52px; display: flex; align-items: center; gap: 4px; overflow-x: auto; }
.sticky-nav a { flex-shrink: 0; text-decoration: none; font-size: 11px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: var(--ink-m); padding: 5px 12px; border-radius: 999px; transition: background 120ms, color 120ms; }
.sticky-nav a:hover { background: var(--surface-soft); color: var(--ink); }
.sticky-nav a.active { background: var(--primary-soft); color: var(--primary); }
.nav-brand { font-family: Georgia, serif; font-size: 14px; font-weight: 600; color: var(--primary); margin-right: 12px; letter-spacing: 0.02em; flex-shrink: 0; }
.nav-sep { width: 1px; height: 20px; background: var(--border); flex-shrink: 0; }
.page { padding-top: 52px; }
.container { max-width: 1100px; margin: 0 auto; padding: 0 32px; }
section { padding: 64px 0; border-top: 1px solid var(--border); }
.section-eyebrow { display: flex; align-items: center; gap: 10px; margin-bottom: 32px; }
.section-eyebrow-num { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--gold); min-width: 24px; }
.section-eyebrow-line { flex: 1; height: 1px; background: var(--border); }
.section-title { font-family: Georgia, serif; font-size: 22px; font-weight: 600; color: var(--ink); margin-bottom: 8px; }
.section-desc { font-size: 13px; color: var(--ink-m); margin-bottom: 36px; }
.hero { padding: 80px 0 64px; border-top: none; }
.hero-kicker { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--gold); margin-bottom: 16px; }
.hero-name { font-family: Georgia, serif; font-size: 72px; font-weight: 600; color: var(--ink); line-height: 1.05; letter-spacing: -0.02em; }
.hero-name span { color: var(--primary); }
.hero-sub { font-size: 15px; color: var(--ink-2); margin-top: 16px; max-width: 520px; line-height: 1.65; }
.hero-meta { display: flex; gap: 24px; margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--border); }
.hero-meta-item { font-size: 12px; color: var(--ink-m); }
.hero-meta-item strong { display: block; font-size: 13px; color: var(--ink); font-weight: 600; }
.mood-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.mood-card { border-radius: var(--r-card); overflow: hidden; position: relative; height: 220px; }
.mood-card-inner { position: absolute; inset: 0; padding: 24px; display: flex; flex-direction: column; justify-content: flex-end; }
.mood-label { font-size: 10px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 6px; }
.mood-title { font-family: Georgia, serif; font-size: 20px; font-weight: 600; line-height: 1.2; }
.mood-1 { background: var(--primary); background-image: repeating-linear-gradient(135deg, transparent, transparent 3px, rgba(255,255,255,0.025) 3px, rgba(255,255,255,0.025) 6px); }
.mood-1-bar { position: absolute; top: 0; left: 0; right: 0; height: 3px; background: var(--gold); }
.mood-tags { display: flex; gap: 6px; margin-bottom: 12px; flex-wrap: wrap; }
.mood-tag { font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(250,247,242,0.45); padding: 2px 8px; border: 1px solid rgba(250,247,242,0.2); border-radius: 999px; }
.mood-2 { background: var(--surface-soft); background-image: repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(43,33,24,0.04) 19px, rgba(43,33,24,0.04) 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(43,33,24,0.04) 19px, rgba(43,33,24,0.04) 20px); border: 1px solid var(--border); }
.mood-2-bar { position: absolute; left: 24px; top: 24px; bottom: 24px; width: 2px; background: var(--gold); }
.mood-3 { display: flex !important; flex-direction: row !important; padding: 0 !important; }
.mood-3-stripe { flex: 1; position: relative; }
.mood-4 { background: var(--ink); background-image: radial-gradient(ellipse at 80% 20%, rgba(122,31,43,0.4) 0%, transparent 60%); }
.mood-4-subtitle { font-size: 12px; color: rgba(250,247,242,0.4); margin-top: 6px; letter-spacing: 0.06em; }
.mood-5 { background: var(--surface); border: 1px solid var(--border); }
.mood-5-content { position: absolute; inset: 0; padding: 20px; display: flex; flex-direction: column; gap: 12px; justify-content: center; }
.mini-card { background: var(--ivory); border: 1px solid var(--border); border-radius: 8px; padding: 12px 14px; display: flex; align-items: center; gap: 10px; }
.mini-thumb { width: 36px; height: 48px; border-radius: 5px; flex-shrink: 0; }
.mini-name { font-size: 11px; font-weight: 600; color: var(--ink); }
.mini-id { font-size: 10px; color: var(--ink-m); }
.mini-price { font-size: 12px; font-weight: 700; color: var(--ink); }
.mini-badge { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; padding: 2px 7px; border-radius: 999px; background: #DCFCE7; color: var(--st-success); }
.mood-6 { background: linear-gradient(135deg, var(--gold-soft) 0%, var(--ivory) 60%, var(--surface-soft) 100%); border: 1px solid var(--border); }
.mood-6-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 8px; }
.gold-ring { width: 72px; height: 72px; border-radius: 50%; border: 2px solid var(--gold); display: flex; align-items: center; justify-content: center; }
.gold-ring-inner { width: 56px; height: 56px; border-radius: 50%; border: 1px solid rgba(201,162,39,0.4); background: var(--gold-soft); display: flex; align-items: center; justify-content: center; font-family: Georgia, serif; font-size: 22px; color: var(--gold); }
.pinterest-section { margin-top: 28px; padding: 20px 24px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-card); display: flex; align-items: flex-start; gap: 16px; }
.pinterest-icon { flex-shrink: 0; width: 32px; height: 32px; border-radius: 50%; background: #E60023; color: white; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 16px; }
.pinterest-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-m); margin-bottom: 8px; }
.search-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.search-chip { font-size: 12px; color: var(--ink-2); background: var(--ivory); border: 1px solid var(--border); border-radius: 999px; padding: 3px 12px; cursor: pointer; transition: background 120ms, border-color 120ms; }
.search-chip:hover { background: var(--primary-soft); border-color: var(--primary); color: var(--primary); }
.palette-group { margin-bottom: 32px; }
.palette-group-name { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--ink-m); margin-bottom: 14px; }
.swatches { display: flex; flex-wrap: wrap; gap: 12px; }
.swatch { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; }
.swatch-color { width: 80px; height: 64px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.07); transition: transform 150ms, box-shadow 150ms; }
.swatch-color:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.swatch-name { font-size: 11px; font-weight: 600; color: var(--ink-2); }
.swatch-hex { font-size: 10px; color: var(--ink-m); font-family: monospace; }
.type-table { display: flex; flex-direction: column; }
.type-row { display: grid; grid-template-columns: 160px 1fr; gap: 24px; align-items: center; padding: 20px 0; border-bottom: 1px solid var(--border); }
.type-row:first-child { border-top: 1px solid var(--border); }
.type-meta-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-m); margin-bottom: 4px; }
.type-meta-spec { font-size: 11px; color: var(--ink-m); line-height: 1.6; }
.btn-matrix { display: flex; flex-direction: column; gap: 24px; }
.btn-row { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.btn-row-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-m); min-width: 80px; }
.btn { display: inline-flex; align-items: center; justify-content: center; font-family: inherit; font-weight: 600; border: none; cursor: pointer; transition: background 150ms, color 150ms, box-shadow 150ms, transform 100ms; }
.btn:active { transform: scale(0.97); }
.btn-primary { background: var(--primary); color: #fff; border-radius: var(--r-btn); padding: 12px 20px; font-size: 14px; min-height: 44px; }
.btn-primary:hover { background: var(--primary-h); }
.btn-secondary { background: var(--surface); color: var(--primary); border: 1px solid var(--border); border-radius: var(--r-btn); padding: 12px 20px; font-size: 14px; min-height: 44px; }
.btn-secondary:hover { background: var(--surface-soft); }
.btn-ghost { background: transparent; color: var(--ink-2); border-radius: var(--r-btn); padding: 8px 12px; font-size: 14px; border: none; }
.btn-ghost:hover { background: var(--surface-soft); }
.btn-sm { padding: 6px 14px; font-size: 12px; min-height: 36px; }
.btn-lg { padding: 14px 28px; font-size: 16px; min-height: 52px; }
.btn-disabled { opacity: 0.4; pointer-events: none; }
.size-label { font-size: 10px; font-weight: 600; text-transform: uppercase; color: var(--ink-m); letter-spacing: 0.08em; display: block; margin-top: 6px; text-align: center; }
.badge-wrap { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.badge { display: inline-flex; align-items: center; border-radius: var(--r-badge); padding: 4px 10px; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
.b-default { background: var(--primary-soft); color: var(--primary); }
.b-success { background: #DCFCE7; color: var(--st-success); }
.b-warning { background: #FEF3C7; color: var(--st-warning); }
.b-danger { background: #FEE2E2; color: var(--st-danger); }
.b-info { background: #DBEAFE; color: var(--st-info); }
.b-neutral { background: var(--surface-soft); color: var(--ink-m); }
.b-cash { background: #DCFCE7; color: var(--pay-cash); }
.b-upi { background: #EDE9FE; color: var(--pay-upi); }
.b-card { background: #DBEAFE; color: var(--pay-card); }
.b-nb { background: #CCFBF1; color: var(--pay-nb); }
.b-id { background: var(--surface-soft); color: var(--ink-2); font-family: monospace; text-transform: none; letter-spacing: 0; }
.card-demo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-card); padding: 20px; box-shadow: 0 1px 3px rgba(43,33,24,0.06); transition: box-shadow 200ms; }
.card:hover { box-shadow: 0 4px 16px rgba(43,33,24,0.1); }
.stat-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-m); margin-bottom: 8px; }
.stat-value { font-size: 28px; font-weight: 700; color: var(--ink); line-height: 1.1; font-variant-numeric: tabular-nums; }
.stat-trend { display: inline-flex; align-items: center; gap: 4px; margin-top: 8px; font-size: 12px; font-weight: 600; color: var(--st-success); background: #DCFCE7; padding: 2px 8px; border-radius: 999px; }
.inv-card-row { display: flex; gap: 12px; margin-bottom: 14px; align-items: flex-start; }
.inv-thumb { width: 48px; height: 64px; border-radius: 6px; background: var(--primary); opacity: 0.8; flex-shrink: 0; }
.inv-name { font-size: 13px; font-weight: 600; color: var(--ink); margin-bottom: 4px; }
.stock-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin-right: 5px; vertical-align: middle; }
.inv-stock { font-size: 12px; color: var(--ink-m); }
.inv-price { font-size: 16px; font-weight: 700; color: var(--ink); font-variant-numeric: tabular-nums; }
.form-field { margin-bottom: 14px; }
.field-label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink-m); margin-bottom: 5px; }
.field-input { width: 100%; background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-input); padding: 9px 12px; font-size: 13px; color: var(--ink); font-family: inherit; outline: none; transition: border-color 150ms, box-shadow 150ms; }
.field-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-soft); }
.input-states { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
.input-state-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-m); margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
.input-state-dot { width: 7px; height: 7px; border-radius: 50%; }
.field-focus-demo { border-color: var(--primary) !important; box-shadow: 0 0 0 3px var(--primary-soft) !important; }
.field-error-demo { border-color: var(--st-danger) !important; box-shadow: 0 0 0 3px rgba(220,38,38,0.15) !important; }
.field-error-msg { font-size: 12px; color: var(--st-danger); margin-top: 5px; }
.field-ai-demo { border-color: var(--border); border-left: 2px solid var(--gold) !important; background: var(--gold-soft) !important; }
.ai-indicator { font-size: 10px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--gold); margin-top: 5px; }
.score-demo { display: flex; flex-direction: column; gap: 24px; max-width: 520px; }
.score-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.score-tier-label { font-size: 12px; color: var(--ink-m); font-weight: 500; }
.score-track { height: 8px; background: var(--s-track); border-radius: 999px; overflow: hidden; }
.score-fill { height: 100%; border-radius: 999px; width: 0; transition: width 1s cubic-bezier(0.22, 1, 0.36, 1); }
.score-fill.excel { background: var(--s-excel); }
.score-fill.strong { background: var(--s-strong); }
.score-fill.good { background: var(--s-good); }
.reason-chip { font-size: 11px; color: var(--ink-2); background: var(--surface-soft); border: 1px solid var(--border); border-radius: 999px; padding: 3px 10px; }
.anim-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.anim-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-card); padding: 24px; display: flex; flex-direction: column; align-items: center; gap: 16px; text-align: center; }
.anim-label { font-size: 12px; font-weight: 600; color: var(--ink); }
.anim-desc { font-size: 11px; color: var(--ink-m); line-height: 1.5; }
.anim-demo-area { display: flex; align-items: center; justify-content: center; height: 64px; width: 100%; }
.press-demo { padding: 10px 20px; background: var(--primary); color: white; border-radius: var(--r-btn); font-weight: 600; font-size: 13px; cursor: pointer; border: none; transition: background 150ms, transform 100ms; font-family: inherit; }
.press-demo:active { transform: scale(0.97); background: var(--primary-h); }
.press-demo:hover { background: var(--primary-h); }
@keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
.shimmer-bar { width: 160px; height: 20px; border-radius: 6px; background: linear-gradient(90deg, var(--surface-soft) 25%, var(--border) 50%, var(--surface-soft) 75%); background-size: 400px 100%; animation: shimmer 1.4s infinite linear; }
@keyframes spin { to { transform: rotate(360deg); } }
.spinner { width: 32px; height: 32px; border: 3px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes pulse-ring { 0% { transform: scale(1); opacity: 0.8; } 70% { transform: scale(1.5); opacity: 0; } 100% { transform: scale(1.5); opacity: 0; } }
.pulse-wrap { position: relative; display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; }
.pulse-dot { width: 14px; height: 14px; border-radius: 50%; background: var(--primary); z-index: 1; }
.pulse-ring { position: absolute; width: 40px; height: 40px; border-radius: 50%; border: 2px solid var(--primary); animation: pulse-ring 1.6s ease-out infinite; }
@keyframes stagger-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
.stagger-demo { display: flex; flex-direction: column; gap: 5px; width: 100%; }
.stagger-line { height: 12px; border-radius: 4px; background: var(--surface-soft); border-left: 2px solid var(--gold); animation: stagger-in 0.35s ease both; }
.stagger-line:nth-child(1) { width: 75%; animation-delay: 0ms; }
.stagger-line:nth-child(2) { width: 90%; animation-delay: 100ms; }
.stagger-line:nth-child(3) { width: 60%; animation-delay: 200ms; }
.gold-reveal-field { width: 100%; height: 36px; border: 1px solid var(--border); border-left: 2px solid transparent; border-radius: var(--r-input); background: var(--surface); display: flex; align-items: center; padding: 0 12px; font-size: 12px; color: var(--ink-m); cursor: pointer; transition: border-left-color 300ms, background 300ms; }
.gold-reveal-field.revealed { border-left-color: var(--gold); background: var(--gold-soft); color: var(--ink); }
.spacing-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
.spacing-row { display: flex; align-items: center; gap: 16px; padding: 10px 0; border-bottom: 1px solid var(--border); }
.spacing-bar { height: 6px; background: var(--primary); border-radius: 3px; opacity: 0.35; }
.spacing-name { font-size: 12px; font-weight: 600; color: var(--ink-2); min-width: 130px; }
.spacing-value { font-size: 11px; color: var(--ink-m); font-family: monospace; min-width: 50px; text-align: right; }
.radius-row { display: flex; align-items: center; gap: 20px; padding: 12px 0; border-bottom: 1px solid var(--border); }
.radius-box { width: 48px; height: 48px; background: var(--primary-soft); border: 2px solid var(--primary); flex-shrink: 0; }
.radius-name { font-size: 12px; font-weight: 600; color: var(--ink-2); }
.radius-value { font-size: 11px; color: var(--ink-m); font-family: monospace; }
.billing-demo { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-card); overflow: hidden; max-width: 440px; }
.billing-header { background: var(--ink); padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; }
.billing-body { padding: 20px; }
.billing-modes { display: flex; gap: 8px; flex-wrap: wrap; }
.billing-mode { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border: 1px solid var(--border); border-radius: 8px; font-size: 12px; font-weight: 600; color: var(--ink-2); cursor: pointer; background: var(--ivory); transition: all 150ms; }
.billing-mode.active { border-color: var(--primary); background: var(--primary-soft); color: var(--primary); }
.billing-mode-dot { width: 8px; height: 8px; border-radius: 50%; }
.billing-total { margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
.vs-footer { padding: 48px 0 64px; border-top: 1px solid var(--border); text-align: center; }
@media (prefers-reduced-motion: reduce) {
  .shimmer-bar, .spinner, .pulse-ring, .stagger-line { animation: none; }
  .score-fill { transition: none; }
}
      `}</style>

      <div className="vs-body">
        <nav className="sticky-nav">
          <span className="nav-brand">VS</span>
          <div className="nav-sep" />
          <a href="#mood">Aesthetic</a>
          <a href="#colors">Colour</a>
          <a href="#type">Type</a>
          <a href="#buttons">Buttons</a>
          <a href="#badges">Badges</a>
          <a href="#cards">Cards</a>
          <a href="#inputs">Inputs</a>
          <a href="#scores">Score</a>
          <a href="#animations">Motion</a>
          <a href="#spacing">Space</a>
          <a href="#billing">Billing</a>
        </nav>

        <div className="page">
          <div className="container">

            {/* Hero */}
            <div className="hero">
              <p className="hero-kicker">Design System · VivahStyle · 2026</p>
              <h1 className="hero-name">Vivah<span>Style</span></h1>
              <p className="hero-sub">Staff platform for Indian wedding fashion boutiques. Warm, intimate, image-forward. Every interface decision is rooted in the boutique's light — ivory surfaces, deep maroon authority, gold restraint.</p>
              <div className="hero-meta">
                <div className="hero-meta-item"><strong>Next.js 16</strong>App Router, React 19</div>
                <div className="hero-meta-item"><strong>Tailwind v4</strong>@theme tokens</div>
                <div className="hero-meta-item"><strong>2 Typefaces</strong>Playfair · Inter</div>
                <div className="hero-meta-item"><strong>16 Features</strong>Phase 1 underway</div>
              </div>
            </div>

            {/* Mood */}
            <section id="mood">
              <div className="section-eyebrow"><span className="section-eyebrow-num">01</span><div className="section-eyebrow-line" /></div>
              <h2 className="section-title">Aesthetic Direction</h2>
              <p className="section-desc">The visual world of a high-end Indian wedding boutique — garments in silk-draped silence, price tags face inward, lighting always warm.</p>
              <div className="mood-grid">
                <div className="mood-card mood-1">
                  <div className="mood-1-bar" />
                  <div className="mood-card-inner">
                    <div className="mood-tags"><span className="mood-tag">Wedding</span><span className="mood-tag">Reception</span><span className="mood-tag">Sangeet</span></div>
                    <div className="mood-label" style={{color:'rgba(201,162,39,0.8)'}}>Bridal Grandeur</div>
                    <div className="mood-title" style={{color:'#FAF7F2'}}>The Maroon<br/>Heritage</div>
                  </div>
                </div>
                <div className="mood-card mood-2">
                  <div className="mood-2-bar" />
                  <div className="mood-card-inner" style={{paddingLeft:36}}>
                    <div className="mood-label" style={{color:'var(--ink-m)'}}>Ivory Atelier</div>
                    <div className="mood-title">The Boutique's<br/>Natural Light</div>
                  </div>
                </div>
                <div className="mood-card" style={{display:'flex',flexDirection:'row',padding:0}}>
                  <div style={{flex:2,background:'#7A1F2B',position:'relative'}}>
                    <div style={{position:'absolute',bottom:16,left:12,fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'rgba(250,247,242,0.5)',writingMode:'vertical-rl',transform:'rotate(180deg)'}}>Primary</div>
                  </div>
                  <div style={{flex:1,background:'#C9A227',position:'relative'}}>
                    <div style={{position:'absolute',bottom:16,left:12,fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'rgba(43,33,24,0.5)',writingMode:'vertical-rl',transform:'rotate(180deg)'}}>Gold</div>
                  </div>
                  <div style={{flex:2,background:'#FAF7F2',border:'1px solid #E8DFD3',position:'relative'}}>
                    <div style={{position:'absolute',bottom:16,left:12,fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'#9C8F84',writingMode:'vertical-rl',transform:'rotate(180deg)'}}>Ivory</div>
                  </div>
                  <div style={{flex:1,background:'#2B2118',position:'relative'}}>
                    <div style={{position:'absolute',bottom:16,left:12,fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'rgba(250,247,242,0.4)',writingMode:'vertical-rl',transform:'rotate(180deg)'}}>Ink</div>
                  </div>
                </div>
                <div className="mood-card mood-4">
                  <div className="mood-card-inner">
                    <div className="mood-label" style={{color:'rgba(201,162,39,0.7)'}}>Editorial Type</div>
                    <div className="mood-title" style={{fontSize:26,color:'var(--ivory)',lineHeight:1.1}}>Anarkali<br/>Silk Lehenga</div>
                    <div className="mood-4-subtitle">LEHE-0024 · ₹38,500 · IN STOCK</div>
                  </div>
                </div>
                <div className="mood-card mood-5">
                  <div className="mood-5-content">
                    <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',color:'var(--ink-m)',marginBottom:4}}>Interface Taste</div>
                    <div className="mini-card">
                      <div className="mini-thumb" style={{background:'var(--primary)'}} />
                      <div style={{flex:1,minWidth:0}}>
                        <div className="mini-name">Banarasi Sherwani</div>
                        <div className="mini-id">SHER-0042</div>
                      </div>
                      <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
                        <div className="mini-price">₹52,000</div>
                        <span className="mini-badge">In Stock</span>
                      </div>
                    </div>
                    <div className="mini-card" style={{opacity:0.6}}>
                      <div className="mini-thumb" style={{background:'var(--gold-soft)'}} />
                      <div style={{flex:1,minWidth:0}}>
                        <div className="mini-name">Ivory Lehenga Set</div>
                        <div className="mini-id">LEHE-0017</div>
                      </div>
                      <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
                        <div className="mini-price">₹28,000</div>
                        <span className="mini-badge" style={{background:'#FEF3C7',color:'var(--st-warning)'}}>Low Stock</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mood-card mood-6">
                  <div className="mood-6-center">
                    <div className="gold-ring"><div className="gold-ring-inner">✦</div></div>
                    <div className="mood-label" style={{color:'var(--ink-m)'}}>Boutique Light</div>
                    <div className="mood-title" style={{fontSize:15}}>Gold as Accent,<br/>Never Dominant</div>
                  </div>
                </div>
              </div>
              <div className="pinterest-section">
                <div className="pinterest-icon">P</div>
                <div>
                  <div className="pinterest-label">Pinterest Reference Searches</div>
                  <div className="search-chips">
                    {['Sabyasachi boutique interior','Indian bridal lehenga editorial 2024','deep maroon bridal palette','warm ivory Indian fashion UI','Indian wedding lookbook photography','luxury boutique staff interface design','Indian bridal fashion typography'].map(t => (
                      <span key={t} className="search-chip">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Colors */}
            <section id="colors">
              <div className="section-eyebrow"><span className="section-eyebrow-num">02</span><div className="section-eyebrow-line" /></div>
              <h2 className="section-title">Colour Palette</h2>
              <p className="section-desc">All values live as CSS variables in globals.css. Never use hex values in components — reference tokens only.</p>
              {[
                { name: 'Surfaces', swatches: [['#FAF7F2','ivory'],['#FFFFFF','surface'],['#F5EFE6','surface-soft'],['#E8DFD3','border']] },
                { name: 'Brand', swatches: [['#7A1F2B','primary'],['#641923','primary-hover'],['#F7E9EB','primary-soft'],['#C9A227','gold'],['#F3E8C9','gold-soft']] },
                { name: 'Text', swatches: [['#2B2118','ink'],['#6F6258','ink-secondary'],['#9C8F84','ink-muted']] },
                { name: 'Match Score Tiers', swatches: [['#16A34A','score-excellent'],['#D97706','score-strong'],['#EA580C','score-good'],['#EFE8DC','score-track']] },
                { name: 'Status', swatches: [['#2563EB','status-info'],['#16A34A','status-success'],['#D97706','status-warning'],['#DC2626','status-danger'],['#9C8F84','status-neutral']] },
                { name: 'Payment Modes', swatches: [['#15803D','pay-cash'],['#6D28D9','pay-upi'],['#1D4ED8','pay-card'],['#0F766E','pay-netbanking']] },
              ].map(g => (
                <div className="palette-group" key={g.name}>
                  <div className="palette-group-name">{g.name}</div>
                  <div className="swatches">
                    {g.swatches.map(([hex, name]) => (
                      <div className="swatch" key={name}>
                        <div className="swatch-color" style={{background: hex}} />
                        <div className="swatch-name">{name}</div>
                        <div className="swatch-hex">{hex}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </section>

            {/* Type */}
            <section id="type">
              <div className="section-eyebrow"><span className="section-eyebrow-num">03</span><div className="section-eyebrow-line" /></div>
              <h2 className="section-title">Typography</h2>
              <p className="section-desc"><strong>Playfair Display</strong> (serif) for headings & dress names. <strong>Inter</strong> (sans) for everything else.</p>
              <div className="type-table">
                {[
                  { label: 'Page Title · h1', spec: 'Playfair · 28px · 600', el: <span style={{fontFamily:'Georgia,serif',fontSize:28,fontWeight:600,lineHeight:1.2}}>Explore the Collection</span> },
                  { label: 'Dress Name', spec: 'Playfair · 24px · 600', el: <span style={{fontFamily:'Georgia,serif',fontSize:24,fontWeight:600}}>Anarkali Silk Lehenga</span> },
                  { label: 'Section Heading · h2', spec: 'Playfair · 20px · 600', el: <span style={{fontFamily:'Georgia,serif',fontSize:20,fontWeight:600}}>Inventory Overview</span> },
                  { label: 'Card Title', spec: 'Playfair · 16px · 600', el: <span style={{fontFamily:'Georgia,serif',fontSize:16,fontWeight:600}}>Billing Summary</span> },
                  { label: 'Body', spec: 'Inter · 14px · 400 · ink-2', el: <span style={{fontSize:14,color:'var(--ink-2)',lineHeight:1.6}}>Customer prefers pastel tones for the reception. Budget ₹50,000 per outfit.</span> },
                  { label: 'Emphasis / Price', spec: 'Inter · 14px · 600', el: <span style={{fontSize:14,fontWeight:600}}>₹38,500 · In Stock · 3 Sizes</span> },
                  { label: 'Field Label', spec: 'Inter · 11px · 700 · UPPERCASE', el: <span style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'var(--ink-m)'}}>Occasion</span> },
                  { label: 'Secondary / Meta', spec: 'Inter · 12px · 400 · ink-m', el: <span style={{fontSize:12,color:'var(--ink-m)'}}>Added 12 Jun 2026 · SHER-0042 · Last edited by Priya</span> },
                  { label: 'Stat Value', spec: 'Inter · 26px · 700 · tabular', el: <span style={{fontSize:26,fontWeight:700,fontVariantNumeric:'tabular-nums'}}>₹2,14,000</span> },
                  { label: 'Dress ID', spec: 'Mono · 12px · pill bg', el: <span style={{fontSize:12,fontWeight:600,fontFamily:'monospace',background:'var(--surface-soft)',padding:'2px 8px',borderRadius:999,color:'var(--ink-2)'}}>LEHE-0017</span> },
                ].map(r => (
                  <div className="type-row" key={r.label}>
                    <div><div className="type-meta-label">{r.label}</div><div className="type-meta-spec">{r.spec}</div></div>
                    <div>{r.el}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Buttons */}
            <section id="buttons">
              <div className="section-eyebrow"><span className="section-eyebrow-num">04</span><div className="section-eyebrow-line" /></div>
              <h2 className="section-title">Buttons</h2>
              <p className="section-desc">One primary action per view. Min 44px height. Active: scale(0.97). 150ms ease on all transitions.</p>
              <div className="btn-matrix">
                <div className="btn-row">
                  <div className="btn-row-label">Primary</div>
                  <button className="btn btn-primary">Add to Cart</button>
                  <button className="btn btn-primary" style={{background:'var(--primary-h)'}}>Hover State</button>
                  <button className="btn btn-primary btn-disabled">Disabled</button>
                </div>
                <div className="btn-row">
                  <div className="btn-row-label">Secondary</div>
                  <button className="btn btn-secondary">Filter</button>
                  <button className="btn btn-secondary" style={{background:'var(--surface-soft)'}}>Hover State</button>
                  <button className="btn btn-secondary btn-disabled">Disabled</button>
                </div>
                <div className="btn-row">
                  <div className="btn-row-label">Ghost</div>
                  <button className="btn btn-ghost">View Details</button>
                  <button className="btn btn-ghost" style={{background:'var(--surface-soft)'}}>Hover State</button>
                  <button className="btn btn-ghost btn-disabled">Disabled</button>
                </div>
                <div className="btn-row">
                  <div className="btn-row-label">Sizes</div>
                  <div style={{display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
                    {[['btn-sm','sm · 36px'],['','md · 44px'],['btn-lg','lg · 52px']].map(([cls, lbl]) => (
                      <div key={lbl} style={{textAlign:'center'}}>
                        <button className={`btn btn-primary ${cls}`}>Button</button>
                        <div className="size-label">{lbl}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Badges */}
            <section id="badges">
              <div className="section-eyebrow"><span className="section-eyebrow-num">05</span><div className="section-eyebrow-line" /></div>
              <h2 className="section-title">Badges</h2>
              <p className="section-desc">11px uppercase, 999px radius. Payment badges always use pay-* tokens, never generic status tokens.</p>
              <div style={{marginBottom:20}}>
                <div className="palette-group-name" style={{marginBottom:12}}>Status</div>
                <div className="badge-wrap">
                  <span className="badge b-default">Active</span>
                  <span className="badge b-success">In Stock</span>
                  <span className="badge b-warning">Low Stock</span>
                  <span className="badge b-danger">Out of Stock</span>
                  <span className="badge b-info">Generating</span>
                  <span className="badge b-neutral">Inactive</span>
                </div>
              </div>
              <div style={{marginBottom:20}}>
                <div className="palette-group-name" style={{marginBottom:12}}>Payment Mode</div>
                <div className="badge-wrap">
                  <span className="badge b-cash">Cash</span>
                  <span className="badge b-upi">UPI</span>
                  <span className="badge b-card">Card</span>
                  <span className="badge b-nb">Net Banking</span>
                </div>
              </div>
              <div>
                <div className="palette-group-name" style={{marginBottom:12}}>Dress ID</div>
                <div className="badge-wrap">
                  <span className="badge b-id">SHER-0042</span>
                  <span className="badge b-id">LEHE-0017</span>
                  <span className="badge b-id">SAREE-0008</span>
                </div>
              </div>
            </section>

            {/* Cards */}
            <section id="cards">
              <div className="section-eyebrow"><span className="section-eyebrow-num">06</span><div className="section-eyebrow-line" /></div>
              <h2 className="section-title">Cards</h2>
              <p className="section-desc">White surface, 1px border, 12px radius, 20px padding. Shadow deepens on hover.</p>
              <div className="card-demo-grid">
                <div className="card">
                  <div className="stat-label">Total Revenue</div>
                  <div className="stat-value">₹2,14,000</div>
                  <span className="stat-trend">↑ +18% this week</span>
                </div>
                <div className="card" style={{cursor:'pointer'}}>
                  <div className="inv-card-row">
                    <div className="inv-thumb" />
                    <div style={{flex:1,minWidth:0}}>
                      <span className="badge b-id" style={{marginBottom:5,display:'inline-block'}}>SHER-0042</span>
                      <div className="inv-name">Banarasi Silk Sherwani</div>
                      <div className="inv-stock"><span className="stock-dot" style={{background:'var(--st-success)'}} />In Stock · M, L, XL</div>
                    </div>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',borderTop:'1px solid var(--border)',paddingTop:12}}>
                    <div className="inv-price">₹52,000</div>
                    <button className="btn btn-secondary btn-sm">Edit</button>
                  </div>
                </div>
                <div className="card">
                  <div style={{fontFamily:'Georgia,serif',fontSize:16,fontWeight:600,marginBottom:16}}>Add Staff Member</div>
                  <div className="form-field">
                    <label className="field-label">Full Name</label>
                    <input className="field-input" type="text" placeholder="Riya Sharma" />
                  </div>
                  <div className="form-field">
                    <label className="field-label">Role</label>
                    <input className="field-input" type="text" placeholder="Stylist" />
                  </div>
                  <button className="btn btn-primary" style={{width:'100%',marginTop:4}}>Add Staff</button>
                </div>
              </div>
            </section>

            {/* Inputs */}
            <section id="inputs">
              <div className="section-eyebrow"><span className="section-eyebrow-num">07</span><div className="section-eyebrow-line" /></div>
              <h2 className="section-title">Form Inputs</h2>
              <p className="section-desc">White bg, 1px border, 8px radius. Focus: primary border + 3px ring. AI-suggested: 2px gold left border + gold-soft tint.</p>
              <div className="input-states">
                <div>
                  <div className="input-state-label"><span className="input-state-dot" style={{background:'var(--border)',border:'1px solid var(--ink-m)'}} />Default</div>
                  <label className="field-label">Dress Name</label>
                  <input className="field-input" type="text" placeholder="e.g. Banarasi Silk Lehenga" readOnly />
                </div>
                <div>
                  <div className="input-state-label"><span className="input-state-dot" style={{background:'var(--primary)'}} />Focus</div>
                  <label className="field-label">Price (₹)</label>
                  <input className="field-input field-focus-demo" type="text" defaultValue="52000" readOnly />
                </div>
                <div>
                  <div className="input-state-label"><span className="input-state-dot" style={{background:'var(--st-danger)'}} />Error</div>
                  <label className="field-label">Store Code</label>
                  <input className="field-input field-error-demo" type="text" defaultValue="VS-WRONG" readOnly />
                  <div className="field-error-msg">Store code not recognised. Check and try again.</div>
                </div>
                <div>
                  <div className="input-state-label"><span className="input-state-dot" style={{background:'var(--gold)'}} />AI-Suggested</div>
                  <label className="field-label">Category <span style={{color:'var(--gold)',fontSize:10,fontWeight:700,marginLeft:4}}>✦ Auto-filled</span></label>
                  <input className="field-input field-ai-demo" type="text" defaultValue="Sherwani" readOnly />
                  <div className="ai-indicator">✦ Groq Vision suggestion — edit to override</div>
                </div>
              </div>
            </section>

            {/* Scores */}
            <section id="scores">
              <div className="section-eyebrow"><span className="section-eyebrow-num">08</span><div className="section-eyebrow-line" /></div>
              <h2 className="section-title">Match Score Bar</h2>
              <p className="section-desc">8px track, tier-colored fill, animates from 0 on load. Items below 60 are excluded.</p>
              <div className="score-demo">
                {[{id:'sf1',pct:92,tier:'Excellent Match',cls:'excel',color:'var(--s-excel)',reasons:['Matches your occasion perfectly','Within your budget','In stock']},
                  {id:'sf2',pct:78,tier:'Strong Match',cls:'strong',color:'var(--s-strong)',reasons:['Works well for your occasion','Close to budget']},
                  {id:'sf3',pct:63,tier:'Good Match',cls:'good',color:'var(--s-good)',reasons:['Limited stock']},
                ].map(s => (
                  <div key={s.id}>
                    <div className="score-header">
                      <span className="score-tier-label">{s.tier}</span>
                      <span style={{fontSize:14,fontWeight:700,color:s.color}}>{s.pct}%</span>
                    </div>
                    <div className="score-track"><div className={`score-fill ${s.cls}`} id={s.id} data-target={s.pct} /></div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:8}}>
                      {s.reasons.map(r => <span key={r} className="reason-chip">{r}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Animations */}
            <section id="animations">
              <div className="section-eyebrow"><span className="section-eyebrow-num">09</span><div className="section-eyebrow-line" /></div>
              <h2 className="section-title">Motion & Transitions</h2>
              <p className="section-desc">All transitions 150ms ease. Respects prefers-reduced-motion. Motion serves orientation, not decoration.</p>
              <div className="anim-grid">
                <div className="anim-card">
                  <div className="anim-demo-area"><button className="press-demo">Finalise Bill</button></div>
                  <div className="anim-label">Button Press</div>
                  <div className="anim-desc">scale(0.97) on :active. Background darkens on hover. 150ms ease.</div>
                </div>
                <div className="anim-card">
                  <div className="anim-demo-area"><div className="spinner" /></div>
                  <div className="anim-label">Loading State</div>
                  <div className="anim-desc">Spinner during Groq Vision & API4.AI generation. 0.8s linear loop.</div>
                </div>
                <div className="anim-card">
                  <div className="anim-demo-area"><div className="stagger-demo"><div className="stagger-line" /><div className="stagger-line" /><div className="stagger-line" /></div></div>
                  <div className="anim-label">AI Field Stagger</div>
                  <div className="anim-desc">Auto-fill fields fade in 300ms apart with gold left border.</div>
                </div>
                <div className="anim-card">
                  <div className="anim-demo-area" style={{flexDirection:'column',gap:8}}>
                    <GoldRevealDemo />
                  </div>
                  <div className="anim-label">Gold Reveal</div>
                  <div className="anim-desc">AI-suggested field gets gold left border + tint. Click to demo.</div>
                </div>
                <div className="anim-card">
                  <div className="anim-demo-area"><div className="pulse-wrap"><div className="pulse-ring" /><div className="pulse-dot" /></div></div>
                  <div className="anim-label">Session Active Pulse</div>
                  <div className="anim-desc">Ring pulse indicates an active styling session. 1.6s ease-out loop.</div>
                </div>
                <div className="anim-card">
                  <div className="anim-demo-area" style={{flexDirection:'column',gap:8,width:'100%'}}>
                    <div className="shimmer-bar" />
                    <div className="shimmer-bar" style={{width:120}} />
                  </div>
                  <div className="anim-label">Try-On Shimmer</div>
                  <div className="anim-desc">Skeleton loader during generation. 1.4s linear loop.</div>
                </div>
              </div>
            </section>

            {/* Spacing */}
            <section id="spacing">
              <div className="section-eyebrow"><span className="section-eyebrow-num">10</span><div className="section-eyebrow-line" /></div>
              <h2 className="section-title">Spacing & Radii</h2>
              <p className="section-desc">Use gap on flex/grid containers. Radii come from tokens — no ad-hoc values in components.</p>
              <div className="spacing-grid">
                <div>
                  <h3 style={{fontSize:13,fontWeight:700,marginBottom:20}}>Spacing Scale</h3>
                  {[['page-x (tablet)','24%','24px'],['page-x (desktop)','32%','32px'],['section gap','32%','32px'],['card padding','20%','20px'],['grid gap','16%','16px'],['navbar height','64%','64px']].map(([n,w,v]) => (
                    <div className="spacing-row" key={n}>
                      <div className="spacing-name">{n}</div>
                      <div style={{flex:1}}><div className="spacing-bar" style={{width:w}} /></div>
                      <div className="spacing-value">{v}</div>
                    </div>
                  ))}
                </div>
                <div>
                  <h3 style={{fontSize:13,fontWeight:700,marginBottom:20}}>Border Radius</h3>
                  {[['radius-card','12px','cards, modals',12],['radius-button','8px','buttons',8],['radius-input','8px','fields, selects',8],['radius-badge','999px','badges, chips',999]].map(([n,v,d,r]) => (
                    <div className="radius-row" key={n}>
                      <div className="radius-box" style={{borderRadius:r}} />
                      <div><div className="radius-name">{n} · {v}</div><div className="radius-value">{d}</div></div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Billing */}
            <section id="billing">
              <div className="section-eyebrow"><span className="section-eyebrow-num">11</span><div className="section-eyebrow-line" /></div>
              <h2 className="section-title">Payment Modes in Context</h2>
              <p className="section-desc">Payment badges always use pay-* tokens. Segmented control selects the active mode.</p>
              <div className="billing-demo">
                <div className="billing-header">
                  <div>
                    <div style={{fontFamily:'Georgia,serif',fontSize:14,color:'var(--ivory)',fontWeight:600}}>VivahStyle</div>
                    <div style={{fontSize:11,color:'rgba(250,247,242,0.5)'}}>Cashier · Priya S.</div>
                  </div>
                  <div style={{fontSize:12,color:'rgba(250,247,242,0.4)'}}>Bill #0042</div>
                </div>
                <div className="billing-body">
                  <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--ink-m)',marginBottom:10}}>Payment Mode</div>
                  <div className="billing-modes">
                    <div className="billing-mode active"><span className="billing-mode-dot" style={{background:'var(--pay-cash)'}} />Cash</div>
                    <div className="billing-mode"><span className="billing-mode-dot" style={{background:'var(--pay-upi)'}} />UPI</div>
                    <div className="billing-mode"><span className="billing-mode-dot" style={{background:'var(--pay-card)'}} />Card</div>
                    <div className="billing-mode"><span className="billing-mode-dot" style={{background:'var(--pay-nb)'}} />Net Banking</div>
                  </div>
                  <div className="billing-total">
                    <div>
                      <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--ink-m)'}}>Total (incl. 18% GST)</div>
                      <div style={{fontSize:12,color:'var(--ink-m)',marginTop:2}}>3 items · ₹1,18,000 + ₹21,240 tax</div>
                    </div>
                    <div style={{fontSize:22,fontWeight:700,fontVariantNumeric:'tabular-nums'}}>₹1,39,240</div>
                  </div>
                  <button className="btn btn-primary" style={{width:'100%',marginTop:16}}>Finalise Bill</button>
                </div>
              </div>
            </section>

            <div className="vs-footer">
              <div style={{fontFamily:'Georgia,serif',fontSize:20,color:'var(--primary)',fontWeight:600,marginBottom:8}}>VivahStyle</div>
              <div style={{fontSize:12,color:'var(--ink-m)'}}>Design System v1 · Feature 01 complete · Next: Store Gate + Auth</div>
            </div>

          </div>
        </div>

        <ScoreAnimator />
      </div>
    </>
  );
}

function GoldRevealDemo() {
  const [revealed, setRevealed] = (require('react') as typeof import('react')).useState(false);
  return (
    <>
      <div
        className={`gold-reveal-field${revealed ? ' revealed' : ''}`}
        onClick={() => setRevealed(r => !r)}
        style={{width:'100%'}}
      >
        {revealed ? 'Sherwani' : 'Category — click to reveal'}
      </div>
      <div style={{fontSize:10,color:'var(--ink-m)'}}>↑ Click to demo gold reveal</div>
    </>
  );
}

function ScoreAnimator() {
  const { useEffect } = require('react') as typeof import('react');
  useEffect(() => {
    const ids = [['sf1', 92], ['sf2', 78], ['sf3', 63]];
    const t = setTimeout(() => {
      ids.forEach(([id, pct]) => {
        const el = document.getElementById(id as string);
        if (el) el.style.width = `${pct}%`;
      });
    }, 400);
    return () => clearTimeout(t);
  }, []);
  return null;
}
