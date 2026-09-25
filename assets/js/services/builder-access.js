import { connectAccount, connectCart, connectProductionServices, readLaunchSettings } from './home-integrations.js';
import { isProduction, productionOrigins, sdkUrl } from './site-config.js';

const base = new URL('../../../', import.meta.url);
let clientPromise;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const absolute = new URL(src, base).href;
    const existing = [...document.scripts].find(script => script.src === absolute);
    if (existing) {
      if (window.supabase) return resolve();
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = absolute;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Builder account services could not load.'));
    document.head.append(script);
  });
}

export function inspectionAllowed(origin = location.origin, search = location.search) {
  return !productionOrigins.has(origin) && new URLSearchParams(search).get('inspect') === '1';
}

export async function getBuilderClient() {
  if (window.volttechAuth) return window.volttechAuth;
  if (!clientPromise) {
    clientPromise = (async () => {
      if (!window.supabase) await loadScript(sdkUrl);
      const config = window.VOLTTECH_SUPABASE;
      if (!window.supabase || !config?.url || !config?.publishableKey) throw new Error('Builder connection unavailable.');
      window.volttechAuth ||= window.supabase.createClient(config.url, config.publishableKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
      return window.volttechAuth;
    })();
  }
  return clientPromise;
}

export async function builderAccess() {
  connectCart();

  if (inspectionAllowed()) {
    return { open: true, inspect: true, preview: true, live: false, reason: 'inspection', settings: null, client: null };
  }

  if (!isProduction()) return { open: false, inspect: false, preview: false, live: false, reason: 'closed' };

  connectProductionServices();
  const config = window.VOLTTECH_SUPABASE;
  const settings = await readLaunchSettings(config);
  if (!settings) return { open: false, inspect: false, preview: false, live: false, reason: 'connection' };

  const previewRequested = new URLSearchParams(location.search).get('preview') === '1';
  if (settings.builder_enabled === true) {
    const client = await getBuilderClient();
    connectAccount(config);
    return { open: true, inspect: false, preview: false, live: true, reason: 'live', settings, client };
  }

  if (previewRequested) {
    try {
      const client = await getBuilderClient();
      const { data: { user }, error } = await client.auth.getUser();
      if (user && !error) {
        const admin = await client.rpc('is_volttech_admin');
        if (!admin.error && admin.data === true) {
          connectAccount(config);
          return { open: true, inspect: false, preview: true, live: false, reason: 'preview', settings, client };
        }
      }
    } catch { /* Public gate remains authoritative. */ }
  }

  connectAccount(config);
  return { open: false, inspect: false, preview: false, live: false, reason: previewRequested ? 'preview' : 'closed', settings };
}
