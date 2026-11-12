import { publicProductSlug } from './product-permalinks.js?v=20261103-slugs1';
// Independent, read-only fallback. No Supabase SDK or customer account is required.
// Show reference prices from the fresh public snapshot. Stock is confirmed separately.
import { readPublicCatalogue } from './public-catalogue.js?v=20261112-arctic-cdn';
import { readLaunchSettings } from './home-integrations.js?v=20261102-failover1';
import { publicCatalogueOnly } from './site-config.js?v=20261107-static1';
import { addItem, notify } from './catalogue.js?v=20261107-static1';
import { esc, imageMarkup, bindImages, filterProducts, jumpToCatalogueResults } from '../components/catalogue-view.js?v=20261108-winter2';

import { arcticOfferEnd, isArcticOffer } from './arctic-christmas.js';

const publicProduct=p=>p&&typeof p.id==='string'&&p.status==='active'&&p.visibility==='public'&&p.sale_mode!=='hidden'&&p.is_demo===false;
const normalConfig=()=>window.VOLTTECH_SUPABASE;
let recovering=false;

function snapshotGate(available, title, description) {
 document.getElementById('catalogue-loading')?.remove();
 const gate = document.getElementById('store-gate');
 if (!gate) return;
 gate.hidden = available;
 const contact = gate.querySelector('#category-enquiry');
 if (contact) {
  contact.href = 'store.html';
  contact.textContent = 'Browse the Store →';
 }
 if (available) return;
 gate.dataset.state = 'offline';
 gate.querySelector('[data-gate-title]').textContent = title;
 gate.querySelector('[data-gate-copy]').textContent = description;
}

async function snapshotProducts(){
 const snapshot=await readPublicCatalogue(fetch,true);
 if(!snapshot||snapshot.settings?.catalogue_enabled===false)return [];
 const freshSnapshot=await readPublicCatalogue();
 return snapshot.products.filter(publicProduct).map(product=>{
  const expiredArcticOffer = Date.now() >= arcticOfferEnd && isArcticOffer(product);
  const price = Number(expiredArcticOffer ? product.compare_at_price : product.retail_price);
  const listed=freshSnapshot && product.stock_qty>0 && !outOfStock(product) && product.currency==='ZAR' && Number.isFinite(price) && price>0;
  return {...product,retail_price:listed?price:null};
 });
}
export function monitorStoreConnection(){
 if(publicCatalogueOnly)return;
 let misses=0;
 const check=async()=>{
  if(document.visibilityState==='hidden')return;
  const settings=await readLaunchSettings(normalConfig(),fetch,3500);
  if(!settings || settings.catalogue_enabled===false)misses++;
  else misses=0;
  if(misses>=2)location.reload();
 };
 window.setInterval(check,240000);
 // Do not force a reload during a customer interaction after a single timeout.
}
function monitorRecovery(){
 if(publicCatalogueOnly)return;
 if(recovering)return;
 recovering=true;
 const check=async()=>{
  if(document.visibilityState==='hidden')return;
  const settings=await readLaunchSettings(normalConfig(),fetch,3500);
  if(settings)location.reload(); // Live server decides whether catalogue is open.
 };
 window.setInterval(check,240000);
 window.addEventListener('online',check);
 window.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')check();});
}

const outOfStock=product=>String(product.stock_status || '').replaceAll('_','-').toLowerCase()==='out-of-stock' || product.stock_qty===0;
function stockAgeIsFresh(product){
 const age=Date.now()-Date.parse(product.supplier_stock_checked_at || product.price_checked_at || '');
 return age>=0 && age<10*3600000;
}
const zar=new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR'});
const listedPrice=product=>product.retail_price===null?'':`<p class="catalogue-price"><strong>${esc(zar.format(product.retail_price))}</strong> <span class="listed-price-label">Listed price</span></p>`;
function availabilityCopy(product){
 if(stockAgeIsFresh(product) && outOfStock(product))
  return 'Out of stock. Contact us for restock information.';
 if(stockAgeIsFresh(product) && product.stock_qty>0 && !outOfStock(product))
  return 'Supplier stock available. Confirm availability when ordering.';
 return 'Contact us for current pricing and availability.';
}

function canAddSnapshot(product) {
  return product.stock_qty > 0 && !outOfStock(product);
}

function addButton(product) {
  return canAddSnapshot(product)
    ? `<button class="button" type="button" data-add-snapshot="${esc(product.id)}">Add to cart</button>`
    : '';
}

