import { publicProductSlug, normalizeProductAddress } from './product-permalinks.js?v=20261103-slugs1';
// Independent, read-only fallback. No Supabase SDK or customer account is required.
// Public catalogue snapshots can be stale: never present their price/stock as current.
import { readPublicCatalogue } from './public-catalogue.js?v=20261102-gpu3';
import { readLaunchSettings } from './home-integrations.js?v=20261102-failover1';
import { esc, imageMarkup, bindImages, filterProducts } from '../components/catalogue-view.js?v=20261103-slugs1';

const WA='https://wa.me/27618435775?text=';
const ENQUIRY='Hi VoltTech, I would like to place an order or request a quote. Please help me with current pricing, stock and delivery.';
const enquiryLink=product=>WA+encodeURIComponent(product
 ? 'Hi VoltTech, please quote me for: '+String(product.name||'PC component')+' ('+String(product.brand||'VoltTech')+'). Please confirm the current price, availability and delivery.'
 : ENQUIRY);
const publicProduct=p=>p&&typeof p.id==='string'&&p.status==='active'&&p.visibility==='public'&&p.sale_mode!=='hidden'&&p.is_demo===false;
const normalConfig=()=>window.VOLTTECH_SUPABASE;
let recovering=false;

function emergencyNotice(title,description,product=null){
 document.getElementById('catalogue-loading')?.remove();
 const gate=document.getElementById('store-gate');
 if(gate){
  gate.hidden=false;
  gate.dataset.state='offline';
  gate.querySelector('[data-gate-title]').textContent=title;
  gate.querySelector('[data-gate-copy]').textContent=description;
  const contact=gate.querySelector('#category-enquiry');
  if(contact){contact.href=enquiryLink(product);contact.textContent='ORDER / ENQUIRE VIA WHATSAPP →';}
 }
 document.body.dataset.storeMode='enquiry';
}

