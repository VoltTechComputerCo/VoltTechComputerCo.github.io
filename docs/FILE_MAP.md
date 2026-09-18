# Repository File Map

This is a functional map, not a complete file-by-file inventory.

## Root public pages

`index.html` — main public homepage  
`store.html` — Store catalogue  
`product.html` — product detail  
`checkout.html` — commerce checkout/request flow  
`order-status.html` — customer order/request status  
`signal-scan.html` — optional diagnostic/estimate tool; lower strategic emphasis  
`stream-scan.html` — current streaming tool; rename under review  
`exposure-scan.html` — current exposure/privacy experiment; not launch priority  
`static.html` — STATIC publication home  
`creator-hub-south-africa.html` — creator/streaming hub

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

## Builder

`builder/index.html`  
`builder/styles.css`  
`builder/js/*`  
`builder/data/*`

## Commerce

`commerce/store.css`  
`commerce/js/*`  
`commerce/schema/*`  
`commerce/suppliers/*`

Mock supplier datasets under `commerce/suppliers/` are development data.

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

## Brand/media

`brand/*` — preferred canonical VoltTech brand files  
`logo-*` and root image files — legacy/current references that must be migrated carefully  
`icons/*` — app/favicons

## Platform

`supabase-config.js` — frontend Supabase project URL + publishable client key  
`manifest.webmanifest` — web app manifest  
`sw.js` — service worker  
`robots.txt` — crawler instructions  
`sitemap.xml` — indexed/public URL inventory

## Automation

`.github/workflows/static-discord-publisher.yml`  
`.github/workflows/update-sa-streamers.yml`

## STATIC content

`static-feed.xml` — RSS/feed source used by Discord publisher  
`static-*.html` — individual editorial articles
