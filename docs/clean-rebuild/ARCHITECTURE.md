# Clean rebuild architecture — Step 2.1

Authoritative branch: `clean-rebuild`. Step 1.3 parent: `d659bad184e002aaa28468663dab83f213225613`, inspected from a fresh clean-rebuild checkout. Step 1.2 delivery bytes are unchanged and its upload placeholders have been removed. Step 1.1 upload was verified against all 32 delivered files and visually approved by the user. No v3-prototype code was used. User-provided V3-named image files are media sources only.

## Source ownership

`src/templates/page.html`, `header.html` and `footer.html` own the shared shell. `src/pages/*.json` supplies output path, metadata, styles and scripts; adjacent HTML supplies content. Optional `.head.html` supplies page-specific canonical/social/structured metadata. `scripts/build-clean-frontend.py` emits complete upload-ready HTML. Edit sources, then regenerate; generated HTML is never a separate implementation.

Converted routes: `index.html`, `design-system.html`, `store.html`, `product.html`, `checkout.html` and `order-status.html`. Other page families retain their working audited implementation until their own migration. Shared design changes propagate to converted routes. There is one new shell, not a second independently authored homepage shell.

| Source | Responsibility |
|---|---|
| `assets/css/tokens.css` | Exact shared palette, fonts, spacing and border tokens |
| `base.css`, `layout.css` | Reset, type, focus, containers and footer |
| `navigation.css`, `responsive.css` | Shared header, search and mobile transformations |
| `components.css`, `forms.css`, `print.css` | Shared controls and print foundations |
| `notifications.css` | Clean presentation for the preserved notifications controller |
| `pages/home.css`, `pages/design-system.css` | Page composition only |
| `assets/js/site-shell.js` | Navigation, native dialogs and public site search |
| `components/search.js` | Explicit public route index; no product or customer-data search |
| `pages/home.js` | Homepage availability and creator UI |
| `services/home-integrations.js` | Read-only launch flags/cart, account bootstrap, analytics and app registration |
| `pages/design-system.js` | Local inspection-form validation only |

No framework, package manager or runtime build is required. Native content and enquiry links work without JavaScript. Shared navigation stays visible without enhancement. Search appears only when native dialogs are supported. Page styles follow shared styles; no override/fix files are introduced.

## Migration boundary and preserved contracts

`<html data-vt-shell="clean">` tells the existing service worker to return marked HTML unchanged. It prevents legacy stylesheet/navigation/notification-loader injection. Both converted pages carry the marker. The inspection page remains backend-free. The homepage explicitly reconnects these responsibilities:

| Contract | Adapter / behaviour |
|---|---|
| Public launch flags | Anonymous GET to `store_settings`, selecting only `catalogue_enabled,builder_enabled`; strict booleans, eight-second timeout, fail closed |
| Category navigation | Existing category slugs validated against `store_categories`; enquiry links remain until catalogue is enabled |
| Builder | Existing route and gate retained; enquiry CTA until enabled; no engine/data changes |
| Cart | Read-only `vt_store_quote_cart_v1`; synchronises both `[data-cart-link]` controls on `vt-store-cart-change` and cross-tab storage; never rewrites the cart |
| Account | Existing `VOLTTECH_SUPABASE` config and cached auth; pinned SDK 2.116.0; shared `volttechAuth` client; existing account route |
| Notifications | Existing queries, RLS, read state, realtime, role checks and sound retained; explicit header host and accessible clean dialog presentation |
| Analytics | Existing GA ID and `whatsapp_click`; existing `conversion-context.js` retains `vt_conversion_intent` and `vt_journey_context` |
| App registration | Existing manifest, icons and root service worker; one clean-page registration owner |
| Creator feed | Existing Supabase/JSON fallback adapter; added per-row `checked_at`; absent checks remain null, never replaced with the current time |
| Creator display | Twenty-minute freshness requirement; stale/missing/future data is not presented as live; only validated Twitch login strings become links |
| Signal Scan | Existing `signal-scan.html?source=home`; no fabricated telemetry |
| WhatsApp/email | Existing public contact destinations and contextual handoffs retained |

