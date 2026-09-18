/**
 * VoltTech Streamer Feed
 * V2 adapter: reads current creator/live state from Supabase and exposes
 * the same response shape previously supplied by sa-streamers-live.json.
 *
 * Temporary migration fallback:
 * If Supabase cannot be reached, the existing generated JSON feed is used.
 * Remove that fallback after the old GitHub streamer workflow is retired.
 */
(function () {
  'use strict';

  const SUPABASE_URL = 'https://qdqhfnvwqvgesfdmocir.supabase.co';
  const PUBLISHABLE_KEY = 'sb_publishable_f6rl6o43iQcwlSGDh9kqWw_mrHlxcN1';

  function legacyResponse(payload, status) {
    return new Response(JSON.stringify(payload), {
      status: status || 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    });
  }

  async function fetchSupabase() {
    const fields = [
      'login',
      'display_name',
      'profile_image_url',
      'description',
      'is_live',
      'viewer_count',
      'game_name',
      'title',
      'started_at',
      'last_live_at',
      'activity_score',
      'checked_at'
    ].join(',');

    const url =
      SUPABASE_URL +
      '/rest/v1/streamer_directory' +
      '?select=' + encodeURIComponent(fields) +
      '&order=is_live.desc,activity_score.desc,viewer_count.desc,display_name.asc';

    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        apikey: PUBLISHABLE_KEY,
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Supabase streamer feed returned HTTP ' + response.status);
    }

    const rows = await response.json();
    if (!Array.isArray(rows)) {
      throw new Error('Supabase streamer feed returned an invalid payload');
    }

    let latestCheck = null;

    const streamers = rows.map(function (row) {
      if (row.checked_at) {
        const checked = new Date(row.checked_at);
        if (!Number.isNaN(checked.getTime())) {
          if (!latestCheck || checked > latestCheck) latestCheck = checked;
        }
      }

      return {
        login: row.login,
        display_name: row.display_name,
        profile_image_url: row.profile_image_url || '',
        description: row.description || '',
        live: Boolean(row.is_live),
        viewer_count: Number(row.viewer_count || 0),
        game_name: row.game_name || '',
        title: row.title || '',
        started_at: row.started_at || null,
        last_live_at: row.last_live_at || null,
        activity_score: Number(row.activity_score || 0)
      };
    });

    return legacyResponse({
      source: 'supabase',
      generated_at: latestCheck ? latestCheck.toISOString() : new Date().toISOString(),
      tracked_count: streamers.length,
      valid_count: streamers.length,
      streamers: streamers
    });
  }

  async function fetchLegacyJson() {
    return fetch('sa-streamers-live.json?ts=' + Date.now(), {
      cache: 'no-store'
    });
  }

  async function fetchLegacy() {
    try {
      return await fetchSupabase();
    } catch (error) {
      console.warn('[VoltTech] Supabase streamer feed unavailable; using migration fallback.', error);

      try {
        const fallback = await fetchLegacyJson();
        if (fallback.ok) return fallback;
      } catch (fallbackError) {
        console.warn('[VoltTech] Legacy streamer fallback also unavailable.', fallbackError);
      }

      return legacyResponse({
        source: 'unavailable',
        generated_at: new Date().toISOString(),
        tracked_count: 0,
        valid_count: 0,
        streamers: []
      }, 503);
    }
  }

  window.VoltTechStreamerFeed = Object.freeze({
    fetchLegacy: fetchLegacy
  });
})();
