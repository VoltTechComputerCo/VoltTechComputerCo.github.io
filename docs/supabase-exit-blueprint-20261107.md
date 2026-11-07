# VoltTech — Supabase outage response and zero-subscription migration plan

**Audit:** 7 November 2026. **Production:** `volttechcomputerco.co.za`. **Repository:** `VoltTechComputerCo/VoltTechComputerCo.github.io`. **Supabase project:** `qdqhfnvwqvgesfdmocir`.

## 1. What is actually failing (verified)
- Supabase project reports `ACTIVE_HEALTHY` and dashboard SQL works. This **does not** imply the public REST/Auth/Function API works.
- Supabase sent an organization service-restriction notification on 3 Nov 2026 reporting **14.74 GB egress**. This is not live usage telemetry; the current cycle/reset date still requires billing dashboard verification.
- Latest GitHub public catalogue refresh failed on 7 Nov 2026 with **HTTP 402** for `/rest/v1/store_settings`. Other failures show 402 for `store_products` and `store_categories`. The Free-plan Fair Use restriction is the immediate confirmed public API blocker.
- Pages deployment/Theme QA could succeed while the API is blocked. Public domain HTTP/DNS availability **was not** independently verified from the current ChatGPT environment.
- Supplier sync records are old: Syntech 3 Nov 22:13 UTC, Tarsus 3 Nov 21:43 UTC. Although pg_cron dispatch jobs keep returning `succeeded`, no supplier offer check was recorded within 24 hours on 7 Nov. A dispatched HTTP request does not prove an importer succeeded.
- Postgres database is only **141 MB**. The problem is transfer/egress, not running out of database storage.
- Public catalogue snapshot already in this repository: **1,993 public products**, compressed `assets/data/catalogue.json.gz` approximately **291 KB**, generated **3 Nov 17:56 UTC**.
- On 2 Nov, API gateway logs recorded about **1,462 requests to `store_products`**, **909 to `store_supplier_offers`**, **1,436 to the email-outbox claim RPC**, **1,436 to Resend key lookup**, and **1,721 to mailer cron token lookup**. These are request counts, *not* response-body bytes. Attribution of the 14.74 GB to individual services cannot be proven from counts alone.

## 2. Immediate read-only recovery — deployed separately via GitHub PR
`assets/js/services/site-config.js`: `publicCatalogueOnly=true` is an explicit standalone public Store switch.

- Public Store and product detail pages load the public compressed snapshot from the same static hosting/CDN instead of requiring a Supabase store-settings request.
- All reference prices, reported supplier stock, checkout and payment controls are **not shown as current**; customers enquire for confirmed stock/pricing/delivery on business WhatsApp, +27 61 843 5775.
- Standalone pages have **zero public Supabase calls**, including no repeated recovery polling. Existing customer login/admin and real transactions are **not migrated** by this switch.
- Stale/removed product IDs remain blocked by the existing static catalogue exclusion list.
- Website HTML, mobile WhatsApp CTA and JS cache keys are updated.
- Browser QA opens a real 1,993-item compressed snapshot, Store + product detail at 390px and 1440px, under blocked external network. Production-origin simulation with cached login verifies public browsing does not invoke Supabase.
- If the snapshot fails, retain WhatsApp ordering/support; do not claim a current price or available stock.
- This emergency mode is an intentionally **limited shop**, not a replacement for a full checkout or logged-in account service.

## 3. Permanent independent architecture (recommended)

| Capability | Planned replacement | Migration requirements |
|---|---|---|
| Public pages, blog, Search, Store, product images | GitHub Pages or Cloudflare Pages static assets | Public static build, local full-text fuzzy search, CDN caching, sitemap; no dynamic Supabase requests |
| Syntech/Tarsus supplier price and stock | Scheduled GitHub Actions or similar build runner, publishing compressed static snapshots | Obtain authorised read-only supplier feed credentials as GitHub Actions secrets, vendor SKU mapping, curation, markups, freshness checks; never commit secrets |
| Esquire/LunaTech data | Same supplier ingestion or manual offline CSV/XML import | Confirm vendor feed permission/format; preserve reviewed selection |
| PC Builder | Static compatibility data + static catalogue | Port compatibility logic, pricing into current builds only after supplier refresh; save locally when signed out |
| Private customer login, saved builds, quotes, orders, invoices | Cloudflare Workers + D1 on Free plan (proposed, *not deployed*) | Redesign PostgreSQL triggers/RLS/auth for SQLite, server-side authorization/permissions, transactional idempotency, audit trails and proper encryption |
| Payment portal and Yoco callbacks | Server-side signed Worker endpoint | Verify HMAC, amount, order state, duplicate webhooks, refunds and release gates; never expose Yoco secrets in static JS |
| Staff Operations Hub and supplier costs | Authenticated Worker + D1 private tables | Admin-only roles, dynamic margin and profit restrictions, invoice editing, payments/dispatch history |
| Emails and notifications | Event-driven email service with free allowance | Verify transactional sender quotas; queue/ratelimit and monitor failures |
| Courier booking | Signed Worker API server-to-server | Rebuild BobGo calls and server-side delivery quoting, with fallback manual cost confirmation |
| Scheduled monitoring and backups | Versioned code + **encrypted private** data backups and uptime checks | Never store customer/order/financial data in the public GitHub repository |