Production-only account bootstrap, analytics and service-worker registration run only on the explicit production-origin allowlist (`volttechcomputerco.github.io`, `volttechcomputerco.co.za`, `www.volttechcomputerco.co.za`). GitHack may read public launch/creator data but cannot share production authentication or send homepage analytics. An account label is display state only; authorisation remains in the existing backend/RLS. Existing destination pages keep their original behaviour and access controls.

`notifications.js` adaptations are limited to clean host placement, delegating clean worker registration, ARIA dialog metadata, Escape/Tab/focus management. Database queries and notification actions are unchanged. `streamer-feed.js` retains its response shape and adds a timestamp; unknown `generated_at` is null rather than a fabricated fresh date.

## Cleanup ownership

Retired: root `home.css`, `service-backgrounds.css`, the V2 finaliser script/workflow, eight upload placeholders, and homepage-only selectors in retained shared legacy files. Other legacy files still have real consumers; they are not imported by converted pages. STATIC feed generation, Discord publishing and guards remain intact. No old implementation is hidden under a new CSS layer. Step 1.3 also removes the unreferenced `volttech-home-hero.webp`, duplicate `volttech-home-hero-logo.png` and three older `Placeholder.html` files. The new hero and official source logo remain intact.

## Assets and typography

New images are organised under `assets/brand/` and `assets/categories/`. See `step-1.2-assets.md` for provenance. Existing photos remain in their current paths where other pages use them; global asset moves must update every consumer atomically. Fonts remain the Step 1.1 self-hosted Space Grotesk and JetBrains Mono WOFF2s with OFL licences. No additional font network requests.

## Preview, SEO and release

Both converted pages are noindex on this rebuild branch. The homepage includes production canonical, en-ZA, truthful Organization/Service structured data and social metadata. Removing noindex is an explicit Step 10 release gate, after whole-site verification. No Product, Offer, Review or AggregateRating claims are emitted.

The user uploads ZIP contents manually and reviews changed pages through GitHack. Before advancing, verify remote HEAD, hashes, removals and imports, then issue commit-pinned links. Local source/runtime checks do not claim browser, payment or accessibility certification. Browser local-file navigation is blocked by its URL policy; HTTP preview rendering and Android 360/390/412 checks happen after upload. Production auth/notification behaviour requires the intended origin and is not certified by a public GitHack preview.

## Step 1.3 QA scope

The phone header intentionally omits the cart icon at 40rem and below to retain comfortable header controls; the same breakpoint now exposes a Cart item in the mobile menu. Both links use the existing `store.html?cart=1` route and launch gate. No new cart implementation is introduced. Desktop layout is unchanged. The inspection page shows the route without accessing customer cart storage.

The uploaded Step 1.2 page was checked in the available desktop browser: no horizontal overflow, working search/results/empty state, native Escape dismissal, and shared local validation. Headline fonts were verified as the intended variable Space Grotesk and JetBrains Mono files. The Step 1.3 phone-menu update has source/runtime checks; 360/390/412 visual review follows manual upload. No new authenticated or payment operation was attempted.

## Step 2.1 commerce boundary

Store/product sources live in `src/pages/` and use the same templates, tokens, controls, typography and navigation as the homepage. `assets/css/pages/commerce.css` owns commerce composition. There is no retained Store/product override stack. The nine existing category types remain query-addressable at `store.html?category=...`.

| File | Responsibility / adaptation |
|---|---|
| `assets/js/services/site-config.js` | Shared explicit production origins and pinned SDK URL; consumed by homepage and commerce adapters |
| `assets/js/services/catalogue.js` | Strict launch check, timed client loading, verified `getUser` + `is_volttech_admin` preview, public demo exclusion, shared status feedback |
| `assets/js/components/catalogue-view.js` | Escaped cards, valid pricing states, filters, product images with labelled category fallback, identity/specification rows |
| `assets/js/pages/store.js` | Category/query navigation, search, brand, sort, reset, gated catalogue state |
| `assets/js/pages/product.js` | Product/related data, identity, specifications, compatibility, fulfilment, documents and error states |
| `assets/js/services/catalogue-cart.js` | Native dialog, existing cart reads/writes/events, quantity/removal, missing-item recovery and existing checkout route; no new checkout/payment API |
| `commerce/js/store-core.js` | Existing public API preserved. Two bootstrap adaptations: clean pages reuse the supplied client and leave worker registration to the clean adapter. Legacy clients/registration still work. |

