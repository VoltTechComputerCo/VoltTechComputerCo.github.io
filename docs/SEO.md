# SEO

## Canonical production domain

VoltTech's canonical public origin is:

`https://volttechcomputerco.co.za`

The `www` host may resolve as an accepted production origin, but canonicals, Open Graph URLs, structured data, RSS and sitemap URLs use the apex `.co.za` host.

The legacy `volttechcomputerco.github.io` host is not the canonical identity of the business and must not be introduced into new public metadata. GitHack and branch-preview URLs are inspection-only and must never appear in canonical or structured-data fields.

## Two different SEO strategies

VoltTech has two distinct search goals.

### VoltTech services
Primarily South African service intent with strong local relevance, especially Pretoria and nearby service areas.

### STATIC
Editorial/global content strategy targeting technology, PC hardware, gaming and enthusiast topics.

Do not mix these strategies blindly.

## Protected public URLs

The following established paths should not be renamed or removed casually:

- `/`
- `/pc-repair-pretoria.html`
- `/pc-performance-optimisation.html`
- `/pc-upgrades-pretoria.html`
- `/virus-malware-removal-pretoria.html`
- `/windows-installation-pretoria.html`
- `/signal-scan.html`
- `/exposure-scan.html`
- `/streaming-setup-south-africa.html`
- `/creator-hub-south-africa.html`
- `/stream-scan.html`
- `/static.html`
- existing `static-*.html` articles

`store.html` and `product.html` currently exist but are intentionally restricted while the Store is launch-gated. Do not restore normal indexing/promotion until Store readiness is deliberately approved.

The PC Builder remains `noindex,nofollow` while `builder_enabled` is disabled.

## Service-page principles

- target real service intent
- explain the service and recognised symptoms
- explain process
- use realistic price guidance where appropriate
- make direct contact easy
- include local/service-area context naturally
- avoid keyword stuffing
- use accurate structured data

## Location/privacy

VoltTech may target Pretoria-area searches without exposing a residential address.

Do not insert the private address into LocalBusiness schema merely to chase local rankings.

## Technical checklist

For public pages:
- unique `<title>`
- useful meta description
- `.co.za` canonical URL
- crawl/index directive appropriate to current launch state
- Open Graph basics
- sensible heading hierarchy
- fast/mobile layout
- descriptive link text
- image alt text
- relevant structured data
- sitemap inclusion only when appropriate

## Store / Builder launch SEO

Before enabling Store discovery:
- restore indexing only when catalogue content and operations are genuinely ready
- confirm `.co.za` canonical URLs
- update sitemap intentionally
- verify internal navigation
- verify product metadata and structured data are accurate

Before promoting Builder:
- confirm `builder_enabled = true`
- decide whether its current `noindex,nofollow` posture should change
- update public navigation and sitemap deliberately rather than incidentally

## STATIC

Each new article must use `.co.za` canonical/OG/JSON-LD URLs. Historical article templates are being migrated in Step 8.3.

## Search Console

Search Console should be configured and monitored for the `.co.za` property after the coordinated domain migration.

Monitor indexing, crawl errors, canonical selection, page queries, click-through rate and pages gaining/losing impressions.
