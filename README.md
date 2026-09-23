# Step 2.1 — Store catalogue and product discovery

Objective: replace Store and product presentation with the shared clean VoltTech frontend while preserving the commerce API and launch controls.

Parent Step: Step 2 — Core commerce.
Previous Step: Step 1.3 — Foundation QA. All 13 upload files verified at `70ecedf7acd4f4f2042e592b882c7a3958ada9c3`; five pending deletions carried forward. User visual review remains pending.
Current: Step 2.1 — Packaged; upload verification and user review pending.
Next planned Step: Step 2.2 — Cart, checkout and order tracking.
Previous major Step: Step 1 — Frontend foundation. Current major Step: Step 2 — Core commerce. Next major Step: Step 3 — PC Builder.

Branch: `clean-rebuild`. Exact parent/rollback commit: `70ecedf7acd4f4f2042e592b882c7a3958ada9c3`. No v3-prototype code used.

## Upload instructions

1. Stay on `clean-rebuild`. Extract **Step-2.1.zip**.
2. Upload the contents **inside `Step 2.1/`** to the matching repository paths. Do not upload the enclosing Step folder as a site folder. Replace existing files exactly.
3. Delete the 10 paths listed below. Deletions already completed can be skipped. ZIP uploads alone do not remove old files.
4. All required directories already exist at the inspected HEAD. **No folder placeholders are needed.**
5. Tell me when uploaded. I will check every expected file, deletion, import and the actual HEAD, then supply commit-specific previews.

31 delivered files: 19 added, 12 changed; 10 deleted separately. The manifest records SHA-256 for all delivered files except itself.

## Preview URLs

These branch previews show the new pages **after this upload** (until then they show the previous Store).

