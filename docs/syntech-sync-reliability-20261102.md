# Syntech automatic supplier sync — reliability patch (2 November 2026)

## Why this exists
Supabase Edge Function `sync-supplier-catalogue` version 18 intermittently failed with PostgREST SQLSTATE `57014` (`canceling statement due to statement timeout`).

We verified this in actual production PostgreSQL logs:
- On 2026-11-02 12:14 UTC the failing statement was a large `store_products` upsert.
- On 2026-11-02 13:14 UTC the failing statement was `vt_update_preferred_offer_products` RPC.
- The underlying PostgREST `authenticator` role has an 8-second statement timeout.
- The importer previously upserted thousands of full product records every hour, even when stock and costs had not changed, then repriced all affected records in groups of 500.
- The site had recently been restricted to gaming-PC components and selected peripherals. Four product triggers preserve that curation on writes, adding unnecessary work to unchanged rows.

## Production implementation (deployed version 19)
The checked-in source under `supabase/functions/sync-supplier-catalogue/` mirrors the deployed function:
- Fetches Syntech's own account-based HTTPS JSON feed exactly as before, retaining the full and update modes, authentication and feed validation.
- On Syntech updates, looks up the supplier's existing `product_id, supplier_sku, cost_price, stock_qty, stock_status` via a compact DB read.
- Builds the full normalised feed, then upserts large `store_products` records only when supplier cost/stock/status or key catalogue fields have changed; all supplier offers still get current `last_checked` timestamps.
- Reduces product upsert batches from 100 to 25 and preferred-offer repricing batches from 500 to 50, below the eight-second API query timeout threshold.
- Runs the full featured-products merchandising refresh for Syntech's daily `full` import rather than every hourly `update`. Other suppliers keep existing behavior.
- Does not alter Supabase role-level timeouts, payments, user accounts, RLS, prices/markups, supplier secrets, checkout or preserved catalogue-approval metadata.
- Reports `updated_products`, `rechecked_offers`, and `repriced_products` for observability.

## Automation schedule
Existing cron jobs remain unchanged:
- `syntech-stock-hourly`: `13 * * * *` UTC, invokes `vt_run_syntech_sync('update')`.
- `syntech-catalogue-daily`: `43 1 * * *` UTC, invokes `vt_run_syntech_sync('full')`.

The cron job's own `succeeded` result only confirms it dispatched the HTTP request. Actual success must be assessed using the `store_suppliers` row (`feed_status`, `feed_last_synced_at`, `metadata.last_error`) and Edge Function response codes.

## Operational verification
- Production Edge Function status: must show `ACTIVE`, deployed version 19 or newer.
- After next safe sync invocation (20-minute debounce from previous attempt), check actual `feed_last_synced_at` moves forward and `last_error` clears.
- Verify `store_supplier_offers.last_checked` for Syntech GPU rows moves forward, and `store_products` GPU stock matches preferred offers.
- Check that no product previously excluded by `catalogue_focus2` is publicly reintroduced.
- If HTTP 500 or 57014 recurs, inspect context in `postgres_logs` to identify whether product upsert or repricing requires further reduction. Do not increase global query timeout as a first resort.
- If a later scheduled import is incomplete, preserve previous successful data; never invent supplier availability.

**Deploy discipline:** The Supabase MCP deployment tool publishes directly, while the repository is version-controlled evidence of version 19. Future code changes must be deployed and verified explicitly; committing source alone does not deploy it.
