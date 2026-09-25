# Step 3.1 QA — Builder foundation and safe inspection

Audit date: 23 September 2026  
Authoritative branch: `clean-rebuild`  
Parent / rollback commit: `70691bb5d3a390a185210bdd7c1d188f6f014546`

## Scope

Step 3.1 starts the PC Builder migration without rewriting the compatibility or recommendation engines. It moves `builder/index.html` onto the generated clean VoltTech shell, replaces the old Builder-specific gate/bootstrap files with a clean controller/service boundary, and adds an explicitly read-only inspection path for non-production previews.

No Store/Builder/payment launch flag is changed. No Supabase schema, RLS, function, secret or production record is changed.

## Current Builder system audited

The Builder is an application, not a brochure page. The audit confirmed separate contracts for:

- guided recommendation flow;
- manual component selection;
- compatibility diagnostics;
- power/headroom estimates;
- local Builder catalogue and product media;
- supplier-offer normalisation;
- Store catalogue overlay;
- saved-build/account integration;
- quote-request handoff;
- admin build-to-quote conversion;
- Store-to-Builder component handoff;
- public launch gating and admin preview.

These contracts are preserved for staged migration rather than being replaced wholesale.

## Catalogue/data position

The local Builder catalogue currently contains **136 products** with no duplicate product IDs across nine categories:

- 16 CPUs;
- 18 motherboards;
- 16 memory kits;
- 18 GPUs;
- 16 storage products;
- 16 PSUs;
- 14 cases;
- 14 CPU coolers;
- 8 fan products.

The Builder manifest explicitly describes this as temporary test data. Five supplier files contain **423 mock offers** in total and all identify themselves as `temporary-test-data`. Their recorded checks are from 11–13 September 2026, so the existing normaliser classifies them as stale by the current 24-hour fresh / 72-hour aging rules.

Step 3.1 does not make those prices or stock live. The clean inspection mode intentionally uses this local prototype data only and labels itself read-only.

## Product media position

`builder/data/product-media.json` has one primary image mapping for each of the 136 local products. These mappings currently resolve through external `api.microlink.io` image-proxy URLs rather than repository-owned product media.

This remains a Step 3.2/3.3 quality and reliability issue. Step 3.1 does not pretend those images are a production media library.

## Backend position checked read-only

At audit time the VoltTech Production launch settings remain fail-closed: Store catalogue, PC Builder and direct payment are disabled. Existing Store catalogue rows are demo records rather than real public inventory.

The `saved_builds` table already supports the current customer/admin workflow. Five historical saved-build records exist and all are in the `quoted` state at audit time. No customer record contents were used for this migration and no production record was changed.

Existing saved-build consumers remain:

- customer `builds.html`;
- `admin-builds.html` build review / quote conversion;
- `admin-workflow.js` operational queue;
- Builder account integration and restore links.

## Step 3.1 architecture changes

### Generated clean route

`builder/index.html` is now generated from:

- `src/pages/builder.json`;
- `src/pages/builder.html`;
- `src/pages/builder.head.html`;
- the existing shared `src/templates/page.html`, header and footer.

The public URL does not move.

The page inherits the shared self-hosted Space Grotesk / JetBrains Mono fonts, navigation, search, footer, cart indicator, clean service-worker marker and common design system. The old Google Fonts request is removed.

### Launch access

`assets/js/services/builder-access.js` owns Builder access for the clean route.

Production behaviour remains fail-closed:

- public access requires `store_settings.builder_enabled === true`;
- `?preview=1` on production is not sufficient by itself;
- production preview still requires a valid signed-in user plus a successful `is_volttech_admin` RPC result;
- non-production pages remain closed unless the explicit read-only inspection switch is used.

### Read-only inspection

`?inspect=1` opens the full Builder only when the current origin is **not** one of VoltTech's configured production origins.

Inspection mode intentionally does not initialise:

- account saving;
- quote requests;
- the Supabase Store product overlay;
- production analytics;
- notification bootstrap;
- clean-page service-worker registration.

