import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(root, 'assets/js/services/product-permalinks.js'), 'utf8');
const { publicProductSlug, productCanonicalUrl } = await import(
  'data:text/javascript;charset=utf-8,' + encodeURIComponent(source)
);
const check = (p, slug) => {
  assert.equal(publicProductSlug(p), slug);
  assert.equal(productCanonicalUrl(p), 'https://volttechcomputerco.co.za/product?slug=' + encodeURIComponent(slug));
  assert.ok(!/\/(?:product)\?slug=(?:syntech|tarsus|esquire|lunatech)-/i.test(productCanonicalUrl(p)));
};
// Actual production record that exposed Syntech to customers.
check({ id: 'syntech-e892913aa39d64f8', name: 'DeepCool ASSASSIN VC ELITE CPU Air Cooler White' },
  'deepcool-assassin-vc-elite-cpu-air-cooler-white-913aa39d64f8');
// Supplier names that happen to appear in source catalogue product names are stripped.
check({ id: 'esquire-0d80517e64b90a02', name: 'Esquire 256MB DDR400' },
  '256mb-ddr400-517e64b90a02');
// The database permalink is authoritative when provided.
check({ id: 'syntech-e892913aa39d64f8', public_slug: 'custom-friendly-slug', name: 'Other' },
  'custom-friendly-slug');
assert.notEqual(publicProductSlug({id:'syntech-1111111111111111', name:'Same Product'}),
  publicProductSlug({id:'syntech-2222222222222222', name:'Same Product'}));

const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
for (const runtime of ['commerce/js/catalogue-runtime.js', 'commerce/js/store-core.js']) {
  const text = read(runtime);
  assert.match(text, /id,slug,public_slug,type/);
  assert.match(text, /\['public_slug', 'slug'\]/);
  assert.match(text, /\['slug', 'public_slug'\]/);
}
for (const target of ['assets/js/components/catalogue-view.js',
  'assets/js/services/product-search.js', 'assets/js/services/emergency-store.js']) {
  assert.match(read(target), /publicProductSlug\(/, target + ': must use clean product links');
}
const page = read('assets/js/pages/product.js');
assert.match(page, /normalizeProductAddress\(p\)/);
assert.doesNotMatch(page, /product\.html\?slug=' \+ encodeURIComponent\(p\.slug\)/);
console.log('PASS: supplier-free product links, legacy lookup, search and SEO canonical contracts');
