# VoltTech frontend reset — Phase 1 audit

Audit date: 5 October 2026. Repository: VoltTechComputerCo/VoltTechComputerCo.github.io.
Fresh branch: frontend-reset-20261005.
Baseline main commit: cf5999d06b4934b7a83ab104cb20b06377ea74e7.

## Status

Phase 1 repository/backend audit is recorded here. This is the audit snapshot.
Current implementation and route migration status are in PROGRESS.md.
No customer HTML, frontend runtime, production data, schema, credentials, launch flags,
payment configuration or publishing workflows were changed by this audit.
This branch starts directly from main; no V3/V4/V5 branch was merged or used.

## Verified inventory

88 deployed HTML files: 37 STATIC files (36 articles and publication hub), 7 admin tools,
1 Google verification file, and 43 other files. Two files are compatibility redirects
(privacy-policy.html and streaming-setup-south-africa-dynamic.html). design-system.html
is an internal component demonstration. The remaining customer routes include the
homepage, Store/product/checkout/order-status, Builder, five PC service pages, streaming
support, three diagnostic tools, Creator Hub/registration, seven customer-area pages,
seven documents, eight canonical legal pages and 404.

The existing Python generator owns 40 outputs. Exposure Scan and STATIC articles are
outside that generator. Auditing only src/pages would miss these legitimate routes.
route-inventory.md lists every deployed HTML file; repository-map.json maps its
scripts, static imports, styles, structured data and literal backend references.

Live read-only metadata confirms 45 public tables, 69 policies, 65 public function
definitions and 20 deployed Edge Functions. All 45 listed public tables have RLS enabled.
This establishes existing policy configuration; it is not an end-to-end authorization test.
The repository contains only 15 Edge Function directories and 20 migration files.
The live migration ledger contains 56 entries; some matching changes have different
timestamps, and multiple foundational migrations are absent from the repository.
Do not treat the repository as a complete database bootstrap or redeploy database code
as part of a frontend build.

## Feature-to-contract map

