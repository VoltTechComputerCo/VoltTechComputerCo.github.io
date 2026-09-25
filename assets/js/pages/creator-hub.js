import { loadCreatorDirectory, creatorFeedAgeLabel } from '../services/creator-feed.js';

const q = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[char]));
const fallbackAvatar = 'assets/brand/volttech-logo.webp';
let creators = [];
let selectedLogin = '';
let searchTerm = '';
let feed = null;

function safeImage(value) {
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : fallbackAvatar; }
  catch { return fallbackAvatar; }
}
function twitchUrl(login) { return `https://www.twitch.tv/${encodeURIComponent(login)}`; }
function relativeLastLive(value) {
  const time = Date.parse(value || '');
  if (!Number.isFinite(time)) return 'recent activity unavailable';
  const hours = Math.max(0, Math.floor((Date.now() - time) / 3600000));
  if (hours < 1) return 'active within the last hour';
  if (hours < 24) return `last active about ${hours} h ago`;
  const days = Math.floor(hours / 24);
  return `last active about ${days} d ago`;
}
function statusMessage() {
  const state = q('#creatorFeedState');
  const detail = q('#creatorFeedDetail');
  if (!feed?.available) {
    state.dataset.state = 'unavailable';
    state.textContent = 'CREATOR DIRECTORY TEMPORARILY UNAVAILABLE';
    detail.textContent = 'The directory could not be loaded. Try again shortly or open Twitch directly.';
    return;
  }
  if (!feed.fresh) {
    state.dataset.state = 'stale';
    state.textContent = 'LIVE STATUS CURRENTLY UNAVAILABLE';
    detail.textContent = `Directory data is available, but live status was last checked ${creatorFeedAgeLabel(feed)}. Stale rows are never shown as live.`;
    return;
  }
  const live = creators.filter(row => row.live).length;
  state.dataset.state = live ? 'live' : 'fresh';
  state.textContent = live ? `${live} CREATOR${live === 1 ? '' : 'S'} LIVE NOW` : 'NO TRACKED CREATORS LIVE RIGHT NOW';
  detail.textContent = `Live status checked ${creatorFeedAgeLabel(feed)}.`;
}
function setMeta() {
  q('#trackedCount').textContent = feed?.trackedCount || creators.length || '—';
  q('#updatedAt').textContent = feed?.generatedAt ? new Date(feed.generatedAt).toLocaleString('en-ZA', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : '—';
  q('#feedSource').textContent = feed?.source === 'supabase' ? 'Supabase directory' : feed?.source === 'fallback' ? 'repository fallback' : 'unavailable';
}
function setPlayer(row) {
  selectedLogin = row?.login || '';
  q('#playerName').textContent = row?.displayName || 'Creator Hub';
  q('#playerDetail').textContent = row ? ([row.gameName, row.live && row.viewerCount ? `${row.viewerCount.toLocaleString()} viewers` : ''].filter(Boolean).join(' · ') || relativeLastLive(row.lastLiveAt)) : 'South African Twitch creators';
  const link = q('#playerLink');
  link.href = row ? twitchUrl(row.login) : 'https://www.twitch.tv/directory';
  const profile = q('#creatorProfile');
  if (row) {
    profile.hidden = false;
    q('#creatorAvatar').src = safeImage(row.profileImageUrl);
    q('#creatorAvatar').alt = `${row.displayName} profile image`;
    q('#creatorProfileName').textContent = row.displayName;
    q('#creatorBio').textContent = row.description || 'South African Twitch creator.';
  } else profile.hidden = true;

  const video = q('#playerVideo');
  video.replaceChildren();
  if (row?.live && feed?.fresh) {
    const iframe = document.createElement('iframe');
    iframe.title = `${row.displayName} Twitch stream`;
    iframe.src = `https://player.twitch.tv/?channel=${encodeURIComponent(row.login)}&parent=${encodeURIComponent(location.hostname)}&autoplay=true&muted=true`;
    iframe.allow = 'autoplay; fullscreen';
    iframe.allowFullscreen = true;
    video.append(iframe);
  } else {
    const placeholder = document.createElement('div');
    placeholder.className = 'creator-player-placeholder';
    placeholder.textContent = feed?.fresh && row ? `${row.displayName} is not live right now. Open the channel on Twitch to follow the next stream.` : 'Live playback is hidden until the creator feed has a fresh status check.';
    video.append(placeholder);
  }
  document.querySelectorAll('[data-live-login]').forEach(button => button.classList.toggle('active', button.dataset.liveLogin === selectedLogin));
}
function renderLive() {
  const list = q('#liveCreatorList');
  const live = feed?.fresh ? creators.filter(row => row.live) : [];
  if (!live.length) {
    list.innerHTML = `<div class="creator-empty">${feed?.fresh ? 'No tracked creators are live right now. Browse recently active channels below.' : 'Live creator status is unavailable until the Twitch refresh succeeds again.'}</div>`;
    const current = creators.find(row => row.login === selectedLogin);
    if (!current) setPlayer(creators.find(row => row.lastLiveAt) || creators[0] || null);
    return;
  }
  const ordered = [...live].sort((a,b) => (b.activityScore - a.activityScore) || (a.viewerCount - b.viewerCount));
  list.innerHTML = ordered.slice(0, 8).map(row => `<button class="creator-live-choice" type="button" data-live-login="${esc(row.login)}"><span><b>${esc(row.displayName)}</b><em>LIVE</em></span><small>${esc([row.gameName, `${row.viewerCount.toLocaleString()} viewers`].filter(Boolean).join(' · '))}</small></button>`).join('');
  list.querySelectorAll('[data-live-login]').forEach(button => button.addEventListener('click', () => setPlayer(creators.find(row => row.login === button.dataset.liveLogin))));
  const current = live.find(row => row.login === selectedLogin);
  setPlayer(current || ordered[0]);
}
function renderDirectory() {
  const target = q('#creatorGrid');
  const term = searchTerm.trim().toLowerCase();
  const ordered = [...creators].sort((a,b) => Number(b.live) - Number(a.live) || Date.parse(b.lastLiveAt || 0) - Date.parse(a.lastLiveAt || 0) || a.displayName.localeCompare(b.displayName));
  const filtered = ordered.filter(row => !term || row.displayName.toLowerCase().includes(term) || row.login.includes(term) || row.gameName.toLowerCase().includes(term));
  if (!filtered.length) { target.innerHTML = '<div class="creator-empty">No creators match that search.</div>'; return; }
  target.innerHTML = filtered.slice(0, 30).map(row => `<a class="creator-directory-card${row.live && feed?.fresh ? ' is-live' : ''}" href="${twitchUrl(row.login)}" target="_blank" rel="noopener"><img src="${esc(safeImage(row.profileImageUrl))}" alt="" loading="lazy"><span><b>${esc(row.displayName)}</b><small>${row.live && feed?.fresh ? `LIVE · ${esc(row.gameName || 'Twitch')}` : esc(relativeLastLive(row.lastLiveAt))}</small></span></a>`).join('');
}
async function refresh() {
  q('#creatorFeedState').textContent = 'CHECKING CREATOR DIRECTORY…';
  feed = await loadCreatorDirectory();
  creators = feed.streamers || [];
  setMeta(); statusMessage(); renderLive(); renderDirectory();
}
function init() {
  q('#creatorSearch').addEventListener('input', event => { searchTerm = event.target.value; renderDirectory(); });
  refresh().catch(() => { feed = { available:false, fresh:false, streamers:[], trackedCount:0 }; creators=[]; setMeta(); statusMessage(); renderLive(); renderDirectory(); });
  window.setInterval(() => refresh().catch(() => {}), 5 * 60 * 1000);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true }); else init();
