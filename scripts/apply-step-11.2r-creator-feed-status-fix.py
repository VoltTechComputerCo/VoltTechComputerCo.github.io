#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "assets/js/pages/creator-hub.js"
text = TARGET.read_text(encoding="utf-8")

OLD_STATUS = "function statusMessage() {\n  const state = q('#creatorFeedState');\n  const detail = q('#creatorFeedDetail');\n  if (!feed?.available) {\n    state.dataset.state = 'unavailable';\n    state.textContent = 'CREATOR DIRECTORY TEMPORARILY UNAVAILABLE';\n    detail.textContent = 'The directory could not be loaded. Try again shortly or open Twitch directly.';\n    return;\n  }\n  if (!feed.fresh) {\n    state.dataset.state = 'stale';\n    state.textContent = 'LIVE STATUS CURRENTLY UNAVAILABLE';\n    detail.textContent = `Directory data is available, but live status was last checked ${creatorFeedAgeLabel(feed)}. Stale rows are never shown as live.`;\n    return;\n  }\n  const live = creators.filter(row => row.live).length;\n  state.dataset.state = live ? 'live' : 'fresh';\n  state.textContent = live ? `${live} CREATOR${live === 1 ? '' : 'S'} LIVE NOW` : 'NO TRACKED CREATORS LIVE RIGHT NOW';\n  detail.textContent = `Live status checked ${creatorFeedAgeLabel(feed)}.`;\n}"
NEW_STATUS = "function statusMessage() {\n  const state = q('#creatorFeedState');\n  const label = state?.querySelector('strong');\n  const detail = q('#creatorFeedDetail');\n  if (!state || !label || !detail) return;\n  if (!feed?.available) {\n    state.dataset.state = 'unavailable';\n    label.textContent = 'CREATOR DIRECTORY TEMPORARILY UNAVAILABLE';\n    detail.textContent = 'The directory could not be loaded. Try again shortly or open Twitch directly.';\n    return;\n  }\n  if (!feed.fresh) {\n    state.dataset.state = 'stale';\n    label.textContent = 'LIVE STATUS CURRENTLY UNAVAILABLE';\n    detail.textContent = `Directory data is available, but live status was last checked ${creatorFeedAgeLabel(feed)}. Stale rows are never shown as live.`;\n    return;\n  }\n  const live = creators.filter(row => row.live).length;\n  state.dataset.state = live ? 'live' : 'fresh';\n  label.textContent = live ? `${live} CREATOR${live === 1 ? '' : 'S'} LIVE NOW` : 'NO TRACKED CREATORS LIVE RIGHT NOW';\n  detail.textContent = `Live status checked ${creatorFeedAgeLabel(feed)}.`;\n}"
OLD_REFRESH = "async function refresh() {\n  q('#creatorFeedState').textContent = 'CHECKING CREATOR DIRECTORY…';\n  feed = await loadCreatorDirectory();\n  creators = feed.streamers || [];\n  setMeta(); statusMessage(); renderLive(); renderDirectory();\n}"
NEW_REFRESH = "async function refresh() {\n  const state = q('#creatorFeedState');\n  const label = state?.querySelector('strong');\n  const detail = q('#creatorFeedDetail');\n  if (state) state.dataset.state = 'loading';\n  if (label) label.textContent = 'CHECKING CREATOR DIRECTORY…';\n  if (detail) detail.textContent = 'Loading the latest available creator status.';\n  feed = await loadCreatorDirectory();\n  creators = feed.streamers || [];\n  setMeta(); statusMessage(); renderLive(); renderDirectory();\n}"

for label, old, new in [
    ("statusMessage", OLD_STATUS, NEW_STATUS),
    ("refresh", OLD_REFRESH, NEW_REFRESH),
]:
    count = text.count(old)
    if count != 1:
        if new in text and count == 0:
            print("PASS already applied:", label)
            continue
        raise RuntimeError(f"{label}: expected exactly one old block, found {count}")
    text = text.replace(old, new, 1)
    print("Applied:", label)

TARGET.write_text(text, encoding="utf-8")
print("STEP 11.2R PREPARED")
