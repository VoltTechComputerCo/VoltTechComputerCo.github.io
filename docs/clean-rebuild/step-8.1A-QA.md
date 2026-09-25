# Step 8.1A QA — canonical source and SEO infrastructure

Parent verified commit: `0c3501d0beefe16e5ce4e1a6d9b6ca897b515f2a`.

## Canonical target
`https://volttechcomputerco.co.za`

`https://www.volttechcomputerco.co.za` remains an accepted production origin, but the apex host is canonical.

## Included
- clean `src/pages/*.head.html` canonical/OG/schema sources;
- Home / Store / Product source heads that predate the preserved package snapshots;
- `assets/js/services/site-config.js`;
- `robots.txt`;
- `sitemap.xml`;
- `static-feed.xml`;
- STATIC hub, template, feed builder, validator and sitemap workflow;
- Discord domain-migration dedupe;
- SEO policy and transaction test fixture.

## Deliberately deferred to 8.1B
Generated clean HTML outputs are not bulk-rewritten in this source-first package. 8.1B will sync the generated outputs from the migrated source and perform the full old-host crawl.

This avoids reconstructing old generated pages manually and makes the source of truth authoritative first.

## Historical STATIC transition
The 30 pre-Step-6.3 STATIC articles keep their old `github.io` canonical tag temporarily until Step 8.3.
During the transition:
- sitemap and RSS publish `.co.za` URLs;
- the RSS builder normalises the old historical canonical to `.co.za`;
- the validator only warns for the known 30 historical article canonicals;
- new articles must use `.co.za`;
- Discord dedupe compares article path, so host-only GUID changes do not repost a story.

## Hosting boundary
No GitHub Pages `CNAME` file is introduced. Cloudflare remains the domain/serving layer.

## Commerce boundary
`transactionOrigin` now points at the canonical `.co.za` browser origin. Direct payments remain disabled. The Yoco Edge Function still needs production credentials and `.co.za` CORS/redirect certification before the payment launch gate can be enabled.
