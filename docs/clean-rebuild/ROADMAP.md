# VoltTech master roadmap

Current major Step: **Step 6 — Creator ecosystem and STATIC (Step 6.2 packaged; upload verification pending)**. Next major Step after Step 6: **Step 7 — Legal, support and customer documents**.

| Step | Scope | Status / completion gate |
|---|---|---|
| 0 | Repository and system audit | Complete |
| 1 | Shared frontend foundation and homepage | Complete; clean shell established |
| 2 | Core commerce | Complete and verified at `70691bb5d3a390a185210bdd7c1d188f6f014546`; launch gates remain closed |
| 3 | PC Builder | Complete and verified at `add3637fa3872aace38d72f8a7497f4918b92933`; Builder remains launch-gated |
| 4 | Signal Scan and service pages | Complete and verified at `a8a76ddcc1b3c93fc9407e285e04c5e331f36cd5` |
| 5 | Customer accounts and operations | Complete and verified at `4c399b694e72e0135723879e06d8e570a695a463` |
| 6 | Creator ecosystem and STATIC | Active. 6.1 Creator Hub verified at `93e6d62e02310b8dea92fc1471e63245f82f5ddd`; 6.2 Streaming Support + Stream Scan packaged; 6.3 STATIC + cleanup next |
| 7 | Legal, support and customer documents | Pending; policies, customer documents and print layouts |
| 8 | SEO, accessibility and performance | Pending; canonical/domain migration, accessibility, performance and residue closure |
| 9 | Full QA | Pending; responsive, customer roles, payments, retries and regression |
| 10 | Release candidate | Pending; verified release package and operational readiness |

## Step 6 sequence

- **6.1 — Creator Hub + live-status truthfulness:** clean generated Creator Hub, dynamic Twitch embed parent, 20-minute freshness gate, stale live-state suppression and directory-only fallback. Verified at `93e6d62e02310b8dea92fc1471e63245f82f5ddd`.
- **6.2 — Streaming Support + Stream Scan:** clean support page and answer-based stream triage with testable model/handoff/controller separation. Packaged; upload verification pending.
- **6.3 — STATIC + creator QA / cleanup:** audit STATIC hub/articles/RSS/sitemap/Discord workflows, preserve publishing continuity, remove only proven-orphaned creator-era runtime files, and close the creator ecosystem.

## Operational boundaries carried forward

- Store catalogue, Builder and direct payment launch gates remain disabled until their release blockers are certified.
- Supabase Auth leaked-password protection remains a release/dashboard action because the connected Supabase tool does not expose that setting.
- Twitch creator refresh remains operationally blocked by a Twitch OAuth token HTTP 403. The scheduler and Edge Function are active; secret repair requires credential-management access.
- Authenticated-callable SECURITY DEFINER admin functions remain intentionally callable by the authenticated role because their definitions enforce `is_volttech_admin()` internally.
- Legacy files are removed only after all remaining consumers are migrated and proven absent.

## Every delivery

Re-inspect branch HEAD and dependencies, package exact repository paths with README/checksums/deletions/rollback details, use folder placeholders only when genuinely required, and verify uploaded remote files before beginning the next substep.
