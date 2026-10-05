import { readLaunchSettings, freshLiveCreators, connectCart, connectAccount, connectProductionServices } from '../services/home-integrations.js';
import { installCategoryFilterMenus } from '../components/store-filter-menu.js?v=1.2.0';

async function loadSupplierHighlights() {
  const config = window.VOLTTECH_SUPABASE;
  if (!config?.url || !config?.publishableKey) return [];
  try {
    const response = await fetch(`${config.url}/rest/v1/rpc/get_public_supplier_highlights`, {
      method: 'POST',
      headers: {
        apikey: config.publishableKey,
        Authorization: `Bearer ${config.publishableKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: '{}',
      cache: 'no-store'
    });
    if (!response.ok) throw new Error(`Supplier highlights unavailable: ${response.status}`);
    const rows = await response.json();
    if (!Array.isArray(rows)) return [];
    rows.forEach(product => {
      const card = document.querySelector(`[data-category="${CSS.escape(product.category_slug || '')}"]`);
      const image = card?.querySelector('img');
      if (!card || !image || !product.id) return;
      image.src = `${config.url}/functions/v1/resolve-product-image?id=${encodeURIComponent(product.id)}`;
      image.alt = product.name || `${product.brand || ''} ${product.category_slug || 'component'}`.trim();
      image.referrerPolicy = 'no-referrer';
      card.dataset.supplierProduct = product.id;
    });
    return rows;
  } catch (error) {
    console.warn('Supplier-backed homepage highlights unavailable', error);
    return [];
  }
}

async function updateAvailability() {
  const [settings, supplierHighlights] = await Promise.all([
    readLaunchSettings(window.VOLTTECH_SUPABASE),
    loadSupplierHighlights()
  ]);
  const store = document.querySelector('#store-availability');
  const builder = document.querySelector('#builder-availability');
  if (store) store.textContent = settings?.catalogue_enabled
    ? (supplierHighlights.length
      ? 'Browse supplier-backed components. Stock and final pricing are confirmed before payment.'
      : 'Supplier catalogue syncing. Only verified supplier-backed products will appear in the Store.')
    : settings
      ? 'Store coming soon. Ask us about your next upgrade using the component cards above.'
      : 'Catalogue status unavailable. Ask us about your next upgrade using the component cards above.';
  if (builder) builder.textContent = settings?.builder_enabled ? 'Plan a configuration. Component supply, pricing and compatibility need confirmation.' : settings ? 'Interactive Builder coming soon. Talk to us about your goals and budget.' : 'Builder status unavailable. Talk to us about your goals and budget.';
  if (settings?.catalogue_enabled) {
    document.querySelectorAll('[data-category]').forEach(link => {
      link.href = `store.html?category=${encodeURIComponent(link.dataset.category)}`;
      delete link.dataset.vtConversion;
    });
    installCategoryFilterMenus(document);
  }
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
