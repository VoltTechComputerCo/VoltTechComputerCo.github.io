# Step 6.1 QA — Creator Hub + live-status truthfulness

Base commit: `4c399b694e72e0135723879e06d8e570a695a463`

## Repository / frontend

- Creator Hub uses the generated clean shell and local VoltTech fonts/tokens.
- One H1, one main, one shared site header and one footer.
- No inline style attributes or inline event handlers.
- No old Creator Hub Google Fonts / analytics / visual-system / creator-system runtime dependencies.
- Creator feed integration lives in `assets/js/services/creator-feed.js`; page controller remains integration-free.
- Twitch embed `parent` follows `location.hostname` instead of hard-coding GitHub Pages.
- Search, recently-active directory and Creator Hub → technical-support / Discord routes preserved.

## Freshness contract

- Freshness threshold: 20 minutes.
- Supabase row marked live + fresh `checked_at` => may render live.
- Supabase row marked live + stale `checked_at` => rendered non-live.
- Repository fallback JSON follows the same stale suppression rule.
- Stale/unavailable feed keeps directory discovery where records exist, but hides live playback and live badges.

## Backend observation

Read-only audit found:

- 219 curated streamer rows; 216 enabled.
- 219 streamer status rows.
- Latest successful status: 18 Sep 2026.
- Cron schedule: `*/10 * * * *`, active.
- Function invocations continue every 10 minutes.
- Recent function logs: `Twitch token request failed: 403`.
- Private telemetry reports the same latest error; internal refresh secret is configured.

No creator backend data, scheduler, Edge Function deployment or secret changed in Step 6.1.

## Tests

`node scripts/test-clean-creator-hub.mjs` verifies fresh/stale behavior, stale live suppression, clean-shell isolation and dynamic Twitch parent behavior.
