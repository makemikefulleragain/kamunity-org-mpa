# Publication sharing — 27 November 2026

News and homepage publication cards now offer Read, Read aloud and Share. Card-level Ask Mike and Express interest email actions are removed, including the static guide cards. General contact links remain available. The full article reader also has Share.

One shared browser control sends the selected headline and clean canonical article URL to the native share menu. Unsupported sharing copies the link. Cancellation is quiet; a native error offers an explicit fresh Copy link gesture. A blocked or missing clipboard exposes a selected read-only address with keyboard dismissal and focus restoration. No external sharing widget, tracking, account connection or backend write is involved.

Cards use separate controls with at least 44 px touch height. Narrow layouts place Read above Read aloud and Share. Browsers without speech show the two available actions together. Existing full-body narration, original-source links, classification labels and inbound campaign navigation are preserved.

The 26 November server-rendered article title, description, canonical URL and 1200 × 630 preview image are reused. The news HTML and bundled function template are synchronized. Shared addresses use the working MPA origin and the selected publication UUID, independently of browser location, campaign parameters and the initially opened article.

Validation: static checks and 78 tests passed. Isolated browser checks covered all four publication types, native user activation, changing from article A to B, cancellation, native failure, actual clipboard contents, blocked clipboard selection, Escape/focus handling, absent speech, card email removal and 1360/390/320 layouts. Native operating-system share destinations are feature-detected; automated checks instrument the browser API without sending messages or publishing posts.

Repository reconciliation preceded implementation: Kamunity PR #12 and Phoenix PR #45 merged the already-live release history into their default branches. Follow-up preview QA found and corrected legacy-type precedence and mid-word headline clipping in Phoenix's image defaults. All four response types were rendered as actual landscape PNGs with a 143-character headline. The existing release guards preserve the Phoenix production lock; no database migration or new public content is required.

## Reader correction after phone testing

Removed the hard-coded Open Org Health Check shortcut from the shared reader. Its button display rule overrode the hidden attribute, exposing an anchor without a destination on unrelated articles. The reader now enforces hidden elements consistently. Genuine links in an article's body remain clickable. Static checks and 79 tests passed; browser checks include unrelated rental and volunteer article fixtures as well as the real body-link case.

Both reported live article URLs returned unique metadata and valid 1200 × 630 PNGs to a WhatsApp-style GET request. The images were approximately 96 KB and 88 KB, below WhatsApp's 600 KB limit. Initial page responses took about nine seconds; a repeat rental request took 1.8 seconds. Variable response time may contribute to an incomplete preview, but the individual WhatsApp event cannot be established from the screenshots. WhatsApp describes previews as best effort and recommends waiting for the preview before sending: https://developers.facebook.com/documentation/business-messaging/whatsapp/link-previews . No publication-gating or cache policy was weakened to mask this uncertainty.
