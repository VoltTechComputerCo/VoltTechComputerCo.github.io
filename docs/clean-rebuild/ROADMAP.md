# VoltTech master roadmap

Current major Step: **Step 8 — SEO, accessibility and performance (Step 8.1A packaged)**.

| Step | Scope | Status / completion gate |
|---|---|---|
| 0 | Repository and system audit | Complete |
| 1 | Shared frontend foundation and homepage | Complete |
| 2 | Core commerce | Complete; launch gates remain closed |
| 3 | PC Builder | Complete; Builder remains launch-gated |
| 4 | Signal Scan and service pages | Complete |
| 5 | Customer accounts and operations | Complete |
| 6 | Creator ecosystem and STATIC | Complete |
| 7 | Legal, support and customer documents | Complete and verified at `0c3501d0beefe16e5ce4e1a6d9b6ca897b515f2a` |
| 8 | SEO, accessibility and performance | Active. 8.1A canonical source/infrastructure packaged |
| 9 | Full QA | Pending |
| 10 | Release candidate | Pending |

## Step 8 sequence
- **8.1A — Canonical source + SEO infrastructure:** move clean page source heads, runtime production origin, robots, sitemap/RSS and STATIC publishing contracts to `https://volttechcomputerco.co.za`.
- **8.1B — Generated output sync + domain crawl:** regenerate/sync public outputs from the new source, update legacy compatibility outputs, and prove no active public metadata still points at `github.io`.
- **8.2 — Accessibility + performance:** keyboard/focus, semantics, contrast, image/font/script loading and mobile performance.
- **8.3 — Final SEO/residue QA:** migrate the 30 historical STATIC article templates/canonicals, close remaining legacy root-file debt and run final crawl/link/structured-data checks.

## Operational blockers carried forward
- Store catalogue, Builder and direct payments remain disabled.
- Production Yoco payment path is not certified; `.co.za` Edge Function CORS/redirect alignment remains required before payment enablement.
- PAIA manual publication and Information Officer registration/details remain release blockers.
- Supabase Auth leaked-password protection remains a dashboard release action.
- Twitch creator refresh credentials still require repair.
