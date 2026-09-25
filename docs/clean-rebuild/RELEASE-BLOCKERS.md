# VoltTech release blockers — Step 9.3

This file separates **website release safety** from **commerce launch readiness**.

## Current certified release mode

The clean rebuild may proceed toward a release candidate only in **non-commerce mode**:

- Store catalogue remains disabled.
- PC Builder remains disabled for customers.
- Direct payments remain disabled.
- No real public supplier products are loaded.
- No current store requests, pending store payments or confirmed store orders exist.

A green Step 9.3 result means the disabled state fails closed and the known blockers are documented. It does **not** mean ecommerce is ready to launch.

## Commerce launch blockers

1. **Deployed Edge Function origin mismatch**
   - The current website canonical origin is `https://volttechcomputerco.co.za`.
   - Deployed store checkout/status/payment/shipping functions still hard-code `https://volttechcomputerco.github.io`.
   - Store payment return URLs also target the old GitHub Pages origin.
   - These functions must be aligned and re-certified before Store launch.

2. **No real sellable catalogue**
   - 0 active/public/non-demo products.
   - 15 active/public demo products.
   - Demo inventory must never become sellable inventory.

3. **Shipping is not production-ready**
   - Bob Go API token is not present in the Vault readiness path.
   - Collection address/contact are not present in the private shipping settings.
   - Production shipping rates must remain unavailable until these are configured and verified.

4. **Payment readiness contract is not aligned**
   - Admin launch readiness checks Yoco Vault secret names.
   - Deployed store payment/webhook functions read Edge Function environment variables.
   - The readiness gate and runtime must use one authoritative configuration contract before direct payments can be enabled.
   - Connected tooling does not expose Edge Function secret values, so their presence is intentionally not claimed here.

5. **Supabase Auth hardening**
   - Supabase security advisor reports leaked-password protection disabled.
   - Enable and verify before the production compliance/security sign-off.

6. **SECURITY DEFINER privilege hardening review**
   - Supabase advisor flags 23 `SECURITY DEFINER` functions executable by `authenticated`.
   - Read-only inspection found an `is_volttech_admin()` or `auth.uid()` guard signal in all 23, but a full function-by-function privilege review is still required before commerce launch.
   - This is a hardening task, not permission to weaken existing guards.

## Compliance blocker

The current PAIA page explicitly states that it is **not the completed private-body PAIA manual**. The applicable PAIA manual and Information Officer registration/details remain outstanding before the production compliance stack is signed off.

## Creator Hub operational blocker

The Twitch refresh configuration exists, but the most recent recorded error is:

`Twitch token request failed: 403`

The public Creator Hub already suppresses stale live-state data. Repair Twitch refresh credentials before treating live-status automation as healthy.

## Release Candidate boundary

Step 10 may proceed only with these customer-facing features still launch-gated:

- Store
- PC Builder
- Checkout/order submission
- Direct Yoco payments

Normal VoltTech service pages, Signal Scan, STATIC, account/customer-record surfaces and other already-certified non-commerce functionality are evaluated separately by the regression suites.
