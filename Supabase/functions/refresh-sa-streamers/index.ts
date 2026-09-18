import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const secretKeyMap = Deno.env.get("SUPABASE_SECRET_KEYS");
const ADMIN_KEY = secretKeyMap
  ? JSON.parse(secretKeyMap)["default"]
  : Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const TWITCH_CLIENT_ID = Deno.env.get("TWITCH_CLIENT_ID") || "";
const TWITCH_CLIENT_SECRET = Deno.env.get("TWITCH_CLIENT_SECRET") || "";

if (!ADMIN_KEY) throw new Error("Supabase backend secret key is unavailable");

const admin = createClient(SUPABASE_URL, ADMIN_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

type Streamer = { login: string };
type StatusRow = {
  streamer_login: string;
  activity_score: number | string | null;
  last_live_at: string | null;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

function chunks<T>(items: T[], size = 100): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function twitchToken(): Promise<string> {
  const params = new URLSearchParams({
    client_id: TWITCH_CLIENT_ID,
    client_secret: TWITCH_CLIENT_SECRET,
    grant_type: "client_credentials"
  });
  const res = await fetch("https://id.twitch.tv/oauth2/token?" + params.toString(), { method: "POST" });
  if (!res.ok) throw new Error("Twitch token request failed: " + res.status);
  const body = await res.json();
  if (!body.access_token) throw new Error("Twitch token response did not contain access_token");
  return body.access_token;
}

async function helix(path: string, key: string, values: string[], bearer: string) {
  const url = new URL("https://api.twitch.tv/helix/" + path);
  for (const value of values) url.searchParams.append(key, value);
  const res = await fetch(url, {
    headers: {
      "Client-Id": TWITCH_CLIENT_ID,
      "Authorization": "Bearer " + bearer
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error("Twitch Helix " + path + " failed: " + res.status + " " + text.slice(0, 300));
  }
  const body = await res.json();
  return Array.isArray(body.data) ? body.data : [];
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "POST required" }, 405);

  try {
    const suppliedSecret = req.headers.get("x-volttech-refresh") || "";
    const { data: expectedSecret, error: secretError } = await admin.rpc("get_streamer_refresh_secret");
    if (secretError) throw new Error("Refresh-secret lookup failed: " + secretError.message);
    if (!suppliedSecret || suppliedSecret !== expectedSecret) return json({ error: "Forbidden" }, 403);

    if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
      throw new Error("TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET is not configured in Edge Function secrets");
    }

    const { data: streamerRows, error: streamerError } = await admin
      .from("streamers")
      .select("login")
      .eq("enabled", true)
      .order("sort_priority", { ascending: true });
    if (streamerError) throw new Error("Streamer query failed: " + streamerError.message);

    const streamers = (streamerRows || []) as Streamer[];
    const logins = streamers.map((x) => x.login.toLowerCase());
    if (!logins.length) throw new Error("No enabled streamer accounts are configured");

    const { data: previousRows, error: previousError } = await admin
      .from("streamer_status")
      .select("streamer_login,activity_score,last_live_at")
      .in("streamer_login", logins);
    if (previousError) throw new Error("Previous status query failed: " + previousError.message);

    const previous = new Map<string, StatusRow>();
    for (const row of (previousRows || []) as StatusRow[]) previous.set(row.streamer_login.toLowerCase(), row);

    const bearer = await twitchToken();
    const streams: any[] = [];
    const users: any[] = [];
    for (const batch of chunks(logins, 100)) {
      streams.push(...await helix("streams", "user_login", batch, bearer));
      users.push(...await helix("users", "login", batch, bearer));
    }

    if (users.length < Math.floor(logins.length * 0.8)) {
      throw new Error("Twitch returned only " + users.length + " user records for " + logins.length + " configured accounts; refresh aborted");
    }

    const live = new Map(streams.map((x) => [String(x.user_login).toLowerCase(), x]));
    const people = new Map(users.map((x) => [String(x.login).toLowerCase(), x]));
    const now = new Date().toISOString();
    const profiles: any[] = [];
    const statuses: any[] = [];
    const missing: string[] = [];

    for (const login of logins) {
      const user = people.get(login);
      const stream = live.get(login);
      const prev = previous.get(login);
      const priorActivity = Number(prev?.activity_score || 0);

      if (!user) {
        missing.push(login);
        continue;
      }

      profiles.push({
        login,
        display_name: user.display_name || login,
        profile_image_url: user.profile_image_url || "",
        description: String(user.description || "").trim(),
        enabled: true,
        updated_at: now,
        last_profile_sync_at: now
      });

      const activity = Math.min(100, priorActivity * 0.94 + (stream ? 8 : 0));
      statuses.push({
        streamer_login: login,
        is_live: Boolean(stream),
        viewer_count: stream ? Number(stream.viewer_count || 0) : 0,
        game_name: stream?.game_name || "",
        title: stream?.title || "",
        started_at: stream?.started_at || null,
        last_live_at: stream ? now : (prev?.last_live_at || null),
        activity_score: Number(activity.toFixed(2)),
        checked_at: now
      });
    }

    if (profiles.length) {
      const { error } = await admin.from("streamers").upsert(profiles, { onConflict: "login" });
      if (error) throw new Error("Streamer profile upsert failed: " + error.message);
    }
    if (statuses.length) {
      const { error } = await admin.from("streamer_status").upsert(statuses, { onConflict: "streamer_login" });
      if (error) throw new Error("Streamer status upsert failed: " + error.message);
    }
    if (missing.length) {
      const { error } = await admin.from("streamers").update({ enabled: false, updated_at: now }).in("login", missing);
      if (error) throw new Error("Missing streamer disable failed: " + error.message);
    }

    await admin.rpc("record_streamer_refresh_result", { p_success: true, p_error: null });
    return json({
      ok: true,
      checked_at: now,
      configured: logins.length,
      valid: profiles.length,
      live: statuses.filter((x) => x.is_live).length,
      disabled_missing: missing.length
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    try { await admin.rpc("record_streamer_refresh_result", { p_success: false, p_error: message }); } catch (_) {}
    console.error(message);
    return json({ error: message }, 500);
  }
});