| Customer feature | Backend/data contract | Integration work for new frontend |
|---|---|---|
| Global shell | production origins, cart event/storage, GA event contracts, authenticated notifications | Replace navigation/header/footer, account/cart renderers and notification presentation. No portal-shell, old CSS or injected public UI. |
| Homepage | launch flags, public products, fresh creator directory, STATIC feed, service/Builder routes | New customer-intent composition; retain live availability rules and meaningful links. |
| Store/search/filter/sort | store_settings, store_categories, store_products, catalogue-normalizer and catalogue-architecture | New typed catalogue adapter and new product renderer. Keep non-demo/public/active/not-hidden eligibility. |
| Product detail | slug lookup, store_product_documents, store_product_relations, product metadata/specs/media | New detail, specification and related-item components. Preserve slug queries, actual media provenance and Builder identifiers. |
| Cart | vt_store_quote_cart_v1; productId/quantity; vt-store-cart-change | New cart sheet. Preserve persisted payload, limits (30 distinct checkout items; quantities 1–25), cross-tab updates, unavailable-item removal. |
| Checkout | submit-store-checkout; profiles/customer_addresses; bobgo-checkout-rates | Preserve server validation, shipping shape, guest/account association, current-cart checks, uncertain-submit lock and confirmation destination validation. New form and summary. |
| Guest order status | store-checkout-status; ref/token URL contract; store_requests | New status presentation. Keep token validation and token out of analytics/logs. Customer account orders are a distinct data stream. |
| Yoco payment | create-store-payment for store requests; create-yoco-checkout for invoice payments; yoco-webhook | Keep both payment journeys, allowlisted redirects, eligibility checks and server authority. Return URLs do not prove successful payment. No provider/settings/webhook changes. |
| PC Builder | build-engine, compatibility-engine, guided-engine, performance-data, catalogue-normalizer; local catalogue + eligible Store overlay | Preserve pure engines; replace app.js, builder-experience and UI adapters. No legacy Builder DOM. Unknown compatibility remains unknown, not confirmed. |
| Builder save/quote/restore | saved_builds; customer_request_build_quote; build_data schema; product Store/builder identity; account-session handoff | New save/quote adapter with identical snapshot contract, resume-after-auth behaviour and provenance. Existing builder-account module is DOM-coupled and cannot be imported unchanged. |
| Repair/upgrades/performance/security/Windows | service-contact configuration; source/issue links; vt_journey_context; WhatsApp/email routes | One service template with content data; new issue controls. Preserve enquiry text and service-aware Signal Scan back/forward journeys. |
| Streaming support | OBS/Streamlabs service content; stream_scan journey context | Use the same service system. Preserve streaming-specific questions and contact result. |
| Signal Scan | signal-scan-model; result estimation; signal-scan-handoff; sessionStorage | New step controller and result component. Retain answer-based triage, branching, estimates, restart/back and contact/export text. It is not a live hardware scanner. |
| Stream Scan | stream-scan-model; stream-scan-handoff | Same diagnostic component family; retain branching and result messaging. Never request passwords, stream keys or 2FA. |
| Exposure Scan | standalone exposure-scan runtime; browser APIs; explicit geolocation action | Extract browser collection from DOM rendering. Preserve local-only processing, browser support states and explicit consent before location access. |
| Creator Hub | streamer_directory REST; sa-streamers-live.json fallback; freshness rules; creator-feed | New directory filters/cards/status. Do not display stale data as live. |
| Creator registration | creator-register Edge Function; Twitch OAuth state; South Africa confirmation; optional VoltTech account link | Replace frontend form/status while preserving OAuth state checking and immediate bearer-token removal from URL. |
| Account/auth | profiles; customer_addresses; customer_save_address_v1; Supabase auth | Email/password sign-in, sign-up, Google OAuth, recovery, email change, profile/address editing and sign-out all require new UI adapters. Preserve canonical callback and safe same-origin return path. |
| Quotes | quotes/quote_items; customer_quote_action; snapshot_quote; expiry rules | New list/detail/action UI. Do not write acceptance/status directly or expose drafts. |
| Saved builds | saved_builds; status guards; build_data; linked quote | New list, restore/detail/delete actions. Preserve ownership and quoted-build locks. |
| Activity | saved_builds, quotes, invoices, orders, service_jobs | New unified timeline; keep genuine references/status/dates and source links. |
| Documents | customer_documents plus quotes, invoices, proformas, orders, saved_builds, service_jobs and nested items/updates | New document registry/detail/print UI. Preserve document IDs, relations, snapshot facts, paid/unpaid distinctions and authorised access. |
| Invoice/receipt | invoices/invoice_items; payments; create-yoco-checkout | New document/payment component; preserve amount, currency, quote linkage, VAT facts and payment availability. |
| Privacy centre/personal data | account_deletion_requests; collectPersonalData tables; recovery window; notification/email hooks | New export/deletion/cancel UI. Preserve export confirmation and status guards. No automatic destructive actions. |
| Notifications | notifications; authenticated customer ownership; event triggers; email outbox/delivery logs | New notification component. Backend notification/email automation remains unchanged. |
| Legal/utility | existing approved text/SEO/structured data, canonical paths, compatibility aliases | Retain content facts and routing while rebuilding semantic presentation. Privacy legacy alias remains a redirect. |
| STATIC | 36 article bodies; static-feed.xml; feed JSON, sitemap; Discord/feed/publishing GitHub workflows; static-subscribe/confirm/unsubscribe; process-static-mailer | Separate editorial system. Preserve article content, GUIDs, publish dates, newsletter double opt-in, canonical links and publishing automation. Visual changes must not announce old articles as new. |
| Admin/back office | admin RPCs, customer/quote/catalogue/order workflows, admin-only policies, service worker compatibility | Audit but do not replace with public controllers. Keep backend/admin access separated. |

Literal source locations are in backend-contracts.md. Dynamic imports, variable table
names, inline browser collectors and hosted-only functions need the manual map above;
the scanner is explicitly not a complete program analysis.

## Live commerce finding

At the audit snapshot, catalogue_enabled, builder_enabled and direct_payment_enabled
are all true. There are ZERO active public non-demo, non-hidden products and 137 active
public demo rows. The latest live supplier-only/demo migrations are newer than the main
branch baseline. A premium design must therefore show an honest empty catalogue with
component enquiry/upgrade planning paths, not fabricated stock, products or supplier offers.

The local builder/data/catalogue.json explicitly labels its supplier files as mock data.
This data can support labelled read-only component planning/compatibility demonstration;
it must not become customer stock, quote prices or purchasable offers. Existing price
helpers sometimes coerce missing prices to zero: the new view model must distinguish
unknown pricing from free pricing. Guided budget recommendations must not use mock
offers as supplier-backed proposals.

A saved build may exist even when the current public catalogue is empty. Preserve it
and show unavailable components honestly rather than silently deleting or substituting them.

## Authentication and permissions

Canonical account origin: https://volttechcomputerco.co.za. Both canonical and www
origins are recognised for account services; commerce submission uses the canonical
origin. Legacy github.io OAuth callbacks forward to the canonical account page.
Non-production inspection cannot authenticate/save/order/pay as a live customer.
Visual preview and mocked contract tests need to be separate from production verification.