function connectSnapshotButtons(root, products) {
  const byId = new Map(products.map(product => [product.id, product]));
  root.addEventListener('click', async event => {
    const button = event.target.closest('button[data-add-snapshot]');
    const product = byId.get(button?.dataset.addSnapshot);
    if (!product || button.disabled) return;
    button.disabled = true;
    const label = button.textContent;
    button.textContent = 'Checking stock…';
    try {
      const { checkoutAccess, checkoutCart, eligibleCart, withTimeout } = await import('./transactions.js?v=20261021.3');
      const { VT } = await checkoutAccess();
      if (!VT) { notify('Online checkout is temporarily unavailable. Please try again shortly.'); return; }
      const live = await withTimeout(VT.getProductsByIds([product.id]), 5000);
      const cart = checkoutCart(VT.readCart());
      const existing = cart?.find(item => item.productId === product.id);
      if (!cart || (existing ? existing.quantity >= 25 : cart.length >= 30)) {
        notify('Your cart is at its limit. Review your cart before adding this item.');
        return;
      }
      const next = { productId: product.id, quantity: (existing?.quantity || 0) + 1 };
      if (!eligibleCart(VT, [next], live) || !canAddSnapshot(live[0]) || live[0].currency !== 'ZAR' || !(Number(live[0].retail_price) > 0)) {
        notify('This item is unavailable in the requested quantity.');
        return;
      }
      addItem(VT, live[0], false);
    } catch {
      notify('Stock could not be checked. Please try again shortly.');
    } finally {
      button.disabled = false;
      button.textContent = label;
    }
  });
}

function card(product){
 const detail='product.html?slug='+encodeURIComponent(publicProductSlug(product));
 return `<article class="card catalogue-card">
 <a class="catalogue-image-link" href="${esc(detail)}" aria-label="View details for ${esc(product.name)}">${imageMarkup(product)}</a>
 <div class="catalogue-card-body">
 <p class="eyebrow">${esc(product.brand||'VoltTech')} / ${esc(product.category_slug||product.type||'PC components')}</p>
 <h3><a href="${esc(detail)}">${esc(product.name)}</a></h3>
 ${listedPrice(product)}<p class="micro">${esc(availabilityCopy(product))}</p>
 <div class="actions">${addButton(product)}<a class="button button-secondary" href="${esc(detail)}">Details</a></div>
 </div></article>`;
}
export async function showEmergencyStore(state){
 const products=await snapshotProducts().catch(()=>[]);
 snapshotGate(products.length > 0, 'The catalogue is temporarily unavailable.', 'Please reload the Store in a moment.');
 document.body.dataset.storeMode='snapshot';
 document.getElementById('shop-featured')?.setAttribute('hidden','');
 const catalogue=document.getElementById('catalogue'),grid=document.getElementById('product-grid');
 const count=document.getElementById('result-count'),search=document.getElementById('catalogue-search');
 const sort=document.getElementById('catalogue-sort');
 const status=document.getElementById('store-state');
 if(status)status.textContent=products.length?'Shop online with guest checkout':'Catalogue temporarily unavailable';
 const hero=document.getElementById('store-hero-copy');
 if(hero)hero.textContent='Shop PC parts and gaming gear. You can check out as a guest or sign in to your account.';
 if(!products.length||!catalogue||!grid){if(catalogue)catalogue.hidden=true;monitorRecovery();return;}
 catalogue.hidden=state.browseCategories;catalogue.dataset.source='offline-snapshot';catalogue.dataset.mode='snapshot';
 document.getElementById('catalogue-preview')?.setAttribute('hidden','');
 document.querySelector('.smart-filter-shell')?.setAttribute('hidden','');
 const filterChips=document.getElementById('active-filter-chips');
 if (filterChips) {
  const brand = state.filters?.brand;
  filterChips.hidden = !brand;
  if (brand) {
   const clearUrl = new URL(location.href);
   clearUrl.searchParams.delete('brand');
   clearUrl.searchParams.delete('page');
   clearUrl.hash = 'catalogue';
   const chip = document.createElement('a');
   chip.className = 'text-link';
   chip.href = clearUrl.href;
   chip.textContent = brand + ' ×';
   chip.setAttribute('aria-label', 'Clear ' + brand + ' brand filter');
   filterChips.replaceChildren(chip);
  }
 }
 const searchInput=search;searchInput.value=state.search||'';
 sort.value=state.sort;
 const pager=document.createElement('nav');
 pager.className='catalogue-page-controls';
 pager.setAttribute('aria-label','Catalogue pages');
 connectSnapshotButtons(grid, products);
 document.querySelectorAll('button[data-open-cart]').forEach(button => {
  button.addEventListener('click', event => {
   if (!event.defaultPrevented && !document.getElementById('catalogue-cart')?.open) location.assign('store.html?cart=1');
  });
 });
 grid.after(pager);
 let limit=24;
 const render=()=>{
  const matches=filterProducts(products,{...state,sort:state.sort,search:state.search||''});
  const pageCount=Math.max(1,Math.ceil(matches.length/limit));
  state.page=Math.min(Math.max(1,state.page||1),pageCount);
  const start=(state.page-1)*limit,visible=matches.slice(start,start+limit);
  grid.innerHTML=visible.length?visible.map(card).join(''):'<div class="empty-state"><h3>No products matched.</h3><p>Try another product name or category.</p></div>';
  count.textContent=matches.length.toLocaleString('en-ZA')+' products';
  pager.innerHTML=`<button type="button" data-offline-page="prev" ${state.page===1?'disabled':''}>← Previous</button><span>Page ${state.page} of ${pageCount}</span><button type="button" data-offline-page="next" ${state.page===pageCount?'disabled':''}>Next →</button>`;
  bindImages(grid);
 };
 searchInput.addEventListener('input',()=>{state.search=searchInput.value.trim();state.page=1;render();});
 sort.addEventListener('change',()=>{state.sort=sort.value;state.page=1;render();});
 pager.addEventListener('click',event=>{const button=event.target.closest('[data-offline-page]');if(!button||button.disabled)return;state.page+=button.dataset.offlinePage==='next'?1:-1;render();catalogue.scrollIntoView({block:'start'});});
 document.getElementById('reset-filters')?.addEventListener('click',()=>{state.category='all';state.filters={};state.search='';state.sort='featured';state.page=1;searchInput.value='';sort.value='featured';render();});
 render();
 document.querySelectorAll('[data-store-all]').forEach(link=>link.addEventListener('click',event=>{
  if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||!catalogue.hidden)return;
  event.preventDefault();
  catalogue.hidden=false;
  history.replaceState(null,'','#catalogue');
  jumpToCatalogueResults(grid);
 }));
 if(location.hash==='#catalogue' || ['category','brand','q'].some(key=>new URLSearchParams(location.search).get(key)))
  requestAnimationFrame(()=>jumpToCatalogueResults(grid));
 monitorRecovery();
}

