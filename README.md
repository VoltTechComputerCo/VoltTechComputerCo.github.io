# Step 3.2 — PC Builder experience and engine consistency

Objective: replace the last legacy Builder presentation dependency with a clean VoltTech page stylesheet, refine the Guided + Manual Builder experience, and fix the integrated-graphics completion mismatch without changing launch flags, account/quote workflow or compatibility-rule scope.

Parent Step: Step 3 — PC Builder.  
Previous: Step 3.1 uploaded, deletion-verified and byte-verified at `217582dc623d24ade8e6ce129f3c0290edeea6e6`.  
Current: Step 3.2 — packaged; upload verification and user visual review pending.  
Next: Step 3.3 — account/quote handoff, saved-build provenance and final Builder QA.

Branch: `clean-rebuild`. Exact parent / rollback commit: `217582dc623d24ade8e6ce129f3c0290edeea6e6`. No v3-prototype code used.

## Upload instructions

1. Extract **Step-3.2.zip** and stay on **clean-rebuild**.
2. Upload the contents inside **Step 3.2/** to their matching repository paths; replace existing files where prompted. Do not upload the enclosing Step folder as a website directory.
3. Delete the single superseded file listed below after the upload. ZIP uploads do not remove files.
4. **No new folder placeholders are required.** Every target directory already exists in the audited repository.
5. Tell me when uploaded. I will verify the new HEAD, every delivered file and the deletion before continuing.

## Delete separately

- `builder/styles.css`

Do not delete any Builder engine, catalogue, media, account or handoff file.

## Builder links after upload

Normal gate — must remain closed:

https://raw.githack.com/VoltTechComputerCo/VoltTechComputerCo.github.io/clean-rebuild/builder/index.html

Full read-only inspection:

https://raw.githack.com/VoltTechComputerCo/VoltTechComputerCo.github.io/clean-rebuild/builder/index.html?inspect=1

`?inspect=1` remains non-production-only and cannot bypass the Builder flag on VoltTech production origins.

## What changes

- Replaces the transitional `builder/styles.css` with clean page-scoped `assets/css/pages/builder.css`.
- Keeps the Step 3.1 clean shell, fail-closed launch gate and isolated read-only inspection path unchanged.
- Reworks the Guided and Manual Builder presentation around the shared VoltTech design tokens, cleaner hierarchy, improved mobile layouts and clearer progress/navigation.
- Guided questions now adapt to the selected workload instead of asking every user gaming-only questions:
  - Gaming / Gaming + Streaming keep resolution and FPS choices.
  - Creator / Workstation keep a workload-resolution choice but do not ask an FPS-target question.
  - Office / Home hides gaming resolution/FPS questions and uses everyday-storage language.
- Fixes the completion contract for CPUs with integrated graphics: a discrete GPU becomes optional when the selected CPU explicitly reports integrated graphics.
- CPUs without integrated graphics still require a GPU.
- Manual automatic-next-category logic now skips the GPU step only when integrated graphics genuinely satisfy it.
- The Builder UI marks that state explicitly as `Integrated graphics available · discrete GPU optional`.
- Read-only inspection now labels mock/stale supplier pricing and stock as prototype data directly in the Builder UI.
- Adds an explicit four-stage Builder flow rail: route → brief → parts → review.
- Removes the clean-checker exception that temporarily allowed the old Builder stylesheet.

## What deliberately does not change

No Supabase schema, RLS, Edge Function, secret, launch setting, customer data, saved-build record or quote is changed.

The underlying compatibility checks remain intact. The local catalogue, mock supplier feeds, performance-intelligence dataset, external product-media map, account save/restore implementation, quote-request status transition and admin build-to-quote workflow are not replaced in this step.

Those account/data-provenance items remain Step 3.3 work.

## Known data truth

The inspection experience still uses the existing 136-product prototype catalogue and 423 mock supplier offers. Those offers are test data and stale. Displayed price/stock values must not be treated as a quote or live inventory.

The 136 product media mappings remain external proxy URLs; the new presentation improves the fallback state but does not claim those mappings are production-owned media.

## Tests

Package-side checks completed:

```text
node scripts/test-clean-builder.mjs
node --input-type=module --check < assets/js/pages/builder.js
node --input-type=module --check < assets/js/pages/builder-experience.js
node --input-type=module --check < builder/js/build-engine.js
```

The Builder contract regression verifies both integrated-graphics and non-integrated-graphics completion behavior, clean stylesheet ownership, adaptive Guided behavior, inspection data labelling and removal of the transitional clean-checker exception.

After upload I will re-run the remote delta/hash/deletion verification before Step 3.3.

## Visual review

On Android, use the `?inspect=1` link and check:

- route chooser;
- Gaming Guided flow;
- Office/Home Guided flow — gaming-only questions should disappear;
- generated Guided recommendation;
- Manual category strip and search;
- Compatible-only filter;
- product cards/images/fallbacks;
- selecting/removing components;
- mobile Review Build bar;
- build summary and compatibility report;
- a CPU with integrated graphics showing GPU as optional;
- Clear Build dialog.

The normal URL must continue to show the closed Builder gate.

## Rollback

**Rollback target: `217582dc623d24ade8e6ce129f3c0290edeea6e6`.**

Restore changed paths from that commit, remove Step 3.2 added files and restore `builder/styles.css`. No backend rollback is required.