Confirmed policies: profiles/addresses/orders/invoices are scoped to the authenticated
owner. Customer quote SELECT additionally excludes drafts. Saved-build inserts require
the current owner, saved status and no quoted identifiers; update/delete policies also
allow admin and database triggers impose additional constraints. Document SELECT is
owner-or-admin; document INSERT is admin-only. Existing authorization stays server-side.
Never migrate these rules into client-only checks.

## Backend drift and payment dependencies

Live-only function names absent from repository function directories:
create-yoco-checkout, yoco-webhook, submit-store-cart, sync-store-catalogue,
register-yoco-webhook-once. Keep these deployed services intact. In particular, invoice
payment and provider webhook processing cannot be inferred solely from store-payment code.
The setup-only webhook registration function must never be called by customer UI.

No secret values were requested. The metadata snapshot records schemas/policies/function
signatures and deployment names; it omits customer records and table row counts.
Environment-variable names in the source index are contracts, not credential values.

## Baseline validation

The untouched main baseline passes 18 of 23 existing repository checks. Five fail:

1. Generated source/output drift: account.html and 404.html differ from generator output.
2. STATIC article static-amd-world-labs-spatial-ai-acquisition.html lacks published time.
3. Runtime navigation test stub lacks document.createElement used by current navigation.
4. Builder check still requires noindex/nofollow, conflicting with current route metadata.
5. Commerce test extraction invokes matchesFacetFilters without including its definition.

These are pre-existing findings, not new rebuild regressions. Several checks assert
legacy classes/markup and must be replaced by behaviour-focused checks for the new frontend.
Do not make the new UI resemble old HTML just to satisfy those assertions.
Existing checks do not substitute for browser, viewport or real session testing.

baseline-qa.json preserves the results without the runner's misleading clean-rebuild
branch label; actual tested ref was the fresh branch at the stated main commit.

## Frontend replacement architecture

Use a new frontend source root and build entrypoint. Route metadata/content may be
retained as data; existing templates, page HTML, page styles, layout classes, page controllers
and frontend component renderers are not implementation inputs.

One token/base/component/layout system owns VoltTech. Route families are home,
catalogue/product, Builder, service, diagnostic, creator, account/document and legal.
STATIC alone receives a separate editorial surface. Functional layout variations must
consume global tokens; no per-route visual identity CSS.

Use data adapters with explicit interfaces for catalogue, cart, authentication, customer
records, Builder snapshots, diagnostics and publishing. Data adapters do not render DOM.
Controllers compose the shared components and consume adapter results. Keep the existing
pure compatibility/recommendation engines; replace DOM-coupled integration modules.

New shell: mobile menu as an accessible modal sheet with focus containment/restoration,
Escape dismissal and scroll lock; grouped hardware, support, creator and account navigation;
search/cart access; responsive footer. Design first at 360px and 390px.
Teal is an accent on refined neutral surfaces; strong hardware photography, restrained
borders, clear hierarchy and no inherited neon/glass system.

Homepage customer journeys: find components, plan a build, resolve a PC issue, improve
a stream; then diagnostic guidance, verified service proof and publication discovery.
No invented customer counts, testimonials, supplier badges or performance promises.

## Completion gates for phases 2–12

- Explicit route checklist: each legitimate customer route uses new markup/controller/shell.
- No customer route loads legacy styles, legacy shell, legacy page controller or old renderer.
- Generated source and output have one owner; CI must target this branch, not clean-rebuild.
- Persist canonical links, robots rules, article facts and valid structured data.
- Real products only; unknown price/spec/media/availability has a designed truthful state.
- Existing cart/build/account/quote/document payloads survive round trips.
- Guest status token validation and all payment origin/redirect/status safeguards survive.
- Diagnostics preserve answers/results/contact payloads and data privacy behaviour.
- Auth boundaries are tested on preview and canonical origins without weakening allowlists.
- Customer ownership, admin separation and immutable document/build rules remain intact.
- STATIC visual edits preserve feed GUIDs/order and do not trigger duplicate publication.
- Keyboard/focus, forms/errors/loading/empty states and sheets tested in a browser.
- Viewports: 360, 390, tablet, laptop, 1440 and large desktop; no horizontal overflow.
- Touch targets >=44px, readable body text, reduced-motion support, visible focus,
  sufficient contrast, no overlapping sticky controls.
- Mobile screenshots reviewed for every route family and every interaction state.
- No production merge/deployment or schema/payment/publishing changes in this branch.

