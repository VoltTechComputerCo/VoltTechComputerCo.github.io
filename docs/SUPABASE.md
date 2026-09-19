# Supabase Backend

## Project

**Project name:** VoltTech Production  
**Purpose:** customer/auth, business records, quotes/documents, service jobs, creator data, Store/commerce data and related application state.

The browser frontend uses a Supabase publishable key. Publishable keys are designed for frontend use with correct RLS. Secret/service-role keys must never be exposed in this repository.

## Current major table groups

### Customer identity
- `profiles`
- `customer_addresses`
- `account_deletion_requests`

### Service
- `service_jobs`
- `service_job_updates`

### Quotes and commercial documents
- `quotes`
- `quote_items`
- `quote_events`
- `quote_acceptances`
- `proformas`
- `invoices`
- `invoice_items`
- `customer_documents`

### Payments
- `payments`
- `payment_events`

### Customer experience
- `saved_builds`
- `notifications`
- `email_delivery_log`

### Administration
- `admin_users`

### Store / commerce
- `store_products`
- `store_categories`
- `store_supplier_offers`
- `store_product_relations`
- `store_product_documents`
- `store_wishlist_items`
- `store_requests`
- `store_request_items`
- `store_payments`
- `store_payment_events`
- `store_shipping_quotes`
- `store_automation_events`
- `store_settings`
- `store_private_settings`
- `orders`
- `order_items`
- `order_events`

## Launch controls

Current public commerce launch settings include:
- `store_settings.catalogue_enabled`
- `store_settings.builder_enabled`

The public Store and PC Builder must fail closed unless the relevant flag is explicitly enabled.

Frontend visibility must not be treated as the security boundary; backend/order submission rules still need to enforce valid commerce state.

## Current commerce posture

As of the current VoltTech 2.0 branch:
- Store and Builder infrastructure exists
- Store and Builder public launch are paused/gated
- supplier offers are not yet a dependable live sourcing layer
- product/category/request/order/payment/shipping structures exist
- direct payment must not be assumed production-ready merely because schema exists
- customer-facing stock/pricing must remain confirmation-first until sourcing is reliable

## Creator backend

Creator/streamer refresh assets include:
- `Supabase/functions/refresh-sa-streamers/`
- streamer-directory backend migrations
- scheduled-refresh migration/configuration

This is the current backend refresh path represented in the repository.

## RLS

RLS must remain enabled for exposed customer/business tables.

Do not fix an access issue by disabling RLS.

## Security advisor baseline

The following findings were recorded on 17 September 2026 and should be treated as a baseline until revalidated:

1. `public.admin_users` had RLS enabled but no explicit RLS policy.
2. Multiple `SECURITY DEFINER` functions were executable by the generic `authenticated` role.
3. Leaked-password protection was disabled.

These findings do not automatically prove an exploit, but they must be rechecked before high-trust commerce is enabled.

See `SECURITY.md`.

## Performance advisor baseline

The baseline performance review reported:
- multiple foreign keys without covering indexes
- RLS policies using per-row auth-function evaluation patterns
- multiple permissive SELECT policies on some tables
- unused indexes

These are optimisation items, not reasons to rewrite the backend.

## Change policy

Before modifying schema, functions or RLS:
1. document the reason
2. make a migration/SQL script
3. verify the result
4. rerun Supabase security advisors
5. rerun performance advisors
6. test authenticated customer access
7. test admin access
8. test that one customer cannot access another customer's records
9. test Store/Builder launch-state behaviour if commerce settings were touched

## Credentials

Never put:
- database password
- service role / secret key
- payment secret
- shipping API secret
- webhook secret

into public frontend files or repository documentation.
