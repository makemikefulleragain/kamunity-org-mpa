# Maintained tool delivery — 7 November 2026

Published to https://kamunity-org-mpa.netlify.app/ as deploy `6aeeae2787f23d62affc6704`.
Previous deploy: `6ad6b0722a76e9bf730c0460`.

Warehouse now merges an incoming Phoenix publication with an existing curated card when their canonical HTTPS artifact URL matches. It keeps the newest feed release and one card, adds a stable Phoenix anchor and maintenance provenance, and renders maintenance details for newly created cards. Description snippets stop at word boundaries.

Before release, the local baseline and existing live Warehouse were semantically identical after normalising Netlify's HTML and clean-URL rewrites. Static verification and 53 tests passed. Live browser readback confirms one Org Health Check card for Phoenix output `ca08cb5e-9089-49ea-ac6d-bfa33920f944`, version 1.1.0, with next review 2027-02-07. Direct and proxied feeds have matching public DTOs and passports; the downloadable tool source matches both maintenance records. Reflow passed at 1360, 375 and 320 pixels.

The actual consumer remains this MPA origin. No custom-domain or DNS changes were made.
