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
