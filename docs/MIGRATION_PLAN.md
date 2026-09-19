# VoltTech 2.0 Migration Plan

## Goal

Convert the current fast-grown repository into a maintainable commercial platform without breaking the live business.

## Principle

**Stabilise, document, simplify, then redesign.**

Do not start by moving every file.

## Current progress — 19 September 2026

- Phase 0: substantially complete
- Phase 1: substantially complete
- Phase 2: active and well underway
- Later phases: not yet considered complete

See `CHANGELOG.md` for the authoritative batch-by-batch implementation record.

## Phase 0 — Baseline and safety

- create `v2-rebuild`
- leave `main` as production
- add the documentation package
- record current URLs
- record current Supabase structure
- record known security/performance advisor findings
- avoid major public URL changes
- establish change log

**Status: substantially complete.**

## Phase 1 — Conversion-first public foundation

Highest immediate business value.

Work on:
- homepage hierarchy
- navigation
- direct WhatsApp/call/email visibility
- clearer service positioning
- trust/reviews/proof
- pricing guidance where appropriate
- mobile conversion
- consistent footer/contact system

Signal Scan must be optional, not the dominant route.

Privacy Lab remains deferred.

Stream Scan remains an optional creator diagnostic helper while naming/positioning is reviewed.

**Status: substantially complete for the current public service foundation.**

## Phase 2 — Shared design system and consolidation

Introduce shared 2.0 CSS/components gradually:
- tokens
- typography
- buttons
- forms
- cards
- navigation
- notices
- modal/dialog patterns
- responsive spacing

Also:
- remove duplicated page-level styles where safe
- normalise shared asset source versions
- remove stale runtime dependencies only after source files are corrected
- keep Store and Builder fail-closed while paused
- keep documentation synchronised with actual branch behaviour

Do not mass-delete legacy CSS or compatibility shims until all dependent pages and cached-session behaviour are confirmed migrated.

**Status: active.**

## Phase 3 — Services and SEO consolidation

- preserve strong existing service URLs
- align layouts and navigation
- improve internal linking
- improve contact conversion
- remove conflicting/duplicated service messaging
- validate structured data and sitemap

## Phase 4 — Customer account simplification

Unify the customer experience around:
- Overview
- Repairs / service activity
- Quotes
- Orders
- Builds
- Documents
- Profile / privacy

Do not add features simply because tables exist.

## Phase 5 — Commerce readiness

Before Store promotion or enabling `catalogue_enabled`:
- company/operating readiness
- real sourcing workflow
- verified supplier offers
- pricing/margin policy
- stock confirmation rules
- delivery/shipping process
- returns/warranty operations
- payment security
- admin RPC security review
- checkout end-to-end testing

The Store should make accurate promises, not look finished before operations can support it.

## Phase 6 — Builder/store unification

Before enabling or broadly promoting `builder_enabled`, progressively converge Builder and Store product data so one canonical catalogue can power both.

Do this only after:
- product IDs/spec schema are stable
- current compatibility engine behaviour is documented
- Store product model contains required compatibility data
- migration tests cover representative builds
- supplier and pricing inputs are dependable

## Phase 7 — VoltTech HQ

Consolidate internal admin screens around daily business workflows:
- new enquiries
- customers
- jobs
- quotes
- invoices/payments
- orders
- builds
- Store products
- notifications

This is an efficiency project after the customer-facing revenue path is working well.

## Phase 8 — STATIC integration

Preserve STATIC as its own publication while improving:
- content templates
- article navigation
- internal linking
- appropriate Store/Builder cross-links only when those products are actually available
- RSS automation
- analytics
- monetisation readiness

## Phase 9 — Cleanup

Only after migration is stable:
- archive obsolete files
- remove dead CSS/JS
- move root assets into organised directories where safe
- remove temporary compatibility shims
- update docs
- run broken-link and SEO checks

## Definition of success for VoltTech 2.0

VoltTech 2.0 is successful when:
- a non-technical visitor quickly understands what VoltTech does
- contacting a human is effortless
- the site generates real enquiries
- service pages support search discovery
- customers can receive/manage business documents safely
- commerce does not make promises operations cannot fulfil
- the repository can be handed to a professional developer without explanation from memory
