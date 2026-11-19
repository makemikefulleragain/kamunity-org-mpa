# Latest Publications — 19 November 2026

The owner approved replacing the homepage Signals/Pulse split with one chronological list of six publications across all existing response classifications. Each entry retains its classification, public date, reader link and proposal/availability state. The full News page remains linked as “View all publications”. The existing #signals anchor is preserved for incoming links.

Phoenix must be released first: its public news mapper now orders all eligible publications by public publication date before applying the requested limit, independently of editorial priority. The normal review handler preserves public_published_at when publication settings or lifecycle change. Existing records keep their currently displayed date on their next reviewed change; historical first-publication dates are not guessed or bulk rewritten.

Validation: MPA static verification and 55 tests passed. Phoenix passed 922 tests, including 120 publications with conflicting priorities and dates, all four classifications, a six-item limit, and stable dates through ordinary review changes. Local browser checks covered a single ordered list, classification labels and 1360/375/320 px layouts. Empty and failed feeds retain explicit states.

Pre-release rollback: MPA deploy 6af937d8c3ac8a68d99c4155; Phoenix deploy 6afa55cddd425ce7ec5933a9 with its production lock retained. Deployment receipts and anonymous live readback are kept in ignored output directories.

## Publication card reading update

The owner requested removing Phoenix attribution and the email action from each homepage publication card, retaining its publication date and adding a plain-text Read aloud button. A shared browser SpeechSynthesis control now reads the headline and full body_text supplied by the public feed. It never substitutes the card summary or fetches an external publisher's article. The News cards use the same full-story control, replacing their previous summary-only playback; their other actions remain unchanged.

The active button becomes Stop. Switching stories resets the previous control and starts the new story; completion, errors, page departure and audio playback reset reading state. Starting speech pauses existing audio. Unsupported speech or missing full text leaves the ordinary reader link available without offering summary-only narration.

Validation: static verification and 60 tests passed. Isolated Chromium checks at 1360, 375 and 320 px verified removal of homepage attribution/email, the exact complete text passed to speech on both pages, stop/switch behavior and audio mutual exclusion. These checks inspect the browser speech input and control state, rather than claiming an independent listening assessment of installed voices. Rollback for this card update is MPA deploy 6afe64e380a5acf33377b99f.

## Card typography, separate reading controls and original sources

Homepage-only heading, summary, metadata and action font overrides caused a mismatch with the rest of the site. Latest Publications now uses the existing News card classes and shared publication stylesheet, so its heading, summary, date, classification, source and action typography follow the same rules as News. The two reading actions have separate bordered hit areas with a 12 px gap and at least 44 px height. A validated HTTPS original-source link appears on its own line and opens in a protected new tab. Missing or unsafe sources do not create links. Full-story speech, chronology, publication dates and the previous removal of homepage attribution/email are retained.

Validation: static verification and 62 tests passed. Isolated browser comparisons at 1360, 375 and 320 px verified identical computed font families, sizes and weights between homepage and News, separate controls, safe source links, no page overflow and unchanged full-story speech input. Rollback for this follow-up is MPA deploy 6afe7d396947b9f6d6e6ae6b.

## Approved Publications hero

After reviewing the separate mockup, the owner approved replacing the third Contact hero card with Latest Kamunity publications. It uses the same hero typography and green accent, a newspaper icon, Read / Listen / Explore wording and the approved articles, opportunities, discussions and tools description. The card jumps to the existing six-item Latest Publications list. A scroll offset keeps its heading below the sticky navigation. Hero actions align along the bottom on desktop and cards retain their normal stacked phone layout.

The former feed teaser is now the permanent contact invitation: Have a question or an idea? Email Mike. The email link uses the established public address and its two-word label stays together. The feed script no longer writes that line in successful, empty or failed states.

Validation: static verification and 62 tests passed. Local Chromium checks at 1360, 375 and 320 px covered the three hero choices, direct email destination, publication jump and heading visibility, zero horizontal overflow, and the stable contact line during normal, empty and failed feeds. The forced-failure checks deliberately return HTTP 503; those console entries are expected. Rollback for this hero update is MPA deploy 6afe8806d43d4da4f3267056.

## Read aloud without website addresses

The shared narration now excludes HTTP(S), www and common bare website addresses, including paths, query strings and fragments. Descriptive link text, narrative paragraphs, factual values and publisher attribution are retained. Empty URL-only lines and orphan source labels are tidied for speech. Published story text and source destinations are not rewritten.

When a card renders a validated original-source link, narration ends once with: To read the original article, click the Open original source link. Both homepage and News renderers pass the actual link availability to the shared control, so narration does not promise a missing link. Existing stop/switch/audio behavior and full-body rather than summary-only reading are preserved. Script versions were advanced on both pages.

Validation: static verification and 66 tests passed. Browser checks exercised six cards on each page, including a missing-source case, preserving first and final paragraphs and numerical facts while excluding addresses and retaining the source destinations. Narration supplied to the browser was also checked against all six current public stories. Installed voice output is not independently assessed. Release is staged from the committed Git archive, avoiding the earlier workspace read failure. Rollback is MPA deploy 6afeb6b5e18d29159c941b47.

The first live check exposed an existing premature feed timeout: browser timing recorded cancellation at 6,004 ms, while a separate bounded browser request returned the six valid stories and a working Read aloud control in 9,195 ms. Homepage and News now allow up to 20 seconds for the feed, covering the server's existing bounded scan and network overhead. Failed requests retain the explicit unavailable state. The immediate rollback for this wait correction is deploy 6afec03702774256c1260853, which already includes the speech changes.

All 66 tests passed again after the wait correction. Isolated browser responses delayed by 9.5 seconds now load cards successfully on both pages, with the full narrative, excluded addresses, correct source prompt and working Stop control.
