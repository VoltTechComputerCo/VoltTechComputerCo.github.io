# Step 5.2 QA — Customer records

## Scope

Step 5.2 migrates four authenticated customer record routes to the generated clean VoltTech frontend:

- `activity.html`
- `builds.html`
- `quotes.html`
- `documents.html`

Printable/formal document pages such as `quote.html`, `invoice.html`, `receipt.html`, `build-document.html`, `order-document.html`, `service-record.html` and `proforma.html` are intentionally not redesigned here. They remain Step 7 document-layout work.

## Preserved customer contracts

- unauthenticated production visitors are returned through `account.html?returnTo=...`;
- authenticated notifications initialise only after a real customer session exists;
- customer data continues to rely on existing RLS rather than client-side user filters as a security boundary;
- Activity combines saved builds, quotations, invoices, orders and service jobs;
- saved builds remain deletable only from `saved` or `archived` UI states;
- quote expiry remains effective at 23:59:59 on `valid_until`;
- quote accept/decline continues through `customer_quote_action`;
- accepted/declined quotes continue to snapshot after the server action;
- Documents preserves quote/build/store provenance and email-copy actions;
- Builder prices remain estimates and new custom build requests remain paused.

## Quote-action server audit

`customer_quote_action` was re-read from the live production database before this migration. It validates:

- action is only `accepted` or `declined`;
- `quotes.user_id = auth.uid()`;
- quote state is only `sent` or `viewed`;
- the quotation has not expired;
- acceptance writes a quote-acceptance record and both actions write quote events.

The clean UI preserves this RPC rather than replacing the state transition with a browser update.

## Clean architecture

The four routes now share:

- `assets/css/pages/customer-records.css`
- `assets/js/pages/customer-records.js`
- `assets/js/services/customer-records.js`
- `assets/js/services/document-email.js`
- the Step 5.1 `account-session.js` foundation

Direct Supabase access is kept out of the page controller. The four pages use the local design-token/font stack and pinned SDK loader from the Step 5.1 account foundation.

## Inspection safety

`?inspect=1` is accepted only on non-production origins through `isAccountInspection()`. It renders clearly-labelled placeholder record layouts, creates no Supabase client, fetches no customer records, initialises no notifications and disables record actions.

## Step 5.1 package hygiene correction

Remote verification confirmed every file from the Step 5.1 ZIP matched the uploaded bytes. The ZIP itself accidentally contained generated Python bytecode, and a placeholder was subsequently created only to reproduce that cache directory. Step 5.2 deletes both:

- `scripts/__pycache__/check-clean-frontend.cpython-313.pyc`
- `scripts/__pycache__/Placeholder.txt`

The corrected Step 5.1 QA/folder/manifest records are included. No account runtime behavior changes because of this cleanup.

## Automated checks

- source generator `--check`: PASS for all four 5.2 pages;
- one H1/main/header/footer per generated page: PASS;
- duplicate-ID, explicit label target, ARIA target and inline-style/handler scan: PASS;
- module syntax checks: PASS;
- `node scripts/test-clean-customer-records.mjs`: PASS after manifest creation.

## Deferred to Step 5.3

- migrate Privacy & Data Centre and notification presentation to the clean customer architecture;
- classify authenticated-callable SECURITY DEFINER functions individually;
- review leaked-password protection and appropriate Supabase Auth settings;
- final customer/admin operation handoffs and remaining legacy portal assets;
- prove and remove old root `activity.js`, `builds.js`, `quotes.js`, `documents.js`, portal styles and loaders only after all remaining consumers are migrated.
