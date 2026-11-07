# VoltTech — Supabase restriction recovery and no-subscription migration plan
Date: 7 November 2026

## Verified outage facts
- Supabase project `qdqhfnvwqvgesfdmocir` is reported `ACTIVE_HEALTHY` by management/SQL, while **public PostgREST/Auth requests respond HTTP 402** (e.g. `/rest/v1/store_settings` at 08:23 UTC on 7 Nov). Project health does not verify customer access.
- 7 Nov GitHub Action `Refresh public Store catalogue` fails `Catalogue export: store_settings 402`. The last committed binary public snapshot is **3 Nov 2026 17:56 UTC**.
- Last recorded Syntech offer check was 3 Nov 22:13 UTC. Never advertise that stock as current.
- The Supabase restriction email dated 3 Nov (UTC) reported **14.74 GB of egress**; Free uncached egress quota is 5 GB/month. The exact next billing reset date was not available through connected project APIs.
- The live Postgres database is 141 MB; `store_products` occupies 58 MB; `store_supplier_offers` about 6.7 MB; 53 `public` tables, 5,122 product records, 5,184 supplier offers, 3 Auth users, 3 store requests, 0 Supabase Storage objects. Do not delete or export account credentials into GitHub.
- The user-facing website itself was not loaded through an authenticated browser in Chat mode; GitHub actions confirm Pages deploys, not live visual correctness. Static-site tests are required.

## Phase 0: keep public browsing working without Supabase
- `assets/js/services/storefront-mode.js`: production and preview/public domains run `STATIC_ENQUIRY_MODE`; localhost keeps the normal store test path.
- Store and product detail pages load the **existing GitHub-hosted public compressed catalogue**, never fetch the Supabase REST API or attempt checkout. No new paid service.
- Stale prices and stock are **not presented**. Each product offers a product-specific WhatsApp enquiry to confirm price, stock, delivery and terms.
- Keep the normal customer/account/operations backend untouched while restricted; do not claim that login, quotes, payment or supplier updates work during HTTP 402.
- The static file's useful public product selection is deliberately limited to last published data. Supplier updates and a new catalogue publishing pipeline are required for freshness.
- Add CI tests that intercept and block all Supabase calls and verify static Store and product details at mobile/desktop widths, then verify the Pages deployment.

## Phase 1: provider-independent public catalogue
1. Move safe, public-only catalogue publication to an independent build process. Import supplier feeds using server-side, permissioned credentials held as GitHub or Cloudflare secrets, never in public JS or GitHub Pages.
2. Publish compact JSON/gzip snapshots with source timestamp, record count, product availability freshness and curation exclusion list.
3. Keep all product imagery on Cloudflare Pages or supplier/manufacturer URLs (Supabase Storage currently holds 0 objects).
4. Load the public catalogue in browsers only from the CDN. Never fetch `store_products.select('*')` or `store_settings` from Supabase on every visitor or on intervals.
5. Do not advertise products as in-stock from old snapshots; require confirmation at checkout or enquiry.

## Phase 2: full transactional replacement (proposed, not deployed)
- **Cloudflare Pages Free**: the existing static storefront, PC Builder, media and generated catalogue.
- **Cloudflare Workers Free**: authenticated API routes for customer accounts, saving builds, cart-to-order request, quotes, invoices, checkout status, admin workspace, mail jobs, Yoco signature verification and BobGo courier operations.
- **Cloudflare D1 Free**: relational business data (SQLite semantics, **not** PostgreSQL RLS). Rebuild privileges explicitly in the API and use prepared SQL, roles, secure sessions and audit logs. PostgreSQL triggers, SECURITY DEFINER functions and RLS cannot simply be copied into D1.
- **Secrets**: feed credentials, payment credentials, courier keys, admin auth and webhook signing keys remain server-side. Never commit raw secrets or customer data into public GitHub.
- **Authentication**: migrate only securely through an approved login/invitation flow. Export all account records under access controls; do not assume Supabase password hashes will work in a new authentication system or publish them.
- **Payments**: preserve manual stock/quote approval; only create payments after confirmed totals, use idempotency keys and verify signed provider webhooks. Provider transaction fees remain applicable.
- **Business data**: all quotes, orders, invoices, suppliers, VAT/tax metadata, courier data, email outbox and document links need explicit export/reconciliation and role tests. No destructive cutover.
- **Backups**: schema, encrypted data exports and restoration drill before any cutover. Keep rollback and dual-write/read reconciliation with access restrictions; avoid losing pending orders.

## Free-tier constraints / costs
Cloudflare Workers Free is currently limited to 100,000 requests/day; D1 Free includes up to 5 million rows read/day, 100,000 written/day and 5 GB stored across an account. Free limits can still stop writes when exceeded; verify with live traffic and alerts. Domain renewal, payment processing, optional email/courier services and operator electricity/connectivity are outside a `$0/month hosting` promise.

## What would make Supabase sustainably cheap *if kept as a temporary private backend*
1. **Remove** bulk direct `store_products` browser reads, `select('*')` on public list and product pages, and per-visitor `store_settings` polling.
2. **Remove** browsing-triggered Auth refresh and Realtime/notifications on anonymous public pages.
3. **Stop** frequent full-catalogue exports from PostgREST. 96 exports/day at ~2.25 MB JSON each would be ~6.5 GB per 30 days before other traffic and compression. Reduced schedule (12/day) projects ~0.81 GB/30 days at that file size, but currently **still fails 402**; make future export incremental or directly from supplier feed rather than Supabase.
4. **Keep** single-purpose, low-row-count authenticated requests for checkout/admin operations; ensure Edge responses return only necessary fields.
5. **Monitor** metered uncached egress per billing cycle and top endpoint response size from Supabase usage dashboard. Current API logs show counts/status but do not expose response bytes, so it is **not possible to promise a hard egress guarantee** from source estimates alone.
6. **Disable or limit** non-essential discovery/feed refresh jobs only after verifying their business use and data flows. Do not delete pricing, stock, order or accounting records.

## Exact remaining dependencies
The public Store is independent **only in static enquiry mode**. Customer login, live payments, stock sync, quotations, invoicing, order tracking, creator accounts and most Admin/Operations systems still rely on Supabase and must be migrated or deliberately retained. Do not claim full independence until staging-based parity and cutover verification pass.

## Release / rollback
Static enquiry mode is deliberately reversible by changing `STATIC_ENQUIRY_MODE` after verified backend restoration; local QA retains the normal path. Keep the public snapshot while supplier feeds are not refreshing. Merge with a green static-outage browser regression and full Theme appearance QA. No DB schema, billing or data changes are part of Phase 0.
