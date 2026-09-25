# Step 11.1D — Canonical URL normalization

## Why this step exists

Google Search Console and the live technical crawl confirmed that Cloudflare Pages
serves root HTML pages at extensionless public URLs:

- `/pc-repair-pretoria.html` -> 308 -> `/pc-repair-pretoria`
- `/signal-scan.html` -> 308 -> `/signal-scan`
- `/static.html` -> 308 -> `/static`

The production sitemap and canonical metadata still advertised the physical `.html`
filenames. That creates contradictory indexing signals.

## Contract after 11.1D

Physical repository files remain `.html`.

Authoritative public SEO URLs become extensionless:

- canonical URLs
- `og:url`
- absolute JSON-LD page/service URLs
- sitemap `<loc>` values
- STATIC RSS channel/item URLs
- future STATIC sitemap/feed generation

This step intentionally does **not** rewrite every relative internal link yet. Existing
relative `.html` links remain functional through Cloudflare's permanent redirects.
The indexing signals are normalized first so Search Console can converge on one
canonical URL format without changing customer-facing navigation or local QA behavior.

## Safety

- staging branch only: `clean-rebuild`
- no production `main` push
- no Supabase/backend changes
- no CSS/layout/content changes
- clean frontend regenerated from source
- STATIC RSS regenerated
- existing full regression target: 24/24
- new extensionless URL-contract gate required
- workflow refuses unexpected file categories

After staging passes, inspect the diff and then promote the normalized SEO tree to
`main` in a separate controlled step.
