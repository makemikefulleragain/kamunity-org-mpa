# Review & Reflect — Kamunity MPA Phase 9 Enhancement
**Date:** 15 March 2026  
**Trigger:** Three bugs required more than 2 fix attempts each, plus an architectural assumption failure  
**Protocol:** Vine-o-Code R&R

---

## 1. What Happened

### Sequence of failures:

**Bug 1: Modal not triggering (symptom-chased for 3 rounds)**
- Modal system built (`kai-modal.js` + CSS), declared complete
- User reported "modal not working — still scrolls to #chats"
- Investigation showed the FAB (`<button class="kai-fab">`) was an `<a href="#chats">` anchor — not converted during the Ask Kai button sweep
- FAB was in a separate comment block: `<!-- Kai FAB — hides when #chats is in viewport (JS handles this) -->` — the comment implied intentional anchor behavior, so it was excluded from the sweep
- Required 3 rounds: (1) claim fixed, (2) user confirms still broken, (3) identify FAB root cause

**Bug 2: Constitution and About pages 404ing (architectural assumption failure)**
- New `constitution.html` and `about.html` pages created
- Both 404'd at `/constitution` and `/about`
- Root cause: `netlify.toml` had pre-existing `301` redirects:
  - `/constitution` → `/my-kamunity` (301)
  - `/about` → `/` (301)
- These were written in Phase 5 to redirect old kamunity.org URLs and were never removed when new pages were created
- The page files existed and were correct — Netlify's redirect engine intercepted them before they could be served
- Not caught because **Python HTTP server was used** — it doesn't process `netlify.toml` redirect rules

**Bug 3: Footer didn't match reference**
- Footer was implemented from a text description ("based on kamunity-ring-zero.html")
- Reference file was not read directly before implementation
- User screenshot showed significant differences: richer description text, Emergency 000, Kids Helpline 1800 551 800, specific Ecosystem link set, expanded AI disclaimer
- Required full reimplementation across all 6 pages

**Bug 4: Wrong dev server (compound cause)**
- Python `http.server` was used for local preview
- This masks all Netlify-specific behaviour: clean URL routing, redirect rules, function proxying
- `/constitution` and `/about` failed silently (404) on Python but would have correctly failed (redirected) on `netlify dev` — pointing to the right diagnosis sooner

---

## 2. Root Causes

### Proximate causes (the bugs):
- FAB not included in Ask Kai button sweep
- Old 301 redirects in netlify.toml conflicting with new pages
- Footer implemented from description, not from direct file read
- Python server used instead of netlify dev

### Systemic causes (why the bugs existed and weren't caught):

**1. netlify.toml redirect table not consulted before creating new pages**  
The redirect table was written in Phase 5 to serve old kamunity.org URL paths. When new pages were created this session, no one checked whether an existing redirect would intercept the new path. This is a missing pre-flight check.

**2. Wrong local dev server chosen**  
Python's `http.server` was used as a "quick" option. On any Netlify project, `netlify dev` should be the only local server — it processes `netlify.toml`, proxies functions, and injects environment variables. Using Python masks the actual deployment environment and produces false negatives (works locally, breaks in prod) and false positives (fails locally, fine in prod).

**3. Reference material read after implementation, not before**  
The kamunity-ring-zero footer was described in session summaries but the actual file was not re-read before implementing. The implementation diverged from the source. This violates the Vine-o-Code principle: read the source, then build.

**4. FAB scope exclusion without explicit decision**  
The "replace all Ask Kai buttons" task used a grep for `ask-kai-btn` class. The FAB uses `kai-fab` class and was in a separate HTML comment describing JS behavior. It was excluded implicitly (not in grep results) rather than explicitly (decided to leave it). Any "replace all X" task needs explicit scope boundaries, not implicit grep coverage.

**5. No quick verify between major changes**  
Multiple large changes were made in sequence without a live check between them. The first local test happened after ~40 separate file edits. One verify pass after the first 5 edits would have caught all four bugs before they compounded.

---

## 3. Why Didn't Normal Flow Catch It?

| Missing Check | What It Would Have Caught |
|---|---|
| Pre-flight: check netlify.toml before creating `/about` and `/constitution` | Conflicting 301 redirects |
| Always use `netlify dev` not Python server | Routing bugs surfaced immediately |
| Read reference files directly before implementing | Footer divergence caught before first commit |
| Explicit FAB scope decision in "replace all" tasks | FAB left as anchor caught in sweep |
| Incremental live verify (every 5-10 edits) | All 4 bugs caught in first session round |

