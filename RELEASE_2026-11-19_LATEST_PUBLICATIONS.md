# Latest Publications — 19 November 2026

The owner approved replacing the homepage Signals/Pulse split with one chronological list of six publications across all existing response classifications. Each entry retains its classification, public date, reader link and proposal/availability state. The full News page remains linked as “View all publications”. The existing #signals anchor is preserved for incoming links.

Phoenix must be released first: its public news mapper now orders all eligible publications by public publication date before applying the requested limit, independently of editorial priority. The normal review handler preserves public_published_at when publication settings or lifecycle change. Existing records keep their currently displayed date on their next reviewed change; historical first-publication dates are not guessed or bulk rewritten.

Validation: MPA static verification and 55 tests passed. Phoenix passed 922 tests, including 120 publications with conflicting priorities and dates, all four classifications, a six-item limit, and stable dates through ordinary review changes. Local browser checks covered a single ordered list, classification labels and 1360/375/320 px layouts. Empty and failed feeds retain explicit states.

Pre-release rollback: MPA deploy 6af937d8c3ac8a68d99c4155; Phoenix deploy 6afa55cddd425ce7ec5933a9 with its production lock retained. Deployment receipts and anonymous live readback are kept in ignored output directories.
