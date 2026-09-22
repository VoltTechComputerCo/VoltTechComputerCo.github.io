# VoltTech master roadmap

Previous major Step: **Step 0 — Repository audit (complete)**. Current: **Step 1 — Frontend foundation (in progress)**. Next: **Step 2 — Core commerce (not started)**.

| Step | Scope | Status / completion gate |
|---|---|---|
| 0 | Repository and system audit | Complete; recorded in Step 0 delivery |
| 1 | Shared frontend foundation and homepage | In progress; Step 1.1 packaged, upload and visual review pending |
| 2 | Store, categories, product, cart, checkout and tracking | Not started; respect launch gates and resolve documented commerce gaps |
| 3 | PC Builder | Not started; preserve engines, estimates, saving and handoffs |
| 4 | Signal Scan and service pages | Not started; truthful diagnostics, service leads and support |
| 5 | Customer accounts and operations | Not started; authentication, history, documents, notifications and privacy |
| 6 | Creator ecosystem and STATIC | Not started; creator freshness and editorial publishing continuity |
| 7 | Legal, support and customer documents | Not started; accurate policies and print layouts |
| 8 | SEO, accessibility and performance | Not started; whole-site verification and residue closure |
| 9 | Full QA | Not started; responsive, customer roles, payments, retries and regression |
| 10 | Release candidate | Not started; verified release ZIP, exact rollback and operational readiness |

## Step 1 sequence

- **Step 1.1 — Shared foundation and inspection page:** code and source checks complete; awaiting manual upload to clean-rebuild and visual review. A pure, noindex inspection route exercises the shared shell without backend calls. Root service worker now respects explicitly converted pages.
- **Step 1.2 — Homepage and shared navigation:** re-inspect uploaded HEAD first, verify Step 1.1 hashes and feedback, then rebuild the homepage against the supplied reference. Connect shared shell responsibilities to actual launch/account/notification/analytics contracts. Retire the V2-only finaliser and obsolete homepage code atomically. Plan adoption across remaining page families with explicit adapters.
- **Step 1.3 — Foundation QA and removal closure:** test 360/390/412, tablets and desktops; source/path checks; native dialog and keyboard handling; installed service-worker transitions; no legacy injections on migrated routes. Continue only after user inspection and concrete upload verification.

## Sequencing clarification from Step 0

Splitting analytics, launch access, app registration and notification responsibilities is coupled to migration of their first business-page consumers in Step 1.2. Step 1.1 establishes the pure shell and the service-worker isolation boundary first. Existing runtime integrations are not removed while old routes still depend on them. No production flags are enabled by a visual Step.

## Every delivery

Re-inspect branch HEAD, current files, prior README and dependencies. Package changed/added repository paths under the exact Step root with README, checksums, deletion and rollback details. Include a folder image for complex deliveries. Provide links only for pages currently changed. After upload, verify actual remote files before issuing commit-pinned previews and starting the next Step.
