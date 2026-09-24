# STATIC publishing contract

This contract applies to every **new** `static-*.html` article after Step 6.3. The 30 articles that already existed at the Step 6.3 boundary are grandfathered as historical template debt and are scheduled for shared-template/domain/performance migration in Step 8.

## New article requirements

- Root filename: `static-<slug>.html`.
- Exactly one `<title>` and one `<h1>`.
- Meta description, indexable robots directive and canonical URL.
- `article:published_time` plus NewsArticle/Article JSON-LD with `datePublished`.
- `og:type=article`, `og:title`, `og:description`, `og:url`, `og:image` and a Twitter/X card.
- Local fonts only. Do not add Google Fonts.
- Use `assets/css/tokens.css`, `assets/css/base.css` and `assets/css/pages/static-article.css`; do not embed a new `<style>` block or inline style attributes.
- Link back to `static.html`.
- Cite primary/authoritative sources in the article body. Do not present rumours as confirmed facts.
- Do not link to paused or unavailable VoltTech offers.
- Update `static.html` so the newest published story becomes the `data-static-lead` story and appears in the latest section.

Use `docs/clean-rebuild/STATIC-ARTICLE-TEMPLATE.html` as the starting structure.

## Automation

On `main`, `v2-rebuild` and `clean-rebuild`:

- `STATIC Feed Autopilot` rebuilds `static-feed.xml` after article changes.
- `STATIC Sitemap Autopilot` keeps STATIC URLs in `sitemap.xml`.
- `STATIC Publishing Guard` validates article/hub/feed/sitemap integrity.

Discord publishing remains **main-only**. It announces only when the newest RSS GUID changes, so metadata-only feed rebuilds do not repost the same story. A manual workflow dispatch intentionally forces a publish.

## Domain boundary

Step 8.1A moves STATIC publishing infrastructure and the template for all new articles to `https://volttechcomputerco.co.za/`.

The 30 historical articles remain explicitly grandfathered with their old `volttechcomputerco.github.io` canonical tag until their shared-template migration in Step 8.3. During this transition:
- RSS and sitemap publish the `.co.za` article URLs;
- the feed builder normalises a grandfathered old article canonical to the `.co.za` URL;
- the publishing guard warns, rather than fails, only for those 30 known historical canonicals;
- any new article must use `.co.za` in canonical, Open Graph and JSON-LD metadata.
