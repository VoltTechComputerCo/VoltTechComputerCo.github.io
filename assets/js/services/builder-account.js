import { REQUIRED_CATEGORIES, getBestOffer } from '../../../builder/js/build-engine.js?v=0.7.9';

const VT_ACCOUNT_VERSION = '3.3.0';
const PENDING_KEY = 'volttech-builder-account-pending-v3';
const ORDER = ['cpu','motherboard','memory','gpu','case','cooler','psu','storage','fans'];

let authClient = null;
let currentUser = null;
let currentSavedId = new URLSearchParams(location.search).get('savedBuild') || null;
let currentSavedStatus = null;
let restoring = false;
let catalogueReady = false;
let initDone = false;

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function safeB64Decode(value) {
  try {
    const normalized = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '==='.slice((normalized.length + 3) % 4);
    return JSON.parse(atob(padded));
  } catch (error) {
    console.warn('VoltTech build restore payload could not be decoded', error);
    return null;
  }
}

async function ensureAuth() {
  authClient ||= window.volttechAuth || null;
  if (!authClient) throw new Error('Account service could not be loaded.');
  const { data: { session } } = await authClient.auth.getSession();
  currentUser = session?.user || null;
  return authClient;
}

function installUi() {
  if (document.getElementById('vt-account-actions')) return;
  const summary = document.querySelector('.summary');
  if (!summary) return;
  const clear = document.getElementById('clear-build');
  const host = document.createElement('section');
  host.id = 'vt-account-actions';
  host.className = 'vt-account-actions';
  host.innerHTML = `
    <div class="vt-account-head">
      <span>VoltTech Account</span>
      <b id="vt-account-state">Checking account…</b>
    </div>
    <button type="button" class="vt-account-btn primary" id="vt-save-build">Save to my account</button>
    <button type="button" class="vt-account-btn" id="vt-request-quote">Request VoltTech quote</button>
    <a class="vt-account-link" href="../builds.html">My saved PC builds →</a>
    <p class="vt-account-message" id="vt-account-message" role="status" aria-live="polite"></p>`;
  summary.insertBefore(host, clear || null);

  document.getElementById('vt-save-build')?.addEventListener('click', () => performAccountAction('save'));
  document.getElementById('vt-request-quote')?.addEventListener('click', () => performAccountAction('quote'));
  document.getElementById('clear-build')?.addEventListener('click', () => {
    setTimeout(() => {
      if (readBuildSnapshot().items.length) return;
      currentSavedId = null;
      currentSavedStatus = null;
      const url = new URL(location.href);
      url.searchParams.delete('savedBuild');
      url.searchParams.delete('build');
      history.replaceState(null, '', url);
      renderAccountState();
      setMessage('Started a new unsaved build.');
    }, 0);
  });
}

function setMessage(text = '', tone = '') {
  const el = document.getElementById('vt-account-message');
  if (!el) return;
  el.textContent = text;
  el.className = `vt-account-message ${tone}`.trim();
}

function setBusy(busy) {
  const save = document.getElementById('vt-save-build');
  const quote = document.getElementById('vt-request-quote');
  if (save) save.disabled = Boolean(busy);
  if (quote) quote.disabled = Boolean(busy) || ['quote_requested','quoted'].includes(currentSavedStatus || '');
}

function renderAccountState() {
  const state = document.getElementById('vt-account-state');
  if (!state) return;
  state.textContent = currentUser ? (currentUser.email || 'Signed in') : 'Sign in required';
  const quote = document.getElementById('vt-request-quote');
  if (quote) {
    quote.textContent = currentSavedStatus === 'quote_requested' ? 'Quote requested ✓' : currentSavedStatus === 'quoted' ? 'Quote created ✓' : 'Request VoltTech quote';
    quote.disabled = ['quote_requested','quoted'].includes(currentSavedStatus || '');
  }
}

function catalogue() {
  return Array.isArray(window.__VT_BUILDER_CATALOGUE) ? window.__VT_BUILDER_CATALOGUE : [];
}

function productByName(type, name) {
  const target = String(name || '').trim();
  return catalogue().find(product => product.type === type && String(product.name || '').trim() === target) || null;
}

export function snapshotOffer(product) {
  const offer = getBestOffer(product);
  return {
    price: Number(offer?.price || 0),
    supplier: offer?.supplierName || offer?.supplier || offer?.source || '',
    supplier_sku: offer?.supplierSku || '',
    stock_status: offer?.stockStatus || 'stock-unconfirmed',
    price_checked_at: offer?.lastChecked || null,
    offer_freshness: offer?.freshness || 'unknown',
    offer_stale: offer?.stale === true,
    pricing_basis: offer ? 'supplier_estimate' : 'unpriced'
  };
}

function itemFromProduct(product, type, quantity = 1) {
  const offer = snapshotOffer(product);
  return {
    product_id: product.id,
    type,
    name: product.name,
    quantity,
    unit_price: offer.price,
    supplier: offer.supplier,
    supplier_sku: offer.supplier_sku,
    stock_status: offer.stock_status,
    price_checked_at: offer.price_checked_at,
    offer_freshness: offer.offer_freshness,
    offer_stale: offer.offer_stale,
    pricing_basis: offer.pricing_basis
  };
}

