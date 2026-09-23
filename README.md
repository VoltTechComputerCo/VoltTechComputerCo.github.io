# Step 3.3 — PC Builder account, quote handoff and final QA

Objective: close the PC Builder rebuild with truthful saved-build pricing provenance, server-authoritative customer/admin status transitions, atomic Builder-to-quote conversion and removal of the remaining legacy Builder integration files.

Parent Step: Step 3 — PC Builder.  
Previous: Step 3.2 uploaded and byte-verified at `bbf3001d8b0a206ca95401d18e3d507fef040b65`.  
Current: Step 3.3 — packaged; repository upload verification pending.  
Next major Step after verification: Step 4 — Signal Scan and service pages.

Branch: `clean-rebuild`. Exact repository rollback commit: `bbf3001d8b0a206ca95401d18e3d507fef040b65`.

## Important: Supabase migration already applied

The production migration was safely applied and verified before this ZIP was packaged:

`20260923164957_builder_handoff_hardening_v1`

The matching SQL file is included under `Supabase/migrations/` so Git remains the source-of-truth record. **Do not run the SQL manually again.**

After migration verification there are still exactly 5 historical saved-build records, all 5 remain `quoted`, and catalogue / Builder / direct-payment launch flags remain disabled.

## Upload instructions

1. Extract **Step-3.3.zip** and stay on **clean-rebuild**.
2. Upload the contents inside **Step 3.3/** to matching repository paths; replace existing files where prompted.
3. Delete the two superseded files listed below after upload. ZIP upload does not remove files.
4. **No new folder placeholders are required.** `assets/js/services`, `docs/clean-rebuild`, `scripts` and `Supabase/migrations` already exist.
5. Tell me when uploaded. I will verify the actual HEAD, every delivered file and both deletions before closing Step 3.

## Delete separately

- `builder/js/account-integration.js`
- `commerce/js/builder-handoff.js`

Do not delete any Builder engine, catalogue, compatibility or guided-recommendation file.

## What changes

- Moves account/save/restore/quote-request integration to `assets/js/services/builder-account.js`.
- Reuses the shared authorised Supabase client instead of creating another client/SDK bootstrap.
- Uses the Builder's existing `getBestOffer()` rule for saved-build price selection.
- Preserves supplier SKU, stock state, freshness, stale state and the real source `lastChecked`; absent timestamps remain NULL.
- Customer quote request now calls the server-owned `customer_request_build_quote` RPC.
- Database guard prevents customers from directly promoting a build to `quoted`, editing quote linkage fields or rewriting a build after quote request.
- Admin conversion now calls one atomic `admin_quote_saved_build` RPC instead of performing three browser-side operations.
- Admin review flags estimates whose source pricing is stale/unknown/missing so pricing can be refreshed before a formal quote is sent.
- Moves Store→Builder handoff to `assets/js/services/builder-handoff.js`, fixes current `vt-storage-*` IDs and removes inline toast styling / old Signal Build wording.
- Moves account and handoff presentation into the clean Builder CSS.
- Keeps the Builder launch flag closed.

## Builder inspection links after upload

Normal production-style gate — must remain closed:

https://raw.githack.com/VoltTechComputerCo/VoltTechComputerCo.github.io/clean-rebuild/builder/index.html

Read-only Builder:

https://raw.githack.com/VoltTechComputerCo/VoltTechComputerCo.github.io/clean-rebuild/builder/index.html?inspect=1

Read-only Store→Builder preselection test:

https://raw.githack.com/VoltTechComputerCo/VoltTechComputerCo.github.io/clean-rebuild/builder/index.html?inspect=1&add=vt-cpu-amd-7600

The preselection test should open Manual Builder and select the AMD Ryzen 5 7600 prototype entry automatically. It does not save anything or contact Supabase in inspection mode.

## Tests completed

Package-side checks pass:

```text
node scripts/test-clean-builder.mjs
node --check assets/js/services/builder-account.js
node --check assets/js/services/builder-handoff.js
node --check assets/js/pages/builder.js
node --check admin-builds.js
```

The live database migration was then verified read-only for trigger/function/policy presence, launch flags and historical row counts.

## Rollback

Repository rollback target: `bbf3001d8b0a206ca95401d18e3d507fef040b65`.

The Step 3.3 database hardening is backwards compatible with the Step 3.2 frontend, so a frontend rollback does **not** require removing the database guard/RPCs. Keeping that migration in place is safer.

Full details: `docs/clean-rebuild/step-3.3-QA.md`.