- [Store](https://raw.githack.com/VoltTechComputerCo/VoltTechComputerCo.github.io/clean-rebuild/store.html)
- [Product page](https://raw.githack.com/VoltTechComputerCo/VoltTechComputerCo.github.io/clean-rebuild/product.html)

After verification, replace `clean-rebuild` with the exact uploaded commit SHA. Product detail requires a published product slug and the launch/admin gate; the current public product page intentionally shows a closed state. Do not enable Store to inspect this design.

Immediate offline visual inspection: `docs/clean-rebuild/step-2.1-store-desktop.png`, `step-2.1-store-mobile.png`. These show the new Store rendered locally. Fixture product screenshots are not published as site content.

## Files added

- `assets/css/pages/commerce.css`
- `assets/js/components/catalogue-view.js`
- `assets/js/pages/product.js`
- `assets/js/pages/store.js`
- `assets/js/services/catalogue-cart.js`
- `assets/js/services/catalogue.js`
- `assets/js/services/site-config.js`
- `docs/clean-rebuild/step-2.1-QA.md`
- `docs/clean-rebuild/step-2.1-folder.png`
- `docs/clean-rebuild/step-2.1-manifest.json`
- `docs/clean-rebuild/step-2.1-store-desktop.png`
- `docs/clean-rebuild/step-2.1-store-mobile.png`
- `scripts/test-clean-commerce.mjs`
- `src/pages/product.head.html`
- `src/pages/product.html`
- `src/pages/product.json`
- `src/pages/store.head.html`
- `src/pages/store.html`
- `src/pages/store.json`

## Files changed

- `README.md`
- `assets/js/services/home-integrations.js`
- `commerce/js/site-store-entry.js`
- `commerce/js/store-core.js`
- `commerce/store.css`
- `docs/clean-rebuild/ARCHITECTURE.md`
- `docs/clean-rebuild/ROADMAP.md`
- `product.html`
- `scripts/check-clean-frontend.py`
- `scripts/test-clean-runtime.mjs`
- `store-gate.css`
- `store.html`

## Files deleted

- `commerce/catalogue-architecture.css`
- `commerce/js/Placeholder.html`
- `commerce/js/product-architecture.js`
- `commerce/js/product.js`
- `commerce/js/store-architecture.js`
- `commerce/js/store.js`
- `commerce/schema/Placeholder.html`
- `docs/Placeholder.html`
- `volttech-home-hero-logo.png`
- `volttech-home-hero.webp`

The three old placeholders and two root hero files are the five pending Step 1.3 removals. Current `assets/brand/home-hero.webp` and source brand logo remain.

## Files / implementations superseded

- Previous README handover.
- Old `store.html` and `product.html` document structures and page controllers. New source templates regenerate complete ready-to-upload pages.
- Old Store/product CSS, catalogue overlay CSS and runtime CSS injection. Retained `commerce/store.css` and `store-gate.css` serve checkout/admin/order consumers only; replaced page rules are removed.
- Old Store-specific DOM IDs and drawer hooks are replaced atomically with the new controllers and generated markup; mappings are in ARCHITECTURE.md.

## Visual changes

Shared premium dark/teal navigation, footer, type, buttons and panels across Store/product. Hardware hero, nine compact category cards, mobile filter controls, product identity/specification/compatibility/fulfilment sections, labelled image fallbacks and a native cart dialog. Existing repository media only; no new third-party brand identity or generated product image.

## Functional changes

Preserved category/slug URLs, name/brand search and sorting, source documents, related products, quote-first cart storage/events and existing checkout destination. Public catalogue filters out demo and unclassified records. Strict launch state and server-verified admin preview; demo/preview purchase actions disabled. Error, empty, missing-product, offline and missing-image states are explicit. Unknown cart rows stay visible/removable and block checkout. Cart quantity controls retain keyboard focus.

The user-confirmed production domain (`volttechcomputerco.co.za`, including www) joins the explicit origin allowlist for existing optional account/analytics/worker enhancements. GitHack remains anonymous and does not run production tracking or worker registration.

## Backend systems touched

Frontend adapters only: read-only `store_settings`; existing `store_products`, categories, documents and relations reads; existing `getUser` + `is_volttech_admin` checks; existing local cart key `vt_store_quote_cart_v1` and `vt-store-cart-change`. Two bootstrap lines in `store-core.js` adapt shared-client reuse and worker ownership for clean pages while retaining the legacy path. No database mutation, migration or policy change.

## Backend systems untouched

Launch flags remain false. Supabase schema/RLS/functions; Yoco and Bob Go calls; checkout/order submission; orders/quotes/invoices/receipts; accounts/profiles/documents/service history; Signal Scan; Builder engines/compatibility/saving; creator data; STATIC publishing; Discord/webhooks and email. Existing analytics ID/events and notification queries remain. Live transactions were not submitted.

## SEO changes

New page titles/descriptions, en-ZA, canonical/social metadata, semantic breadcrumbs/headings and contextual service links. Both converted commerce pages remain `noindex, follow` on the rebuild. No Product/Offer/Review/stock structured claims are manufactured. Existing GitHub canonical domain is retained until Step 8 handles the deliberate custom-domain/redirect/Search Console migration.

## Dependencies

Native HTML/CSS/ES modules; existing self-hosted fonts/assets; Supabase browser SDK pinned to **2.116.0**, loaded only when catalogue/admin access requires it. Existing commerce core and catalogue architecture remain the backend interface. Python 3 + Node run the repository checks. Browser QA used isolated local Chromium and intercepted fixture data; no browser tooling package is a site dependency.

## Test checklist

- [x] Source generation, local imports/assets/links/anchors, labels/ARIA and JS syntax.
- [x] Launch flags, preview-origin isolation, demo exclusion and legacy boundary tests.
- [x] Chromium widths: 360, 390, 412, 768, 1366, 1920; no horizontal overflow.
- [x] Search/brand/category/reset, cart add/quantity/close, image failure, no-JS and offline states using isolated fixtures.
- [x] Desktop/mobile Store screenshots inspected.
- [x] Superseded imports and runtime CSS injection removed.
- [x] ZIP overlay and exact rollback rehearsal.
- [ ] Uploaded commit/files/deletions verified.
- [ ] User physical-phone visual review.
- [ ] Intended-origin authenticated and payment release QA (later Steps; no live transaction attempted).

Run: `python scripts/check-clean-frontend.py`, `node scripts/test-clean-runtime.mjs`, `node scripts/test-clean-commerce.mjs`, `git diff --check`. Details: `docs/clean-rebuild/step-2.1-QA.md`.

## Rollback

**Rollback target: Step 1.3 — exact uploaded state `70ecedf7acd4f4f2042e592b882c7a3958ada9c3`.** Restore every changed/deleted path from that commit and remove every added path listed in this README. This deliberately restores its five not-yet-deleted obsolete files too, preserving the exact prior state. No backend rollback is needed. A requested rollback ZIP will use that exact commit, not an approximation.

## Known limitations

Store remains locked; all 15 existing products are demo fixtures, with no real active inventory. Public previews therefore show enquiry/category and closed product states. Authorised product catalogue behaviour was exercised with local fixtures, not live customer orders. Checkout/order tracking still use their existing frontend pending Step 2.2. Physical Android and post-upload GitHack verification remain outstanding. Production-origin support does not alter Supabase redirect settings or migrate sessions between domains. Canonical/redirect migration remains planned, not silently completed.

## Folder tree

```text
Step 2.1/
├── assets/
│   ├── css/
│   │   └── pages/
│   │       └── commerce.css
│   └── js/
│       ├── components/
│       │   └── catalogue-view.js
│       ├── pages/
│       │   ├── product.js
│       │   └── store.js
│       └── services/
│           ├── catalogue-cart.js
│           ├── catalogue.js
│           ├── home-integrations.js
│           └── site-config.js
├── commerce/
│   ├── js/
│   │   ├── site-store-entry.js
│   │   └── store-core.js
│   └── store.css
├── docs/
│   └── clean-rebuild/
│       ├── ARCHITECTURE.md
│       ├── ROADMAP.md
│       ├── step-2.1-QA.md
│       ├── step-2.1-folder.png
│       ├── step-2.1-manifest.json
│       ├── step-2.1-store-desktop.png
│       └── step-2.1-store-mobile.png
├── scripts/
│   ├── check-clean-frontend.py
│   ├── test-clean-commerce.mjs
│   └── test-clean-runtime.mjs
├── src/
│   └── pages/
│       ├── product.head.html
│       ├── product.html
│       ├── product.json
│       ├── store.head.html
│       ├── store.html
│       └── store.json
├── README.md
├── product.html
├── store-gate.css
└── store.html
```

The colour folder map is `docs/clean-rebuild/step-2.1-folder.png`.
