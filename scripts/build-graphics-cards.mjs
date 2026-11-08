import fs from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {productCanonicalUrl} from '../assets/js/services/product-permalinks.js';

const read = path => fs.readFile(new URL('../' + path, import.meta.url));
const snapshot = JSON.parse(gunzipSync(await read('assets/data/catalogue.json.gz')));
const sitemap = (await read('sitemap-products.xml')).toString();
const indexedUrls = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]));
const escape = text => String(text).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const eligible = snapshot.settings.catalogue_enabled ? snapshot.products.filter(product =>
  product.type === 'gpu' && product.name && indexedUrls.has(productCanonicalUrl(product)) &&
  ['in-stock', 'low-stock'].includes(product.stock_status)) : [];
const sort = (a, b) => (b.featured === true) - (a.featured === true) ||
  (b.sort_priority || 0) - (a.sort_priority || 0) ||
  (a.name < b.name ? -1 : a.name > b.name ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
eligible.sort(sort);
const picks = [];
const seen = new Set();
function take(product) {
  const url = productCanonicalUrl(product);
  // Avoid repeating closely related board variants when enough different GPUs are listed.
  const model = product.name.toLowerCase().match(/\b(?:rtx|gtx|rx|arc)\s*[ab]?\d+(?:\s*(?:xtx|xt|ti|super)\b){0,2}/)?.[0].replace(/\s+/g, '') || url;
  if (seen.has(model)) return false;
  seen.add(model);
  picks.push(product);
  return true;
}
for (const family of [/\b(?:geforce|nvidia)\b/i, /\b(?:radeon|amd)\b/i]) {
  let count = 0;
  for (const product of eligible) {
    if (family.test(product.name) && take(product) && ++count === 3) break;
  }
}
for (const product of eligible) {
  if (picks.length >= 6) break;
  take(product);
}
const pathFor = product => { const url = new URL(productCanonicalUrl(product)); return url.pathname + url.search; };
const html = picks.length
  ? '<ul class="gpu-list">\n' + picks.map(product => '  <li><a href="' + escape(pathFor(product)) + '"><span>' + escape(product.name) + '</span><span aria-hidden="true">→</span></a></li>').join('\n') + '\n</ul>'
  : '<p>Use the Store to check the current GPU range, or ask us to help find a card for your build.</p>';
await fs.writeFile(new URL('../src/pages/graphics-cards.products.html', import.meta.url), html + '\n');
console.log('Prepared ' + picks.length + ' GPU catalogue links.');