export async function showEmergencyProduct(slug){
 const products=await snapshotProducts().catch(()=>[]);
 const product=products.find(row=>(row.slug||row.id)===slug || publicProductSlug(row)===slug);
 snapshotGate(Boolean(product), 'This product is unavailable.', 'Browse the Store to find another component.');
 const host=document.getElementById('product-detail');
 if(!product){monitorRecovery();return;}
 if(host){
  host.hidden=false;host.dataset.mode='snapshot';
  const specs = Object.entries(product.specs || {}).filter(([,value]) =>
    (typeof value === 'string' || typeof value === 'number') && String(value).length < 160).slice(0,8);
  host.innerHTML = `<div class="component-overview">
    <div class="component-showcase">${imageMarkup(product,true)}</div>
    <header class="snapshot-product-heading"><p class="eyebrow">${esc(product.brand || 'VoltTech')}</p><div class="product-title-slot"></div></header>
    <div class="component-summary snapshot-product-buy">${listedPrice(product)}<p>${esc(availabilityCopy(product))}</p>
      <div class="actions">${addButton(product)}<a class="button button-secondary" href="store.html?cart=1">View cart →</a></div>
    </div>
    ${specs.length ? `<details class="snapshot-product-specs"><summary>Specifications</summary>
      <dl class="component-specs">${specs.map(([key,value]) => `<div><dt>${esc(key.replace(/_/g,' '))}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl></details>` : ''}
  </div>`;
  const heading = document.querySelector('.component-heading');
  const title = document.getElementById('component-title');
  if (title) {
   title.textContent = product.name;
   host.querySelector('.product-title-slot').append(title);
  }
  if (heading) heading.hidden = true;
  const crumb = document.querySelector('.commerce-crumbs [aria-current="page"]');
  if (crumb) crumb.textContent = product.name;
  bindImages(host);
  connectSnapshotButtons(host, [product]);
 }
 document.title=product.name+' | VoltTech Computer Co.';
 monitorRecovery();
}