export function readBuildSnapshot() {
  const rows = [...document.querySelectorAll('#build-list > .build-item, #build-list > .build-group')];
  const serialized = { version: 3, categories: {} };
  const items = [];

  ORDER.forEach((type, index) => {
    const row = rows[index];
    if (!row) return;
    const ids = [];
    if (row.matches('details.build-group')) {
      row.querySelectorAll('.build-detail-row span').forEach(span => {
        const raw = span.textContent.trim();
        const match = raw.match(/^(.*?)(?:\s+×(\d+))?$/);
        const name = (match?.[1] || raw).trim();
        const quantity = Math.max(1, Number(match?.[2] || 1));
        const product = productByName(type, name);
        if (!product) return;
        for (let n = 0; n < quantity; n++) ids.push(product.id);
        items.push(itemFromProduct(product, type, quantity));
      });
    } else {
      const name = row.querySelector('b')?.textContent?.trim() || '';
      if (name && !/not selected|optional|integrated graphics/i.test(name)) {
        const product = productByName(type, name);
        if (product) {
          ids.push(product.id);
          items.push(itemFromProduct(product, type, 1));
        }
      }
    }
    if (ids.length) serialized.categories[type] = ids;
  });

  const selectedCpu = serialized.categories.cpu?.[0] ? catalogue().find(product => product.id === serialized.categories.cpu[0]) : null;
  const gpuOptional = !serialized.categories.gpu?.length && selectedCpu?.specs?.integratedGraphics === true;
  serialized.gpuOptional = gpuOptional;

  const complete = REQUIRED_CATEGORIES.every(type => {
    if (type === 'gpu' && gpuOptional) return true;
    return Array.isArray(serialized.categories[type]) && serialized.categories[type].length > 0;
  });
  const hardConflict = Boolean(document.querySelector('#report .report-item.bad'));
  const review = Boolean(document.querySelector('#report .report-item.warn, #report .report-item.unknown'));
  const compatibility = hardConflict ? 'conflict' : review ? 'review' : complete ? 'clear' : 'in_progress';
  const total = Number(items.reduce((sum, item) => sum + Number(item.unit_price || 0) * Number(item.quantity || 1), 0).toFixed(2));
  const powerText = document.querySelector('#power .power-grid strong')?.textContent || '';
  const estimatedPower = Number((powerText.match(/\d+/) || [])[0] || 0) || null;

  return {
    serialized,
    items,
    estimated_total: total,
    estimated_power_watts: estimatedPower,
    compatibility_status: compatibility,
    complete,
    hardConflict
  };
}

function defaultBuildName() {
  const date = new Intl.DateTimeFormat('en-ZA', { day:'2-digit', month:'short', year:'numeric' }).format(new Date());
  return `My PC Build — ${date}`;
}

async function ensureSignedIn(action, snapshot) {
  await ensureAuth();
  if (currentUser) return true;
  sessionStorage.setItem(PENDING_KEY, JSON.stringify({ action, snapshot, createdAt: Date.now() }));
  const returnTo = `${location.pathname}${location.search || ''}`;
  location.href = `../account.html?returnTo=${encodeURIComponent(returnTo)}`;
  return false;
}

async function getExistingBuild(id) {
  if (!id || !authClient || !currentUser) return null;
  const { data, error } = await authClient.from('saved_builds').select('id,name,status,user_id').eq('id', id).maybeSingle();
  if (error) {
    console.warn('Could not load saved-build state', error);
    return null;
  }
  return data || null;
}

async function saveSnapshot(snapshot, { silent = false } = {}) {
  await ensureAuth();
  if (!currentUser) throw new Error('Please sign in before saving this build.');
  if (!snapshot.items.length) throw new Error('Choose at least one component before saving.');

  const existing = await getExistingBuild(currentSavedId);
  const now = new Date().toISOString();
  const payload = {
    user_id: currentUser.id,
    name: existing?.name || defaultBuildName(),
    status: 'saved',
    build_data: {
      serialized: snapshot.serialized,
      items: snapshot.items,
      builder_version: `clean-v3.3+account-v${VT_ACCOUNT_VERSION}`,
      pricing_basis: 'supplier_estimate',
      captured_at: now
    },
    estimated_total: snapshot.estimated_total,
    estimated_power_watts: snapshot.estimated_power_watts,
    compatibility_status: snapshot.compatibility_status,
    updated_at: now
  };

  let result;
  if (existing && existing.status === 'saved') {
    result = await authClient.from('saved_builds').update(payload).eq('id', existing.id).eq('status', 'saved').select('id,status,name').single();
  } else {
    result = await authClient.from('saved_builds').insert(payload).select('id,status,name').single();
  }
  if (result.error) throw result.error;

  currentSavedId = result.data.id;
  currentSavedStatus = result.data.status;
  const url = new URL(location.href);
  url.searchParams.set('savedBuild', currentSavedId);
  url.searchParams.delete('build');
  history.replaceState(null, '', url);
  renderAccountState();
  if (!silent) setMessage('Saved to your VoltTech account.', 'good');
  return result.data;
}

