# Step 2.2 — Checkout and private order tracking

Objective: rebuild both transaction pages on the shared VoltTech frontend while preserving existing commerce and customer contracts.

Parent Step: Step 2 — Core commerce.
Previous Step: Step 2.1 — Store/product; 31 upload files verified exactly at `0ed405a7b406bfb923ebd54308c6831f233ef194`. User visual inspection approved. Ten requested deletions remained at HEAD and are carried forward.
Current: Step 2.2 — Packaged; upload verification and user visual review pending.
Next planned Step: Step 2.3 — Commerce QA and cleanup.
Previous major Step: Step 1 — Frontend foundation. Current major Step: Step 2 — Core commerce. Next major Step: Step 3 — PC Builder.

Branch: `clean-rebuild`. Exact parent/rollback commit: `0ed405a7b406bfb923ebd54308c6831f233ef194`. No v3-prototype code used.

## Upload instructions

1. Extract **Step-2.2.zip** and stay on **clean-rebuild**.
2. Upload the contents inside **Step 2.2/** at their matching repository paths; replace existing files. Do not upload the enclosing Step folder as a website directory.
3. Delete the **16 files** in the deletion list below. ZIP uploads do not remove files. Ten are pending Step 2.1 cleanup; six are replaced in this step.
4. **No new folders or placeholder paths are required.** All target directories already exist at the audited HEAD.
5. Tell me when uploaded. I will verify file hashes, all deletions, imports and HEAD and supply commit-pinned preview links before continuing.

30 delivered files: 19 added, 11 changed; 16 deletions to perform separately. Manifest contains SHA-256 for every delivered file except itself.

## Preview URLs

These show this delivery **after upload**; until then they show the previous pages. New commit-specific URLs follow upload verification.

- [Checkout](https://raw.githack.com/VoltTechComputerCo/VoltTechComputerCo.github.io/clean-rebuild/checkout.html)
- [Order tracking](https://raw.githack.com/VoltTechComputerCo/VoltTechComputerCo.github.io/clean-rebuild/order-status.html)

Checkout intentionally remains closed. Order tracking without a private link shows its entry state; real private transactions are disabled on GitHack. Do not enable launch flags for design review.

Immediate visual inspection: desktop/mobile PNGs for both pages are included in `docs/clean-rebuild/step-2.2-*.png`. These are public states rendered locally, not fabricated customer records. Folder map: `docs/clean-rebuild/step-2.2-folder.png`.

## Files added

- `assets/css/pages/transactions.css`
- `assets/js/components/order-view.js`
- `assets/js/pages/checkout.js`
- `assets/js/pages/order-status.js`
- `assets/js/services/transactions.js`
- `docs/clean-rebuild/step-2.2-QA.md`
- `docs/clean-rebuild/step-2.2-checkout-desktop.png`
- `docs/clean-rebuild/step-2.2-checkout-mobile.png`
- `docs/clean-rebuild/step-2.2-folder.png`
- `docs/clean-rebuild/step-2.2-manifest.json`
- `docs/clean-rebuild/step-2.2-order-status-desktop.png`
- `docs/clean-rebuild/step-2.2-order-status-mobile.png`
- `scripts/test-clean-transactions.mjs`
- `src/pages/checkout.head.html`
- `src/pages/checkout.html`
- `src/pages/checkout.json`
- `src/pages/order-status.head.html`
- `src/pages/order-status.html`
- `src/pages/order-status.json`

## Files changed

- `README.md`
- `assets/js/services/catalogue.js`
- `assets/js/services/home-integrations.js`
- `assets/js/services/site-config.js`
- `checkout.html`
- `commerce/js/store-core.js`
- `commerce/store.css`
- `docs/clean-rebuild/ARCHITECTURE.md`
- `docs/clean-rebuild/ROADMAP.md`
- `order-status.html`
- `scripts/check-clean-frontend.py`

## Files deleted

- `checkout.css`
- `commerce/catalogue-architecture.css`
- `commerce/js/Placeholder.html`
- `commerce/js/checkout.js`
- `commerce/js/order-status.js`
- `commerce/js/product-architecture.js`
- `commerce/js/product.js`
- `commerce/js/store-architecture.js`
- `commerce/js/store.js`
- `commerce/schema/Placeholder.html`
- `docs/Placeholder.html`
- `order-status.css`
- `store-access.js`
- `store-gate.css`
- `volttech-home-hero-logo.png`
- `volttech-home-hero.webp`

New replacements: `checkout.css`, `order-status.css`, `store-access.js`, `store-gate.css`, `commerce/js/checkout.js`, `commerce/js/order-status.js`. The other ten are pending Step 2.1 deletions. Existing assets under `assets/brand/` remain.

## Files / implementations superseded

Previous README handover; old checkout/order HTML structures and their controllers/styles; last consumer of the old Store gate. New source markup and controllers replace DOM hooks together; backend field names and APIs remain. Old filenames mentioned in historical changelogs/audit records are documentation, not runtime imports. `commerce/store.css` remains for the admin Store.

## Visual changes

Shared dark/teal tokens, navigation, footer, Space Grotesk/JetBrains Mono, buttons and forms. Checkout introduces request/confirmation/payment steps, numbered contact/delivery sections, review summary and acknowledgement. Tracking presents recorded progress, component list, confirmed totals, conditional courier/payment actions and practical help. Deliberate one-column phone layouts. Repository images only; category fallbacks labelled.

## Functional changes

Existing cart key/events preserved. Checkout validates eligibility, prefills known profile/address fields, checks production courier estimates, rereads launch and product data before submission, preserves changed carts and clears only after acknowledged success. Definitive rejections can retry; ambiguous failures ask for confirmation and keep the cart to reduce duplicate requests.

Private order access requires the existing reference/token. No page analytics, conversion context or notification bootstrap; no-referrer protects outbound navigation. Status comes from the server. Payment return query strings never mark paid. Payment requires both server eligibility and the global flag, rechecked before calling the existing function. Only HTTPS `c.yoco.com` redirects are accepted. Stale details are labelled and payment hidden after refresh failure.

## Backend systems touched

Frontend adapters only: existing `store_settings` read adds strict `direct_payment_enabled`; product/profile/address reads; existing cart storage; `submit-store-checkout`, `bobgo-checkout-rates`, `store-checkout-status`, `create-store-payment` call contracts retained. Core submission errors expose HTTP status/uncertainty without altering payload or function endpoint. Detailed hook mappings: `docs/clean-rebuild/ARCHITECTURE.md`.

## Backend systems untouched

No Supabase schema/RLS/function/configuration/data changes. No launch flags enabled, Yoco/Bob Go deployment or secret changes. Auth sessions, account linkage, orders/quotes/documents/history, admin operations, analytics IDs, notifications, Builder/compatibility, Signal Scan, creator/STATIC, Discord/webhooks and email remain. Private pages intentionally omit analytics to avoid token leakage. No live transaction submitted.

## SEO changes

Semantic headings and breadcrumbs, en-ZA titles/descriptions. Transaction pages use `noindex,nofollow` and `no-referrer`. No invented Offer/Review/Product claims or private token canonicals. Site-wide canonical/domain migration remains Step 8.

## Dependencies

Native HTML/CSS/ES modules; existing self-hosted fonts/assets; existing Supabase SDK pin 2.116.0 and commerce core/catalogue architecture. Python 3 and Node for source/contract checks. Local browser QA tooling is not a production dependency. No added external image, form or payment library.

## Test checklist

- [x] Generated HTML, paths/imports/links, ARIA/labels, JS syntax and legacy isolation.
- [x] Existing runtime/commerce plus new transaction contract tests.
- [x] Chromium at 360, 390, 412, 768, 1366 and 1920px; no overflow/page errors.
- [x] Isolated checkout success/failure/cart/rate and private status/payment states.
- [x] Desktop/mobile compositions inspected; public screenshots included.
- [x] Deleted runtime references removed; admin consumers preserved.
- [x] ZIP overlay and exact rollback byte comparison.
- [ ] Uploaded hashes/deletions/HEAD verified.
- [ ] User Android visual review.
- [ ] Intended-origin signed-in/live payment/webhook/fulfilment release tests.

Run `python scripts/check-clean-frontend.py`, `node scripts/test-clean-runtime.mjs`, `node scripts/test-clean-commerce.mjs`, `node scripts/test-clean-transactions.mjs`, `git diff --check`. Full evidence: `docs/clean-rebuild/step-2.2-QA.md`.

## Rollback

**Rollback target: Step 2.1 — exact uploaded state `0ed405a7b406bfb923ebd54308c6831f233ef194`.** Restore every changed/deleted path from that commit; remove every added path. This restores all ten pending old files too, preserving the exact prior state. No backend rollback required. Any requested rollback ZIP will be generated from this exact Git tree.

## Known limitations / release blockers

All three launch flags remain off and current catalogue records are demos. Public previews cannot submit orders or show a real order. Local intercepted fixtures establish frontend behaviour, not live payment certification.

Deployed transaction functions accept only `https://volttechcomputerco.github.io`. `.co.za` and GitHack transaction requests fail closed; domain alignment requires coordinated backend changes. The deployed checkout lacks idempotency and server demo/stock safeguards; payment functions need server enforcement of the global payment flag. Delivery selection is currently informational because submission ignores it. These are documented operational release gates, not solved by frontend checks. See QA report for versions and exact findings.

Physical Android, authenticated account linkage, production worker transition and live Yoco/Bob Go/webhook checks remain for release QA. No live service is claimed tested by this visual delivery.

## Folder tree

```text
Step 2.2/
├── assets/
│   ├── css/
│   │   └── pages/
│   │       └── transactions.css
│   └── js/
│       ├── components/
│       │   └── order-view.js
│       ├── pages/
│       │   ├── checkout.js
│       │   └── order-status.js
│       └── services/
│           ├── catalogue.js
│           ├── home-integrations.js
│           ├── site-config.js
│           └── transactions.js
├── commerce/
│   ├── js/
│   │   └── store-core.js
│   └── store.css
├── docs/
│   └── clean-rebuild/
│       ├── ARCHITECTURE.md
│       ├── ROADMAP.md
│       ├── step-2.2-QA.md
│       ├── step-2.2-checkout-desktop.png
│       ├── step-2.2-checkout-mobile.png
│       ├── step-2.2-folder.png
│       ├── step-2.2-manifest.json
│       ├── step-2.2-order-status-desktop.png
│       └── step-2.2-order-status-mobile.png
├── scripts/
│   ├── check-clean-frontend.py
│   └── test-clean-transactions.mjs
├── src/
│   └── pages/
│       ├── checkout.head.html
│       ├── checkout.html
│       ├── checkout.json
│       ├── order-status.head.html
│       ├── order-status.html
│       └── order-status.json
├── README.md
├── checkout.html
└── order-status.html
```
