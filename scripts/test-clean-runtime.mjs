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
