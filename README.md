# Step 6.2 — Streaming Support and Stream Scan

Objective: migrate VoltTech's creator technical-support page and Stream Scan onto the clean generated frontend while preserving current offers, answer-based triage, creator-security boundaries and the Creator Hub handoff.

Previous: Step 6.1 verified at `93e6d62e02310b8dea92fc1471e63245f82f5ddd`.
Current: Step 6.2 — packaged; upload verification pending.
Next: Step 6.3 — STATIC, creator ecosystem QA and safe legacy cleanup.

Branch: `clean-rebuild`. Rollback target before this delivery: `93e6d62e02310b8dea92fc1471e63245f82f5ddd`.

## Upload

1. Extract `Step-6.2.zip` and stay on `clean-rebuild`.
2. Upload everything inside `Step 6.2/` to matching repository paths.
3. Deletions: **none**.
4. Folder placeholders: **none required**.
5. No Supabase migration, Twitch secret, streamer row, scheduler or customer data is changed in this package.
6. Inspect both changed public routes on mobile before approval.

## What changes

- Converts `streaming-setup-south-africa.html` to the clean generated VoltTech shell.
- Converts `stream-scan.html` to the clean generated VoltTech shell.
- Preserves Stream Check `R299`, Stream Tune `R449`, and Stream Setup `R649`.
- Preserves the broader `Creator System Tune / quoted after assessment` route for complex dual-PC or capture-card first-time setups.
- Keeps remote-across-South-Africa positioning and the rule that VoltTech never needs creator passwords, 2FA codes or stream keys.
- Splits Stream Scan into:
  - `assets/js/services/stream-scan-model.js` — question branches, urgency and recommendations.
  - `assets/js/services/stream-scan-handoff.js` — journey storage and optional analytics.
  - `assets/js/pages/stream-scan.js` — page controller only.
- Reuses the clean Signal Scan visual system instead of retaining a second giant scan stylesheet.
- Preserves Creator Hub ↔ Streaming Support ↔ Stream Scan navigation.
- Leaves `streaming-setup-south-africa-dynamic.html` in place as the existing noindex redirect.
- Leaves old creator/streaming files in place until Step 6.3 proves which are orphaned.

## Backend boundary

The Creator Hub refresh blocker remains operationally unchanged from Step 6.1: the scheduled `refresh-sa-streamers` job is reaching the Edge Function every ten minutes, but Twitch's token endpoint is returning HTTP 403. Step 6.2 does not modify credentials or hide that condition.

## Inspect

Streaming Support:
https://raw.githack.com/VoltTechComputerCo/VoltTechComputerCo.github.io/clean-rebuild/streaming-setup-south-africa.html

Stream Scan:
https://raw.githack.com/VoltTechComputerCo/VoltTechComputerCo.github.io/clean-rebuild/stream-scan.html

Useful direct Stream Scan test:
https://raw.githack.com/VoltTechComputerCo/VoltTechComputerCo.github.io/clean-rebuild/stream-scan.html?issue=network

## Tests

```text
node scripts/test-clean-streaming.mjs
python scripts/build-clean-frontend.py --check
```
