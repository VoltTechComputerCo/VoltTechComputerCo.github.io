import { openCatalogue, showGate, publicProducts, withTimeout, addItem } from '../services/catalogue.js';
import { esc, safeLink, imageMarkup, bindImages, commerceState, dataRows, productUrl } from '../components/catalogue-view.js';
import { connectCatalogueCart } from '../services/catalogue-cart.js';
const host = document.getElementById('product-detail'), title = document.getElementById('component-title');
async function init() {
  try {
    const access = await openCatalogue(); if (!access.open) { showGate(access); return; }
    const {VT,preview} = access, slug = new URLSearchParams(location.search).get('slug');
    if (!slug) { title.textContent = 'Find your next component.'; document.querySelector('[data-gate-title]').textContent = 'Choose a component from the Store.'; document.querySelector('[data-gate-copy]').textContent = 'Open a product to see its specifications, compatibility and availability.'; return; }
    const p = await withTimeout(VT.getProductBySlug(slug));
    if (!publicProducts(p ? [p] : [],preview).length) { title.textContent='Component unavailable.'; document.querySelector('[data-gate-title]').textContent='This component is not currently listed.'; document.querySelector('[data-gate-copy]').textContent='Browse the Store or tell VoltTech what you are looking for.'; return; }
    let extras = {documents:[],relations:[]}, extrasFailed = false;
    try { extras = await withTimeout(VT.getProductExtras(p.id)); } catch { extrasFailed = true; }
    const state = commerceState(VT,p,preview), identity = VT.productIdentity(p), official = safeLink(p.media?.officialUrl);
    const section = (heading,rows) => rows.length ? `<section class="component-data"><h2>${heading}</h2>${dataRows(VT,rows)}</section>` : '';
    document.getElementById('store-gate').hidden = true;
    title.textContent = p.name; document.title = `${p.name} | VoltTech Computer Co.`;
    const desc = p.seo?.description || p.short_description || `${p.name} component details from VoltTech Computer Co.`;
    document.querySelector('meta[name="description"]').content = desc;
    document.querySelector('meta[property="og:title"]').content = document.title;
    document.querySelector('meta[property="og:description"]').content = desc;
    document.getElementById('component-label').textContent = `${p.brand} / ${VT.categoryLabel(p.type)}`;
    const canonical = 'https://volttechcomputerco.github.io/product.html?slug=' + encodeURIComponent(p.slug);
    document.querySelector('link[rel="canonical"]').href=canonical;
    document.querySelector('meta[property="og:url"]').content=canonical;
    host.hidden = false;
    const docs = (extras.documents || []).filter(d => safeLink(d.url));
    const relations = (extras.relations || []).filter(r => publicProducts([r.product],preview).length);
    host.innerHTML = `${preview ? '<p class="notice notice-warning">ADMIN PREVIEW · reference data only. Cart and checkout actions are disabled.</p>' : ''}<div class="component-overview"><div class="component-showcase">${imageMarkup(p,true)}${official ? `<a class="text-link" href="${esc(official)}" target="_blank" rel="noopener noreferrer">Manufacturer information ↗</a>` : ''}</div><div class="component-summary"><p class="eyebrow">YOUR NEXT COMPONENT</p><p class="component-description">${esc(p.short_description || 'Discuss this component and your setup with VoltTech.')}</p><ul class="spec-tags">${(p.highlights || []).map(v => `<li>${esc(v)}</li>`).join('')}</ul><div class="catalogue-price"><strong>${esc(state.price)}</strong><span>${esc(state.stock)}</span></div><p class="micro">Final pricing, applicable VAT, availability and delivery are confirmed before payment.</p><div class="actions"><button class="button" id="add-component" type="button" ${state.canAdd ? '' : 'disabled'}>${state.canAdd ? 'Add to cart' : preview ? 'Preview only' : 'Unavailable'}</button><a class="button button-secondary" href="https://wa.me/27618435775?text=${encodeURIComponent('Hi VoltTech, I would like advice on ' + p.name + ' for my setup.')}">ASK VOLTTECH ↗</a></div><a class="text-link" href="store.html?category=${encodeURIComponent(p.category_slug || p.type)}${preview ? '&preview=1' : ''}">Browse ${esc(VT.categoryLabel(p.type))} →</a></div></div><div class="component-data-grid">${section('Product identity',[['Brand',identity.brand],['Manufacturer',identity.manufacturer],['Model',identity.model],['Manufacturer part number (MPN)',identity.mpn],['SKU',identity.sku],['EAN / GTIN / UPC',identity.gtin],['Condition',p.condition || 'Not supplied']])}${section('Specifications',Object.entries(p.specs || {}))}${section('Compatibility',Object.entries(p.compatibility || {}))}${section('Before you buy',[['Warranty',p.warranty_months == null ? 'Confirmed with your quote' : `${p.warranty_months} months (listed)`],['Delivery',p.lead_time_days == null ? 'Estimate confirmed with your quote' : `${p.lead_time_days} days (listed estimate)`],['Shipping weight',p.shipping_weight_kg == null ? 'Not supplied' : `${p.shipping_weight_kg} kg`],['Package size',[p.shipping_length_cm,p.shipping_width_cm,p.shipping_height_cm].every(v => v != null) ? [p.shipping_length_cm,p.shipping_width_cm,p.shipping_height_cm].join(' × ') + ' cm' : 'Not supplied'],['Shipping class',p.shipping_class || 'Confirmed with your quote'],['Packaging',p.shipping_packaging_verified ? 'Verified in catalogue' : 'To be confirmed']])}</div>${docs.length ? `<section class="component-data"><h2>Manuals & source documents</h2><div class="component-links">${docs.map(d => `<a href="${esc(safeLink(d.url))}" target="_blank" rel="noopener noreferrer">${esc(d.title)} <span>OPEN ↗</span></a>`).join('')}</div></section>` : ''}${relations.length ? `<section class="component-data"><h2>Explore related components</h2><div class="component-links">${relations.map(r => `<a href="${productUrl(r.product,preview)}">${esc(r.product.name)} <span>${esc(VT.formatSpecKey(r.relation_type))} →</span></a>`).join('')}</div></section>` : ''}${extrasFailed ? '<p class="notice">Additional documents and related components could not load. Reload to try again.</p>' : ''}`;
    bindImages(host); document.getElementById('add-component').addEventListener('click', () => addItem(VT,p,preview));
    connectCatalogueCart(VT,[p],preview); VT.analytics('view_item',{currency:p.currency || 'ZAR',items:[{item_id:p.id,item_name:p.name}]});
  } catch { showGate({reason:'connection'}); }
}
init();
