# VoltTech master roadmap

Current major Step: **Step 6 — Creator ecosystem and STATIC (Step 6.1 packaged; upload verification pending)**. Next substep: **Step 6.2 — Streaming Support + Stream Scan**.

| Step | Scope | Status / completion gate |
|---|---|---|
| 0 | Repository and system audit | Complete |
| 1 | Shared frontend foundation and homepage | Complete; clean shell established |
| 2 | Core commerce | Complete and verified at `70691bb5d3a390a185210bdd7c1d188f6f014546`; launch gates remain closed |
| 3 | PC Builder | Complete and verified at `add3637fa3872aace38d72f8a7497f4918b92933`; Builder remains launch-gated |
| 4 | Signal Scan and service pages | Complete and verified at `a8a76ddcc1b3c93fc9407e285e04c5e331f36cd5` |
| 5 | Customer accounts and operations | Complete and verified at `4c399b694e72e0135723879e06d8e570a695a463` |
| 6 | Creator ecosystem and STATIC | Active. 6.1 Creator Hub / freshness package prepared |
| 7 | Legal, support and customer documents | Pending; policies, customer documents and print layouts |
| 8 | SEO, accessibility and performance | Pending; canonical/domain migration, accessibility, performance and residue closure |
| 9 | Full QA | Pending; responsive, customer roles, payments, retries and regression |
| 10 | Release candidate | Pending; verified release package and operational readiness |

## Step 6 sequence

- **6.1 — Creator Hub and feed truthfulness:** clean Creator Hub shell, freshness-aware directory, stale-live suppression, current-host Twitch embedding and streamer backend incident record.
- **6.2 — Streaming Support + Stream Scan:** migrate the creator technical-support page and answer-based Stream Scan together; preserve pricing, handoff and no-password/no-stream-key safety messaging.
- **6.3 — STATIC + creator QA / cleanup:** protect publishing/feed/Discord continuity, migrate or rationalise the STATIC hub/runtime where appropriate, verify workflows and delete only proven-orphaned creator/streaming assets.

## Step 6.1 audit position

The live streamer directory contains 219 rows with 216 enabled. The scheduled refresh job is active every 10 minutes and reaches the deployed `refresh-sa-streamers` Edge Function, but Twitch's OAuth token endpoint currently returns HTTP 403. The last successful status refresh is 18 Sep 2026. Step 6.1 therefore treats status older than 20 minutes as stale and never renders stale rows as live. Updating Twitch Edge Function credentials remains an operational secret-management action; this delivery does not expose, invent or replace secret values.

## Operational boundaries carried forward

- Store catalogue, Builder and direct-payment launch gates remain disabled until their release blockers are certified.
- Supabase Auth leaked-password protection remains a release/dashboard action because the connected Supabase tool does not expose that setting.
- Twitch creator refresh credentials require operational repair; stale live status is suppressed until the backend succeeds again.
- STATIC publishing workflows are intentionally not made to publish from `clean-rebuild`; release/publishing branch behavior will be handled explicitly in Step 6.3.

## Every delivery

Re-inspect branch HEAD and dependencies, package exact repository paths with README/checksums/deletions/rollback details, use folder placeholders only when genuinely required, and verify the uploaded remote files before beginning the next substep.
