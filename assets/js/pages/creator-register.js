import {
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
