# Step 3.1 — PC Builder foundation and safe inspection

Objective: move the existing PC Builder onto the clean generated VoltTech shell without rewriting its compatibility/guided engines, preserve the fail-closed launch boundary, and create a safe read-only GitHack inspection path for the full Builder.

Parent Step: Step 3 — PC Builder.  
Previous major Step: Step 2 — Core commerce, fully uploaded and byte-verified at `70691bb5d3a390a185210bdd7c1d188f6f014546`.  
Current: Step 3.1 — Packaged; upload verification and user visual review pending.  
Next: Step 3.2 — Builder experience and engine-consistency pass.

Branch: `clean-rebuild`. Exact parent / rollback commit: `70691bb5d3a390a185210bdd7c1d188f6f014546`. No v3-prototype code used.

## Upload instructions

1. Extract **Step-3.1.zip** and stay on **clean-rebuild**.
2. Upload the contents inside **Step 3.1/** to their matching repository paths; replace existing files where prompted. Do not upload the enclosing Step folder as a website directory.
3. Delete the three superseded Builder files listed below after the upload. ZIP uploads do not remove files.
4. **No new folder placeholders are required.** Every target directory already exists in the audited repository.
5. Tell me when uploaded. I will verify the new HEAD, all delivered hashes and all three deletions before continuing.

**16 delivered files: 5 changed, 11 added; 3 deletions to perform separately.**

## Files deleted separately

- `builder/builder-access.js`
- `builder/builder-gate.css`
- `builder/phase6-unification.css`

Do **not** delete `builder/styles.css`. Step 3.1 intentionally carries it as the current inner-Builder presentation layer; Step 3.2 will own its replacement.

## Builder links after upload

Normal gate (must stay closed):

https://raw.githack.com/VoltTechComputerCo/VoltTechComputerCo.github.io/clean-rebuild/builder/index.html

Read-only owner inspection:

https://raw.githack.com/VoltTechComputerCo/VoltTechComputerCo.github.io/clean-rebuild/builder/index.html?inspect=1

`?inspect=1` is accepted only on non-production origins. It does not bypass the Builder flag on VoltTech's production origins.

## What changes

- `builder/index.html` becomes a generated `data-vt-shell="clean"` route using the shared VoltTech header, navigation, search, footer, self-hosted fonts and clean shell.
- Production Builder access remains fail-closed behind `builder_enabled`.
- Production `?preview=1` still requires a verified signed-in VoltTech administrator.
- Non-production `?inspect=1` opens a clearly labelled read-only Builder using only local prototype catalogue data.
- Inspection does not initialise account saving, quote requests, Store overlay, analytics, notifications or service-worker registration.
- Builder catalogue loading no longer imports account/auth integration as a side effect.
- Store overlay loading reuses the clean shared Supabase client when the live Builder is eventually enabled.
- Builder confirmations use a clean native-dialog adapter rather than the root legacy dialog dependency.
- The clean dependency checker now correctly resolves nested generated routes such as `builder/index.html`.

## What deliberately does not change yet

The compatibility engine, guided recommendation engine, performance-intelligence data, account save/restore contract, quote workflow, product catalogue JSON and supplier mock datasets remain in place. `builder/styles.css` remains transitional so Step 3.1 does not mix architecture migration with the Step 3.2 visual/UX rebuild.

No Supabase schema/RLS/function/secret/launch setting is changed. No customer record or quote is created.

## Audit findings carried forward

The Builder currently has 136 local prototype products and 423 mock supplier offers. All supplier datasets explicitly identify themselves as temporary test data and are stale at the current date. Its 136 product-image mappings use external proxy URLs rather than repository-owned product media.

Two important functional/data-truth issues are recorded for later Builder work: Office/Home guided builds can omit a GPU while the main build engine still treats GPU as universally required; and saved-build serialisation currently does not use the same offer/freshness selection contract as the Builder itself. Full details: `docs/clean-rebuild/step-3.1-QA.md`.

## Tests

Run after upload/deletions:

```text
python scripts/build-clean-frontend.py --check
python scripts/check-clean-frontend.py
node scripts/test-clean-runtime.mjs
node scripts/test-clean-commerce.mjs
node scripts/test-clean-transactions.mjs
node scripts/test-clean-builder.mjs
```

Step 3.1 package-side checks already pass for the new JavaScript syntax and generated Builder HTML structure. Full repository checks are re-run against the actual uploaded branch before Step 3.2.

## Rollback

**Rollback target: `70691bb5d3a390a185210bdd7c1d188f6f014546`.**

Restore changed/deleted paths from that commit and remove Step 3.1 added paths. No backend rollback is required because this delivery makes no backend mutation.

## Next

After hash/deletion verification and your visual approval of both Builder states, Step 3.2 will fix the Office/iGPU completion contract and migrate/refine the Guided + Manual Builder experience on the clean design system without replacing the underlying compatibility logic unnecessarily.
