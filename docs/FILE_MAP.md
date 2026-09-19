# Repository File Map

This is a functional map, not a complete file-by-file inventory.

## Root public pages

`index.html` — main public homepage  
`store.html` — Store catalogue shell; currently launch-gated  
`product.html` — product detail shell; currently launch-gated with Store  
`checkout.html` — commerce checkout/request flow  
`order-status.html` — customer order/request status  
`signal-scan.html` — optional diagnostic/estimate tool; lower strategic emphasis  
`stream-scan.html` — optional streaming diagnostic helper  
`exposure-scan.html` — browser privacy/security demonstration  
`static.html` — STATIC publication home  
`creator-hub-south-africa.html` — South African creator discovery hub

## Core service SEO pages

`pc-repair-pretoria.html`  
`pc-performance-optimisation.html`  
`pc-upgrades-pretoria.html`  
`virus-malware-removal-pretoria.html`  
`windows-installation-pretoria.html`  
`streaming-setup-south-africa.html`

## Customer portal

`account.html` / `account.js`  
`activity.html` / `activity.js`  
`builds.html` / `builds.js`  
`quotes.html` / `quotes.js`  
`quote.html` / `quote.js`  
`documents.html` / `documents.js`  
`privacy-center.html` / `privacy-center.js`  
`personal-data.html` / `personal-data.js`

## Commercial documents

`invoice.html` / `invoice.js`  
`proforma.html` / `proforma.js`  
`receipt.html` / `receipt.js`  
`order-document.html` / `order-document.js`  
`build-document.html` / `build-document.js`  
`service-record.html` / `service-record.js`

## Internal/admin

`admin.html` / `admin.js`  
`admin-customers.html` / `admin-customers.js`  
`admin-customer.html` / `admin-customer.js`  
`admin-builds.html` / `admin-builds.js`  
`admin-records.html` / `admin-records.js`  
`admin-deletions.html` / `admin-deletions.js`  
`admin-store.html`  
`admin-workflow.js`  
`admin-launch-controls.js`

## Builder

`builder/index.html`  
`builder/styles.css`  
`builder/builder-gate.css`  
`builder/builder-access.js`  
`builder/js/*`  
`builder/data/*`

Public Builder access is controlled by the Supabase `builder_enabled` launch flag.

## Commerce

`store-access.js` — fail-closed public Store launch gate  
`store-gate.css` — Store coming-soon/gate presentation  
`commerce/store.css`  
`commerce/js/*`  
`commerce/schema/*`  
`commerce/suppliers/*`

Mock supplier datasets under `commerce/suppliers/` are development data.

Public Store access is controlled by the Supabase `catalogue_enabled` launch flag.

## Shared frontend

`visual-system.css`  
`visual-block-fix.css`  
`v4-nav.css`  
`mobile-nav.css`  
`portal-shell.css`  
`customer-shell.css`  
`commerce-ui.css`  
`volttech-dialog.js`  
`site-notifications-loader.js`  
`analytics.js`  
`sw.js`

## Brand/media

`brand/*` — preferred canonical VoltTech brand files  
`logo-*` and root image files — legacy/current references that must be migrated carefully  
`icons/*` — app/favicons

## Platform

`supabase-config.js` — frontend Supabase project URL + publishable client key  
`manifest.webmanifest` — web app manifest  
`sw.js` — service worker and compatibility layer  
`robots.txt` — crawler instructions  
`sitemap.xml` — indexed/public URL inventory

## Automation

Current GitHub Actions workflows:
- `.github/workflows/static-discord-publisher.yml`
- `.github/workflows/static-sitemap-autopilot.yml`

Streamer-directory refresh is currently represented by Supabase backend assets rather than a GitHub Actions workflow:
- `Supabase/functions/refresh-sa-streamers/`
- `Supabase/migrations/*streamer*`

## STATIC content

`static-feed.xml` — RSS/feed source used by Discord publisher  
`static-*.html` — individual editorial articles
