# Step 9.3 — Failure, retry and release-blocker certification

Step 9.2 is approved:
- Full regression: **24/24**
- Device + role browser QA: **9/9**
- Manual phone visual approval: **approved**

Step 9.3 certifies the clean rebuild for a **non-commerce release candidate**.

The certification deliberately does not activate Store, Builder, checkout or payments. Instead it verifies that:

- launch settings fail closed;
- preview query parameters do not unlock customer commerce;
- Builder inspection mode is explicit, read-only and non-production only;
- Checkout remains closed when the Store is disabled;
- Checkout refuses to operate on a non-canonical origin even when a mocked catalogue flag is open;
- order tracking requires a full private token and refuses preview-host transaction access;
- direct payment remains governed by both server/order eligibility and `direct_payment_enabled`;
- ambiguous checkout submission failures do not encourage duplicate resubmission;
- retry/error copy keeps customer state safe;
- Admin launch controls cannot enable blocked Store/Builder states;
- PAIA and ecommerce blockers remain visible rather than silently represented as complete;
- stale Twitch live status is suppressed;
- no service-role or secret key is exposed in public Supabase config.

## Backend snapshot

The Step 9.3 package includes a read-only snapshot of current production backend readiness. It contains booleans/counts/configuration status only; it contains no customer records and no secret values.

Important verified state at preparation time:
- Store flag: OFF
- Builder flag: OFF
- Direct payment flag: OFF
- Real public products: 0
- Demo public products: 15
- Store requests: 0
- Pending store payments: 0
- Confirmed Store orders: 0
- Deployed Store Edge Functions still target the old GitHub Pages origin
- PAIA / Information Officer compliance remains incomplete
- Supabase leaked-password protection remains disabled
- Twitch refresh currently records a 403 token error

A Step 9.3 PASS means **safe to proceed to Step 10 with commerce disabled**. It does not certify ecommerce launch readiness.
