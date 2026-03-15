# Kamunity MPA — Implementation Report
## Brief: WB-MPA-002 · Phases 1–6 Complete
## Date: 14 March 2026
## Prepared by: Cascade (Windy)

---

## Status Summary

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Foundation — brief review, inventory confirmation | ✅ Complete |
| 2 | Scaffold — 4-surface MPA built | ✅ Complete |
| 3 | Homepage content + tools | ✅ Complete |
| 4 | Dedicated pages (/news, /warehouse, /my-kamunity) | ✅ Complete |
| 5 | Sibling audit + critical fixes | ✅ Complete |
| 6 | Hardening — code-verifiable items | ✅ Complete |
| 7 | Pre-cutover UAT | ⏳ Pending (Mike-gated) |
| 8 | DNS cutover | ⏳ Pending (Mike-gated) |

**Staging URL:** https://kamunity-ring-two-demo.netlify.app
**Production target:** kamunity.org (post Phase 8)

---

## What Was Built

### 4 Main Surfaces

| Page | URL | Sections |
|------|-----|----------|
| Homepage | `/` | Hero (3 doors) · Signals+Pulse · Shop · Chats · Services · Footer |
| Kamunity News | `/news` | Masthead · Tab bar (5 tabs) · Filter bar · Card grid · Load more · Sticky Kai |
| Commons Warehouse | `/warehouse` | Masthead + search · 5 aisles (Tools, Assessments, Instances, Ecosystem, Builds) |
| My Kamunity+ | `/my-kamunity` | Ring Zero · GGA showcase · Von Neumann Sequence · Your org here CTA |

### JavaScript Files

| File | Purpose |
|------|---------|
| `js/nav.js` | AoC dismiss, hamburger nav, FAB IntersectionObserver, reflection consent gate, toggleQuiz/toggleForm |
| `js/kai.js` | Kai + Reflection dual chat embeds → kai-proxy |
| `js/quizzes.js` | Sovereignty Check, AI Readiness, Org Health Check — all client-side |
| `js/supabase-feed.js` | Signals+Pulse feed from Community Signal, graceful fallback |
| `js/news.js` | Tab switching, filters, read-aloud (SpeechSynthesis), load-more, card render |
| `js/warehouse.js` | Client-side search across all aisle cards |

### New Tools Created

| Tool | Path | Description |
|------|------|-------------|
| Board Paper Pack | `site/tools/board-paper-pack.html` | 3 printable board templates (tech decision, AI policy, digital strategy) |
| Grant Acquittal Helper | `site/tools/grant-acquittal-helper.html` | Full acquittal template with financial tables, evidence checklist, declaration |

### Agent Infrastructure

| File | Purpose |
|------|---------|
| `site/llms.txt` | 4-surface summary for AI agents |
| `site/llms-full.txt` | Full ontological context — bothy, ecosystem, Kai constitution, design system |
| `site/robots.txt` | Consent signals (search=yes, training=no) |
| `site/sitemap.xml` | 4 surfaces + agent files |
| `site/bothy-floor.html` | Constitutional witness page for systematic crawlers |

---

## Bugs Found and Fixed

### Bug 1 — Quiz container ID mismatch (silent failure)
- **Where:** `site/index.html` vs `site/js/quizzes.js`
- **Problem:** `index.html` used `sovcheck-container`, `aiready-container`, `healthcheck-container` as div IDs. `quizzes.js` auto-inits on `DOMContentLoaded` using `sovcheck-quiz`, `aiready-quiz`, `health-quiz`. Quizzes would never render.
- **Fix:** Aligned container IDs in `index.html` to match `quizzes.js`. Added `results` and `warm` divs required by quiz engine.

### Bug 2 — Dead `initQuiz` call in nav.js (console error on toggle)
- **Where:** `site/js/nav.js` `toggleQuiz()` function
- **Problem:** Called `initQuiz(id, id + '-container')` — a function that doesn't exist. Would throw a silent error every time a quiz toggle was clicked.
- **Fix:** Removed the dead call. Quizzes are already initialised by `DOMContentLoaded`; the toggle just shows/hides the embed wrapper.

### Bug 3 — Google Fonts in 8 handout tools (constitutional hard floor breach)
- **Where:** All 8 handout HTML files copied from `ring-two-mvp/site/tools/`
- **Problem:** Each file loaded `fonts.googleapis.com` — a passive fingerprinting call that violates Constitutional Principle 1 (no tracking, no surveillance architecture).
- **Fix:** Replaced Google Fonts link with `<link rel="stylesheet" href="../fonts/fonts.css">` (self-hosted WOFF2) across all 8 files via PowerShell batch replace.

### Bug 4 — Stale pricing in handout-consulting.html
- **Where:** `site/tools/handout-consulting.html`
- **Problem:** Showed $5,000/$2,500 day rates from an older version. Current rates are $150/hr NFP / $220/hr standard. Also referenced "Gemini 3.1" (not a real model) as an AI draft disclosure.
- **Fix:** Pricing updated to current rates for Fix It, Invent It, and Ring Zero. Service names updated to match site (Fix It / Invent It / Ring Zero). Stale disclosure replaced with CC BY-SA 4.0 credit.

### Bug 5 — Von Neumann Sequence wrong steps
- **Where:** `site/my-kamunity.html`
- **Problem:** Had 4 timeline steps (Week 1–2, 3–4, 5–6, 7+) which didn't match the Von Neumann Kit's actual 6-step sequence.
- **Fix:** Corrected to 6 steps: Recognition Before Navigation → Room Architecture → Value Exchange → Sector Intelligence → Constitutional Governance → Propagation (sourced from `KNOWLEDGE/VON_NEUMANN_KIT/README.md`).

