import { readLaunchSettings, connectCart, connectAccount, connectProductionServices } from './home-integrations.js';
import { isProduction, sdkUrl } from './site-config.js';
const base = new URL('../../../', import.meta.url);
let ready;
export async function withTimeout(promise, ms = 10000) {
  let timer;
  try { return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Connection timed out. Please try again.')), ms); })]); }
  finally { clearTimeout(timer); }
}
function script(path) {
  return withTimeout(new Promise((resolve, reject) => {
    const el = document.createElement('script'); el.src = new URL(path, base).href;
    el.onload = resolve; el.onerror = () => reject(new Error('The catalogue could not connect.')); document.head.append(el);
  }));
}
export function publicProducts(products, preview = false) {
  return (products || []).filter(p => p && typeof p.id === 'string' && p.status === 'active' && p.visibility === 'public' && p.sale_mode !== 'hidden' && (preview || p.is_demo === false));
}
async function core() {
  if (!ready) ready = (async () => {
    if (!window.supabase) await script(sdkUrl);
    const config = window.VOLTTECH_SUPABASE;
    if (!config?.url || !config?.publishableKey) throw new Error('Catalogue connection unavailable.');
    const production = isProduction();
    window.volttechAuth ||= window.supabase.createClient(config.url, config.publishableKey, { auth: { persistSession: production, autoRefreshToken: production, detectSessionInUrl: production } });
    await script('commerce/js/store-core.js');
    await script('commerce/js/catalogue-architecture.js');
    return window.VoltTechStore;
  })();
  return ready;
}
export async function openCatalogue() {
  connectCart(); connectProductionServices();
  const settings = await readLaunchSettings(window.VOLTTECH_SUPABASE);
  let preview = false;
  const previewRequested = new URLSearchParams(location.search).get('preview') === '1';
  if (!settings) return { open: false, reason: 'connection' };
  if (previewRequested && isProduction()) {
    try {
      const VT = await core();
      const { data: { user }, error } = await withTimeout(VT.getClient().auth.getUser());
      if (user && !error) { const result = await withTimeout(VT.getClient().rpc('is_volttech_admin')); preview = !result.error && result.data === true; }
    } catch { /* No verified administrator: the public launch gate still applies. */ }
  }
  if (!settings.catalogue_enabled && !preview) {
    connectAccount(window.VOLTTECH_SUPABASE);
    return { open: false, reason: previewRequested ? 'preview' : 'closed' };
  }
  const VT = await core();
  document.body.classList.toggle('store-preview', preview);
  connectAccount(window.VOLTTECH_SUPABASE);
  return { open: true, preview, VT, settings };
}
export function showGate(access) {
  const gate = document.getElementById('store-gate');
  gate.hidden = false; gate.dataset.state = access.reason || 'closed';
  document.getElementById('catalogue')?.setAttribute('hidden','');
  document.getElementById('product-detail')?.setAttribute('hidden','');
  const title = document.querySelector('[data-gate-title]');
  const copy = document.querySelector('[data-gate-copy]');
  if (access.reason === 'connection') {
    title.textContent = 'Catalogue connection unavailable.';
    copy.textContent = 'We could not check Store availability. Please reload the page or contact VoltTech about the component you need.';
  } else if (access.reason === 'preview') {
    copy.textContent = 'The catalogue is not open for shopping. Admin preview requires an authorised account on the VoltTech website; a preview link alone does not unlock it.';
  }
}
let notificationTimer;
export function notify(message) {
  const status = document.getElementById('commerce-status'); status.textContent = message;
  clearTimeout(notificationTimer); notificationTimer = setTimeout(() => { status.textContent = ''; }, 6000);
}
export function addItem(VT, p, preview) {
  if (preview || p.is_demo !== false || !VT.canAdd(p)) return;
  try { VT.addToCart(p.id, 1); notify(`${p.name} added to your cart.`); VT.analytics('add_to_cart', { currency: p.currency || 'ZAR', items: [{ item_id: p.id, item_name: p.name }] }); }
  catch { notify('Your browser could not save the cart. Please allow site storage or contact VoltTech.'); }
}
