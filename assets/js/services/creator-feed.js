const SUPABASE_URL = 'https://qdqhfnvwqvgesfdmocir.supabase.co';
const PUBLISHABLE_KEY = 'sb_publishable_f6rl6o43iQcwlSGDh9kqWw_mrHlxcN1';
const base = new URL('../../../', import.meta.url);
export const CREATOR_FRESH_MS = 20 * 60 * 1000;

function validTime(value) {
  const parsed = Date.parse(value || '');
  return Number.isFinite(parsed) ? parsed : null;
}

export function isFreshTimestamp(value, now = Date.now()) {
  const parsed = validTime(value);
  if (parsed == null) return false;
  const age = now - parsed;
  return age >= -60_000 && age <= CREATOR_FRESH_MS;
}

function safeLogin(value) {
  const login = String(value || '').toLowerCase();
  return /^[a-z0-9_]{1,25}$/.test(login) ? login : '';
}

function normaliseRows(rows, source, now, generatedAtHint = null) {
  const input = Array.isArray(rows) ? rows : [];
  let latest = validTime(generatedAtHint);
  for (const row of input) {
    const checked = validTime(row.checked_at);
    if (checked != null && (latest == null || checked > latest)) latest = checked;
  }
  const generatedAt = latest == null ? null : new Date(latest).toISOString();
  const fresh = isFreshTimestamp(generatedAt, now);
  const streamers = input.map(row => {
    const login = safeLogin(row.login);
    const rowFresh = source === 'supabase' ? isFreshTimestamp(row.checked_at, now) : fresh;
    return {
      login,
      displayName: String(row.display_name || login || 'Creator'),
      profileImageUrl: String(row.profile_image_url || ''),
      description: String(row.description || '').trim(),
      live: Boolean(fresh && rowFresh && (row.is_live ?? row.live) && login),
      viewerCount: Number(row.viewer_count || 0),
      gameName: String(row.game_name || ''),
      title: String(row.title || ''),
      startedAt: row.started_at || null,
      lastLiveAt: row.last_live_at || null,
      activityScore: Number(row.activity_score || 0),
      checkedAt: row.checked_at || generatedAt || null
    };
  }).filter(row => row.login);
  return {
    source,
    available: streamers.length > 0,
    fresh,
    generatedAt,
    ageMs: generatedAt ? Math.max(0, now - Date.parse(generatedAt)) : null,
    trackedCount: streamers.length,
    streamers
  };
}

async function fetchSupabase(request, now) {
  const fields = [
    'login','display_name','profile_image_url','description','is_live','viewer_count',
    'game_name','title','started_at','last_live_at','activity_score','checked_at'
  ].join(',');
  const url = `${SUPABASE_URL}/rest/v1/streamer_directory?select=${encodeURIComponent(fields)}&order=is_live.desc,activity_score.desc,viewer_count.desc,display_name.asc`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await request(url, {
      headers: { apikey: PUBLISHABLE_KEY, Accept: 'application/json' },
      cache: 'no-store',
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`Creator directory returned HTTP ${response.status}`);
    const rows = await response.json();
    return normaliseRows(rows, 'supabase', now);
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchFallback(request, now) {
  const url = new URL('sa-streamers-live.json', base);
  url.searchParams.set('ts', String(now));
  const response = await request(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Fallback creator directory returned HTTP ${response.status}`);
  const payload = await response.json();
  const result = normaliseRows(payload?.streamers, 'fallback', now, payload?.generated_at || null);
  result.trackedCount = Number(payload?.valid_count || payload?.tracked_count || result.streamers.length);
  return result;
}

export async function loadCreatorDirectory(request = fetch, now = Date.now()) {
  try {
    return await fetchSupabase(request, now);
  } catch (primaryError) {
    try {
      const result = await fetchFallback(request, now);
      result.primaryError = primaryError instanceof Error ? primaryError.message : String(primaryError);
      return result;
    } catch (fallbackError) {
      return {
        source: 'unavailable', available: false, fresh: false, generatedAt: null,
        ageMs: null, trackedCount: 0, streamers: [],
        error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
      };
    }
  }
}

export function creatorFeedAgeLabel(result) {
  if (!result?.generatedAt) return 'unknown';
  const minutes = Math.max(0, Math.floor((result.ageMs || 0) / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours} h ago`;
  return `${Math.floor(hours / 24)} d ago`;
}
