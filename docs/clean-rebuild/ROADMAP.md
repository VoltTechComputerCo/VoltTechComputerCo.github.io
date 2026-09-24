# VoltTech master roadmap

Current major Step: **Step 7 — Legal, support and customer documents (Step 7.2 packaged)**. Next substep: **7.3 — Document/support QA + legacy cleanup**.

| Step | Scope | Status / completion gate |
|---|---|---|
| 0 | Repository and system audit | Complete |
| 1 | Shared frontend foundation and homepage | Complete |
| 2 | Core commerce | Complete and verified at `70691bb5d3a390a185210bdd7c1d188f6f014546`; launch gates remain closed |
| 3 | PC Builder | Complete and verified at `add3637fa3872aace38d72f8a7497f4918b92933`; Builder remains launch-gated |
| 4 | Signal Scan and service pages | Complete and verified at `a8a76ddcc1b3c93fc9407e285e04c5e331f36cd5` |
| 5 | Customer accounts and operations | Complete and verified at `4c399b694e72e0135723879e06d8e570a695a463` |
| 6 | Creator ecosystem and STATIC | Complete and verified at `7d1c272beb3766ceca6d03cfacfa280c9446b762` |
| 7 | Legal, support and customer documents | Active. 7.1 verified at `57a8e9f3eb61d4ee5e9d92e088e8a617b1a86de7`; 7.2 packaged |
| 8 | SEO, accessibility and performance | Pending |
| 9 | Full QA | Pending |
| 10 | Release candidate | Pending |

## Step 7 sequence
- **7.1 — Public legal/support foundation:** complete and verified.
- **7.2 — Printable customer documents:** generated clean Quote, Invoice, Proforma, Receipt, Order, Build, Service Record and Personal Data report; broken email/test-payment actions suppressed.
- **7.3 — Document/support QA + cleanup:** document-list/action consistency, print/email readiness, provenance, customer/admin handoffs and safe deletion of proven-unused legacy document assets.

## Operational boundaries carried forward
- Store catalogue, Builder and direct payment launch gates remain disabled.
- Document email delivery is not currently available because `send-document-email` is not deployed.
- Existing Yoco invoice checkout remains test-only and origin-bound; clean documents do not expose it as a production action.
- Twitch creator refresh credentials still require repair.
- Supabase Auth leaked-password protection remains a release/dashboard action.
- STATIC and site-wide canonical/feed/sitemap URLs remain on the GitHub base until Step 8.
- PAIA manual publication and Information Officer registration/details remain release blockers.

## Every delivery
Re-inspect branch HEAD and dependencies, package exact repository paths with README/checksums/deletions/rollback details, use folder placeholders only when genuinely required, and verify uploaded remote files before beginning the next substep.
