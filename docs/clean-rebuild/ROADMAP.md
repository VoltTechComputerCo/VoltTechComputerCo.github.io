# VoltTech master roadmap

Current major Step: **Step 7 — Legal, support and customer documents (Step 7.1 packaged)**. Next substep: **7.2 — Printable customer documents**.

| Step | Scope | Status / completion gate |
|---|---|---|
| 0 | Repository and system audit | Complete |
| 1 | Shared frontend foundation and homepage | Complete |
| 2 | Core commerce | Complete and verified at `70691bb5d3a390a185210bdd7c1d188f6f014546`; launch gates remain closed |
| 3 | PC Builder | Complete and verified at `add3637fa3872aace38d72f8a7497f4918b92933`; Builder remains launch-gated |
| 4 | Signal Scan and service pages | Complete and verified at `a8a76ddcc1b3c93fc9407e285e04c5e331f36cd5` |
| 5 | Customer accounts and operations | Complete and verified at `4c399b694e72e0135723879e06d8e570a695a463` |
| 6 | Creator ecosystem and STATIC | Complete and verified at `7d1c272beb3766ceca6d03cfacfa280c9446b762`; Twitch credential repair remains operationally blocked |
| 7 | Legal, support and customer documents | Active. 7.1 public legal/support foundation packaged |
| 8 | SEO, accessibility and performance | Pending; canonical/domain migration, historical STATIC template migration, accessibility, performance and residue closure |
| 9 | Full QA | Pending; responsive, customer roles, payments, retries and regression |
| 10 | Release candidate | Pending; verified release package and operational readiness |

## Step 7 sequence
- **7.1 — Public legal/support foundation:** generated clean Legal Centre, Quote Terms, Terms, Privacy, PAIA, Returns/Warranty, Delivery/Collection and Repair Authorisation. PAIA manual and Information Officer registration are explicit release blockers.
- **7.2 — Printable customer documents:** Quote, Invoice, Proforma, Receipt, Order, Build, Service Record and Personal Data report.
- **7.3 — Document/support QA + cleanup:** print/email consistency, customer/admin handoffs, document provenance and remaining legacy legal/document residue.

## Operational boundaries carried forward
- Store catalogue, Builder and direct payment launch gates remain disabled until their release blockers are certified.
- Twitch creator refresh credentials still require repair; stale creator status must never be presented as live.
- Supabase Auth leaked-password protection remains a release/dashboard action.
- STATIC and site-wide canonical/feed/sitemap URLs deliberately remain on the existing `volttechcomputerco.github.io` base until Step 8.
- The 30 historical STATIC articles remain valid published content but retain historical template debt for Step 8.
- Root legacy notification/portal/document assets remain only where unconverted consumers still require them.
- PAIA manual publication and Information Officer registration/details remain release blockers; this website page is not a substitute for the required manual.

## Every delivery
Re-inspect branch HEAD and dependencies, package exact repository paths with README/checksums/deletions/rollback details, use folder placeholders only when genuinely required, and verify uploaded remote files before beginning the next substep.
