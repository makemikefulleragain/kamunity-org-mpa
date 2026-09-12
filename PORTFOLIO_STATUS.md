# Kamunity.org MPA / Kamunity Demo

Status: **Active—transition**. Decision: 12 September 2026. Portfolio owner: Mike Fuller.

The MPA is the public demonstration endpoint of the signal-to-action product line and the bridge into Consulting and the curated tool set. It consumes public Phoenix feeds and public Kamunity AI rooms; it is the intended successor to the current Next.js kamunity.org site.

Canonical repository: https://github.com/makemikefulleragain/kamunity-org-mpa (main). Current review site: https://kamunity-org-mpa.netlify.app . Public domain cutover has not been performed by the portfolio cleanup.

Run `npm run verify` with Node 22 or later for script/inline-script checks and public rooms-proxy contract tests. There are no installed test dependencies. Generated `.netlify` files stay local and are not source-controlled.

Local browser checks on 12 September passed tool-tag handling and the news dialog at 1360, 768 and 375 pixel widths using synthetic data. Public homepage stories/tools loaded, but live rooms and news requests also timed out; deterministic UI checks do not certify reliable live delivery. Test fixtures were local only.

Release gates: reliable feed checks, authenticated end-to-end publication in a chosen test environment, contact/Kai delivery checks, content and accessibility UAT, traceable deployment and an approved domain/rollback plan. The selected showcase includes VinoCode, Sovereignty Audit, AI Readiness and Org Health; remaining public copy/navigation still needs alignment with that decision and the GGA/Mycelium retirement.

Authoritative register: `Dev_Code/portfolio-audit/PHASE_1_CANONICAL_PORTFOLIO_REGISTER_2026-09-12.md`.