async function snapshotProducts(){
 const snapshot=await readPublicCatalogue(fetch,true);
 if(!snapshot||snapshot.settings?.catalogue_enabled===false)return [];
 return snapshot.products.filter(publicProduct);
}
export function monitorStoreConnection(){
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

function card(product){
 const message=enquiryLink(product);
 const detail='product.html?slug='+encodeURIComponent(publicProductSlug(product));
 return `<article class="card catalogue-card">
 <a class="catalogue-image-link" href="${esc(detail)}" aria-label="View details for ${esc(product.name)}">${imageMarkup(product)}</a>
 <div class="catalogue-card-body">
 <p class="eyebrow">${esc(product.brand||'VoltTech')} / ${esc(product.category_slug||product.type||'PC components')}</p>
 <h3><a href="${esc(detail)}">${esc(product.name)}</a></h3>
 <p class="micro">Current price and availability confirmed personally.</p>
 <div class="actions"><a class="button" href="${esc(message)}" target="_blank" rel="noopener noreferrer">ENQUIRE ON WHATSAPP →</a><a class="button button-secondary" href="${esc(detail)}">Details</a></div>
 </div></article>`;
}
export async function showEmergencyStore(state){
 const products=await snapshotProducts().catch(()=>[]);
 emergencyNotice('Online checkout is temporarily unavailable.',
 'VoltTech is still open! Browse our product range and send us a WhatsApp enquiry. Current pricing, stock and delivery will be confirmed before any order is placed.');
 document.getElementById('shop-featured')?.setAttribute('hidden','');
 const catalogue=document.getElementById('catalogue'),grid=document.getElementById('product-grid');
 const count=document.getElementById('result-count'),search=document.getElementById('catalogue-search');
 const sort=document.getElementById('catalogue-sort');
 const status=document.getElementById('store-state');
 if(status)status.textContent=products.length?'Manual ordering available · catalogue is for reference':'Manual ordering available · contact VoltTech';
 const hero=document.getElementById('store-hero-copy');
 if(hero)hero.textContent='We are still accepting PC parts and gaming gear enquiries directly on WhatsApp.';
 if(!products.length||!catalogue||!grid){if(catalogue)catalogue.hidden=true;monitorRecovery();return;}
 catalogue.hidden=false;catalogue.dataset.source='offline-snapshot';catalogue.dataset.mode='enquiry';
 document.getElementById('catalogue-preview')?.setAttribute('hidden','');
 document.querySelector('.smart-filter-shell')?.setAttribute('hidden','');
 const filterChips=document.getElementById('active-filter-chips');if(filterChips)filterChips.hidden=true;
 const searchInput=search;searchInput.value=state.search||'';
 for(const option of sort.options){if(option.value.startsWith('price-')){option.disabled=true;option.hidden=true;}}
 if(state.sort.startsWith('price-'))state.sort='featured';
 sort.value=state.sort;
 const pager=document.createElement('nav');
 pager.className='catalogue-page-controls';
 pager.setAttribute('aria-label','Emergency catalogue pages');
 grid.after(pager);
 let limit=24;
 const render=()=>{
  const matches=filterProducts(products,{...state,sort:state.sort,search:state.search||''});
  const pageCount=Math.max(1,Math.ceil(matches.length/limit));
  state.page=Math.min(Math.max(1,state.page||1),pageCount);
  const start=(state.page-1)*limit,visible=matches.slice(start,start+limit);
  grid.innerHTML=visible.length?visible.map(card).join(''):'<div class="empty-state"><h3>No products matched.</h3><p>Try another search or ask us directly on WhatsApp.</p></div>';
  count.textContent=matches.length.toLocaleString('en-ZA')+' products to enquire about';
  pager.innerHTML=`<button type="button" data-offline-page="prev" ${state.page===1?'disabled':''}>← Previous</button><span>Page ${state.page} of ${pageCount}</span><button type="button" data-offline-page="next" ${state.page===pageCount?'disabled':''}>Next →</button>`;
  bindImages(grid);
 };
 searchInput.addEventListener('input',()=>{state.search=searchInput.value.trim();state.category='all';state.filters={};state.page=1;render();});
 sort.addEventListener('change',()=>{state.sort=sort.value;state.page=1;render();});
 pager.addEventListener('click',event=>{const button=event.target.closest('[data-offline-page]');if(!button||button.disabled)return;state.page+=button.dataset.offlinePage==='next'?1:-1;render();catalogue.scrollIntoView({block:'start'});});
 document.getElementById('reset-filters')?.addEventListener('click',()=>{state.category='all';state.filters={};state.search='';state.sort='featured';state.page=1;searchInput.value='';sort.value='featured';render();});
 render();
 monitorRecovery();
}

export async function showEmergencyProduct(slug){
 const products=await snapshotProducts().catch(()=>[]);
 const product=products.find(row=>(row.slug||row.id)===slug || publicProductSlug(row)===slug);
 emergencyNotice('Online ordering is temporarily unavailable.',
 'VoltTech is still accepting enquiries. Prices, availability and delivery are confirmed directly on WhatsApp.',product);
 const host=document.getElementById('product-detail');
 if(!product){monitorRecovery();return;}
 if(host){
  host.hidden=false;host.dataset.mode='enquiry';
  const specs=Object.entries(product.specs||{}).filter(([key,value])=>typeof value==='string'||typeof value==='number').filter(([,value])=>String(value).length<160).slice(0,8);
  host.innerHTML=`<div class="component-overview"><div class="component-showcase">${imageMarkup(product,true)}</div><div class="component-summary"><p class="eyebrow">${esc(product.brand||'VoltTech')}</p><h2>${esc(product.name)}</h2><p>Current price and supplier availability are confirmed on enquiry. No payment is being taken through this page.</p>${specs.length?`<dl class="component-specs">${specs.map(([key,value])=>`<div><dt>${esc(key.replace(/_/g,' '))}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>`:''}<a class="button" href="${esc(enquiryLink(product))}" target="_blank" rel="noopener noreferrer">ENQUIRE ABOUT THIS PRODUCT ON WHATSAPP →</a></div></div>`;
  bindImages(host);
 }
 const label=document.getElementById('component-label'),title=document.getElementById('component-title');
 if(label)label.textContent=(product.brand||'VOLTTECH')+' / PRODUCT ENQUIRY';
 if(title)title.textContent=product.name;
 document.title=product.name+' | VoltTech Computer Co.';
 monitorRecovery();
}