It uses the local temporary Builder catalogue and mock supplier files so the owner can visually inspect the application on GitHack without changing a launch flag or creating production activity.

### Catalogue bootstrap

`builder/js/data-loader.js` no longer imports account integration as a side effect. Store overlay loading now requires the shared `window.volttechAuth` client supplied by the production access layer. Inspection explicitly returns the local catalogue without attempting the overlay.

This removes the previous coupling where loading catalogue data could also start account/auth services.

### Dialog boundary

The Builder no longer needs the root `volttech-dialog.js` merely to support its clear/copy confirmation UI. A clean Builder dialog adapter exposes the same `window.VoltTechDialog.confirm/message` contract using a native dialog and shared components.

## Transitional dependency

`builder/styles.css` is intentionally retained in Step 3.1. It owns the current Guided/Manual Builder presentation and allows this step to change shell/access architecture without simultaneously redesigning the application.

The clean dependency checker explicitly permits this single transitional Builder stylesheet. **Step 3.2 owns migrating/replacing it.**

The following old gate/bootstrap presentation files are superseded and should be removed with this upload:

- `builder/builder-access.js`
- `builder/builder-gate.css`
- `builder/phase6-unification.css`

## Confirmed issues carried into later Builder steps

### Office / integrated-graphics completion mismatch

The guided engine correctly skips a discrete GPU for an Office/Home build, but `build-engine.js` still treats GPU as universally required. The account snapshot code separately knows that a CPU with integrated graphics can make GPU optional.

Step 3.2 must unify the completion rule so an appropriate integrated-graphics build is not shown as incomplete by the main Builder.

### Saved-build price provenance

`account-integration.js` currently selects the first positive supplier offer when serialising a saved build instead of using the Builder's `getBestOffer()` eligibility/freshness rules. Its fallback `price_checked_at` can also use the current time when no source timestamp exists.

That can make stale/unknown prototype pricing look fresher than its source. Step 3.3 must make saved-build/quote provenance use one truthful offer-selection contract and never fabricate freshness.

### Saved-build status transition boundary

Current ownership RLS allows an authenticated owner to update their own `saved_builds` row, and the browser directly changes `status` to `quote_requested`. Before Builder launch, quote/status transitions should be constrained to the fields/actions the workflow actually permits rather than relying only on client behaviour.

No RLS/RPC change is made in Step 3.1.

### Product media

The 136 image mappings are external proxy URLs. Step 3.2/3.3 should move toward verified, stable product media or clearly labelled category fallback imagery instead of treating the proxy map as a production asset system.

### Supplier data

All current Builder supplier offers are mock/stale. Real supplier onboarding, commercial pricing policy and stock freshness remain operational launch gates.

## Tests performed for this package

- New Builder service/controller/dialog/data-loader JavaScript syntax checked with Node.
- Generated Builder HTML inspected for one `h1`, one `main`, one `header`, one `footer`, duplicate IDs, inline handlers/styles and label targets.
- Source/generation pair rendered locally using the same nested-output prefix rules as `scripts/build-clean-frontend.py`.
- New Builder contract test checks clean-shell usage, removed legacy dependencies, no Google Fonts loader, fail-closed production launch flag, verified-admin preview, non-production-only inspection, no implicit account import and shared Store-overlay client usage.
- Package manifest records SHA-256 for all delivered files except itself.

## Visual QA after upload

Check both URLs:

1. normal GitHack Builder URL — must remain on the coming-soon gate;
2. same URL with `?inspect=1` — must open the Builder with a prominent read-only inspection notice.

Inspect desktop and Android layouts, Guided mode, Manual mode, category navigation, search, compatible-only filtering, selections, quantity controls, build summary, compatibility report, clear confirmation and copy summary. Do not treat displayed prototype supplier prices/stock as commercial data.

## Rollback

Restore every changed/deleted path from `70691bb5d3a390a185210bdd7c1d188f6f014546` and remove every Step 3.1 added path.
