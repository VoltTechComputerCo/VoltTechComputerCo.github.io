# Current System Baseline

**Original baseline:** 17 September 2026  
**Status refresh:** 19 September 2026

This file records the broad current state of the VoltTech 2.0 development branch.

## Public frontend

The repository is primarily static HTML/CSS/JavaScript hosted on GitHub Pages.

Important public entry points include:

- `index.html`
- `pc-repair-pretoria.html`
- `pc-performance-optimisation.html`
- `pc-upgrades-pretoria.html`
- `virus-malware-removal-pretoria.html`
- `windows-installation-pretoria.html`
- `signal-scan.html`
- `exposure-scan.html`
- `streaming-setup-south-africa.html`
- `creator-hub-south-africa.html`
- `stream-scan.html`
- `static.html`
- individual `static-*.html` editorial articles

Store and Builder files also exist publicly in the repository, but their interactive commerce experiences are currently launch-gated.

Do not move or rename indexed URLs casually. Update canonical links, sitemap and internal links together when a controlled migration is eventually required.

## Customer/account system

Existing files include:

- `account.html`
- `account.js`
- `account-dashboard.js`
- `account-filters.js`
- `account-v3.css`
- `account-v4-nav.js`
- `activity.html`
- `activity.js`
- `builds.html`
- `builds.js`
- `documents.html`
- `documents.js`
- `quotes.html`
- `quotes.js`
- `quote.html`
- `quote.js`
- `privacy-center.html`
- `privacy-center.js`
- `personal-data.html`
- `personal-data.js`
- notifications and onboarding assets

Shared portal and notification assets have been normalised to their current source versions on the migrated account/admin pages.

## Admin system

Existing internal/admin files include:

- `admin.html`
- `admin.js`
- `admin-customers.html`
- `admin-customers.js`
- `admin-customer.html`
- `admin-customer.js`
- `admin-builds.html`
- `admin-builds.js`
- `admin-records.html`
- `admin-records.js`
- `admin-deletions.html`
- `admin-deletions.js`
- `admin-store.html`
- `admin-workflow.js`
- `admin-launch-controls.js`
- `commerce/js/admin-store.js`

The Parts Desk includes separate Store and Builder launch controls.

## Commerce

Existing commerce assets include:

- `store.html`
- `product.html`
- `checkout.html`
- `order-status.html`
- `store-access.js`
- `store-gate.css`
- `commerce/store.css`
- `commerce/js/store-core.js`
- `commerce/js/store.js`
- `commerce/js/product.js`
- `commerce/js/checkout.js`
- `commerce/js/order-status.js`
- `commerce/js/builder-handoff.js`
- `commerce/js/catalogue-normalizer.js`
- product and supplier schemas
- mock supplier JSON datasets

The Store currently fails closed unless Supabase explicitly reports `store_settings.catalogue_enabled = true`.

At the current development state, catalogue promotion is paused and Store/Product indexing is deliberately restricted while supplier, pricing and company-operating readiness are unfinished.

Mock supplier datasets must never be presented as verified live stock.

## PC Builder

Existing Builder structure includes:

- `builder/index.html`
- `builder/styles.css`
- `builder/builder-gate.css`
- `builder/builder-access.js`
- `builder/js/app.js`
- `builder/js/build-engine.js`
- `builder/js/compatibility-engine.js`
- `builder/js/guided-engine.js`
- `builder/js/data-loader.js`
- `builder/js/account-integration.js`
- category JSON datasets under `builder/data/`

The Builder is `noindex,nofollow` and fails closed unless Supabase explicitly reports `store_settings.builder_enabled = true`.

Saved historical builds remain available through the customer portal while new Builder access is paused.

## STATIC

STATIC has:

- `static.html`
- individual `static-*.html` article files
- `static-feed.xml`
- `STATIC-logo-master.png`
- a GitHub Action that publishes the newest feed item to Discord when `static-feed.xml` changes on `main`
- a sitemap autopilot workflow for STATIC content

STATIC targets a wider/global editorial audience and should not be treated as another local-service page.

## Creator / streamer data

The South African creator directory uses Supabase-backed streamer data.

Current repository backend assets include:
- `Supabase/functions/refresh-sa-streamers/`
- streamer-directory migrations
- scheduled-refresh migration/configuration

Do not describe streamer refresh as a current GitHub Actions workflow unless a new workflow is actually added.

## Shared frontend layers

The repository still contains multiple generations of shared styling and shell code, including:

- `visual-system.css`
- `visual-block-fix.css`
- `v4-nav.css`
- `mobile-nav.css`
- `customer-shell.css`
- `portal-shell.css`
- `commerce-ui.css`
- newer page-specific shared stylesheets

Phase 2 is actively reducing duplication without mass-deleting legacy assets that may still have dependants.

## Assets

Brand assets exist under `brand/` as well as legacy root logo files.

Numerous WebP images currently live in the repository root. New asset organisation should be introduced gradually while preserving existing referenced paths.

## PWA / service worker

The repo includes:

- `manifest.webmanifest`
- `sw.js`
- app icons under `icons/`

The service worker currently includes compatibility rewrites for older cached asset-version references and injects the current notification loader into same-origin HTML navigations when needed.

Compatibility shims should only be removed after source references and cache behaviour are confirmed safe.

## Analytics

The repository includes `analytics.js` and Google Analytics tags on key pages.

The current public pages migrated in Phase 2 reference `analytics.js?v=6` directly.

Preserve analytics continuity when rebuilding templates.