Old presentation hook IDs (`productGrid`, `brandFilters`, `productHost`, old cart drawer IDs and `data-store-script`) are retired together with their Store/product controllers. New generated sources, controllers and selectors are changed atomically. The old `store-access.js` remains solely for the unconverted checkout. `commerce/store.css` retains shared admin/checkout/order styles; retired public Store/product rules are removed. `site-store-entry.js` retains its navigation and Builder handoff, but its obsolete Store CSS injection is removed.

`?preview=1` is never sufficient to open the catalogue. Preview requires a production origin, a server-verified user and a true admin RPC result. Public views require `catalogue_enabled === true` and exclude demo/unclassified records. Fixture purchases are disabled even in authorised preview. A second settings check after `loadStore` protects Store display against a launch-state change during loading. Product reads use the public launch gate and existing published-product queries/RLS. GitHack uses a non-persistent anonymous client and no production tracking, auth bootstrap or worker.

The live backend remains locked with 15 demo records and zero real active records. This delivery does not publish supplier offers. All example records used for browser checks were intercepted locally and never written to Supabase or shipped as site data.

Reuse of repository category and hardware media is deliberate; category fallback is labelled and never described as the exact product. No new manufacturer specification, pricing, stock, warranty or delivery claim is authored.

## Step 2.2 transaction boundary (supersedes earlier checkout retention notes)

Checkout and order tracking use `src/pages/{checkout,order-status}.*`, the existing templates, shared shell, and `assets/css/pages/transactions.css`. Shared typography, buttons, fields and palette remain central. `commerce/store.css` now serves the legacy admin route only; old checkout/order controllers and styles and the last `store-access.js`/`store-gate.css` consumer are removed.

| File | Responsibility / deliberate hook adaptation |
|---|---|
| `services/catalogue.js` | Exposes `getCommerceCore()` so private pages can load existing commerce APIs without the public catalogue analytics bootstrap |
| `services/site-config.js` | Explicit `transactionOrigin` matches deployed functions; apex/www/GitHack fail closed for transaction calls |
| `services/home-integrations.js` | Reads and strictly normalises existing `direct_payment_enabled` alongside catalogue/Builder flags |
| `services/transactions.js` | Cart eligibility, access tokens, same-origin status URL, Yoco URL allowlist, production courier estimates and payment eligibility |
| `components/order-view.js` | Escaped order items, ZAR confirmed amounts, server-derived stages, timeline and safe tracking links |
| `pages/checkout.js` | New `checkout-form`, `checkout-fields`, `checkout-state`, `checkout-items`, `checkout-confirmation` hooks; native validation, saved profile, cart concurrency, exact original submission payload |
| `pages/order-status.js` | New `order-state`, `order-detail`, `order-timeline`, `refresh-order`, `pay-order` hooks; private status refresh and rechecked payment availability |
| `commerce/js/store-core.js` | Original API unchanged; `submitCheckout` errors now retain HTTP status/uncertainty for safe retry UX |

All paths above except the explicitly qualified core are under `assets/js/`. Legacy page DOM IDs are replaced together with their controllers; backend payload fields and API names are preserved. Checkout payload: `items`, `customer`, `delivery` (door/address), `customerNote`, `shippingSelection`, `website`. Existing cart key/event and profile queries remain. No customer details or tokens are newly persisted in browser storage.

Checkout clears only an unchanged cart after a valid success acknowledgement. An ambiguous dispatched request remains locked pending confirmation because the deployed submission function has no idempotency key. This mitigates accidental retries within the current page; it cannot make retries after reload idempotent. Live product eligibility and launch flags are re-read before submission. The server remains authoritative.

Private order pages have `no-referrer` and `noindex,nofollow`, no GA/conversion-context/notification bootstrap, no external product images, and no worker registration. SDK/core loading is origin-guarded; valid reference plus 64-hex access token required. Payment query strings only explain the return, never assert paid. Status refreshes every 30 seconds while visible (60 after failure); errors retain the last view and hide payment until refreshed. Payment is rechecked immediately before the existing function and redirects only to HTTPS `c.yoco.com`.

The transaction origin deliberately remains `https://volttechcomputerco.github.io` because deployed submit/status/payment/rates functions enforce it. Aligning `.co.za` requires coordinated backend CORS/allowed-origin/return-URL deployment, not just expanding a frontend list. No external deployment occurred.
