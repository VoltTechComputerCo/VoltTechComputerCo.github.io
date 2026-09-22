// Behaviour contracts at the migration boundary; not a substitute for device QA.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = name => fs.readFileSync(path.join(root, name), 'utf8');
const handlers = {};
let body = '';
let status = 200;
let contentType = 'text/html';
const self = {
  location: { origin: 'https://example.test' },
  registration: { scope: 'https://example.test/' },
  addEventListener: (name, fn) => { handlers[name] = fn; }
};
vm.runInNewContext(source('sw.js'), {
  self, URL, Headers, Response,
  fetch: async () => new Response(body, { status, headers: { 'content-type': contentType, 'etag': 'original' } })
});
async function navigate(html, overrides = {}) {
  body = html;
  let promise;
  handlers.fetch({ request: { mode: 'navigate', url: 'https://example.test/page.html', ...overrides }, respondWith: p => { promise = p; } });
  return await promise;
}
const clean = '<html lang="en-ZA" data-vt-shell="clean"><body>analytics.js?v=5</body></html>';
let response = await navigate(clean);
assert.equal(await response.text(), clean, 'Clean page is byte-for-byte unchanged');
assert.equal(response.headers.get('etag'), 'original');
response = await navigate('<html><body>analytics.js?v=5</body></html>');
const legacy = await response.text();
assert.ok(legacy.includes('analytics.js?v=6'), 'Legacy version update preserved');
assert.ok(legacy.includes('https://example.test/site-notifications-loader.js?v=6.0.0'), 'Legacy notifications preserved');
assert.equal(response.headers.get('etag'), null);
response = await navigate('<html><body><script src="site-notifications-loader.js?v=6.0.0"></script></body></html>');
assert.equal((await response.text()).match(/site-notifications-loader/g).length, 1, 'No duplicate loader');
status = 404;
assert.equal(await (await navigate('<html>Missing</html>')).text(), '<html>Missing</html>');
status = 200;
contentType = 'application/json';
assert.equal(await (await navigate('{"ok":true}')).text(), '{"ok":true}');
contentType = 'text/html';
assert.equal(await (await navigate(clean, { mode: 'cors' })).text(), clean);
assert.equal(await (await navigate(clean, { url: 'https://other.test/page.html' })).text(), clean);
console.log('PASS: service worker isolates clean HTML; legacy, error and non-HTML paths preserved');

const media = { matches: true, addEventListener: (_, fn) => { media.change = fn; } };
const doc = { activeElement: null, addEventListener: (_, fn) => { doc.keydown = fn; } };
function element() {
  return { hidden: false, attributes: {}, listeners: {}, setAttribute(k, v) { this.attributes[k] = v; }, addEventListener(k, fn) { this.listeners[k] = fn; }, focus() { doc.activeElement = this; } };
}
const toggle = element(), nav = element(), link = element();
nav.contains = el => el === link;
nav.querySelector = () => link;
doc.querySelector = selector => selector === '[data-menu-toggle]' ? toggle : nav;
vm.runInNewContext(source('assets/js/navigation.js').replace('export function', 'function') + '\nenhanceNavigation(document);', { document: doc, window: { matchMedia: () => media } });
assert.equal(nav.hidden, true);
assert.equal(toggle.hidden, false);
toggle.listeners.click();
assert.equal(nav.hidden, false);
assert.equal(toggle.attributes['aria-expanded'], 'true');
doc.keydown({ key: 'Escape' });
assert.equal(nav.hidden, true);
assert.equal(doc.activeElement, toggle);
media.matches = false; media.change();
assert.equal(nav.hidden, false);
assert.equal(toggle.hidden, true);
assert.equal(doc.activeElement, link, 'Resize must not strand focus in hidden toggle');
media.matches = true; media.change();
assert.equal(doc.activeElement, toggle, 'Resize must not strand focus in hidden navigation');
toggle.listeners.click();
nav.listeners.click({ target: { closest: () => link } });
assert.equal(nav.hidden, true);
console.log('PASS: mobile disclosure, Escape, link selection and resize focus contracts');

