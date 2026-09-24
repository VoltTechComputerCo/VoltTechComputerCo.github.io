# Step 6.3 — STATIC publishing + Creator ecosystem closeout

Objective: close Step 6 by cleaning the STATIC hub, fixing RSS metadata extraction, making the STATIC publishing workflows safe on `clean-rebuild`, preventing duplicate Discord announcements, enforcing a stronger contract for future STATIC articles, and removing creator-era CSS proven unused after the Creator Hub / Streaming Support / Stream Scan migrations.

Previous: Step 6.2 verified at `e3243d4bab35e173a860e1cab141b534ffc59c54`.
Current: Step 6.3 — packaged; upload verification pending.
Next: Step 7 — Legal, support and customer documents.

Branch: `clean-rebuild`.
Rollback target before this delivery: `e3243d4bab35e173a860e1cab141b534ffc59c54`.

## Upload

1. Extract `Step-6.3.zip` and stay on `clean-rebuild`.
2. Upload everything inside `Step 6.3/` to matching repository paths.
3. Delete exactly:

```text
creator-hub.css
creator-network.css
creator-system.css
scan-system.css
service-network.css
stream-scan.css
streaming-support.css
```

4. No folder placeholders are required.
5. No Supabase migration or backend mutation is part of this package.

## STATIC changes

- `static.html` keeps the standalone STATIC identity but moves its presentation into `assets/css/pages/static.css` and local VoltTech fonts. Google Fonts and the giant inline style block are removed from the hub.
- `assets/js/pages/static.js` enables production analytics/service-worker integration through the shared clean service only on approved production origins.
- `scripts/build-static-feed.py` now parses HTML metadata with Python's standard `HTMLParser`, fixing descriptions containing apostrophes such as `Xbox's` or `Nvidia's`.
- `static-feed.xml` is regenerated with the five currently truncated descriptions repaired.
- The feed, sitemap and publishing guard workflows now also run on `clean-rebuild` so the rebuild branch can maintain a complete editorial state while testing.
- Discord remains `main`-only. It compares the newest RSS GUID with the previous feed and skips metadata-only rebuilds, preventing duplicate announcements. Manual dispatch intentionally forces an announcement.
- Future new STATIC articles must follow `docs/clean-rebuild/STATIC-PUBLISHING.md` and use the shared `assets/css/pages/static-article.css` template contract.
- The 30 existing articles are explicitly grandfathered as historical template debt. They are not bulk-rewritten in this step; shared-template/canonical/performance migration is deferred to Step 8.

## Creator cleanup boundary

Seven root creator/streaming CSS files have no remaining audited consumers after Steps 6.1 and 6.2 and are safe to delete. `streamer-feed.js` stays because the clean homepage still uses it. `scan-handoff.js`, `symptom-handoff.js` and `contact-icons-static.css` stay because the legacy `analytics.js` loader still references them on unconverted legacy routes.

## Known operational blocker

The Twitch creator refresh scheduler and Edge Function are still active, but Twitch's OAuth token endpoint currently returns HTTP 403. The last successful creator refresh remains 18 September 2026. Step 6.1 already makes stale status safe by suppressing stale live badges/embeds. Repairing Twitch credentials requires secret-management access and is not faked here.

## Inspect

STATIC hub:
https://raw.githack.com/VoltTechComputerCo/VoltTechComputerCo.github.io/clean-rebuild/static.html

Creator Hub:
https://raw.githack.com/VoltTechComputerCo/VoltTechComputerCo.github.io/clean-rebuild/creator-hub-south-africa.html

Streaming Support:
https://raw.githack.com/VoltTechComputerCo/VoltTechComputerCo.github.io/clean-rebuild/streaming-setup-south-africa.html

Stream Scan:
https://raw.githack.com/VoltTechComputerCo/VoltTechComputerCo.github.io/clean-rebuild/stream-scan.html

## Tests

```text
node --check assets/js/pages/static.js
node scripts/test-clean-static.mjs
python scripts/validate-static.py
```

The full `validate-static.py` run requires the repository's 30 existing article files and is therefore intended for the repository / GitHub Actions environment. The packaged contract test validates the files carried by this delivery.
