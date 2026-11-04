# Yoco webhook retry resilience — 4 Nov 2026

## Confirmed risk

The previously deployed Yoco webhook recorded an event in `store_payment_events` before updating `store_payments`, `store_requests` and customer/admin notices. If a later write failed, the provider retried with the same event ID. The webhook's old duplicate check immediately returned HTTP 200, so the order could remain unpaid even after the provider payment had succeeded.

## Production code change

- Keep timestamp-limited HMAC verification and amount/currency/status matching exactly as before.
- A duplicate `store_payment_events` row is **not** early success: it means the event was seen, but the remaining payment finalization may need repair.
- Re-check the actual store payment and request state; mark missing successful payment/request fields and re-create missing notifications with the existing unique `dedupe_key` (no duplicate notice).
- Do not overwrite an existing `paid_at` on repeated callbacks.
- Do not regress a paid or fulfilled order back to `payment_received` if a duplicate callback arrives later.
- Ignore late `payment.failed` callbacks for payments already marked succeeded.
- Emit the fulfilment analytics event only if the request really transitions from unpaid to paid.
- Return HTTP 500 on recoverable database write failures so the payment provider can retry. Only return HTTP 200 once core statuses and notifications are consistent.
- The existing invoice payment handling is unchanged.

## QA, no money touched

`scripts/test-yoco-webhook-recovery.mjs` executes the actual TypeScript handler in Node with a signed event fixture and a fake in-memory database. Scenarios cover initial success, duplicate success, an initial database failure followed by duplicate-event recovery, notification failure recovery, order stage progression, failed-after-success event, invalid HMAC and mismatched amount. It does not connect to Yoco, Supabase production or customer accounts.

## Still required for full checkout certification

A supervised staging payment with Yoco TEST keys, real webhook delivery/retry timing, guest/customer email delivery, refund/cancellation reconciliation, invoice linkage and BobGo fulfilment. Live card charges must not be used for QA.

## Rollback

Re-deploy the previous Edge version only if required; it has the known duplicate-acknowledgement bug, so promptly investigate and reconcile any incomplete payment statuses. Never delete payment event records and never mark an order paid without verified provider evidence.
