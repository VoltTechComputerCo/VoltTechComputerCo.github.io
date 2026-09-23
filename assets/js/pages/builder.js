import { builderAccess } from '../services/builder-access.js';
import { installBuilderDialog } from '../components/builder-dialog.js';
import { enhanceBuilderExperience } from './builder-experience.js';

const body = document.body;
const gate = document.getElementById('builderGate');
const app = document.getElementById('builderApp');
const state = document.getElementById('builderState');
const safety = document.getElementById('builderSafety');

function showGate(reason = 'closed') {
  body.classList.remove('builder-open', 'builder-preview', 'builder-inspect');
  body.classList.add('builder-gated');
  gate.hidden = false;
  app.hidden = true;
  window.__VT_BUILDER_PREVIEW = false;
  window.__VT_BUILDER_INSPECT = false;
  if (state) state.textContent = 'BUILDER PAUSED';
  const title = gate.querySelector('[data-builder-gate-title]');
  const copy = gate.querySelector('[data-builder-gate-copy]');
  if (reason === 'connection') {
    title.textContent = 'Builder connection unavailable.';
    copy.textContent = 'We could not verify Builder availability. Reload the page or contact VoltTech for help planning a PC.';
  } else if (reason === 'preview') {
    title.textContent = 'PC Builder remains paused.';
    copy.textContent = 'Admin preview requires an authorised VoltTech account on the production website.';
  }
}

async function openBuilder(access) {
  body.classList.remove('builder-gated');
  body.classList.add('builder-open');
  body.classList.toggle('builder-preview', access.preview && !access.inspect);
  body.classList.toggle('builder-inspect', access.inspect);
  gate.hidden = true;
  app.hidden = false;
  window.__VT_BUILDER_PREVIEW = Boolean(access.preview);
  window.__VT_BUILDER_INSPECT = Boolean(access.inspect);

  if (state) state.textContent = access.inspect ? 'READ-ONLY INSPECTION' : access.preview ? 'ADMIN PREVIEW / LOCKED' : 'BUILDER LIVE';
  if (safety) {
    safety.hidden = !(access.preview || access.inspect);
    safety.classList.toggle('notice-warning', Boolean(access.preview && !access.inspect));
    safety.innerHTML = access.inspect
      ? '<strong>READ-ONLY INSPECTION.</strong> Prototype catalogue data only. No account, Store overlay, analytics, notifications, service worker, save or quote-request services are initialised.'
      : '<strong>ADMIN PREVIEW.</strong> Builder remains locked to customers. Save and quote-request tools are not initialised.';
  }

  installBuilderDialog();
  await import(new URL('../../../builder/js/app.js?v=3.2.0', import.meta.url));
  enhanceBuilderExperience();
  await import(new URL('../../../commerce/js/builder-handoff.js?v=1.1.0', import.meta.url));

  if (access.live) {
    await import(new URL('../../../builder/js/account-integration.js?v=2.2.0', import.meta.url));
  }
}

showGate();
try {
  const access = await builderAccess();
  if (access.open) await openBuilder(access);
  else showGate(access.reason);
} catch (error) {
  console.error('VoltTech Builder launch gate:', error);
  showGate('connection');
}
