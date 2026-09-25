# Step 3.2 QA — Builder experience and engine consistency

Audit/build date: 23 September 2026  
Authoritative branch base: `clean-rebuild`  
Parent / rollback commit: `217582dc623d24ade8e6ce129f3c0290edeea6e6`

## Scope

Step 3.2 owns the Builder presentation migration and the integrated-graphics completion inconsistency recorded in Step 3.1. It intentionally does not change Builder launch settings, Supabase state, saved-build rows, quote rows or supplier data.

## Presentation migration

The last Builder-specific legacy stylesheet, `builder/styles.css`, is superseded by `assets/css/pages/builder.css`.

The new stylesheet is scoped to `[data-page="builder"]` and uses the shared clean-shell design tokens. It covers the existing Guided and Manual DOM contracts rather than replacing the compatibility/recommendation application.

Key presentation changes:

- stronger route hierarchy and four-stage progress rail;
- cleaner Guided question cards and budget control;
- workload-adaptive question visibility/copy;
- improved recommendation reveal and part cards;
- clearer Manual category strip, product cards and build summary;
- stronger responsive behavior for Android widths;
- explicit prototype-data styling in read-only inspection;
- explicit integrated-graphics satisfied state;
- improved media fallback presentation when an external image fails.

The clean frontend checker no longer allowlists `builder/styles.css`. After the delivery, a converted Builder page is permitted only the same root `supabase-config.js` classic dependency already required by its launch contract; its presentation must resolve under `assets/`.

## Guided workload adaptation

The recommendation engine is preserved, but the questionnaire now presents only relevant questions.

### Gaming / Gaming + Streaming

- Use case
- Budget
- Display/game resolution
- FPS target
- Buying priority
- Storage

### Creator / Workstation

- Use case
- Budget
- workload resolution
- Buying priority
- project storage

FPS is hidden and normalised to a conservative internal value so users are not asked an irrelevant gaming question.

### Office / Home

- Use case
- Budget
- Buying priority
- everyday storage

Gaming resolution/FPS questions are hidden and their internal values are neutralised.

No recommendation benchmark claim is added by this UX change.

## Integrated-graphics completion contract

Step 3.1 found three conflicting truths:

1. Guided Office/Home intentionally can omit a discrete GPU.
2. Account snapshot logic already treated GPU as optional when the selected CPU explicitly has `specs.integratedGraphics === true`.
3. The main Builder completion helpers still required a GPU unconditionally.

Step 3.2 makes the main build engine agree with the existing account contract.

A category is now considered satisfied when:

- it has a selected component; or
- the category is `gpu`, no discrete GPU is selected, and the selected CPU explicitly reports integrated graphics.

Consequences:

- iGPU Office/Home builds can reach Build Complete;
- automatic next-category selection does not force the GPU step for an iGPU build;
- the UI labels the GPU step as satisfied by integrated graphics;
- selecting a discrete GPU remains available;
- a CPU without integrated graphics still leaves GPU incomplete and required.

No compatibility rule is weakened for socket, memory, motherboard, case, cooling, PSU or physical-fit checks.

## Inspection truth

The Step 3.1 inspection boundary remains unchanged. In `?inspect=1` mode the Builder now reinforces its data state directly inside the catalogue status area:

`PROTOTYPE DATA ONLY` — local test catalogue and mock supplier offers; displayed price/stock snapshots are stale test data and are not live availability or a quotation.

Supplier labels in the product picker are also prefixed as prototype presentation in inspection mode.

This is a UI truthfulness improvement only. It does not modify the supplier JSON.

## Data/media findings carried forward

Still unresolved by design in Step 3.2:

- 136 local prototype products;
- 423 mock supplier offers;
- stale supplier timestamps;
- external proxy product-image mappings;
- saved-build serializer using its own offer selection/freshness fallback;
- browser-owned `quote_requested` status transition;
- production Store/Builder supplier onboarding and launch certification.

These remain Step 3.3 / later operational work.

## Package-side verification

`node scripts/test-clean-builder.mjs` passes and asserts:

- clean Builder shell remains in use;
- `builder/styles.css` is no longer referenced;
- `assets/css/pages/builder.css` owns presentation;
- fail-closed production access remains in place;
- adaptive Guided experience module is initialised;
- prototype data is labelled;
- an iGPU build with all other required categories is complete without a discrete GPU;
- a non-iGPU build remains incomplete without a GPU;
- automatic next-category flow does not force GPU on a satisfied iGPU build;
- the clean checker no longer carries the transitional Builder stylesheet exception.

New/changed JavaScript also passes Node syntax checks. `src/pages/builder.json` remains valid JSON and the committed generated Builder points at the clean Builder stylesheet.

## Visual QA after upload

Use only:

- normal Builder URL for the closed gate;
- non-production `?inspect=1` for full Builder inspection.

Priority Android checks:

1. route cards fit without horizontal overflow;
2. Guided questions are readable and selectable one-handed;
3. switching Gaming → Office hides resolution/FPS cleanly;
4. switching back restores gaming questions;
5. category navigation scrolls horizontally without trapping the page;
6. product cards collapse to one column;
7. selection controls remain tappable;
8. bottom Review Build bar does not cover important controls;
9. Guided recommendation cards/images remain readable;
10. build summary and diagnostics remain legible;
11. integrated-graphics builds show GPU as optional and can reach complete state;
12. normal gate remains closed.

## Rollback

Restore changed paths and `builder/styles.css` from `217582dc623d24ade8e6ce129f3c0290edeea6e6`, then remove the Step 3.2 added files. No backend rollback is required.
