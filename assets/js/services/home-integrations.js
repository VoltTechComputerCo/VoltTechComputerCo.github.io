import { isProduction, sdkUrl } from './site-config.js';
const base = new URL('../../../', import.meta.url);
const cartKey = 'vt_store_quote_cart_v1';

export function normaliseLaunchSettings(row) {
  return { catalogue_enabled: row?.catalogue_enabled === true, builder_enabled: row?.builder_enabled === true };
}

export async function readLaunchSettings(config, request = fetch) {
  if (!config?.url || !config?.publishableKey) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await request(`${config.url}/rest/v1/store_settings?id=eq.store&select=catalogue_enabled,builder_enabled`, {
      headers: { apikey: config.publishableKey, Accept: 'application/json' }, cache: 'no-store', signal: controller.signal
    });
    if (!response.ok) return null;
    const rows = await response.json();
    return Array.isArray(rows) && rows.length === 1 ? normaliseLaunchSettings(rows[0]) : null;
  } catch { return null; } finally { clearTimeout(timeout); }
}

export function cartQuantity(raw) {
  try {
    const rows = JSON.parse(raw || '[]');
    if (!Array.isArray(rows)) return 0;
    return rows.reduce((sum, row) => sum + (typeof row?.productId === 'string' && Number.isInteger(row.quantity) && row.quantity > 0 && row.quantity <= 25 ? row.quantity : 0), 0);
  } catch { return 0; }
}

export function freshLiveCreators(payload, now = Date.now()) {
  if (payload?.source === 'unavailable' || !Array.isArray(payload?.streamers)) return null;
  const fresh = value => { const age = now - Date.parse(value); return Number.isFinite(age) && age >= -60000 && age <= 20 * 60000; };
  if (!fresh(payload.generated_at)) return null;
  return payload.streamers.filter(row => row.live === true && fresh(payload.source === 'supabase' ? row.checked_at : (row.checked_at || payload.generated_at)) && /^[a-zA-Z0-9_]{1,25}$/.test(row.login || ''));
}

export function connectCart() {
  const links = document.querySelectorAll('[data-cart-link]');
  if (!links.length) return;
  function update() {
    let count = 0;
    try { count = cartQuantity(localStorage.getItem(cartKey)); } catch { /* Storage may be blocked. */ }
    links.forEach(link => {
      const badge = link.querySelector('[data-cart-count]');
      if (badge) {
        badge.textContent = count > 99 ? '99+' : String(count);
        badge.hidden = !count;
      }
      link.setAttribute('aria-label', count ? `Open cart, ${count} ${count === 1 ? 'item' : 'items'}` : 'Open cart');
    });
  }
  update();
  window.addEventListener('storage', event => { if (!event.key || event.key === cartKey) update(); });
  window.addEventListener('vt-store-cart-change', update);
}

function loadScript(path) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = new URL(path, base).href;
    script.onload = resolve; script.onerror = reject; document.head.append(script);
  });
}

export async function connectAccount(config) {
  // GitHack cannot share the site's authenticated session. Keep it public-only.
  if (!isProduction() || !config) return;
  let cached = false;
  try { cached = Object.keys(localStorage).some(key => /^sb-.*-auth-token$/.test(key)); } catch { return; }
  if (!cached) return;
  try {
    if (!window.supabase) await loadScript(sdkUrl);
    window.volttechAuth ||= window.supabase.createClient(config.url, config.publishableKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
    const client = window.volttechAuth;
    const label = document.querySelector('[data-account-label]');
    const update = session => { if (label) label.textContent = session ? 'My account' : 'Account'; };
    const { data } = await client.auth.getSession();
    update(data.session);
    client.auth.onAuthStateChange((_event, session) => update(session));
    await loadScript('notifications.js');
  } catch { /* Account link remains usable if the optional enhancement fails. */ }
}

export function connectProductionServices() {
  if (!isProduction()) return;
  window.dataLayer ||= [];
  window.gtag ||= function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', 'G-QQ3CC70MBE');
  loadScript('https://www.googletagmanager.com/gtag/js?id=G-QQ3CC70MBE').catch(() => {});
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href*="wa.me/27618435775"]');
    if (link) window.gtag('event', 'whatsapp_click', { page_path: location.pathname, link_text: link.textContent.trim() });
  });
  if ('serviceWorker' in navigator) navigator.serviceWorker.register(new URL('sw.js', base)).then(reg => reg.update()).catch(() => {});
}
