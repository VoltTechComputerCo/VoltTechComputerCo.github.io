# Step 2.3 — Commerce QA and cleanup

Audit date: 23 September 2026  
Authoritative branch: `clean-rebuild`  
Base / rollback commit: `fd0a981dee1c3ddb2e4f1342dbf61858dc49cafe`

## Upload closure verified

Step 2.2 was rechecked against the real GitHub branch before Step 2.3 work began.

- Current Step 2.2 cleanup HEAD: `fd0a981dee1c3ddb2e4f1342dbf61858dc49cafe`.
- All 29 files listed in the Step 2.2 SHA-256 manifest were reverified byte-for-byte after upload.
- The Step 2.2 upload delta from `0ed405a7b406bfb923ebd54308c6831f233ef194` contained exactly the intended 30 uploaded files and no unrelated paths.
- The subsequent cleanup delta from `121f08a8efd3397dbb984016f09245f845194093` to `fd0a981dee1c3ddb2e4f1342dbf61858dc49cafe` contained exactly the requested 16 removals.
- All 16 legacy files are now absent. No cleanup deletion remains outstanding.

## Commerce journey reviewed

The current clean Store → Product → Cart → Checkout → private Order Status journey was re-read against the current branch rather than assumed from the previous package.

Frontend contracts confirmed:

- Catalogue access remains fail-closed and demo records remain excluded from public shopping.
- Admin preview still requires production origin, a real authenticated user and the existing `is_volttech_admin` RPC; `?preview=1` alone does not open the Store.
- Store category, brand, text-search and sort state remain client-side display controls over the already-gated public product set.
- Product detail escapes catalogue data, labels fallback/category imagery and disables purchase for demo, preview or unavailable records.
- Cart storage remains `vt_store_quote_cart_v1`, quantities are capped at 25, unavailable/missing rows remain removable, and Store/cart events remain compatible with the shared header cart count.
- Checkout validates the cart again, re-reads launch/product data before dispatch, keeps changed carts, and only clears an unchanged cart after an acknowledged successful submission.
- Ambiguous 5xx/network submission outcomes keep the cart and block casual resubmission because the deployed submit function has no idempotency key.
- Private order access still requires the request reference plus a 64-hex token.
- Order return query parameters never mark an order paid.
- Payment is offered only when both server eligibility and the strict global `direct_payment_enabled === true` frontend flag agree.
- Only HTTPS `c.yoco.com` checkout redirects are accepted by the frontend.
- Tracking links require HTTPS and cannot contain embedded credentials.

## Step 2.3 runtime fix

One customer-state inconsistency was found in `assets/js/components/order-view.js`.

A fully or partially refunded order correctly received a refund headline, but the timeline rendered **Payment received** as `Awaiting update` because the completion check recognised only `payment_status === 'paid'`.

This delivery treats `paid`, `refunded` and `partially_refunded` as evidence that the payment milestone was recorded. It does not alter payment eligibility, totals, refund handling or backend state.

`test-clean-transactions.mjs` now asserts that both refund states keep the Payment received milestone recorded.

## Verification performed for this delivery

- Current GitHub HEAD and exact 16-file cleanup delta verified.
- Active Store/Product/Checkout/Order Status source and current commerce adapters re-read.
- Modified transaction contract suite executed locally against the changed order-view logic: PASS.
- Existing cart validation, demo/stock exclusion, order-token validation, Yoco redirect validation, production-only delivery-rate filtering, strict payment gate and ambiguous-error classification assertions remain passing in the suite.
- New full-refund and partial-refund timeline assertions: PASS.
- No visual CSS or HTML structure changed; the already-approved public checkout/order-tracking entry layouts are unchanged.
- No live order, payment or courier transaction was submitted.

The environment available for this continuation could not clone GitHub directly into the local test container, so the whole repository test runner was not falsely claimed as re-run. Step 2.2's shipped browser/source evidence remains applicable because its 29 manifest-hashed files were reverified and the only Step 2.3 runtime change is the isolated order timeline condition covered above.

## Live Supabase state rechecked read-only

Project: `VoltTech Production` (`ACTIVE_HEALTHY`) at audit time.

Store state at audit time:

