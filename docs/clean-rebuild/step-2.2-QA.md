# Step 2.2 — QA and operational boundaries

Base: `0ed405a7b406bfb923ebd54308c6831f233ef194`; branch `clean-rebuild`. Inspected and rechecked 23 September 2026.

## Audit and preservation

All 31 Step 2.1 files matched the remote Git blobs, user visual approval received; ten pending deletions carried forward. Current README, roadmap, hooks, assets and frontend/backend consumers inspected before implementation. Latest HEAD rechecked before packaging. All required directories exist.

Read-only live review: catalogue, Builder and direct payments disabled; 15 demo products and zero real active products. No schema, policy, function, data or launch setting was modified. No live checkout, payment or courier transaction was submitted. Frontend retains existing profile, address, cart, order, rate and payment APIs.

## Automated and visual checks

- Generated source equality, local links/imports/assets, unique IDs, labels/ARIA references, module syntax and clean/legacy isolation pass.
- Existing clean runtime and commerce contract suites pass.
- New transaction contract suite checks malformed/duplicate/oversized carts, demo/quantity eligibility, access tokens, status/checkout URL validation, strict payment gate, production-only ZAR courier rates, unknown totals, escaped order items and 4xx versus ambiguous 5xx/network errors.
- Local Chromium: 360, 390, 412, 768, 1366 and 1920px for both public states and both private/open layouts. No horizontal overflow or page-script errors. Desktop/mobile screenshots inspected.
- Intercepted SDK/backend fixtures only: checkout payload and success/cart clearing, definitive versus ambiguous submission failure, cart changes, sandbox rates, origin restrictions, missing/empty cart and no-JavaScript states. No live writes.
- Private order: global payment flag, paid state, unsafe Yoco/courier URLs, stale status error, no analytics bootstrap and referrer policy. A `payment=success` query does not mark paid.
- Active references to deleted runtimes searched; historical audit/changelog references retained as records. Admin CSS/core consumers retained.
- ZIP overlay and exact rollback byte comparison pass.

36 browser check groups:

- checkout public 360 passed
- checkout public 390 passed
- checkout public 412 passed
- checkout public 768 passed
- checkout public 1366 passed
- checkout public 1920 passed
- order-status public 360 passed
- order-status public 390 passed
- order-status public 412 passed
- order-status public 768 passed
- order-status public 1366 passed
- order-status public 1920 passed
- Checkout form 360 passed
- Checkout form 390 passed
- Checkout form 412 passed
- Checkout form 768 passed
- Checkout form 1366 passed
- Checkout form 1920 passed
- Checkout success, delivery rate, exact payload and cart clearance passed
- Checkout uncertain preserves cart and correct retry state passed
- Checkout reject preserves cart and correct retry state passed
- Sandbox rates withheld and changed cart blocks submit passed
- Unapproved transaction origin https://raw.githack.com blocked passed
- Unapproved transaction origin https://volttechcomputerco.co.za blocked passed
- Order detail 360 passed
- Order detail 390 passed
- Order detail 412 passed
- Order detail 768 passed
- Order detail 1366 passed
- Order detail 1920 passed
- Private order/payment gate true and query cannot mark paid passed
- Private order/payment gate false and query cannot mark paid passed
- Server-paid state prevents new payment passed
- checkout no JavaScript passed
- order-status no JavaScript passed
- Empty cart prevents checkout passed

## Deployment findings — release blockers, not fixed by this frontend ZIP

| Deployed function | Version | Observed limitation / required release work |
|---|---|---|
| `submit-store-checkout` | 6 | GitHub-only origin; no `is_demo` check or full stock validation; no submission idempotency; ignores client `shippingSelection`. Enforce eligibility server-side and add safe retry semantics before opening commerce. |
| `store-checkout-status` | 4 | GitHub-only origin; `can_pay` does not include global direct-payment flag. Frontend checks both, but server enforcement is still required. |
| `create-store-payment` | 5 | GitHub-only origin and hard-coded return URLs; no global direct-payment flag enforcement. Review pending-checkout reuse/amount changes and verify intended live/test key selection before release. |
| `bobgo-checkout-rates` | 5 | GitHub-only origin; sandbox and production possible. UI presents production ZAR estimates only. Delivery remains subject to order confirmation. |

Frontend controls are not a substitute for server authorisation/validation. Coordinate domain migration, server-side controls, webhook verification, RLS/account access and real end-to-end payment/retry tests before any launch. No launch switch should be changed merely for visual review.

## Limits

Local Chromium viewports are not physical Android certification. Upload and user review remain pending. No signed-in customer, live Yoco, live rate, payment webhook or fulfilment state was created to test this ZIP. UI interactions were tested using isolated fixtures, never published offers. Existing unconverted Builder, services, accounts, documents and legal routes are preserved, not recertified by this step.

GitHack previews display the locked checkout and private-link entry state. They cannot access real orders. Included public screenshots show the same states using locally intercepted current settings. Synthetic order/form screenshots are not shipped as production content.

## Authoritative API references reviewed

- https://supabase.com/docs/guides/functions/error-handling — function error context/status
- https://supabase.com/docs/reference/javascript/functions-invoke
- https://developer.yoco.com/api-reference/checkout-api/checkout/create-checkout — hosted checkout redirect and idempotency contract
- https://developer.yoco.com/api-reference/checkout-api/webhook-events/payment-notification — payment confirmation via server event

Deployed project code, rather than assumptions about generic APIs, determined retained payloads and origin constraints.