### Bug 6 — Stale `/constitution` URL in ecosystem-state.json
- **Where:** `KNOWLEDGE/ecosystem-state.json`
- **Problem:** Referenced `/constitution` (old WB-MPA-001 URL, no longer valid).
- **Fix:** Updated to `/my-kamunity#constitution`. Also bumped to v0.2.0, added GGA instance entry, updated date.

---

## Constitutional Compliance Check

| Principle | Status | Notes |
|-----------|--------|-------|
| No tracking, no cookies, no analytics | ✅ | Confirmed — no analytics scripts anywhere |
| Free tools collect zero data | ✅ | All quizzes client-side only |
| Kai stores no conversations | ✅ | kai-proxy.mjs: no persistence, session-only |
| Prices visible, no discovery call | ✅ | §5 Services prices shown, handout-consulting updated |
| IP in the commons | ✅ | CC BY-SA 4.0 in footer + tools |
| No surveillance architecture | ✅ | Google Fonts removed from all tools (Bug 3) |
| Constitutional amendment process | ✅ | Referenced at /my-kamunity#constitution |
| AoC on every page | ✅ | All 4 pages |
| No Google Fonts | ✅ | 0 googleapis.com calls in any HTML/CSS/JS/MJS |
| Crisis protocol hardcoded | ✅ | Lifeline + Beyond Blue + MentalHealthLine in kai-proxy + UI |

---

## Doug Test Results (Static / No-JS)

| Page | Status | Notes |
|------|--------|-------|
| `/` | ✅ | All 6 sections readable. Forms visible. Noscript messages present. |
| `/news` | ✅ | 3 static fallback cards explain the feed and its tabs |
| `/warehouse` | ✅ | All 5 aisles render as static HTML. Search requires JS (noted in noscript). |
| `/my-kamunity` | ✅ | All 4 sections fully static. No JS dependency. |

---

## Security (CSP) — netlify.toml

```
default-src 'self'
script-src 'self' 'unsafe-inline'
style-src 'self' 'unsafe-inline'
font-src 'self'
connect-src 'self' https://community-signal.netlify.app https://api.anthropic.com
img-src 'self' data:
form-action 'self' https://kamunity-ring-two-demo.netlify.app
frame-ancestors 'none'
```

Additional headers: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`

---

## Redirects (netlify.toml)

**Clean URL rewrites (200):**
- `/news` → `news.html`
- `/warehouse` → `warehouse.html`
- `/my-kamunity` → `my-kamunity.html`

**Legacy 301 redirects (old kamunity.org paths):**
- `/constitution`, `/about/constitution` → `/my-kamunity`
- `/ring-zero`, `/von-neumann` → `/my-kamunity`
- `/tools`, `/sovereignty-check`, `/ai-readiness`, `/org-health-check`, `/calculator`, `/copilot-check` → `/#shop`
- `/kai`, `/reflection` → `/#chats`
- `/services` → `/#services`
- `/pulse`, `/peer-stories`, `/stories` → `/news`
- `/about` → `/`
- `/*` → `/index.html` (catch-all 200 — the bothy door is always open)

---

## Ecosystem State

All sibling sites linked correctly across the 4 surfaces and llms.txt:

| Site | Linked from |
|------|-------------|
| kamunityconsulting.com | Index §5 services, §4 chats, /my-kamunity CTA, footer |
| community-signal.netlify.app | Index §2 feed, /news masthead, news.js endpoint, footer |
| kamunity-reflection.netlify.app | Index §4 chats |
| gga-kamunity.netlify.app | /my-kamunity §2, /warehouse Aisle 3, llms.txt |
| kamunity-audit.netlify.app | /warehouse Aisle 2, index quiz noscript |
| kamunity-ai-readiness.netlify.app | /warehouse Aisle 2, index quiz noscript |
| kamunity.ai | Footer (all pages), llms.txt |
| vine-o-coding.netlify.app | /warehouse Aisle 5 |
| factoryk1.netlify.app | /warehouse Aisle 5 |

---

## Phase 7 UAT Checklist (Mike)

Test on **https://kamunity-ring-two-demo.netlify.app**

- [ ] Visit all 4 pages — confirm they load and nav active states are correct
- [ ] Test Kai (3+ exchanges) — confirm wayfinder tone, no upselling
- [ ] Test Reflection — consent checkbox required before chat appears; 2+ exchanges
- [ ] Test all 3 inline quizzes in Shop row 2 — confirm they render and complete
- [ ] Download at least 1 tool from Shop row 1 — confirm print layout
- [ ] Submit Fix It form — confirm email arrives at mike@kamunityconsulting.com
- [ ] Submit Contact Mike form — confirm email arrives
- [ ] Test FAB on /news and /warehouse — confirm visible + links to /#chats
- [ ] Test /news tabs (at least 3) — confirm tab switching works
- [ ] Test /warehouse search (2 queries) — confirm filtering + "Can't find it? Ask Kai" fallback
- [ ] Scroll all 4 sections on /my-kamunity — confirm Von Neumann 6 steps visible
- [ ] Test on actual phone (not DevTools) — confirm mobile nav hamburger works
- [ ] **Confirm `ANTHROPIC_API_KEY` is set in Netlify environment variables** — Kai won't respond without it
- [ ] Confirm old kamunity-org Netlify project is ready to detach from kamunity.org domain

**DNS cutover (Phase 8) does not proceed until Mike explicitly signs off on Phase 7.**

---

*Report generated by Cascade (Windy) · March 14, 2026*
*Brief: WB-MPA-002 · PROJECTS/kamunity-org-mpa/*
