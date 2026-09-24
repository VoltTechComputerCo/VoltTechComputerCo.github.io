# VoltTech master roadmap

Current major Step: **Step 6 — Creator ecosystem and STATIC (Step 6.3 packaged; upload verification pending)**. Next major Step: **Step 7 — Legal, support and customer documents**.

| Step | Scope | Status / completion gate |
|---|---|---|
| 0 | Repository and system audit | Complete |
| 1 | Shared frontend foundation and homepage | Complete; clean shell established |
| 2 | Core commerce | Complete and verified at `70691bb5d3a390a185210bdd7c1d188f6f014546`; launch gates remain closed |
| 3 | PC Builder | Complete and verified at `add3637fa3872aace38d72f8a7497f4918b92933`; Builder remains launch-gated |
| 4 | Signal Scan and service pages | Complete and verified at `a8a76ddcc1b3c93fc9407e285e04c5e331f36cd5` |
| 5 | Customer accounts and operations | Complete and verified at `4c399b694e72e0135723879e06d8e570a695a463` |
| 6 | Creator ecosystem and STATIC | Active. 6.1 Creator Hub verified at `93e6d62e02310b8dea92fc1471e63245f82f5ddd`; 6.2 Streaming Support + Stream Scan verified at `e3243d4bab35e173a860e1cab141b534ffc59c54`; 6.3 packaged |
| 7 | Legal, support and customer documents | Next; policies, document layouts, support records and printable customer outputs |
| 8 | SEO, accessibility and performance | Pending; canonical/domain migration, STATIC historical-template migration, accessibility, performance and residue closure |
| 9 | Full QA | Pending; responsive, customer roles, payments, retries and regression |
| 10 | Release candidate | Pending; verified release package and operational readiness |

## Step 6 sequence

- **6.1 — Creator Hub + live-status truthfulness:** generated clean Creator Hub, 20-minute freshness contract, dynamic Twitch parent hostname and stale-live suppression. Twitch refresh failure diagnosed as an OAuth token HTTP 403; scheduler itself is active.
- **6.2 — Streaming Support + Stream Scan:** generated clean support page, testable answer-based Stream Scan model/controller/handoff, existing R299/R449/R649 service boundaries preserved. Verified at `e3243d4bab35e173a860e1cab141b534ffc59c54`.
- **6.3 — STATIC + creator closeout:** clean STATIC hub presentation, robust RSS metadata parsing, `clean-rebuild` publishing automation, Discord GUID dedupe, future-article contract, corrected RSS descriptions and safe deletion of proven-unused creator CSS.

## Operational boundaries carried forward

- Store catalogue, Builder and direct payment launch gates remain disabled until their release blockers are certified.
- Twitch creator refresh credentials still require repair; stale creator status must never be presented as live.
- Supabase Auth leaked-password protection remains a release/dashboard action because the connected Supabase tool does not expose that setting.
- STATIC canonical/feed/sitemap URLs deliberately remain on the existing `volttechcomputerco.github.io` base until the coordinated Step 8 canonical/domain migration.
- The 30 historical STATIC articles remain valid published content but retain legacy inline/remote-font template debt. New articles after Step 6.3 must follow the clean STATIC article contract immediately.
- Root legacy notification/portal/document assets remain only where unconverted consumers still require them; broad residue deletion waits for the relevant later step.

## Every delivery

Re-inspect branch HEAD and dependencies, package exact repository paths with README/checksums/deletions/rollback details, use folder placeholders only when genuinely required, and verify uploaded remote files before beginning the next substep.
