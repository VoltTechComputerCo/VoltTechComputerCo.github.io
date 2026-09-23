# Step 6.1 — Creator Hub + live-status truthfulness

Objective: move the South African Creator Hub onto the generated clean VoltTech frontend and make creator live status freshness-aware before continuing into Streaming Support / Stream Scan and STATIC.

Previous: Step 5.3 verified at `4c399b694e72e0135723879e06d8e570a695a463`.
Current: Step 6.1 — packaged; upload verification pending.
Next: Step 6.2 — Streaming Support + Stream Scan clean migration.

Branch: `clean-rebuild`. Rollback target before this delivery: `4c399b694e72e0135723879e06d8e570a695a463`.

## Upload

1. Extract `Step-6.1.zip` and stay on `clean-rebuild`.
2. Upload everything inside `Step 6.1/` to matching repository paths.
3. Deletions: none.
4. Folder placeholders: none required.
5. Inspect `creator-hub-south-africa.html` on mobile after upload.

## What changes

- Converts `creator-hub-south-africa.html` to the generated clean shell and shared VoltTech design tokens.
- Adds a clean creator-feed service and page controller under `assets/js/`.
- Keeps the existing public 219-creator directory contract and repository JSON fallback.
- Applies the same 20-minute freshness boundary already used by the clean homepage creator integration.
- Suppresses every stale `is_live/live` flag. Stale data remains usable only as a creator directory.
- Makes the Twitch player `parent` parameter use `location.hostname`, so the embed is not hard-coded to the old GitHub Pages host and can work on the `.co.za` domain.
- Preserves Creator Hub → VoltTech HQ Discord and Creator Hub → Streaming Tech Support routes.
- Removes this page's dependency on Google Fonts, `analytics.js`, `visual-system.css`, `creator-system.css`, `creator-hub.css`, `mobile-nav.css` and `volttech-experience.js`.
- Makes no Supabase mutation and does not alter the creator rows, scheduler, Edge Function or secrets.

## Backend incident recorded during audit

- `public.streamers`: 219 rows; 216 enabled at audit time.
- `public.streamer_status`: 219 rows.
- Latest successful status time: 18 Sep 2026.
- Cron `refresh-sa-streamers` remains active every 10 minutes.
- Deployed Edge Function `refresh-sa-streamers` is receiving those scheduled POSTs.
- Current runs return HTTP 500 because Twitch OAuth returns `403` while requesting an app token.
- Private refresh telemetry records `Twitch token request failed: 403` and the refresh secret itself is configured.

The connected Supabase tooling does not expose Edge Function secret values or a secret-update action, so Twitch credentials are an explicit operational repair. Step 6.1 prevents that incident from producing false "live now" claims in the meantime.

## Tests

```text
node --check assets/js/pages/creator-hub.js
node --check assets/js/services/creator-feed.js
node scripts/test-clean-creator-hub.mjs
```