Phase 9 was not a formal phase with acceptance criteria — it was an ad-hoc enhancement sprint. No `done when:` checklist existed, so there was no gate to catch these issues before declaring work complete.

---

## 4. Process Changes Required

### Immediate (apply from next session):

**Rule: Always use `netlify dev` for local testing on any Netlify project**  
Never use Python `http.server`, `npx serve`, or any other static server for Netlify projects. `netlify dev` is the only valid local environment.

**Rule: Check netlify.toml redirects before creating any new page**  
Before creating a new HTML file at path `/X`, scan `netlify.toml` for any `from = "/X"` redirect rules. If found, decide: update the redirect (preferred for new pages) or choose a different path.

**Rule: Read reference files directly, never from description**  
If implementing something "based on" a reference file, read the file via tool call before writing a single line. No exceptions.

**Rule: "Replace all X" tasks require explicit scope definition**  
Before a sweep, define: what element types are in scope (links, buttons, FABs, embedded links), what class/attribute to grep for, and explicitly list out-of-scope items with a reason. FABs must always be in scope for any "replace all Kai buttons" task.

**Rule: Incremental live verify**  
After every 5-10 file edits, run a quick sanity check on the local dev server before continuing. Don't make 40 edits then discover a systemic issue.

### Phase structure change:

**Add Phase 9 to PHASES.md as a formal phase** with explicit acceptance criteria, not an ad-hoc sprint. Enhancement work that touches 6+ files needs phase structure.

### Acceptance criteria to add to Phase 9:

```
Done when:
- [ ] netlify dev running (not Python server)
- [ ] All new pages load at clean URLs (no .html extension required)
- [ ] Kai modal opens on click of all Ask Kai buttons AND the FAB
- [ ] Modal closes on ×, Escape, and click-outside
- [ ] Modal sends/receives messages via Kai API
- [ ] Reflection modal shows consent screen before chat
- [ ] /constitution renders full 11 principles
- [ ] /about renders with MPA design system
- [ ] All 6 page footers match kamunity-ring-zero reference exactly
- [ ] Footer crisis lines include Emergency 000, Kids Helpline 1800 551 800
- [ ] Browser console: zero JS errors on all pages
```

---

## 5. Reset Point

**No code revert required.** All four bugs are fixed in the current codebase. The reset point is the current confirmed state:

### Current confirmed good state (15 March 2026):

| Item | Status |
|---|---|
| `netlify.toml` — `/constitution` → `constitution.html` (200) | ✅ Fixed |
| `netlify.toml` — `/about` → `about.html` (200) | ✅ Fixed |
| All FABs converted to `<button data-kai-modal>` | ✅ Fixed |
| All 6 page footers match kamunity-ring-zero reference | ✅ Fixed |
| All Ask Kai buttons on index.html converted (9 cards + 3 quiz warm links) | ✅ Fixed |
| All Ask Kai buttons on warehouse.html converted (all 5 aisles, 22 cards) | ✅ Fixed |
| `netlify dev` running on port 8888 with ANTHROPIC_API_KEY | ✅ Running |
| `/constitution` and `/about` pages exist and render | ✅ Confirmed |

### What to preserve (do not revert):
- `ASK_KAI_MODAL_PATTERN.md` — code standard document, valuable
- `IMPLEMENTATION_REPORT.md` — session history, valuable
- All modal CSS additions to `mpa.css` — correct
- `kai-modal.js` — correct implementation

### Next actions before UAT:
1. Hard refresh browser (Ctrl+Shift+R) on all pages
2. Open browser console — verify zero JS errors
3. Click FAB → modal must open
4. Click one "Ask Kai →" button → modal must open with pre-loaded context
5. Run through Phase 9 acceptance criteria checklist above

---

## Learning

This R&R is primarily about **environment mismatch** and **implicit scope boundaries**. Both are preventable at the start of a session with three 30-second checks:

1. `netlify dev` started? (yes/no)
2. netlify.toml scanned for conflicts? (yes/no)
3. Reference files read directly, not from memory? (yes/no)

The bugs themselves were trivial to fix once identified. The cost was in the rounds of symptom-chasing, user frustration, and context consumption.

**Every session that starts a Netlify project enhancement must begin with these three checks. No exceptions.**

---

*Prepared by Cascade AI pair programmer*  
*R&R document — Kamunity MPA Phase 9*  
*15 March 2026*
