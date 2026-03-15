# PHASES — Kamunity.org MPA
## Brief: WB-MPA-002
## Project: PROJECTS/kamunity-org-mpa/
## Deploy target: kamunity-ring-two.netlify.app → kamunity.org (post DNS)
## Last updated: March 16, 2026
## Replaces: WB-MPA-001 (7-page scaffold → 4-surface MPA rebuild)

---

## Phase 1: FOUNDATION (no code)

**Status: COMPLETE**

**Done:**
- [x] Brief WB-MPA-002 reviewed — replaces WB-MPA-001 (7-page → 4-surface architecture)
- [x] PHASES.md updated (this file)
- [x] All cannibalisation sources confirmed present
- [x] Font files confirmed: 29 items (28 WOFF2 + fonts.css) in ring-two-mvp/site/fonts/
- [x] von-neumann.html Google Fonts bug confirmed (lines 13-14 — googleapis.com)
- [x] ring-zero.html Google Fonts bug NOT present (already fixed in Brief 23)
- [x] ANTHROPIC_API_KEY: likely set (Kai functional in R2-05/06), human confirmation in Phase 7
- [x] Missing downloads identified: Board Paper Pack ZIP + Grant Acquittal Helper PDF — will be created
- [x] handout-rooms.html present in tools/ — will be included in Warehouse Aisle 1

**Cannibalisation inventory (all confirmed present):**

| Source | Destination | Fix Needed |
|---|---|---|
| `ring-two-mvp/site/css/style.css` | Shared CSS all surfaces | None |
| `ring-two-mvp/site/fonts/` (28 WOFF2 + fonts.css) | `site/fonts/` — copy verbatim | None |
| `ring-two-mvp/site/index.html` | Homepage §3 shop + §4 chats | Restructure sections |
| `ring-two-mvp/site/ring-zero.html` | /my-kamunity §1 | None (Google Fonts already fixed) |
| `ring-two-mvp/site/von-neumann.html` | /my-kamunity §3 | Fix Google Fonts → self-hosted |
| `ring-two-mvp/site/bothy-floor.html` | Root level | None |
| `ring-two-mvp/site/llms.txt` | Root level | Update with new 4-surface pages + siblings |
| `ring-two-mvp/site/netlify/functions/kai-proxy.mjs` | `site/netlify/functions/` | Update system prompt for MPA |
| `ring-two-mvp/site/tools/` (8 files) | `/warehouse` Aisle 1 | None |
| `ring-two-mvp/netlify.toml` | Root level | New redirects for MPA structure |

**New content to create (not in sources):**
- Board Paper Pack (HTML → printable PDF template)
- Grant Acquittal Helper (HTML → printable PDF template)
- news.html — Kamunity News (new surface)
- warehouse.html — Commons Warehouse (new surface)
- my-kamunity.html — My Kamunity+ (new surface)
- js/supabase-feed.js — Signals+Pulse feed with fallback

---

## Phase 2: SCAFFOLD

**Status: COMPLETE**

**Architecture (WB-MPA-002 — 4 surfaces):**
```
kamunity-org-mpa/
  site/
    index.html          → / (long-scroll homepage, 6 sections)
    news.html           → /news
    warehouse.html      → /warehouse
    my-kamunity.html    → /my-kamunity
    bothy-floor.html    → (invisible, not in nav)
    llms.txt            → /llms.txt
    llms-full.txt       → /llms-full.txt
    robots.txt          → /robots.txt
    sitemap.xml         → /sitemap.xml
    css/
      style.css         (Campfire Design System — from ring-two-mvp)
      mpa.css           (MPA-specific additions)
    fonts/
      fonts.css + 28 WOFF2 (from ring-two-mvp)
    js/
      nav.js            (AoC dismiss, hamburger, active state, FAB visibility)
      supabase-feed.js  (Signals+Pulse from Supabase, static fallback)
      quizzes.js        (Sovereignty Check, AI Readiness, Org Health Check — inline)
      kai.js            (Kai chat embed)
      news.js           (News tabs + card grid)
      warehouse.js      (Warehouse search + aisle render)
    tools/              (from ring-two-mvp verbatim + 2 new)
      ai-safety-checklist.html
      board-paper-pack.html    (NEW)
      grant-acquittal-helper.html (NEW)
      handout-*.html (7 files)
    netlify/
      functions/
        kai-proxy.mjs   (updated system prompt for MPA)
      edge-functions/
        agent-mirror.js (from ring-two-mvp)
        spore-radar.js  (from ring-two-mvp)
  netlify.toml
```

