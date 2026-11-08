import fs from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {productCanonicalUrl, publicProductSlug} from '../assets/js/services/product-permalinks.js';

const origin = 'https://volttechcomputerco.co.za';
const folder = new URL('../assets/data/product-seo/', import.meta.url);
const catalogue = JSON.parse(gunzipSync(await fs.readFile(new URL('../assets/data/catalogue.json.gz', import.meta.url))));
if (catalogue.schemaVersion !== 1 || typeof catalogue.settings?.catalogue_enabled !== 'boolean' || !Array.isArray(catalogue.products)) {
  throw new Error('Unexpected public catalogue format');
}
const shardKey = slug => (slug.charCodeAt(slug.length - 1) % 16).toString(16);
const shards = Object.fromEntries([...('0123456789abcdef')].map(n => [n, {}]));
const urls = [];
const clean = value => typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim() : '';
const text = value => clean(value).slice(0, 240);
const specFields = [
  ['productKind', 'Product type'], ['socket', 'Socket'], ['memoryType', 'Memory type'],
  ['resolution', 'Resolution'], ['interface', 'Interface'], ['form-factor', 'Form factor'],
  ['connection', 'Connection'], ['colour', 'Colour']
];
function httpsImage(value) {
  try {
    if (!value) return '';
    const url = new URL(value, origin);
    if (url.protocol === 'https:' && !url.username && !url.password &&
        (url.origin !== origin || url.pathname.startsWith('/assets/'))) return url.href;
  } catch {}
  return '';
}
for (const product of catalogue.settings.catalogue_enabled ? catalogue.products : []) {
  if (product.status !== 'active' || product.visibility !== 'public' || product.is_demo !== false ||
      !product.sale_mode || product.sale_mode === 'hidden') continue;
  const slug = publicProductSlug(product);
  const name = text(product.name);
  if (!name || slug.length > 160 || !/^[a-z0-9]+(?:-+[a-z0-9]+)*$/.test(slug)) continue;
  const shard = shards[shardKey(slug)];
  if (shard[slug]) throw new Error('Duplicate product slug: ' + slug);
  const brand = text(product.brand);
  const model = text(product.model);
  const image = product.media_review_required ? '' : httpsImage(product.direct_image || product.primary_image);
  const mpn = text(product.identifiers?.mpn);
  const specs = specFields.map(([key, label]) => [label, text(product.specs?.[key])]).filter(([, value]) => value).slice(0, 4);
  shard[slug] = {name, ...(brand && {brand}), ...(model && {model}), ...(image && {image}), ...(mpn && {mpn}), ...(specs.length && {specs})};
  urls.push(productCanonicalUrl(product));
}
await fs.mkdir(folder, {recursive: true});
for (const [key, records] of Object.entries(shards)) {
  const sorted = Object.fromEntries(Object.entries(records).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0));
  await fs.writeFile(new URL(key + '.json', folder), JSON.stringify(sorted) + '\n');
}
await fs.writeFile(new URL('../sitemap-products.xml', import.meta.url), '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.sort().map(url => '  <url><loc>' + url + '</loc></url>\n').join('') + '</urlset>\n');
console.log('Prepared search metadata for ' + urls.length + ' public products.');
