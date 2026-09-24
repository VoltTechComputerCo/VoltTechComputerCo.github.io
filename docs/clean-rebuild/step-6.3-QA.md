# Step 6.3 QA — STATIC publishing + Creator ecosystem closeout

Parent branch state: `e3243d4bab35e173a860e1cab141b534ffc59c54`.

## Repository audit

- `clean-rebuild` and `main` both contained the same 30 STATIC article files at the audit boundary; no published article was missing from the rebuild branch.
- All 30 articles had a meta description, exactly one H1, a canonical URL and a link back to `static.html`.
- Historical article markup exists in two generations. All 30 still use inline article presentation and most load remote Google Fonts; only the older subset has explicit Article JSON-LD / machine-readable publish dates. Those published bodies are intentionally not mass-rewritten in Step 6.3.
- `static.html` was still a standalone inline-style / Google-Fonts page and is cleaned in this delivery.

## RSS issue found and fixed

The old feed parser used a regex that disallowed both quote characters inside attribute values. A perfectly valid double-quoted description containing an apostrophe therefore truncated at the apostrophe. This produced feed descriptions such as `Xbox`, `South Africa`, `Nintendo marks The Legend of Zelda`, `NBA 2K27 is the first shipping game with Nvidia`, and `Linus Tech Tips built its fastest off-the-shelf PC of 2026 around AMD`.

`build-static-feed.py` now uses `html.parser.HTMLParser` for metadata attributes. The current `static-feed.xml` is regenerated with those descriptions restored from the source article metadata.

## Automation checks

- Feed autopilot: `main`, `v2-rebuild`, `clean-rebuild`.
- STATIC publishing guard: `main`, `v2-rebuild`, `clean-rebuild`.
- Sitemap autopilot: `main`, `v2-rebuild`, `clean-rebuild`.
- Discord publisher: still `main` only.
- Discord now compares the first RSS GUID with the previous commit and skips metadata-only feed rebuilds. Manual dispatch bypasses that dedupe intentionally.

## Future article boundary

The 30 existing article filenames are explicitly grandfathered in `validate-static.py`. Any new `static-*.html` file after this boundary must use the shared clean article stylesheet/local fonts and provide machine-readable publish date, JSON-LD and social metadata. See `STATIC-PUBLISHING.md` and `STATIC-ARTICLE-TEMPLATE.html`.

## Creator residue audit

Safe deletions with no remaining audited consumer:

- `creator-hub.css`
- `creator-network.css`
- `creator-system.css`
- `scan-system.css`
- `service-network.css`
- `stream-scan.css`
- `streaming-support.css`

Intentionally retained:

- `streamer-feed.js` — still used by the clean homepage creator integration.
- `scan-handoff.js` — still referenced by the legacy `analytics.js` loader.
- `symptom-handoff.js` — still referenced by the legacy `analytics.js` loader.
- `contact-icons-static.css` — still loaded by legacy `analytics.js` consumers.

## Backend boundary

No Supabase changes in 6.3. Creator refresh remains operationally blocked by Twitch OAuth HTTP 403. Last successful backend refresh: 18 September 2026. Freshness suppression from Step 6.1 remains the safety boundary until credentials are repaired.

## Domain boundary

The current GitHub canonical base is preserved in STATIC feed/sitemap/article validation. The entire site moves to the `.co.za` canonical base together in Step 8 rather than mixing canonical hosts during the rebuild.