const integrationContext = {
  URL, AbortController, setTimeout, clearTimeout, fetch: () => { throw new Error('Unexpected network'); },
  location: { origin: 'https://raw.githack.com' },
  window: new Proxy({}, { get() { throw new Error('Preview accessed production services'); } }),
  localStorage: new Proxy({}, { get() { throw new Error('Preview accessed authentication storage'); } })
};
const integrationSource = source('assets/js/services/home-integrations.js')
  .replaceAll('export ', '')
  .replaceAll('import.meta.url', JSON.stringify('https://example.test/assets/js/services/home-integrations.js'));
vm.runInNewContext(integrationSource + '\nthis.contracts = {normaliseLaunchSettings, readLaunchSettings, cartQuantity, freshLiveCreators, connectAccount, connectProductionServices};', integrationContext);
const c = integrationContext.contracts;
assert.equal(c.normaliseLaunchSettings({catalogue_enabled: 'true', builder_enabled: 1}).catalogue_enabled, false);
assert.equal(c.normaliseLaunchSettings({builder_enabled: true}).builder_enabled, true);
assert.equal(c.normaliseLaunchSettings(null).builder_enabled, false);
const config = {url: 'https://example.test', publishableKey: 'public-test-key'};
assert.equal(await c.readLaunchSettings(null), null);
assert.equal(await c.readLaunchSettings(config, async () => { throw new Error('offline'); }), null);
assert.equal(await c.readLaunchSettings(config, async () => ({ok: false})), null);
for (const payload of [null, {}, [], [{}, {}]]) {
  assert.equal(await c.readLaunchSettings(config, async () => ({ok: true, json: async () => payload})), null);
}
const enabled = await c.readLaunchSettings(config, async (url, options) => {
  assert.ok(url.includes('id=eq.store&select=catalogue_enabled,builder_enabled'));
  assert.equal(options.headers.apikey, 'public-test-key');
  assert.equal(options.cache, 'no-store');
  return {ok: true, json: async () => [{catalogue_enabled: true, builder_enabled: false}]};
});
assert.equal(enabled.catalogue_enabled, true);
assert.equal(enabled.builder_enabled, false);
assert.equal(c.cartQuantity('invalid'), 0);
assert.equal(c.cartQuantity('{"quantity":9}'), 0);
assert.equal(c.cartQuantity(JSON.stringify([{productId:'one',quantity:2},{productId:'two',quantity:25},{productId:'bad',quantity:-1},{quantity:4},{productId:'bad',quantity:999}])), 27);
const now = Date.parse('2026-09-22T12:00:00Z');
const live = {login: 'valid_creator', display_name: 'Creator', live: true, checked_at: '2026-09-22T11:59:00Z'};
const feed = {source: 'supabase', generated_at: '2026-09-22T11:59:00Z', streamers: [live]};
assert.equal(c.freshLiveCreators(feed, now).length, 1);
assert.equal(c.freshLiveCreators({...feed, generated_at:'2026-09-18T12:00:00Z'}, now), null);
assert.equal(c.freshLiveCreators({...feed, generated_at:null}, now), null);
assert.equal(c.freshLiveCreators({...feed, generated_at:'2026-09-22T13:00:00Z'}, now), null);
for (const row of [{...live, checked_at:null}, {...live, checked_at:'2026-09-18T12:00:00Z'}, {...live, login:'../not-a-creator'}, {...live, live:'true'}]) {
  assert.equal(c.freshLiveCreators({...feed, streamers:[row]}, now).length, 0);
}
assert.equal(c.freshLiveCreators({...feed, source:'legacy', streamers:[{...live,checked_at:null}]}, now).length, 1);
await c.connectAccount(config);
c.connectProductionServices();
console.log('PASS: launch flags fail closed; cart data validated; stale/unsafe creator data rejected; previews do not access production account or tracking');
