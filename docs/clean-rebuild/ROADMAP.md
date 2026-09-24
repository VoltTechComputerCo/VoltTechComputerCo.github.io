# VoltTech master roadmap

Current major Step: **Step 7 — Legal, support and customer documents (Step 7.3 packaged)**. Next major Step after verification: **Step 8 — SEO, accessibility and performance**.

| Step | Scope | Status / completion gate |
|---|---|---|
| 0 | Repository and system audit | Complete |
| 1 | Shared frontend foundation and homepage | Complete |
| 2 | Core commerce | Complete and verified at `70691bb5d3a390a185210bdd7c1d188f6f014546`; launch gates remain closed |
| 3 | PC Builder | Complete and verified at `add3637fa3872aace38d72f8a7497f4918b92933`; Builder remains launch-gated |
| 4 | Signal Scan and service pages | Complete and verified at `a8a76ddcc1b3c93fc9407e285e04c5e331f36cd5` |
| 5 | Customer accounts and operations | Complete and verified at `4c399b694e72e0135723879e06d8e570a695a463` |
| 6 | Creator ecosystem and STATIC | Complete and verified at `7d1c272beb3766ceca6d03cfacfa280c9446b762` |
| 7 | Legal, support and customer documents | Active. 7.1 and 7.2 verified; 7.3 packaged |
| 8 | SEO, accessibility and performance | Next after Step 7 verification |
| 9 | Full QA | Pending |
| 10 | Release candidate | Pending |

## Step 7 closeout
- **7.1:** public legal/support family migrated to the clean generated shell.
- **7.2:** quotation, invoice, proforma, receipt, order, build, service and personal-data documents migrated to the clean generated shell.
- **7.3:** dead document-email UI removed from clean customer records; proven-unused document-specific legacy stack scheduled for deletion.

## Step 8 planned boundary
- coordinated `volttechcomputerco.co.za` canonical/domain migration;
- sitemap/feed/structured-data URL alignment;
- historical STATIC article-template migration;
- accessibility and keyboard/focus review;
- performance and asset-loading review;
- final repository residue / unused-root-file cleanup;
- release-blocker documentation refresh.

## Operational blockers carried forward
- Store catalogue, Builder and direct payments remain disabled.
- Production Yoco payment path is not certified.
- PAIA manual publication and Information Officer registration/details remain release blockers.
- Supabase Auth leaked-password protection remains a release/dashboard action.
- Twitch creator refresh credentials still require repair.