- `catalogue_enabled = false`
- `builder_enabled = false`
- `direct_payment_enabled = false`
- currency `ZAR`
- 15 total catalogue products
- 15 demo products
- 0 real public products
- 0 Store requests
- 0 Store payments

No setting, row, function, schema, RLS policy, secret or backend configuration was changed during this audit.

## Deployed transaction boundary revalidated

The currently deployed functions remain the versions recorded by Step 2.2:

- `submit-store-checkout` v6
- `store-checkout-status` v4
- `create-store-payment` v5
- `bobgo-checkout-rates` v5
- `bobgo-book-shipment` v4
- shared `yoco-webhook` v5

The Yoco webhook verifies the webhook signature and amount/currency before recording Store payment success. Bob Go shipment booking requires an authenticated VoltTech admin and a paid Store request. These are useful controls, but they do not close the release blockers below.

## Commerce release blockers — documented, not silently changed

These remain **must-resolve before opening real Store purchasing**:

1. **Production domain alignment.** The public site now recognises the apex/www `.co.za` origins, but the deployed Store submit/status/payment/rate functions and Yoco Store return URLs are still hard-coded to `https://volttechcomputerco.github.io`. The `.co.za` production site therefore cannot perform Store transactions until frontend and backend origins are changed together.
2. **Server product eligibility.** `submit-store-checkout` still does not reject `is_demo` records or enforce the full frontend stock/quantity rules server-side. Browser gating is not a security boundary.
3. **Checkout idempotency.** There is no client-supplied/server-enforced idempotency key for Store request creation, so an ambiguous response followed by a later retry can create a duplicate request.
4. **Server payment switch enforcement.** `create-store-payment` and the status function do not enforce `store_settings.direct_payment_enabled` themselves. The current frontend does, but the backend must remain authoritative.
5. **Pending Yoco reuse.** `create-store-payment` can reuse an existing pending Yoco checkout without proving that its amount still equals the Store request's current confirmed total. This must be hardened before real payment activation.
6. **Explicit Yoco environment selection.** The function currently prefers a live Yoco secret whenever present and falls back to test. Release should use an explicit environment policy rather than secret-presence ordering.
7. **Delivery selection persistence/enforcement.** The browser sends `shippingSelection`, but `submit-store-checkout` currently ignores it. The displayed estimate must not be treated as the contracted courier/service until the backend stores and validates the selected service or the product intentionally remains quote-first.
8. **Courier-rate product validation.** `bobgo-checkout-rates` retrieves product status/visibility/sale mode but does not currently enforce those fields before quoting if the endpoint is called directly.
9. **Courier booking persistence errors.** `bobgo-book-shipment` does not currently fail the request if its final Store-request update or automation-event insert fails after Bob Go accepts the shipment. Release hardening should verify those writes and provide reconciliation for partial success.
10. **Live end-to-end certification.** Intended-origin authenticated checkout, real Yoco/test-mode payment, signed webhook transition, Bob Go rate/booking and fulfilment retry/reconciliation tests remain required before enabling commerce.

## Broader Supabase advisor backlog observed

A read-only advisor pass was also taken so commerce work does not hide platform debt.

Security advisors currently report:

- leaked-password protection disabled;
- `public.admin_users` and the private streamer config table have RLS enabled with no policies;
- 21 `SECURITY DEFINER` functions are executable by the `authenticated` role and require a dedicated authorisation review before deciding which grants are intentional.

These advisor warnings are **not automatically equivalent to confirmed exploitable vulnerabilities**; each privileged function must be reviewed for its internal admin/ownership checks before permissions are changed. They belong in the later account/admin/security pass rather than being mass-revoked during commerce QA.

Performance advisors also report existing unindexed foreign keys, per-row auth-function RLS evaluation and multiple permissive policies. These are scale/maintenance items and were not changed during this frontend commerce closeout.

## Step 2 completion boundary

After this package is uploaded and hash-verified, the **clean frontend commerce rebuild is complete for the current closed-store state**.

That does **not** mean Store launch readiness. Store launch remains separately blocked by real supplier/product data, company/operating readiness and the backend/payment/courier controls above.

Next rebuild scope: **Step 3 — PC Builder**.