**Cloudflare Free capacity (current published limits; verify on deployment):**
- Cloudflare Pages static assets: no per-request fee/limit under the stated pricing model; Free Pages builds 500/month, max 20,000 files.
- Workers Free: 100,000 Worker/function requests per day, with a 10 ms CPU budget/request and other resource limits.
- D1 Free: 5 GB storage total, 5 million rows read per day, 100,000 rows written per day. At the Free limit, D1 **returns quota errors** rather than providing unlimited service.
- Cloudflare R2 has a free allowance but requires opting into R2 billing; avoid it for a strict no-billing requirement until approved.
- Customer emails, payment provider transaction charges, existing domain renewal and optional services are *not* guaranteed zero-cost. No provider offers **unlimited** full commerce infrastructure without limits.

Official references: https://developers.cloudflare.com/pages/functions/pricing/ ; https://developers.cloudflare.com/workers/platform/limits/ ; https://developers.cloudflare.com/d1/platform/pricing/ ; https://developers.cloudflare.com/d1/reference/faq/ .

## 4. Exact Supabase egress changes if retaining Supabase (best effort, not a guarantee)

1. **Stop all public full-table reads** from Store, homepage, product pages and Builder. Serve cached static catalogue/compatibility data. Current emergency Store already does this.
2. Move supplier feed ingestion and publication **outside Supabase**, so the hourly 2,000+ SKU imports, supplier offer upserts and catalog repricing no longer consume Supabase API traffic. Keep vendor credentials out of the public repo.
3. Avoid `select('*')` for product detail/cart/operations where narrower fields are sufficient; do not fetch thousands of rows to implement client-side search.
4. Replace 1-minute email outbox polling with event-driven dispatch or a less-frequent queue worker that does not query private credentials/queue on every idle minute. **Do not sacrifice delivery confirmations** without an operational replacement.
5. Reduce unnecessary Creator Hub refresh calls; treat its cached public JSON feed as the source for public visitors, not PostgREST.
6. Keep only genuine authenticated/account/order/payment operations against the Supabase API during an interim stage; enforce rate limits, small responses and RLS.
7. Measure **actual billed egress by service** over a full cycle in Supabase Usage and API Gateway logs before confidently asserting Free-plan fit. The 5 GB uncached + 5 GB cached quotas still apply. Historical egress cannot be erased retroactively.

**No one can truthfully guarantee a complete always-on e-commerce backend will stay inside free Supabase quotas without measuring the supplier import pattern, order volume, bots, emails and traffic.** Cloudflare also has hard free limits.

## 5. Safe cutover gates

A. Keep live orders, customers, quotes, invoice numbers, supplier costs and payment history in Supabase until copied, independently backed up, and reconciled.

B. Build a private encrypted one-time export of customer/account and financial data. **Do not put it in public GitHub.** Password migration should use a secure account re-enrolment process or an independently audited identity bridge. Avoid copying password secrets or raw auth tokens.

C. Run a parallel backend with test data first. Test customer ownership isolation, admin access, product curation, payments, Yoco signature replay, courier booking and invoice workflow end-to-end with **no real charge**.

D. Validate counts and checksums for customers, orders, invoices, approved quotes, saved builds, suppliers and financial history; make new data writes atomic and idempotent.

E. Switch payment/webhook URLs and account endpoints only after tests pass; retain a documented rollback. Remove Supabase runtime and credentials from public assets only after the successful cutover.

F. Add budget/usage warning thresholds for **any** free-tier provider; support quote-by-WhatsApp when dynamic requests are not available.

## 6. Immediate blocker

A connected browser session in ChatGPT **Work mode**, or a supported Cloudflare management integration, is required to inspect the real live domain and Cloudflare DNS/project routing, and later to configure Cloudflare Workers/D1 on the owner's behalf. The current browser integration cannot access user tabs from this Chat session. GitHub and Supabase connectors can still handle repository code and read-only project diagnosis.

**Never pause/delete Supabase or delete customer data as part of this emergency fix.**
