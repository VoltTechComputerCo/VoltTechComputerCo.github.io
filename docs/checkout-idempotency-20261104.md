# Checkout idempotency and failure recovery — 4 Nov 2026

**Root cause:** VoltTech's checkout saves a request, request items, an Operations job and notifications in separate calls. Failure after the first insert could return HTTP 500 while an order already exists, and a retry could create a duplicate.

**Fix:** The browser generates and reuses a random 256-bit checkout token across reloads, stored only in sessionStorage for up to 48 hours. The Edge Function uses SHA-256 of that token in the pre-existing unique `store_requests.public_token_hash` index. A hashed, normalized customer/cart/delivery fingerprint prevents changing the order using the same token. Exact replays return the original reference and repair a failed Operations/notification step. Older browsers without a token still work. Known insufficient or zero stock is rejected before creating an order. No customer PII, supplier cost or raw token is stored in metadata.

**Tests:** `scripts/test-checkout-idempotency.mjs` uses the actual TypeScript handler with in-memory fake Supabase. Cases: guest submission/replay, changed cart, out-of-stock, insufficient quantity, a failed Operations job followed by recovery, invalid token, backwards-compatible signed-in checkout and frontend session token persistence. All run without a real customer account, Supabase write or payment charge.

**Not yet certified:** Browser-level guest/signed-in order transactions against staging; interrupted network/read-only database; provider payment webhook reconciliation; refunds and courier fulfilment. These remain in GitHub issue #38. A separate Yoco webhook review identified an event-duplicate acknowledgement path that needs hardening.

**Safe rollback:** Redeploy the prior `submit-store-checkout` version and revert the frontend code. Existing customer records and payments must never be wiped as part of rollback. Reconcile uncertain request references with the Operations Hub before allowing a new request.