**Done when:**
- [x] index.html, news.html, warehouse.html, my-kamunity.html all exist and are navigable
- [x] Shared nav renders correctly on all four pages
- [x] Active state works (current page highlighted in nav)
- [x] Campfire fonts loading from self-hosted WOFF2 (no Google Fonts requests)
- [x] Campfire palette applied (ember, parchment, cream, deep present in CSS)
- [x] FAB present on all pages
- [x] AoC banner present on all pages (sessionStorage dismiss)
- [x] bothy-floor.html present at root
- [x] llms.txt present at root (updated for MPA)
- [x] netlify.toml redirect rules written
- [x] Doug Test: all four pages display heading text without JS

---

## Phase 3: HOMEPAGE CONTENT + TOOLS

**Status: COMPLETE**

**What:** Fill the homepage. All six sections. Tools embedded inline.

**Done when:**
- [x] §1 Hero: three doors present (⚡ Quick tools → #shop, 🔍 Dig in → #shop, 💬 Chat → #chats)
- [x] §1: scroll-anchors working to #shop and #chats
- [x] §1: Community Signal teaser line present (static, manually updated)
- [x] §2 Signals+Pulse: two columns rendering (Latest 3 each from Supabase)
- [x] §2: static fallback text present if Supabase unavailable (Doug Test)
- [x] §2: "→ Kamunity News Room" link box below both columns
- [x] §3 Shop: Row 1 — AI Safety Checklist, Board Paper Pack, Grant Acquittal Helper (download links)
- [x] §3 Shop: Row 2 — Sovereignty Check, AI Readiness, Org Health Check (inline, functional)
- [x] §3 Shop: Row 3 — Fix It form, Invent It form (Netlify forms), AI Systems card → /my-kamunity
- [x] §3 Shop: Warehouse link box below all rows
- [x] §4 Chats: Row 1 — Kai embed functional (ANTHROPIC_API_KEY in env)
- [x] §4 Chats: Row 2 — Reflection embed with consent intake
- [x] §4 Chats: Row 3 — Contact Mike form (Netlify form)
- [x] §4: FAB hides when #chats section is in viewport
- [x] §5 Services: three cards with visible pricing (NFP + standard rates)
- [x] §6 Footer: all links correct per brief spec
- [x] Ask Kai buttons present on applicable cards
- [x] Board Paper Pack HTML tool created and functional
- [x] Grant Acquittal Helper HTML tool created and functional
- [x] Doug Test: all homepage content readable without JS

---

## Phase 4: DEDICATED PAGES

**Status: COMPLETE**

**Done when:**

**/news:**
- [x] Masthead with live signal/pulse counts (Supabase, static fallback)
- [x] Tab bar renders (Latest, Sector Intelligence, Community Practice, AI & Tech, Policy & Funding)
- [x] Active tab highlighted (ember underline)
- [x] Card grid: 3×2 desktop, 2-stacked mobile
- [x] Card anatomy: TAG, Fraunces headline, Source Serif 4 summary, IBM Plex Mono source+date
- [x] Read aloud (SpeechSynthesis) on written cards — fails gracefully if unavailable
- [x] YouTube embeds using youtube-nocookie.com
- [x] Filter bar functional (client-side)
- [x] "Load more" pagination (no infinite scroll — Doug Test)
- [x] Sticky Ask Kai button present
- [x] Doug Test: 3 static fallback cards readable without JS

**/warehouse:**
- [x] Masthead with client-side search bar
- [x] Search: no results → "Can't find it? Ask Kai ↗"
- [x] Aisle 1 (Free Tools): all 10 tools present (8 from ring-two-mvp + Board Paper Pack + Grant Acquittal Helper)
- [x] Aisle 2 (Assessments): 3 cards linking to homepage #shop embeds
- [x] Aisle 3 (Community Instances): GGA card + Von Neumann card + "Your org here" ember card
- [x] Aisle 4 (Ecosystem Tools): 5 curated external tools with sovereignty scores
- [x] Aisle 5 (The Builds): 4 methodology/build cards with links to live sites
- [x] Ask Kai button persistent in masthead

**/my-kamunity:**
- [x] §1 Ring Zero: content present, self-hosted fonts (no Google Fonts), 6 hard floors, Doug Test, Hard-to-Love Fund
- [x] §2 GGA showcase: content present, link to gga-kamunity.netlify.app, no iframe
- [x] §3 Von Neumann: 6-step sequence (Recognition → Room Architecture → Value Exchange → Sector Intelligence → Constitutional Governance → Propagation), pure CSS timeline
- [x] §4 Your org here: ember card, all 3 links correct

---

## Phase 5: SIBLING AUDIT

**Status: COMPLETE**

**Done when (all must pass):**
- [x] kamunityconsulting.com → kamunity.org ✓ / pricing consistent (Fix It $150/hr NFP, Invent It $150/hr NFP, Ring Zero $4,500 / $0 HtLF)
- [x] kamunity-reflection.netlify.app → kamunity.org ✓ (teased at /#chats)
- [x] community-signal.netlify.app → kamunity.org ✓ / pulse feed wired to §2 + /news
- [x] kamunity-audit.netlify.app → kamunity.org ✓ (linked from /warehouse Aisle 2)
- [x] kamunity-ai-readiness.netlify.app → kamunity.org ✓ (linked from /warehouse Aisle 2)
- [x] gga-kamunity.netlify.app → kamunity.org ✓ (showcased at /my-kamunity §2 + /warehouse Aisle 3)
- [x] llms.txt updated with all sibling URLs + constitutional consent status
- [x] ecosystem-state.json updated: v0.2.0, stale /constitution URL fixed → /my-kamunity#constitution, GGA instance added
- [x] CRITICAL FIX: Google Fonts removed from all 8 handout tools (constitutional hard floor breach — now use ../fonts/fonts.css)
- [x] handout-consulting.html pricing updated: Fix It/Invent It $150/hr NFP, Ring Zero $4,500/$0, stale AI disclosure removed

---

## Phase 6: HARDENING

**Status: COMPLETE (code-verifiable items — live UAT items for Phase 7)**

**Done when:**
- [x] CSP headers in netlify.toml — default-src 'self', connect-src includes community-signal + anthropic, frame-ancestors 'none'
- [x] No Google Fonts requests — 0 googleapis.com calls in all HTML/CSS/JS/MJS (only comment in fonts.css)
- [x] All external links have rel="noopener noreferrer" + target="_blank" on all 4 pages
- [x] nav.js: all getElementById calls guarded (no console errors on pages without #chats)
- [x] kai.js: initChat early-returns if elements missing (no console errors on non-homepage pages)
- [x] AbortSignal.timeout present on both fetch calls (supabase-feed.js + news.js)
- [x] BUG FIX: quiz container IDs aligned — index.html now uses sovcheck-quiz/aiready-quiz/health-quiz matching quizzes.js DOMContentLoaded init
- [x] BUG FIX: dead initQuiz call removed from nav.js toggleQuiz (was silently failing)
- [x] Quiz results + warm divs added to each quiz embed in index.html
- [ ] Kai crisis protocol tested live: DV, self-harm, mental health (Mike — Phase 7)
- [ ] Prompt injection: 10+ attack vectors on Kai and Reflection (Mike — Phase 7)
- [ ] Mobile viewports: 375px, 768px, 1280px (Mike — Phase 7)
- [ ] Screen reader pass on VoiceOver or NVDA (Mike — Phase 7)

---

## Phase 7: PRE-CUTOVER UAT (MIKE-GATED)

**Status: PENDING — Mike must complete this manually**

- [ ] Visit all four pages on staging URL (kamunity-org-mpa.netlify.app)
- [ ] Test Kai conversation (at least 3 exchanges)
- [ ] Test Reflection intake and at least 2 exchanges
- [ ] Test all three embedded tools in shop row 2
- [ ] Download at least one tool from shop row 1
- [ ] Submit Fix It form — confirm email arrives
- [ ] Submit contact form — confirm email arrives
- [ ] Test FAB on /news and /warehouse
- [ ] Test Kamunity News tabs (at least 3 tabs)
- [ ] Test Warehouse search (at least 2 queries)
- [ ] Test My Kamunity+ scroll (all 4 sections visible)
- [ ] Test on mobile (actual phone — not DevTools)
- [ ] Confirm ANTHROPIC_API_KEY set in Netlify environment variables
- [ ] Confirm old kamunity-org GitHub project is ready to detach from domain

**DNS cutover does NOT happen until Mike explicitly signs off.**

---

## Phase 8: DNS CUTOVER + POST-CUTOVER VERIFICATION

**Status: PENDING — Human actions only**

**Mike does:**
1. Update DNS: kamunity.org → kamunity-ring-two.netlify.app
2. Detach old kamunity-org Netlify project from kamunity.org domain
3. Wait for DNS propagation (usually <1h, up to 48h)
4. Notify Windy cutover is complete

**Windy verifies:**
- [ ] kamunity.org loads new MPA (not old Next.js site)
- [ ] kamunity.org/news loads correctly
- [ ] kamunity.org/warehouse loads correctly
- [ ] kamunity.org/my-kamunity loads correctly
- [ ] Old redirects: /constitution → /my-kamunity ✓, /ring-zero → /my-kamunity ✓
- [ ] Kai functional on production domain
- [ ] llms.txt accessible at kamunity.org/llms.txt
- [ ] bothy-floor.html accessible (not linked, just present)
- [ ] All sibling back-links point to kamunity.org (not staging URL)
- [ ] No Google Fonts requests on production domain (final check)

---

---

## Phase 9: MODAL SYSTEM + CONSTITUTION + ABOUT + FOOTER

**Status: IN PROGRESS — local verified, UAT pending**

**What:** Kai floating modal system, new /constitution and /about pages, footer aligned to kamunity-ring-zero reference, all Ask Kai buttons converted to modal triggers.

**R&R Note:** This phase triggered a Review & Reflect (15 March 2026). Three bugs (FAB not converted, /constitution and /about 404ing due to old netlify.toml redirects, footer not matching reference) required correction after initial build. Root causes documented in `REVIEW_REFLECT_20260315.md`. Process fixes applied.

**Pre-flight checks (required before any work):**
- [x] `netlify dev` used (not Python server)
- [x] `netlify.toml` scanned for conflicting redirects before creating new pages
- [x] Reference files read directly before implementing

**Done when:**
- [x] `kai-modal.js` created — floating modal with 90% lighter brown palette
- [x] Reflection modal variant with consent screen and moss green accents
- [x] Context pre-loading via `data-kai-modal` + `data-kai-context` attributes
- [x] All Ask Kai buttons on index.html converted (9 cards + 3 quiz warm links)
- [x] All Ask Kai buttons on warehouse.html converted (all 5 aisles, 22 cards)
- [x] FAB converted to modal trigger on all 4 MPA pages
- [x] `/constitution.html` created — full 11 inviolable principles, MPA design system
- [x] `/about.html` rebuilt — Mike Fuller story, six hard floors, post-corporate language, MPA design system
- [x] `netlify.toml` — `/constitution` → `constitution.html` (200), `/about` → `about.html` (200)
- [x] All 6 page footers match kamunity-ring-zero reference (Emergency 000, Kids Helpline, Ecosystem col, full description, expanded AI disclaimer)
- [x] `.mpa-footer-nav-heading` CSS added
- [x] `netlify dev` running — clean URLs work, ANTHROPIC_API_KEY injected
- [ ] Browser console: zero JS errors on all pages (Mike — UAT)
- [ ] Kai modal opens on FAB click (Mike — UAT)
- [ ] Kai modal opens on "Ask Kai →" button with pre-loaded context (Mike — UAT)
- [ ] Reflection modal shows consent screen before chat (Mike — UAT)
- [ ] /constitution renders full 11 principles (Mike — UAT)
- [ ] /about renders with MPA design system (Mike — UAT)
- [ ] All 6 footers show Emergency 000 + Kids Helpline (Mike — UAT)
- [ ] Kai API responds in modal (requires ANTHROPIC_API_KEY — confirmed injected via netlify dev)

---

## DONE CONDITION (OVERALL)

- [ ] All Phase 7 pre-cutover UAT items pass
- [ ] Mike signs off on Phase 7
- [ ] DNS cutover complete
- [ ] All Phase 8 post-cutover checks pass
- [ ] PHASES.md: Phase 3 DNS Cutover marked COMPLETE
- [ ] BRAIN/ECOSYSTEM.md: kamunity.org now serves new MPA
- [ ] PLAN/DECISION_LOG.md: DNS cutover date + confirmation entry added
- [ ] STATE.md: updated with new live state
