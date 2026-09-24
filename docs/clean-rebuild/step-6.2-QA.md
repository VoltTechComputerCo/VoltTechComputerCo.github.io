# Step 6.2 QA — Streaming Support and Stream Scan

## Baseline

- Parent / rollback commit: `93e6d62e02310b8dea92fc1471e63245f82f5ddd`
- Branch: `clean-rebuild`
- Supabase changes: none
- Deletions: none

## Streaming Support

- Clean generated site shell.
- Existing canonical and South Africa service intent retained.
- Current public starting offers retained:
  - Stream Check — R299
  - Stream Tune — R449
  - Stream Setup — R649
- Complex dual-PC / capture-card setup remains eligible for `Creator System Tune` quoted after assessment.
- Creator Hub and Stream Scan routes retained.
- Remote support boundary retained.
- No request for Twitch/YouTube password, 2FA code or stream key.

## Stream Scan

- Answer-based only; no claim of remote OBS, hardware, network or account inspection.
- Audio branch asks platform + setup type only.
- Encoding / rendering / FPS branch asks platform + output + GPU + setup type.
- Network / blurry branch asks platform + output + connection + upload.
- First-time setup branch can expand to connection/upload scope.
- Price/recommendation regression coverage:
  - Rendering → Stream Tune / R449.
  - Network → Stream Check → Tune if needed / R299–R449.
  - Single-PC first-time setup → Stream Setup / R649.
  - Dual-PC or capture-card first-time setup → Creator System Tune / quoted after assessment.
- WhatsApp and email result copy are generated only after the result exists.
- Journey context / analytics are isolated in a service module.

## Clean-frontend boundary

The changed routes no longer load:
- Google Fonts
- root `analytics.js`
- old `visual-system.css`
- old `visual-block-fix.css`
- `volttech-experience.js`

The migration deliberately does **not** delete `creator-system.css`, `streaming-support.css`, `service-network.css`, `stream-scan.css`, `creator-network.css`, `scan-system.css`, or `scan-handoff.js` in this step. Step 6.3 performs the final consumer audit.

## Existing creator backend blocker

No backend mutation is included. Twitch creator refresh is still failing at OAuth token creation with HTTP 403; Step 6.1 already made the Creator Hub truthfully suppress stale live status.

## Local package checks

- `node scripts/test-clean-streaming.mjs` — PASS
- JS syntax checks — PASS
- Generated HTML shell checks — PASS
