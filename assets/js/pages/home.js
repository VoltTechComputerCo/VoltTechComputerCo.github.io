import { readLaunchSettings, freshLiveCreators, connectCart, connectAccount, connectProductionServices } from '../services/home-integrations.js';

async function updateAvailability() {
  const settings = await readLaunchSettings(window.VOLTTECH_SUPABASE);
  const store = document.querySelector('#store-availability');
  const builder = document.querySelector('#builder-availability');
  if (store) store.textContent = settings?.catalogue_enabled ? 'Browse the catalogue. Product availability and pricing are shown in the Store.' : settings ? 'Store coming soon. Ask us about your next upgrade using the component cards above.' : 'Catalogue status unavailable. Ask us about your next upgrade using the component cards above.';
  if (builder) builder.textContent = settings?.builder_enabled ? 'Plan a configuration. Component supply, pricing and compatibility need confirmation.' : settings ? 'Interactive Builder coming soon. Talk to us about your goals and budget.' : 'Builder status unavailable. Talk to us about your goals and budget.';
  if (settings?.catalogue_enabled) document.querySelectorAll('[data-category]').forEach(link => {
    link.href = `store.html?category=${encodeURIComponent(link.dataset.category)}`;
    delete link.dataset.vtConversion;
  });
  if (settings?.builder_enabled) document.querySelectorAll('[data-builder-link]').forEach(link => {
    link.href = 'builder/index.html';
    link.textContent = 'START BUILDING →';
    delete link.dataset.vtConversion;
  });
}

async function updateCreators() {
  const status = document.querySelector('#creatorLiveCount');
  const list = document.querySelector('#creatorLiveList');
  if (!status || !list) return;
  try {
    if (!window.VoltTechStreamerFeed) throw new Error('Feed unavailable');
    const response = await window.VoltTechStreamerFeed.fetchLegacy();
    if (!response.ok) throw new Error('Feed unavailable');
    const creators = freshLiveCreators(await response.json());
    if (creators === null) throw new Error('Feed stale');
    status.textContent = creators.length ? `${creators.length} ${creators.length === 1 ? 'creator' : 'creators'} recently reported live · status may change.` : 'No live streams reported in the latest check.';
    creators.slice(0, 3).forEach(creator => {
      const link = document.createElement('a');
      link.href = `https://www.twitch.tv/${encodeURIComponent(creator.login)}`;
      link.textContent = `${creator.display_name || creator.login} ↗`;
      list.append(link);
    });
  } catch { status.textContent = 'Live status unavailable. Explore the Creator Hub to discover creators.'; }
}

function start() {
  connectProductionServices();
  connectCart();
  connectAccount(window.VOLTTECH_SUPABASE);
  updateAvailability();
  updateCreators();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
else start();
