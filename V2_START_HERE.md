# VoltTech 2.0 — Start Here

VoltTech 2.0 is now an active consolidation branch, not a foundation-only package.

The working development branch is:

`v2-rebuild`

Production remains:

`main`

## Current state — 19 September 2026

The documentation baseline, conversion-first public pass and a substantial portion of Phase 2 cleanup are already complete.

Completed work includes:
- repository handover/documentation baseline
- pricing clarity on core PC service pages
- shared service-page styling
- homepage and creator shared styling
- Signal Scan / Stream Scan stylesheet cleanup
- Exposure Scan stylesheet and inline-style cleanup
- customer/admin portal stylesheet cleanup
- checkout and order-status cleanup
- Store launch gating
- Builder launch gating
- global commerce-navigation gating
- customer/admin shared asset version normalisation
- public `analytics.js` source-version normalisation
- Builder notification-loader source-version normalisation

## Current operating rules

- `main` is production.
- `v2-rebuild` is the active VoltTech 2.0 development branch.
- Do not casually move or rename established public URLs.
- Store and PC Builder remain fail-closed until their Supabase launch flags are explicitly enabled.
- Direct human contact remains the primary conversion path.
- Diagnostic tools are optional helpers, not mandatory funnels.
- Preserve customer records, quotes, documents and saved-build history during cleanup.

## Current development focus

Continue Phase 2 consolidation carefully:
- remove stale compatibility dependencies only after source files are normalised
- reduce duplicated legacy styling and shell code
- keep documentation aligned with actual runtime behaviour
- avoid mixing unrelated high-risk systems into one batch

After Phase 2 stabilises, continue with the documented migration plan for service/SEO consolidation, account simplification and future commerce readiness.

## Before each batch

1. Read the current branch state first.
2. Change only the files required for that batch.
3. Preserve public URLs and working business flows.
4. Test mobile and customer-contact paths.
5. Record the batch in `CHANGELOG.md`.
