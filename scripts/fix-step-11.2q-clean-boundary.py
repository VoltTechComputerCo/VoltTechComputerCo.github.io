#!/usr/bin/env python3
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]

service = r"""import { getAccountClient } from './account-session.js';

const SUPABASE_URL = 'https://qdqhfnvwqvgesfdmocir.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_f6rl6o43iQcwlSGDh9kqWw_mrHlxcN1';
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/creator-register`;
const LIVE_HOSTS = new Set(['volttechcomputerco.co.za', 'www.volttechcomputerco.co.za']);

window.VOLTTECH_SUPABASE ||= {
  url: SUPABASE_URL,
  publishableKey: SUPABASE_PUBLISHABLE_KEY
};

async function requestRegistration(options = {}) {
  const response = await fetch(FUNCTION_URL, {
    ...options,
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body?.error || `Creator registration returned HTTP ${response.status}`);
  }
  return body;
}

async function volttechAccessToken() {
  if (!LIVE_HOSTS.has(location.hostname)) return '';
  try {
    const client = await getAccountClient();
    const { data: { session } } = await client.auth.getSession();
    return session?.access_token || '';
  } catch {
    return '';
  }
}

export function creatorRegistrationAvailableHere() {
  return LIVE_HOSTS.has(location.hostname);
}

export async function beginTwitchCreatorRegistration({ southAfricaConfirmed }) {
  if (!southAfricaConfirmed) {
    throw new Error('Confirm that you are a South African creator first.');
  }
  if (!creatorRegistrationAvailableHere()) {
    throw new Error('Twitch connection is enabled on the live .co.za site. This preview remains safe for visual inspection.');
  }

  const config = await requestRegistration();
  const state = crypto.randomUUID();

  sessionStorage.setItem('vt_twitch_oauth_state', state);
  sessionStorage.setItem('vt_creator_sa_confirmed', '1');

  const url = new URL('https://id.twitch.tv/oauth2/authorize');
  url.searchParams.set('response_type', 'token');
  url.searchParams.set('client_id', config.client_id);
  url.searchParams.set('redirect_uri', config.redirect_uri);
  url.searchParams.set('scope', config.scope || 'openid');
  url.searchParams.set('state', state);
  url.searchParams.set('force_verify', 'true');

  location.assign(url.href);
}

export async function completeTwitchCreatorRegistrationFromLocation() {
  const query = new URLSearchParams(location.search);
  if (query.get('error')) {
    const message = query.get('error_description') || 'Twitch sign-in was cancelled.';
    history.replaceState(null, '', location.pathname);
    return { state: 'error', message };
  }

  if (!location.hash.includes('access_token=')) return { state: 'idle' };

  const fragment = new URLSearchParams(location.hash.slice(1));
  const accessToken = fragment.get('access_token') || '';
  const returnedState = fragment.get('state') || '';
  const expectedState = sessionStorage.getItem('vt_twitch_oauth_state') || '';
  const confirmed = sessionStorage.getItem('vt_creator_sa_confirmed') === '1';

  // Remove the bearer token from the address bar immediately.
  history.replaceState(null, '', location.pathname);

  if (!accessToken) return { state: 'error', message: 'Twitch did not return an access token.' };
  if (!expectedState || returnedState !== expectedState) {
    return { state: 'error', message: 'Twitch verification state did not match. Please try connecting again.' };
  }
  if (!confirmed) {
    return { state: 'error', message: 'South African creator confirmation was not retained. Please try again.' };
  }

  sessionStorage.removeItem('vt_twitch_oauth_state');
  sessionStorage.removeItem('vt_creator_sa_confirmed');

  const accountToken = await volttechAccessToken();
  const result = await requestRegistration({
    method: 'POST',
    body: JSON.stringify({
      twitch_access_token: accessToken,
      south_africa_confirmed: true,
      volttech_access_token: accountToken || undefined
    })
  });

  return {
    state: 'success',
    creator: result.creator,
    volttechAccountLinked: result.volttech_account_linked === true
  };
}
"""

controller = r"""import {
  beginTwitchCreatorRegistration,
  completeTwitchCreatorRegistrationFromLocation
} from '../services/creator-registration.js';

const q = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;'
}[char]));

function setStatus(message = '', type = '') {
  const el = q('#creatorRegisterStatus');
  el.textContent = message;
  el.dataset.type = type;
}

function showCreator(creator, linked) {
  const target = q('#creatorRegisterResult');
  target.hidden = false;
  target.innerHTML = `
    <img src="${esc(creator.profile_image_url || 'assets/brand/volttech-logo.webp')}" alt="">
    <div><p class="eyebrow">CREATOR ADDED</p><h3>${esc(creator.display_name || creator.login)}</h3>
    <p>@${esc(creator.login)} · ${linked ? 'Linked to your VoltTech account.' : 'Registered as a standalone creator.'}</p></div>
    <a class="button button-secondary" href="${esc(creator.twitch_url)}" target="_blank" rel="noopener">Open Twitch ↗</a>`;
  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function connect() {
  const button = q('#connectTwitch');
  button.disabled = true;
  setStatus('Preparing Twitch sign-in…');

  try {
    await beginTwitchCreatorRegistration({
      southAfricaConfirmed: q('#creatorSouthAfrica').checked
    });
  } catch (error) {
    setStatus(error instanceof Error ? error.message : String(error), 'error');
    button.disabled = false;
  }
}

async function resume() {
  setStatus('');
  try {
    const result = await completeTwitchCreatorRegistrationFromLocation();
    if (result.state === 'idle') return;
    if (result.state === 'error') {
      setStatus(result.message, 'error');
      return;
    }
    showCreator(result.creator, result.volttechAccountLinked);
    setStatus('Twitch verified. Your channel has been added to Creator Hub.', 'success');
  } catch (error) {
    setStatus(error instanceof Error ? error.message : String(error), 'error');
  }
}

function init() {
  q('#connectTwitch').addEventListener('click', connect);
  resume();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
"""

service_path = ROOT / 'assets/js/services/creator-registration.js'
service_path.parent.mkdir(parents=True, exist_ok=True)
service_path.write_text(service, encoding='utf-8')

controller_path = ROOT / 'assets/js/pages/creator-register.js'
controller_path.write_text(controller, encoding='utf-8')

config_path = ROOT / 'src/pages/creator-register.json'
config = json.loads(config_path.read_text(encoding='utf-8'))
config.pop('classic_scripts', None)
config_path.write_text(json.dumps(config, indent=2) + '\n', encoding='utf-8')

print('PASS: Step 11.2Q clean integration boundary applied')
