# Step 5.1 QA — Account foundation

## Scope

Step 5.1 migrates the customer account landing page and its core account-setting interactions to the clean generated frontend. Activity, Saved Builds, Quotes, Documents, Privacy Centre and admin operations remain on the existing runtime until later Step 5 substeps.

## Audit findings

The legacy account page was assembled from several generations of runtime and presentation files: `account-v3.css`, `account-phase4.css`, `account.js`, `account-dashboard.js`, `account-v4-nav.js`, `account-filters.js`, `commerce-ui.css`, `v4-nav.css`, `portal-shell.css`, `portal-shell.js`, `notifications.js`, an unversioned Supabase CDN script and other injected layers.

The clean page now owns its shell and account layout through source files under `src/pages/` and clean assets under `assets/`.

## Preserved account contracts

- email/password sign-in;
- email/password account creation;
- Google OAuth;
- password recovery and recovered-password update;
- same-origin `returnTo` continuation;
- profile read/write under existing RLS;
- address read/write/delete under existing RLS;
- account overview counts and quote/invoice attention state;
- login-email change;
- password reset request;
- sign out;
- Privacy & Data route;
- authenticated notification bootstrap;
- admin shortcut visibility via `is_volttech_admin()`;
- welcome tour via `account.html?tour=1`.

## Inspection safety

`?inspect=1` is accepted only when `isProduction()` is false. It reveals the responsive account UI with placeholders, disables the data-entry forms and does not create a Supabase client, load a customer session, fetch account data or initialise notifications.

## Default-address bug fixed

`customer_addresses` already enforces one default shipping address per user with the partial unique index `customer_addresses_one_default_shipping_per_user`.

The legacy browser flow tried to save a new default address before clearing the old default, which can conflict with that index. Migration `20260923210205_customer_address_atomic_v1` adds `customer_save_address_v1`, a SECURITY INVOKER function that performs the default switch and save in one database transaction while still operating under the authenticated user's RLS permissions.

Post-migration verification confirmed the existing address row count and existing default count did not change.

## Backend access audit

Core customer tables reviewed in this step have RLS enabled. Customer-facing records such as quotes, invoices, orders and service jobs retain owner-read policies. Profiles and addresses retain owner-scoped writes.

The deletion-request update trigger still protects server-managed fields and limits a customer transition to cancelling a pending request.

## Deferred security work

Current Supabase advisor warnings include leaked-password protection disabled, authenticated-callable SECURITY DEFINER functions, RLS init-plan performance warnings and unindexed foreign keys. Step 5.1 does not bulk-change these because they span commerce, documents, admin and customer workflows. Step 5.3 will classify intentional customer/admin RPC exposure and apply narrow hardening where appropriate.

## Clean frontend checks

The generated account page:

- has the clean-shell marker;
- has one H1, one main, one clean header and one clean footer;
- contains no inline styles or event handlers;
- uses explicit label/input associations;
- references the local font/design-token stack;
- references only the preserved `supabase-config.js` classic runtime outside `assets/`;
- no longer references Google Fonts, `account-v3.css`, `account-phase4.css`, `account-dashboard.js`, `account-v4-nav.js`, `account-filters.js`, `admin-shortcut.js` or `portal-shell.js`;
- keeps customer integrations outside the pure page shell through service modules.

## Automated regression result

`node scripts/test-clean-account.mjs`

PASS: clean account shell, preview isolation, auth boundary and atomic address contract.


## Package hygiene correction

Remote verification confirmed all intended Step 5.1 runtime/source files matched the delivered bytes. The initial ZIP also contained generated `scripts/__pycache__/check-clean-frontend.cpython-313.pyc`, and a `Placeholder.txt` was added only to create that cache directory. Both are build/check artifacts rather than source and are removed by the Step 5.1 cleanup. The corrected manifest and folder map exclude `scripts/__pycache__/`.
