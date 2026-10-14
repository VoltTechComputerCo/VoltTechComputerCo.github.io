import { briefDescription } from './product-summary.js?v=20261014-merch';
import { matchesFacetFilters, categoryMatch } from './store-filter-menu.js?v=20261014-merch';
export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function safeLink(value) { if (!value || typeof value !== 'string') return ''; try { const u = new URL(value, location.href); return ['http:', 'https:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } }
export const productUrl = (p, preview) => `product.html?slug=${encodeURIComponent(p.slug)}${preview ? '&preview=1' : ''}`;
function imageSources(p) {
  if (p.metadata?.media_review_required) return { src:'', fallback:'' };
  const primary = safeLink(p.media?.primaryImage || p.media?.primary_image);
  const direct = safeLink(p.media?.directImage || p.media?.direct_image);
  const src = primary || direct;
  return { src, fallback: direct && direct !== src ? direct : '' };
}
export function imagePlaceholder(){return `<span class="product-image-placeholder"><img src="${new URL('../../brand/volttech-logo.webp',import.meta.url).href}" alt="VoltTech Computer Co." width="360" height="210"><span>Product image not available</span></span>`;}
export function imageMarkup(p, large = false, eager = false) {
  const { src, fallback } = imageSources(p);
  return `<figure class="catalogue-media ${large ? 'catalogue-media-large' : ''}">${src ? `<img data-product-image src="${esc(src)}" data-fallback="${esc(fallback)}" width="480" height="480" alt="${esc(p.name)} product image" loading="${large || eager ? 'eager' : 'lazy'}" fetchpriority="${large ? 'high' : 'auto'}" decoding="async" referrerpolicy="no-referrer">` : ''}<figcaption ${src?'hidden':''}>${imagePlaceholder()}</figcaption></figure>`;
}
export function bindImages(root) {
  root.querySelectorAll('.catalogue-media img[data-product-image]').forEach(img => img.addEventListener('error', () => {
    const caption = img.closest('figure')?.querySelector('figcaption');
    if (img.dataset.fallback && !img.dataset.failed) {
      img.dataset.failed = '1';
      img.src = img.dataset.fallback;
      return;
    }
    img.hidden = true;
    if (caption) { caption.hidden = false; caption.innerHTML = imagePlaceholder(); }
  }));
}
export function commerceState(VT, p, preview = false) {
  const demo = p.is_demo !== false;
  const priced = !demo && ['ZAR','USD','EUR','GBP'].includes(p.currency || 'ZAR') && p.retail_price !== null && p.retail_price !== '' && Number.isFinite(Number(p.retail_price)) && Number(p.retail_price) >= 0;
  return { canAdd: !preview && !demo && VT.canAdd(p), price: demo ? 'Not for sale' : priced ? new Intl.NumberFormat('en-ZA', { style:'currency', currency:p.currency || 'ZAR', minimumFractionDigits:2 }).format(Number(p.retail_price)) : 'Request pricing', stock: demo ? 'Demo fixture · no supplier stock' : (p.stock_qty == null && !['out_of_stock','in_stock','supplier_stock','backorder'].includes(p.stock_status) ? 'Availability to be confirmed' : VT.stockLabel(p)), label: preview ? 'Preview only' : demo ? 'Demo only' : 'Add to cart' };
}
export function productDeal(p){
 const old=Number(p.compare_at_price),price=Number(p.retail_price),verified=p.metadata?.compare_at_verified===true;
 const ends=p.metadata?.deal_ends_at;const active=!ends || (Number.isFinite(Date.parse(ends))&&Date.now()<Date.parse(ends));
 return verified&&active&&Number(p.stock_qty)>0&&price>0&&old>price?{old,saving:old-price,percent:Math.round((old-price)/old*100)}:null;
}
export function priceMarkup(p,state){
 const deal=productDeal(p),money=n=>new Intl.NumberFormat('en-ZA',{style:'currency',currency:p.currency||'ZAR',minimumFractionDigits:2}).format(n);
 return `${deal?`<span class="was-price">Was <s>${esc(money(deal.old))}</s></span>`:''}<strong>${deal?'Now ':''}${esc(state.price)}</strong>${deal?`<span class="deal-saving">Save ${esc(money(deal.saving))} · ${deal.percent}% off</span>`:''}<span class="stock-label">${esc(state.stock)}</span>`;
}
export function productCard(VT, p, preview, eager = false) {
 const state=commerceState(VT,p,preview),href=productUrl(p,preview),deal=productDeal(p),description=briefDescription(p);
 const labels={gpu:'Graphics cards',cpu:'Processors',motherboard:'Motherboards',memory:'Memory',storage:'Storage',psu:'Power supplies',case:'Cases',cooler:'Cooling',fan:'Case fans',desktops:'Desktop PCs',laptops:'Laptops',monitors:'Monitors',audio:'Audio',networking:'Networking',tablets:'Tablets'};
 const label=labels[p.category_slug]||p.category_slug?.replaceAll('-',' ')||VT.categoryLabel(p.type);
 return `<article class="card catalogue-card ${deal?'has-deal':''}"><a class="catalogue-image-link" href="${href}" aria-label="View ${esc(p.name)}">${deal?`<span class="product-badge">SAVE ${deal.percent}%</span>`:p.featured&&Number(p.stock_qty)>0?'<span class="product-badge product-badge-pick">FEATURED PICK</span>':''}${imageMarkup(p,false,eager)}</a><div class="catalogue-card-body"><p class="eyebrow">${esc(p.brand)} / ${esc(label)}</p><h3><a href="${href}">${esc(p.name)}</a></h3>${description?`<p class="catalogue-description">${esc(description)}</p>`:''}<ul class="spec-tags">${(Array.isArray(p.highlights)?p.highlights:[]).slice(0,3).map(v=>`<li>${esc(v)}</li>`).join('')}</ul><div class="catalogue-price">${priceMarkup(p,state)}</div><div class="actions"><button class="button" type="button" data-add="${esc(p.id)}" ${state.canAdd?'':'disabled'}>${state.canAdd?'Add to cart':state.label==='Add to cart'?'Unavailable':state.label}</button><a class="button button-secondary" href="${href}" aria-label="Details for ${esc(p.name)}">Details →</a></div></div></article>`;
}
const coreCategories=['gpu','cpu','motherboard','memory','storage','psu','case','cooler','monitors','desktops','laptops'];
const coreRank=p=>{const rank=coreCategories.indexOf(p.category_slug||p.type);return rank<0?coreCategories.length:rank;};
export function filterProducts(products, state) {
  const filters = state.filters || (state.brand ? { brand:state.brand } : {});
  return products
    .filter(p => categoryMatch(p, state.category))
    .filter(p => matchesFacetFilters(p, filters))
    .filter(p => !state.search || [p.name,p.brand,p.model,p.identifiers?.sku,p.identifiers?.mpn,p.short_description,JSON.stringify(p.specs || {}),JSON.stringify(p.compatibility || {}),...(p.highlights || [])].join(' ').toLowerCase().includes(state.search.toLowerCase()))
    .sort((a,b) => state.sort === 'name' ? a.name.localeCompare(b.name) : state.sort === 'price-low' ? (a.retail_price==null?Infinity:Number(a.retail_price))-(b.retail_price==null?Infinity:Number(b.retail_price)) : state.sort === 'price-high' ? (b.retail_price==null?-Infinity:Number(b.retail_price))-(a.retail_price==null?-Infinity:Number(a.retail_price)) : state.sort === 'brand' ? (a.brand || '').localeCompare(b.brand || '') || a.name.localeCompare(b.name) : Number(Number(b.stock_qty)>0)-Number(Number(a.stock_qty)>0) || (state.category==='all'?coreRank(a)-coreRank(b):0) || Number(b.featured)-Number(a.featured) || Number(b.sort_priority || 0)-Number(a.sort_priority || 0) || a.name.localeCompare(b.name));
}
export function dataRows(VT, rows) {
  return `<dl class="component-specs">${rows.map(([key,value]) => `<div><dt>${esc(VT.formatSpecKey(key))}</dt><dd>${esc(VT.formatSpecValue(value))}</dd></div>`).join('')}</dl>`;
}
