# VoltTech master roadmap

Previous major Step: **Step 2 — Core commerce (complete and verified at `70691bb5d3a390a185210bdd7c1d188f6f014546`)**. Current: **Step 3 — PC Builder (Step 3.2 packaged)**. Next major Step: **Step 4 — Signal Scan and service pages**.

| Step | Scope | Status / completion gate |
|---|---|---|
| 0 | Repository and system audit | Complete; recorded in Step 0 delivery |
| 1 | Shared frontend foundation and homepage | Steps 1.1–1.3 uploaded and hash-verified; Step 1.3 visual review still pending. Five pending deletions carried into Step 2.1. |
| 2 | Store, categories, product, cart, checkout and tracking | Complete. Step 2.3 uploaded and byte-verified at `70691bb5d3a390a185210bdd7c1d188f6f014546`; launch gates remain closed. |
| 3 | PC Builder | Active. Step 3.1 clean-shell/gate/inspection foundation verified; Step 3.2 clean Guided/Manual experience and iGPU completion consistency packaged. |
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

**Historical next at the time:** Step 2.2 — Cart, checkout and order tracking. Payment enablement and real supplier onboarding remained separate operational gates.

Production-origin allowlist now includes the user-confirmed apex and www `.co.za` domain as well as the existing GitHub domain. Canonical/redirect/Search Console migration remains Step 8 / release work; there is no silent site-wide URL migration in this ZIP.

## Step 2.2 delivery position

Step 2.1: all 31 delivered files match the uploaded Git blobs at `0ed405a7b406bfb923ebd54308c6831f233ef194`; user visual inspection approved. Its ten requested deletions were still present at this HEAD and are explicitly carried into Step 2.2. Earlier pending-review entries above are historical handover records.

Step 2.2: checkout and private order tracking use the shared generated shell and design tokens. All 29 manifest-hashed files were reverified after upload, the exact 30-file upload delta was confirmed, and all 16 requested legacy deletions are now absent at `fd0a981dee1c3ddb2e4f1342dbf61858dc49cafe`. User visual review was already approved before cleanup.

## Step 2.3 delivery position

Step 2.3 re-audits the complete commerce journey and live read-only backend boundary. The frontend remains fail-closed with catalogue, Builder and direct payment disabled; the live catalogue still contains 15 demo records and zero real public products, with zero Store requests/payments at audit time. One customer-state inconsistency was found and fixed: refunded and partially refunded orders now keep the Payment received timeline milestone recorded. A regression assertion covers both states.

No Supabase schema, RLS, Edge Function, secret, launch flag or production data is changed by this delivery. Backend release blockers remain documented: `.co.za` transaction-origin alignment and Yoco return URLs, server-side demo/stock safeguards, checkout idempotency, server enforcement of the direct-payment switch, stale pending-payment reuse/amount validation, delivery-selection enforcement and live payment/courier certification. Current Supabase security/performance advisor findings remain a later security/operations review rather than being silently changed during commerce QA.

Step 2.3 was uploaded and all six delivered files were byte-verified at `70691bb5d3a390a185210bdd7c1d188f6f014546`. **Step 2 is closed.**


## Step 3 sequence

- **Step 3.1 — Builder foundation and safe inspection:** move `builder/index.html` onto the generated clean shell; replace the legacy Builder gate/bootstrap with a fail-closed clean controller; add an explicit non-production-only `?inspect=1` path that uses local prototype data and does not initialise account/save/quote/production services; decouple catalogue loading from account bootstrap. Keep the existing compatibility/guided engines and transitional `builder/styles.css`.
- **Step 3.2 — Builder experience and engine consistency:** migrate/refine Guided + Manual presentation on shared design tokens, fix the integrated-graphics/GPU-required completion mismatch, improve product/media fallbacks and mobile interaction while preserving compatibility rules.
- **Step 3.3 — Account/quote handoff and Builder QA:** unify truthful offer/freshness provenance for saved builds, harden status transitions, verify restore/admin quote handoffs, retire remaining replaced Builder presentation code and run full responsive/regression QA.

## Step 3.1 audit position

The audited Builder contains 136 local prototype products and 423 mock supplier offers. The mock offers are explicitly temporary data and are stale at the current audit date. All 136 mapped product images currently use external proxy URLs. Existing compatibility, guided recommendation, saved-build, quote-request and admin conversion contracts are retained for staged migration.

The Builder and Store launch flags remain off; no backend mutation is part of Step 3.1. One engine inconsistency is recorded for Step 3.2: Guided Office/Home builds can omit a discrete GPU, while the main completion helper still treats GPU as universally required. Saved-build offer/freshness provenance and browser-driven quote-status transitions are recorded for Step 3.3.

## Step 3.2 delivery position

Step 3.1 was uploaded and fully verified at `217582dc623d24ade8e6ce129f3c0290edeea6e6`: all 16 delivered files matched the package bytes and all three requested legacy deletions were absent.

Step 3.2 removes the final transitional `builder/styles.css` dependency and moves Builder presentation into `assets/css/pages/builder.css`. Guided questions adapt to Gaming/Streaming, Creator/Workstation and Office/Home use cases while preserving the existing recommendation engine. The main completion helper now agrees with the existing account snapshot rule that a discrete GPU is optional only when the selected CPU explicitly reports integrated graphics; non-iGPU builds still require a GPU.

Read-only inspection continues to use local prototype data only and now labels mock/stale supplier price and stock data directly in the UI. No Supabase setting, schema, RLS, production record, quote or saved build is changed. Saved-build price provenance, status-transition hardening, restore/admin handoff verification and remaining media/data QA remain Step 3.3.
