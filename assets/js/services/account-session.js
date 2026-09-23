import { isProduction, sdkUrl } from './site-config.js';

let clientPromise = null;

export function isAccountInspection() {
  return !isProduction() && new URLSearchParams(location.search).get('inspect') === '1';
}

export function safeReturnPath() {
  const raw = new URLSearchParams(location.search).get('returnTo');
  if (!raw) return '';
  try {
    const url = new URL(raw, location.origin);
    if (url.origin !== location.origin) return '';
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    if (url.pathname.endsWith('/account.html')) return '';
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '';
  }
}

function loadClassicScript(src) {
  return new Promise((resolve, reject) => {
    const existing = [...document.scripts].find(script => script.src === src);
    if (existing?.dataset.loaded === '1') return resolve();
    const script = existing || document.createElement('script');
    if (!existing) {
      script.src = src;
      script.defer = true;
      document.head.append(script);
    }
    script.addEventListener('load', () => { script.dataset.loaded = '1'; resolve(); }, { once: true });
    script.addEventListener('error', reject, { once: true });
  });
}

export async function getAccountClient() {
  if (clientPromise) return clientPromise;
  clientPromise = (async () => {
    if (!isProduction()) throw new Error('Account sign-in is unavailable on this preview host.');
    const config = window.VOLTTECH_SUPABASE;
    if (!config?.url || !config?.publishableKey) throw new Error('Account configuration is unavailable.');
    if (!window.supabase) await loadClassicScript(sdkUrl);
    if (!window.supabase?.createClient) throw new Error('Account service could not start.');
    const client = window.volttechAuth || window.supabase.createClient(config.url, config.publishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    window.volttechAuth = client;
    return client;
  })();
  return clientPromise;
}

export function accountCallbackUrl(returnPath = safeReturnPath()) {
  return `${location.origin}/account.html${returnPath ? `?returnTo=${encodeURIComponent(returnPath)}` : ''}`;
}

export function continueAfterAuth(returnPath = safeReturnPath()) {
  if (!returnPath) return false;
  location.replace(returnPath);
  return true;
}

let notificationModulePromise = null;
export async function loadAccountNotifications(client) {
  if (!isProduction() || !client) return;
  const { data: { session } } = await client.auth.getSession();
  if (!session?.user) return;
  notificationModulePromise ||= import('./customer-notifications.js');
  try { const module = await notificationModulePromise; await module.initialiseCustomerNotifications(client); } catch {}
}

export async function accountIsAdmin(client) {
  if (!client) return false;
  try {
    const { data, error } = await client.rpc('is_volttech_admin');
    return !error && data === true;
  } catch {
    return false;
  }
}
