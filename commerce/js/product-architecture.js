(function(){
'use strict';

const VT=window.VoltTechStore;
const host=document.getElementById('productHost');
const cartCount=document.getElementById('cartCount');

updateCart();
window.addEventListener('vt-store-cart-change',updateCart);
init();

function updateCart(){if(cartCount)cartCount.textContent=VT.cartCount()}

function previewSuffix(){
  return VT.previewMode?.()?'&preview=1':'';
}

async function init(){
  const slug=new URLSearchParams(location.search).get('slug');
  if(!slug){renderError('No product was selected.');return}

  try{
    const p=await VT.getProductBySlug(slug);
    if(!p){renderError('This product is not currently published in the VoltTech catalogue.');return}

    const extras=await VT.getProductExtras(p.id);
    setMeta(p);
    render(p,extras);

    VT.analytics('view_item',{
      currency:p.currency||'ZAR',
      items:[{item_id:p.id,item_name:p.name,item_brand:p.brand,item_category:p.type}]
    });
  }catch(error){
    console.error(error);
    renderError('We could not load this component right now.');
  }
}

function setMeta(p){
  document.title=`${p.name} | VoltTech PC Parts`;

  const desc=p.seo?.description||p.short_description||
    `${p.name} specifications and compatibility guidance from VoltTech Computer Co.`;

  let d=document.querySelector('meta[name="description"]');
  if(d)d.content=desc;

  const canonical=`https://volttechcomputerco.github.io/product.html?slug=${encodeURIComponent(p.slug)}`;
  let c=document.querySelector('link[rel="canonical"]');
  if(!c){c=document.createElement('link');c.rel='canonical';document.head.appendChild(c)}
  c.href=canonical;

  [['og:title',`${p.name} | VoltTech PC Parts`],['og:description',desc],['og:url',canonical]].forEach(([prop,val])=>{
    let m=document.querySelector(`meta[property="${prop}"]`);
    if(!m){
      m=document.createElement('meta');
      m.setAttribute('property',prop);
      document.head.appendChild(m);
    }
    m.content=val;
  });
}

function renderError(msg){
  host.innerHTML=`<div class="empty-state"><strong>Product unavailable</strong>${VT.esc(msg)}
    <div style="margin-top:14px"><a class="btn primary" href="store.html${VT.previewMode?.()?'?preview=1':''}">Back to PC Parts</a></div>
  </div>`;
}

function labelValue(label,value){
  return `<div class="product-data-row"><small>${VT.esc(label)}</small><b>${VT.esc(value==null||value===''?'—':value)}</b></div>`;
}

function fulfilmentRows(p){
  const f=VT.fulfilmentInfo(p);
  const dims=[f.dimensions.length,f.dimensions.width,f.dimensions.height];
  const dimText=dims.some(v=>v!=null)
    ? dims.map(v=>v==null?'?':v).join(' × ')+' cm'
    : 'Not yet supplied';

  return [
    labelValue('Warranty',f.warrantyMonths!=null?`${f.warrantyMonths} months`:'Supplier warranty not yet loaded'),
    labelValue('Lead time',f.leadTimeDays!=null?`${f.leadTimeDays} day${Number(f.leadTimeDays)===1?'':'s'}`:'Confirmed with supplier'),
    labelValue('Shipping weight',f.shippingWeightKg!=null?`${f.shippingWeightKg} kg`:'Not yet supplied'),
    labelValue('Package size',dimText),
    labelValue('Shipping class',f.shippingClass||'Not yet assigned'),
    labelValue('Packaging data',f.packagingVerified?'Verified':'Not yet verified')
  ].join('');
}

function render(p,{documents,relations}){
  const m=VT.mediaFor(p);
  const specs=Object.entries(p.specs||{});
  const compat=Object.entries(p.compatibility||{});
  const official=VT.safeUrl(p.media?.officialUrl);
  const identity=VT.productIdentity(p);
  const availability=VT.productAvailability(p);
  const isDemo=VT.isDemo(p);
  const available=VT.canAdd(p);

  const demoNotice=isDemo?`
    <div class="demo-product-banner">
      <b>DEMO CATALOGUE FIXTURE</b>
      <span>This product exists to test VoltTech Store structure and component data. It is not connected to supplier stock or pricing and cannot be purchased.</span>
    </div>`:'';

  const mediaNote=m.reviewRequired
    ? '<span class="visual-note warning">Image needs review</span>'
    : (!m.actual?'<span class="visual-note">Category visual</span>':'');

  const identifiers=`
    <section class="panel product-data-panel">
      <div class="panel-headline">
        <div><div class="kicker">PRODUCT IDENTITY</div><h2>Exactly what component is this?</h2></div>
      </div>
      <div class="product-data-grid">
        ${labelValue('Brand',identity.brand)}
        ${labelValue('Manufacturer',identity.manufacturer)}
        ${labelValue('Model',identity.model)}
        ${labelValue('Manufacturer part no.',identity.mpn)}
        ${labelValue('Supplier SKU',identity.sku)}
        ${labelValue('EAN / GTIN / UPC',identity.gtin)}
        ${labelValue('Condition',VT.formatSpecValue(identity.condition))}
        ${labelValue('Catalogue role',isDemo?'Demo fixture':'Supplier product')}
      </div>
    </section>`;

  const fulfilment=`
    <section class="panel product-data-panel">
      <div class="panel-headline">
        <div><div class="kicker">WARRANTY & DELIVERY</div><h2>Before you buy</h2></div>
      </div>
      <div class="product-data-grid">${fulfilmentRows(p)}</div>
    </section>`;

  const productStatus=`
    <div class="product-price ${isDemo?'demo-price':''}">
      <small>${isDemo?'Demo catalogue status':(p.retail_price!=null?'Current listed price':'Current price')}</small>
      <strong>${isDemo?'Not for sale':VT.esc(VT.formatPrice(p.retail_price,p.currency))}</strong>
      <span>${VT.esc(availability.label)}. ${VT.esc(availability.detail)}</span>
    </div>`;

  host.innerHTML=`
    <div class="product-crumbs">
      <a href="store.html${VT.previewMode?.()?'?preview=1':''}">PC Parts</a><span>›</span>
      <a href="store.html?category=${encodeURIComponent(p.category_slug||p.type)}${previewSuffix()}">${VT.esc(VT.categoryLabel(p.type))}</a>
      <span>›</span><span>${VT.esc(p.brand)}</span>
    </div>

    ${demoNotice}

    <div class="product-shell">
      <aside class="product-showcase">
        <div class="product-image-large">
          <img src="${VT.esc(m.src)}" alt="${VT.esc(m.actual?p.name:VT.categoryLabel(p.type)+' category visual')}">
          ${mediaNote}
        </div>
        ${official?`<a class="official-link" href="${VT.esc(official)}" target="_blank" rel="noopener noreferrer">Official manufacturer page ↗</a>`:''}
        ${m.reviewRequired?'<div class="media-review-note">This demo image has not yet been approved as the final product image.</div>':''}
      </aside>

      <article class="product-content">
        <div class="kicker">${VT.esc(p.brand)} // ${VT.esc(VT.categoryLabel(p.type))}</div>
        <h1>${VT.esc(p.name)}</h1>
        <p class="lead">${VT.esc(p.short_description||'Manufacturer-sourced component specifications with VoltTech compatibility guidance.')}</p>

        ${(p.highlights||[]).length?`<div class="highlights">${p.highlights.map(x=>`<span>${VT.esc(x)}</span>`).join('')}</div>`:''}

        ${productStatus}

        <div class="product-actions">
          <button class="btn primary" id="addProduct" type="button" ${available?'':'disabled'}>
            ${isDemo?'Demo only':(available?'Add to cart':'Currently unavailable')}
          </button>
          <a class="btn ghost" href="store.html${VT.previewMode?.()?'?preview=1':''}">Browse components →</a>
        </div>

        ${identifiers}

        ${specs.length?`
          <section class="panel">
            <h2>Specifications</h2>
            <div class="spec-grid">${specs.map(([k,v])=>specRow(k,v)).join('')}</div>
          </section>`:''}

        ${compat.length?`
          <section class="panel">
            <h2>Compatibility that matters</h2>
            <div class="spec-grid">${compat.map(([k,v])=>specRow(k,v)).join('')}</div>
          </section>`:''}

        ${fulfilment}

        ${documents.length?`
          <section class="panel">
            <h2>Manuals & source documents</h2>
            <div class="doc-list">
              ${documents.map(d=>`<a class="doc-link" href="${VT.esc(VT.safeUrl(d.url))}" target="_blank" rel="noopener noreferrer">
                <div><b>${VT.esc(d.title)}</b><small>${VT.esc(d.source_name||d.document_type)}</small></div><span>OPEN ↗</span>
              </a>`).join('')}
            </div>
          </section>`:''}

        ${relations.length?`
          <section class="panel">
            <h2>Hardware Graph</h2>
            <div class="related-grid">
              ${relations.slice(0,8).map(r=>`<a class="related-link" href="product.html?slug=${encodeURIComponent(r.product.slug)}${previewSuffix()}">
                <div><b>${VT.esc(r.product.name)}</b><small>${VT.esc(relationLabel(r.relation_type))}${r.note?' · '+VT.esc(r.note):''}</small></div><span>VIEW →</span>
              </a>`).join('')}
            </div>
          </section>`:''}
      </article>
    </div>`;

  document.getElementById('addProduct')?.addEventListener('click',()=>{
    if(!available)return;
    VT.addToCart(p.id,1);
    VT.toast(`${p.name} added to your cart.`);
  });

  VT.applyImageFallback?.(host.querySelector('.product-image-large img'),p);
}

function specRow(k,v){
  return `<div class="spec-row"><small>${VT.esc(VT.formatSpecKey(k))}</small><b>${VT.esc(VT.formatSpecValue(v))}</b></div>`;
}

function relationLabel(t){
  return ({
    compatible_with:'Compatible with',
    recommended_with:'Recommended with',
    alternative_to:'Alternative',
    upgrade_from:'Upgrade path',
    bundle_with:'Pairs well with'
  }[t]||VT.formatSpecKey(t));
}
})();