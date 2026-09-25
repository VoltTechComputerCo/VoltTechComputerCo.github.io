const visuals = { cpu:'assets/categories/cpu.webp', gpu:'assets/categories/gpu.webp', motherboard:'assets/categories/motherboard.webp', memory:'assets/categories/memory.webp', storage:'assets/categories/storage.webp', psu:'assets/categories/psu.webp', case:'vt-stock-modern-build.webp', cooler:'vt-stock-cooling-rgb.webp', fan:'vt-stock-cooling-rgb.webp' };
export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function safeLink(value) { if (!value || typeof value !== 'string') return ''; try { const u = new URL(value, location.href); return ['http:', 'https:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } }
export const productUrl = (p, preview) => `product.html?slug=${encodeURIComponent(p.slug)}${preview ? '&preview=1' : ''}`;
export function imageMarkup(p, large = false) {
  const src = !p.metadata?.media_review_required && safeLink(p.media?.primaryImage || p.media?.primary_image);
  const fallback = visuals[p.type];
  return `<figure class="catalogue-media ${large ? 'catalogue-media-large' : ''}">${src || fallback ? `<img src="${esc(src || fallback)}" data-fallback="${esc(fallback || '')}" width="480" height="480" alt="${esc(src ? p.name : p.type + ' category visual')}" loading="${large ? 'eager' : 'lazy'}" decoding="async">` : '<span>Product image unavailable</span>'}<figcaption ${src ? 'hidden' : ''}>${fallback ? 'Category visual · not the specific product' : 'Product image unavailable'}</figcaption></figure>`;
}
export function bindImages(root) {
  root.querySelectorAll('.catalogue-media img').forEach(img => img.addEventListener('error', () => {
    const caption = img.closest('figure').querySelector('figcaption'); caption.hidden = false;
    if (img.dataset.fallback && !img.dataset.failed) { img.dataset.failed = '1'; img.src = img.dataset.fallback; img.alt = 'Category visual'; caption.textContent = 'Category visual · not the specific product'; }
    else { img.hidden = true; caption.textContent = 'Product image unavailable'; }
  }));
}
export function commerceState(VT, p, preview = false) {
  const demo = p.is_demo !== false;
  const priced = !demo && ['ZAR','USD','EUR','GBP'].includes(p.currency || 'ZAR') && p.retail_price !== null && p.retail_price !== '' && Number.isFinite(Number(p.retail_price)) && Number(p.retail_price) >= 0;
  return { canAdd: !preview && !demo && VT.canAdd(p), price: demo ? 'Not for sale' : priced ? new Intl.NumberFormat('en-ZA', { style:'currency', currency:p.currency || 'ZAR', minimumFractionDigits:2 }).format(Number(p.retail_price)) : 'Request pricing', stock: demo ? 'Demo fixture · no supplier stock' : (p.stock_qty == null && !['out_of_stock','in_stock','supplier_stock','backorder'].includes(p.stock_status) ? 'Availability to be confirmed' : VT.stockLabel(p)), label: preview ? 'Preview only' : demo ? 'Demo only' : 'Add to cart' };
}
export function productCard(VT, p, preview) {
  const state = commerceState(VT, p, preview), href = productUrl(p, preview);
  return `<article class="card catalogue-card"><a class="catalogue-image-link" href="${href}" aria-label="View ${esc(p.name)}">${imageMarkup(p)}</a><div class="catalogue-card-body"><p class="eyebrow">${esc(p.brand)} / ${esc(VT.categoryLabel(p.type))}</p><h3><a href="${href}">${esc(p.name)}</a></h3><p class="catalogue-description">${esc(p.short_description || 'View component details and discuss your requirements.')}</p><ul class="spec-tags">${(Array.isArray(p.highlights) ? p.highlights : []).slice(0,3).map(v => `<li>${esc(v)}</li>`).join('')}</ul><div class="catalogue-price"><strong>${esc(state.price)}</strong><span>${esc(state.stock)}</span></div><div class="actions"><button class="button" type="button" data-add="${esc(p.id)}" ${state.canAdd ? '' : 'disabled'}>${state.canAdd ? 'Add to cart' : state.label === 'Add to cart' ? 'Unavailable' : state.label}</button><a class="button button-secondary" href="${href}" aria-label="Details for ${esc(p.name)}">Details →</a></div></div></article>`;
}
export function filterProducts(products, state) {
  return products.filter(p => (state.category === 'all' || p.category_slug === state.category || p.type === state.category) && (!state.brand || p.brand === state.brand) && (!state.search || [p.name,p.brand,p.model,p.short_description,JSON.stringify(p.specs || {}),JSON.stringify(p.compatibility || {}),...(p.highlights || [])].join(' ').toLowerCase().includes(state.search.toLowerCase()))).sort((a,b) => state.sort === 'name' ? a.name.localeCompare(b.name) : state.sort === 'brand' ? (a.brand || '').localeCompare(b.brand || '') || a.name.localeCompare(b.name) : Number(b.featured)-Number(a.featured) || Number(b.sort_priority || 0)-Number(a.sort_priority || 0) || a.name.localeCompare(b.name));
}
export function dataRows(VT, rows) {
  return `<dl class="component-specs">${rows.map(([key,value]) => `<div><dt>${esc(VT.formatSpecKey(key))}</dt><dd>${esc(VT.formatSpecValue(value))}</dd></div>`).join('')}</dl>`;
}
