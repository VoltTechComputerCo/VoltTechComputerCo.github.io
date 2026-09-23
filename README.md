# Step 5.2 — Activity, Builds, Quotes and Documents

Objective: migrate the core authenticated customer-record pages onto the clean VoltTech frontend while preserving real RLS-backed records, quote decisions, document email actions and source provenance.

Parent Step: Step 5 — Customer accounts and operations.  
Previous: Step 5.1 functional upload verified at `8ac46e6c39064c31efc6a16719462e6e3d654dc2`; two accidental Python-cache artifacts are carried into this delivery for cleanup.  
Current: Step 5.2 — packaged; upload verification pending.  
Next: Step 5.3 — Privacy, Notifications, operations/security QA and legacy cleanup.

Branch: `clean-rebuild`. Repository rollback target before this delivery: `8ac46e6c39064c31efc6a16719462e6e3d654dc2`.

## Upload

1. Extract `Step-5.2.zip` and stay on `clean-rebuild`.
2. Upload everything inside `Step 5.2/` to matching repository paths, replacing existing files where prompted.
3. Delete exactly:

```text
scripts/__pycache__/check-clean-frontend.cpython-313.pyc
scripts/__pycache__/Placeholder.txt
```

4. There are no new folder placeholders required.
5. Do not run any SQL. Step 5.2 makes no new Supabase migration.
6. Inspect the four `?inspect=1` links below on mobile. GitHack inspection loads no customer session or records.

## Pages converted

- `activity.html`
- `builds.html`
- `quotes.html`
- `documents.html`

## What changes

- Moves all four pages onto the clean generated site shell.
- Replaces their duplicated legacy customer shell/portal runtime with one records stylesheet, one page controller and shared account-record services.
- Reuses the Step 5.1 pinned Supabase/session foundation instead of creating a new client on every page.
- Keeps notification bootstrap behind a real authenticated production session.
- Preserves search/filter behavior and source links between Builder, quotes, invoices, receipts, orders and service records.
- Preserves customer quote Accept/Decline through the existing server-authoritative RPC.
- Preserves document email-copy calls through `send-document-email`.
- Keeps new custom PC build requests paused and saved Builder totals presented as estimates/history.
- Does not alter customer rows, RLS, quote states, launch flags or commerce settings during packaging.

## Step 5.1 cleanup included

The prior ZIP accidentally contained compiled Python cache. All 16 ZIP files themselves were verified byte-for-byte after upload; the cleanup is source hygiene only. This delivery removes the two cache files and replaces the Step 5.1 QA/folder/manifest record with the corrected source-only version.

## Inspect

Activity:  
https://raw.githack.com/VoltTechComputerCo/VoltTechComputerCo.github.io/clean-rebuild/activity.html?inspect=1

Saved Builds:  
https://raw.githack.com/VoltTechComputerCo/VoltTechComputerCo.github.io/clean-rebuild/builds.html?inspect=1

Quotes:  
https://raw.githack.com/VoltTechComputerCo/VoltTechComputerCo.github.io/clean-rebuild/quotes.html?inspect=1

Documents:  
https://raw.githack.com/VoltTechComputerCo/VoltTechComputerCo.github.io/clean-rebuild/documents.html?inspect=1

## Tests

```text
node --check assets/js/pages/customer-records.js
node --check assets/js/services/customer-records.js
node --check assets/js/services/document-email.js
node scripts/test-clean-customer-records.mjs
python scripts/build-clean-frontend.py --check
```

Do not use `py_compile` as a package test; it generates `__pycache__` artifacts that do not belong in source control.
