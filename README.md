# VoltTech clean rebuild

Branch: `clean-rebuild`

Current phase: **Step 9.1 Correction — automated full regression QA**.

The first Step 9.1 GitHub Actions run completed with **19/24 gates passing**. This correction addresses every failure signature from that run before Step 9.2 begins.

## Upload
Upload everything inside `Step 9.1 Correction/` to matching repository paths.

Delete nothing.

No folder placeholders are required; every destination folder already exists.

### What this correction fixes
- Product runtime canonical/OG URL now uses `https://volttechcomputerco.co.za` instead of the legacy GitHub Pages host.
- Six admin surfaces use the existing local Space Grotesk / JetBrains Mono font files instead of Google Fonts.
- Unavailable customer-record email actions are hidden again.
- STATIC domain regression assertions are updated for the completed Step 8.3 migration.
- STATIC feed parser QA now recognises the current `HeadParser` implementation.
- The STATIC publishing validator preserves the 30 migrated historical articles **and allows clean future articles beyond article #30** using `assets/css/pages/static-article.css`.

**Upload `scripts/run-full-qa.mjs` LAST.** Its correction marker retriggers the existing `VoltTech Full QA` workflow after every replacement file is already present.

Expected result after upload: **24/24 gates PASS** and a fresh `volttech-step-9.1-qa` artifact.

There is no intentional visual redesign in this correction. Admin typography should look the same because the same font families are now served locally; the product fix is metadata-only; the records change only hides an unavailable/dead action.

Next after verified green QA: **Step 9.2 — responsive/device interaction and role-flow QA**.