async function requestQuote(snapshot) {
  if (!snapshot.complete) throw new Error('Finish the core build before requesting a quotation.');
  if (snapshot.hardConflict) throw new Error('Resolve the compatibility conflict before requesting a quotation.');
  const saved = await saveSnapshot(snapshot, { silent:true });
  const { data, error } = await authClient.rpc('customer_request_build_quote', { p_build_id: saved.id });
  if (error) throw error;
  currentSavedStatus = data?.status || 'quote_requested';
  renderAccountState();
  setMessage('Quote request sent to VoltTech. We’ll review stock, compatibility and final pricing before it becomes a normal account quote.', 'good');
}

async function performAccountAction(action) {
  const snapshot = readBuildSnapshot();
  try {
    setBusy(true);
    setMessage(action === 'quote' ? 'Preparing your quote request…' : 'Saving your build…');
    if (!await ensureSignedIn(action, snapshot)) return;
    if (action === 'quote') await requestQuote(snapshot);
    else await saveSnapshot(snapshot);
  } catch (error) {
    console.error('VoltTech account build action failed', error);
    setMessage(error?.message || 'That account action could not be completed.', 'bad');
  } finally {
    setBusy(false);
  }
}

async function waitForBuilderReady() {
  for (let i = 0; i < 80; i++) {
    if (catalogueReady && document.querySelector('#steps [data-category]') && catalogue().length) return true;
    await wait(50);
  }
  return false;
}

async function restoreSerialized(serialized) {
  if (restoring || !serialized?.categories) return false;
  restoring = true;
  try {
    if (!await waitForBuilderReady()) throw new Error('The builder catalogue did not finish loading.');
    document.getElementById('choose-advanced')?.click();
    await wait(120);
    const compatible = document.getElementById('compatible-only');
    if (compatible?.checked) {
      compatible.checked = false;
      compatible.dispatchEvent(new Event('change', { bubbles:true }));
      await wait(50);
    }

    for (const type of ORDER) {
      const ids = Array.isArray(serialized.categories[type]) ? serialized.categories[type] : [];
      if (!ids.length) continue;
      const step = [...document.querySelectorAll('#steps [data-category]')].find(el => el.dataset.category === type);
      step?.click();
      await wait(70);
      for (const id of ids) {
        const button = [...document.querySelectorAll('#products [data-select-product]')].find(el => el.dataset.selectProduct === id);
        if (!button || button.disabled) {
          console.warn('Could not restore component', type, id);
          continue;
        }
        button.click();
        await wait(70);
        if (type !== 'storage' && type !== 'fans') break;
        step?.click();
        await wait(40);
      }
    }
    if (compatible && !compatible.checked) {
      compatible.checked = true;
      compatible.dispatchEvent(new Event('change', { bubbles:true }));
    }
    setMessage('Saved build loaded. You can keep customising it.', 'good');
    return true;
  } finally {
    restoring = false;
  }
}

async function maybeRestore() {
  const params = new URLSearchParams(location.search);
  const encoded = params.get('build');
  let payload = encoded ? safeB64Decode(encoded) : null;
  const pendingRaw = sessionStorage.getItem(PENDING_KEY);
  let pending = null;
  if (pendingRaw) {
    try { pending = JSON.parse(pendingRaw); } catch {}
    sessionStorage.removeItem(PENDING_KEY);
    if (!payload && pending?.snapshot?.serialized) payload = pending.snapshot.serialized;
  }
  if (payload) await restoreSerialized(payload);

  if (currentSavedId && authClient && currentUser) {
    const existing = await getExistingBuild(currentSavedId);
    currentSavedStatus = existing?.status || null;
    renderAccountState();
  }

  if (pending?.action && pending?.snapshot) {
    try {
      const fresh = readBuildSnapshot();
      if (pending.action === 'quote') await requestQuote(fresh);
      else await saveSnapshot(fresh);
    } catch (error) {
      setMessage(error?.message || 'Could not complete the pending account action.', 'bad');
    }
  }
}

export async function initBuilderAccount() {
  if (initDone) return;
  initDone = true;
  installUi();
  try {
    await ensureAuth();
    renderAccountState();
    authClient.auth.onAuthStateChange((_event, sessionNow) => {
      currentUser = sessionNow?.user || null;
      renderAccountState();
    });
  } catch (error) {
    console.warn('VoltTech builder account integration unavailable', error);
    setMessage('Account tools are temporarily unavailable. The builder itself still works.', 'warn');
  }
  await maybeRestore();
}

window.addEventListener('volttech:catalogue-ready', () => { catalogueReady = true; });
if (Array.isArray(window.__VT_BUILDER_CATALOGUE)) catalogueReady = true;
