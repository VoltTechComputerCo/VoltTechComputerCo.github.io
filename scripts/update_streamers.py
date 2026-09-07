#!/usr/bin/env python3
import json, os, urllib.parse, urllib.request
from datetime import datetime, timezone

ROOT = os.getcwd()
POOL_FILE = os.path.join(ROOT, "sa-streamers-pool.json")
OUT_FILE = os.path.join(ROOT, "sa-streamers-live.json")
CLIENT_ID = os.environ["TWITCH_CLIENT_ID"]
CLIENT_SECRET = os.environ["TWITCH_CLIENT_SECRET"]

def request_json(url, headers=None, data=None):
    req = urllib.request.Request(url, headers=headers or {}, data=data)
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))

def token():
    query = urllib.parse.urlencode({
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "grant_type": "client_credentials",
    })
    return request_json("https://id.twitch.tv/oauth2/token?" + query, data=b"")["access_token"]

def helix(path, params, bearer):
    qs = urllib.parse.urlencode(params, doseq=True)
    return request_json("https://api.twitch.tv/helix/" + path + "?" + qs,
        headers={"Client-Id": CLIENT_ID, "Authorization": "Bearer " + bearer})

with open(POOL_FILE, encoding="utf-8") as f:
    logins = [x.strip() for x in json.load(f)["streamers"] if x.strip()][:100]

bearer = token()
streams = helix("streams", [("user_login", x) for x in logins], bearer)["data"]
users = helix("users", [("login", x) for x in logins], bearer)["data"]
live = {x["user_login"].lower(): x for x in streams}
people = {x["login"].lower(): x for x in users}

old = {}
try:
    with open(OUT_FILE, encoding="utf-8") as f:
        old = {x["login"].lower(): x for x in json.load(f).get("streamers", [])}
except Exception:
    pass

now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
ranked = []

for login in logins:
    key = login.lower()
    s = live.get(key)
    u = people.get(key, {})
    prev = old.get(key, {})
    prior_activity = float(prev.get("activity_score") or 0)
    activity = min(100.0, prior_activity * 0.94 + (8.0 if s else 0.0))
    viewers = int(s.get("viewer_count", 0)) if s else 0
    last_live = now if s else prev.get("last_live_at")
    rank = (1_000_000 if s else 0) + activity * 1000 + min(viewers, 1000) * 2

    ranked.append({
        "login": u.get("login", login),
        "display_name": u.get("display_name", login),
        "profile_image_url": u.get("profile_image_url", ""),
        "live": bool(s),
        "viewer_count": viewers,
        "game_name": s.get("game_name", "") if s else "",
        "title": s.get("title", "") if s else "",
        "started_at": s.get("started_at") if s else None,
        "last_live_at": last_live,
        "activity_score": round(activity, 2),
        "_rank": rank
    })

ranked.sort(key=lambda x: (x["_rank"], x["display_name"].lower()), reverse=True)
public = []
for item in ranked[:20]:
    item.pop("_rank", None)
    public.append(item)

with open(OUT_FILE, "w", encoding="utf-8") as f:
    json.dump({"generated_at": now, "streamers": public}, f, indent=2, ensure_ascii=False)
    f.write("\n")

print(f"{sum(1 for x in public if x['live'])} live creators in current top 20.")
