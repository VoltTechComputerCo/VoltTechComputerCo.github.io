# Current System Baseline

**Baseline date:** 17 September 2026

This file records the broad current state before VoltTech 2.0 restructuring.

## Public frontend

The repository is primarily static HTML/CSS/JavaScript hosted on GitHub Pages.

Important public entry points currently include:

- `index.html`
- `store.html`
- `pc-repair-pretoria.html`
- `pc-performance-optimisation.html`
- `pc-upgrades-pretoria.html`
- `virus-malware-removal-pretoria.html`
- `windows-installation-pretoria.html`
- `signal-scan.html`
- `streaming-setup-south-africa.html`
- `creator-hub-south-africa.html`
- `stream-scan.html`
- `static.html`
- individual `static-*.html` editorial articles

Do not move or rename indexed URLs casually. Use an explicit migration/redirect plan where hosting limitations allow, and update canonical links, sitemap and internal links together.

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
- `commerce/js/admin-store.js`

VoltTech 2.0 should eventually consolidate these into a coherent internal "VoltTech HQ" interface, but not at the expense of immediate revenue-generating work.

## Commerce

Existing commerce assets include:

- `store.html`
- `product.html`
- `checkout.html`
- `order-status.html`
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

The Store currently operates in a cautious, confirmation-first model. Do not present mock supplier datasets as real stock.

## PC Builder

Existing Builder structure includes:

- `builder/index.html`
- `builder/styles.css`
- `builder/js/app.js`
- `builder/js/build-engine.js`
- `builder/js/compatibility-engine.js`
- `builder/js/guided-engine.js`
- `builder/js/data-loader.js`
- `builder/js/account-integration.js`
- category JSON datasets under `builder/data/`

The Builder is currently marked as a preview and has `noindex,nofollow`.

## STATIC

STATIC has:

- `static.html`
- individual `static-*.html` article files
- `static-feed.xml`
- `STATIC-logo-master.png`
- GitHub Action automation that publishes the newest feed item to Discord when `static-feed.xml` changes on `main`

STATIC targets a wider/global editorial audience and should not be treated as another local-service page.

## Shared/legacy frontend layers

The repository contains multiple generations of shared styling and shell code, including:

- `visual-system.css`
- `visual-block-fix.css`
- `v4-nav.css`
- `mobile-nav.css`
- `customer-shell.css`
- `portal-shell.css`
- `commerce-ui.css`
- page-specific inline styles

A major VoltTech 2.0 technical objective is to reduce duplication into a documented shared design system without breaking existing pages during migration.

## Assets

Brand assets exist under `brand/` as well as legacy root logo files.

Numerous WebP images currently live in the repository root. VoltTech 2.0 should gradually organise new assets under a predictable `assets/` hierarchy while preserving old paths until references are migrated safely.

## PWA / service worker

The repo includes:

- `manifest.webmanifest`
- `sw.js`
- app icons under `icons/`

Any restructuring must check service-worker cache paths and invalidation behaviour.

## Analytics

The repository includes `analytics.js` and Google Analytics tags on key pages.

Preserve analytics continuity when rebuilding templates.
