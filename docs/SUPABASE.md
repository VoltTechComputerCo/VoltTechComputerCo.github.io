# Supabase Backend

## Project

**Project name:** VoltTech Production  
**Purpose:** customer/auth, business records, quotes/documents, service jobs, Store/commerce data and related application state.

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

## Current commerce posture

At the 17 September 2026 baseline:
- the Store catalogue exists in Supabase
- product/category structures exist
- request/order/payment/shipping structures exist
- direct payment is not intended to be assumed production-ready merely because schema exists
- supplier offers are not yet a dependable live sourcing layer
- customer-facing stock/pricing must remain confirmation-first until sourcing is reliable

## RLS

RLS is enabled on the public tables reviewed at baseline.

RLS must remain enabled for exposed customer/business tables.

Do not "fix" an access issue by disabling RLS.

## Security advisor findings at baseline

Supabase's security advisor reported:

1. `public.admin_users` has RLS enabled but no explicit RLS policy.
2. Multiple `SECURITY DEFINER` functions are executable by the generic `authenticated` role.
3. Leaked-password protection is disabled.

The `SECURITY DEFINER` warning affects functions including admin quote, invoice, customer and Store operations. This does **not automatically prove an exploit**, because functions may perform their own admin checks, but the permission model must be reviewed before relying on these functions for production commerce.

See `SECURITY.md`.

## Performance advisor findings at baseline

The performance advisor reported:
- multiple foreign keys without covering indexes
- a group of RLS policies using per-row auth-function evaluation patterns
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

## Credentials

Never put:
- database password
- service role / secret key
- payment secret
- shipping API secret
- webhook secret

into public frontend files or repository documentation.
