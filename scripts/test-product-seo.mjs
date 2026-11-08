import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderProductHtml, onRequestGet} from '../functions/product.js';

const origin = 'https://volttechcomputerco.co.za';
const read = path => fs.readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const shell = read('product.html');
const sitemap = read('sitemap-products.xml');
const listed = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
const records = new Map();
for (const key of '0123456789abcdef') {
  for (const [slug, product] of Object.entries(JSON.parse(read('assets/data/product-seo/' + key + '.json')))) {
    assert.equal((slug.charCodeAt(slug.length - 1) % 16).toString(16), key);
    assert(!records.has(slug));
    records.set(slug, product);
    assert(Object.keys(product).every(field => ['name', 'brand', 'model', 'image', 'mpn', 'specs'].includes(field)));
    const html = renderProductHtml(shell, slug, product);
    assert(html?.includes('<meta name="robots" content="index, follow, max-image-preview:large">'));
    assert(html.includes('<link rel="canonical" href="' + origin + '/product?slug=' + slug + '">'));
    const structured = JSON.parse(html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)[1]);
    assert.equal(structured['@graph'][0].name, product.name);
    assert(!structured['@graph'][0].offers);
  }
}
assert.deepEqual(listed, [...records.keys()].map(slug => origin + '/product?slug=' + slug).sort());
const sample = [...records.keys()][0];
const assets = {fetch: async url => new Response(
  url.pathname === '/product' ? shell : read(url.pathname.slice(1)),
  {headers: {'Content-Type': url.pathname === '/product' ? 'text/html' : 'application/xml'}}
)};
const request = path => ({env: {ASSETS: assets}, request: new Request(origin + path), next: () => new Response(shell)});
for (const path of ['/product', '/product?slug=not-an-item', '/product?slug=' + sample + '&preview=1']) {
  const response = await onRequestGet(request(path));
  assert((await response.text()).includes('content="noindex, follow"'));
}
assert(!JSON.parse(read('_routes.json')).include.includes('/sitemap-products.xml'));
const untrusted = renderProductHtml(shell, 'fixture', {name: '</script><img src=x onerror="bad()"> $&'});
assert(untrusted.includes('&lt;/script&gt;'));
assert(!untrusted.includes('<img src=x'));
console.log('PASS: ' + listed.length + ' public product canonicals, sitemap membership, escaping and noindex fallbacks');
