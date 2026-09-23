# VoltTech master roadmap

Previous major Step: **Step 1 — Frontend foundation (uploaded; user visual review pending)**. Current: **Step 2 — Core commerce (Step 2.1 ready for upload)**. Next major Step: **Step 3 — PC Builder**.

| Step | Scope | Status / completion gate |
|---|---|---|
| 0 | Repository and system audit | Complete; recorded in Step 0 delivery |
| 1 | Shared frontend foundation and homepage | Steps 1.1–1.3 uploaded and hash-verified; Step 1.3 visual review still pending. Five pending deletions carried into Step 2.1. |
| 2 | Store, categories, product, cart, checkout and tracking | Step 2.1 Store/product frontend packaged; manual upload verification and visual review pending. Launch gates stay closed. |
| 3 | PC Builder | Not started; preserve engines, estimates, saving and handoffs |
| 4 | Signal Scan and service pages | Not started; truthful diagnostics, service leads and support |
| 5 | Customer accounts and operations | Not started; authentication, history, documents, notifications and privacy |
| 6 | Creator ecosystem and STATIC | Not started; creator freshness and editorial publishing continuity |
| 7 | Legal, support and customer documents | Not started; accurate policies and print layouts |
| 8 | SEO, accessibility and performance | Not started; whole-site verification and residue closure |
| 9 | Full QA | Not started; responsive, customer roles, payments, retries and regression |
| 10 | Release candidate | Not started; verified release ZIP, exact rollback and operational readiness |

## Step 1 sequence

- **Step 1.1 — Shared foundation and inspection page:** uploaded to `8c120bc74512583cfb3f4cf3be292d13368b320e`; 32 files verified exactly; user visual approval received.
- **Step 1.2 — Homepage and shared navigation:** uploaded at `7db853fb7f22e949ca82c27e8cc67e2e4cdeadea`; all 43 delivery files and all 12 deletions verified. Follow-up folder placeholders removed by `d659bad184e002aaa28468663dab83f213225613`. User requested continuation.
- **Step 1.3 — Foundation QA and removal closure:** desktop preview/search/native Escape/local-form checks completed; phone-menu Cart route added, shared cart labels synchronised, enquiry wording refined, unused legacy hero files and older placeholders removed. Source/runtime and exact rollback checks pass. Upload verification and device visual review remain pending. Authenticated notifications and installed production-worker transitions remain appropriate-origin release QA, not certified by GitHack.

## Step 2 sequence

- **Step 2.1 — Store catalogue and product discovery:** inspect the newly verified branch and live public catalogue contract again. Build Store/category browsing and product detail on the shared shell; retain filters, correct imagery, launch gating and truthful stock/pricing states. Do not enable catalogue or payments merely to show the design.
- **Step 2.2 — Cart, checkout and order tracking:** preserve existing cart storage/events, quote-first handoff, account linkage and payment availability boundaries. Use explicit pending/unavailable states where operational data is absent.
- **Step 2.3 — Commerce QA and cleanup:** verify mobile browsing, filters, product links, quantity changes, failures and customer/order handoffs; retire replaced frontend code atomically. Resolve or document operational blockers before release.

## Sequencing clarification from Step 0

Step 1.2 reconnects analytics, launch access, app registration and notifications explicitly for the homepage. The shared inspection shell remains backend-free. Existing runtime integrations remain for unconverted consumers. No production launch flags are enabled by a visual Step.

## Every delivery

Re-inspect branch HEAD, current files, prior README and dependencies. Package changed/added repository paths under the exact Step root with README, checksums, deletion and rollback details. Include a folder image for complex deliveries. Provide links only for pages currently changed. After upload, verify actual remote files before issuing commit-pinned previews and starting the next Step.

## Step 2.1 delivery position

Base: `70ecedf7acd4f4f2042e592b882c7a3958ada9c3` on `clean-rebuild`, freshly cloned and checked again before packaging. All 13 Step 1.3 upload files match the delivered bytes. Five pending deletions are carried forward. User requested continuation while Step 1.3 device visual review remains pending.

Step 2.1 rebuilds Store/category browsing and product detail on the existing shared shell. Public closed, public open and authorised admin preview states are separate; no launch flag was changed. Existing cart/data contracts are retained, with accessible native cart presentation. Local browser checks passed; see `step-2.1-QA.md`.

**Next: Step 2.2 — Cart, checkout and order tracking.** First verify Step 2.1 uploaded hashes, deletions, imports and actual HEAD. Resolve user visual feedback before extending commerce. Payment enablement and real supplier onboarding are separate operational gates.

Production-origin allowlist now includes the user-confirmed apex and www `.co.za` domain as well as the existing GitHub domain. Canonical/redirect/Search Console migration remains Step 8 / release work; there is no silent site-wide URL migration in this ZIP.
