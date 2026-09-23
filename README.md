# Step 5.1 — Account foundation

Objective: move `account.html` onto the clean VoltTech frontend while preserving real authentication, customer-owned profile/address data, account overview actions and security controls.

Parent Step: Step 5 — Customer accounts and operations.  
Previous: Step 4 fully closed and verified at `a8a76ddcc1b3c93fc9407e285e04c5e331f36cd5`.  
Current: Step 5.1 — packaged; repository upload verification pending.  
Next: Step 5.2 — Activity, Saved Builds, Quotes and Documents.

Branch: `clean-rebuild`. Exact repository rollback commit: `a8a76ddcc1b3c93fc9407e285e04c5e331f36cd5`.

## Upload instructions

1. Extract **Step-5.1.zip** and stay on **clean-rebuild**.
2. Upload everything inside **Step 5.1/** to matching repository paths, replacing existing files when prompted.
3. There are **no deletions in Step 5.1**.
4. There are **no folder placeholders required**; every target directory already exists.
5. Do **not** run the SQL file manually. Supabase migration `20260923210205_customer_address_atomic_v1` is already applied and verified.
6. Inspect the account page with the GitHack inspection link below. Do not attempt real sign-in on GitHack.

## What changes

- Moves `account.html` onto the generated clean site shell and local font/design-token system.
- Replaces the old layered account page runtime with:
  - `assets/js/pages/account.js`
  - `assets/js/services/account-session.js`
  - `assets/js/services/account-data.js`
  - `assets/css/pages/account.css`
- Keeps real email/password, Google OAuth, password recovery and safe same-origin `returnTo` behavior on approved production origins.
- Adds an explicit non-production-only `?inspect=1` state. It loads no Supabase session and no customer records.
- Preserves profile editing, billing/contact preferences, address editing, overview counts, attention state, password reset, login-email change, sign-out, Privacy & Data link and admin shortcut detection.
- Keeps the welcome-tour contract used by the existing account welcome notification, but moves the tour into the clean account controller.
- Continues to load the existing notification system only after an authenticated production session exists.
- Fixes the default-delivery-address race/constraint bug with the already-applied `customer_save_address_v1` SECURITY INVOKER RPC. The one-default-per-user unique index remains intact.
- Does not rewrite Quotes, Documents, Activity, Saved Builds, Privacy Centre, Notifications or admin pages yet; those remain later Step 5 substeps.

## Supabase change already applied

`20260923210205_customer_address_atomic_v1`

The migration adds one narrow customer RPC. It does not drop tables, disable RLS, change customer rows or weaken the existing unique default-address index. Existing address/default row counts were unchanged after deployment.

## Security findings recorded, not silently changed here

The Supabase advisor still reports leaked-password protection disabled and multiple authenticated-callable SECURITY DEFINER RPCs. Some are intentionally customer-facing or internally admin-guarded. Step 5.3 will classify and harden these deliberately rather than revoking functions during this UI migration.

## Visual inspection

Logged-out page on GitHack:
https://raw.githack.com/VoltTechComputerCo/VoltTechComputerCo.github.io/clean-rebuild/account.html

Read-only full layout inspection:
https://raw.githack.com/VoltTechComputerCo/VoltTechComputerCo.github.io/clean-rebuild/account.html?inspect=1

## Package tests

```text
node --check assets/js/pages/account.js
node --check assets/js/services/account-session.js
node --check assets/js/services/account-data.js
node scripts/test-clean-account.mjs
python -m py_compile scripts/check-clean-frontend.py
```

Result: PASS.

## Rollback

Repository rollback target: `a8a76ddcc1b3c93fc9407e285e04c5e331f36cd5`.

The address RPC is backwards-compatible with the existing account page, so a repository rollback does not require weakening or removing the database fix.
