import { searchCatalogue } from '../services/product-search.js?v=20261026-search2';
import { updateDepartmentImages } from '../services/store-departments.js?v=20261021.3';
import { openCatalogue, showGate, publicProducts, withTimeout, addItem } from '../services/catalogue.js?v=20261021.3';
import { productCard, filterProducts, bindImages } from '../components/catalogue-view.js?v=20261026-search2';
import { pageWindow, pageSize } from '../services/catalogue-pagination.js?v=20261021.3';
import { connectCatalogueCart } from '../services/catalogue-cart.js?v=20261021.3';
import { FILTER_KEYS, accentFor, facetDefinitions, facetOptions, formatFacetValue } from '../components/store-filter-menu.js?v=20261021.3';

const query=new URLSearchParams(location.search);
const landingHash=location.hash;
const categories=[...document.querySelectorAll('[data-category-link]')];
const selected=categories.find(a=>a.dataset.categoryLink===query.get('category'));
const filters={};
FILTER_KEYS.forEach(key=>{ const value=query.get(key); if(value!==null && value!=='') filters[key]=value; });

let savedSize;try{savedSize=localStorage.getItem('volttech-catalogue-page-size');}catch{}
const state={
  category:selected?.dataset.categoryLink || 'all',
  page:Math.max(1,Number(query.get('page'))||1),
  pageSize:pageSize(query.get('pageSize')||savedSize),
  filters,
  search:query.get('q') || '',
  sort:['featured','name','brand','price-low','price-high'].includes(query.get('sort')) ? query.get('sort') : 'featured'
};

const search=document.getElementById('catalogue-search');
const sort=document.getElementById('catalogue-sort');
const grid=document.getElementById('product-grid');
const count=document.getElementById('result-count');
const filterHost=document.getElementById('catalogue-smart-filters');
const chipHost=document.getElementById('active-filter-chips');

function categoryLabel(){
  return categories.find(a=>a.dataset.categoryLink===state.category)?.dataset.label || 'All products';
}

function selectCategory(){
  categories.forEach(a=>{
    if(a.dataset.categoryLink===state.category) a.setAttribute('aria-current','page');
    else a.removeAttribute('aria-current');
  });
  document.querySelectorAll('.department-card').forEach(card=>{const url=new URL(card.href);const active=card.dataset.category===state.category&&(!url.searchParams.has('laptopPurpose')||url.searchParams.get('laptopPurpose')===state.filters.laptopPurpose);if(active)card.setAttribute('aria-current','page');else card.removeAttribute('aria-current');});
  document.getElementById('category-name').textContent=state.category==='all' ? 'Shop all products' : categoryLabel();
  const contact=document.getElementById('category-enquiry');
  contact.href=`https://wa.me/27618435775?text=${encodeURIComponent('Hi VoltTech, I would like help choosing '+(state.category==='all'?'PC components':categoryLabel().toLowerCase())+' for my setup.')}`;
}

function updateUrl(){
  const url=new URL(location.href);
  ['category','q','sort','page','pageSize',...FILTER_KEYS].forEach(key=>url.searchParams.delete(key));
  if(state.category!=='all') url.searchParams.set('category',state.category);
  if(state.search) url.searchParams.set('q',state.search);
  if(state.sort!=='featured') url.searchParams.set('sort',state.sort);
  Object.entries(state.filters).forEach(([key,value])=>{ if(value) url.searchParams.set(key,value); });
  if(state.page>1) url.searchParams.set('page',state.page);
  url.searchParams.set('pageSize',state.pageSize);
  if(state.category!=='all'||state.search||landingHash==='#catalogue') url.hash='catalogue';
  history.replaceState(null,'',url);
}

function pruneFilters(products){
  const definitions=facetDefinitions(state.category);
  const allowed=new Set(definitions.map(item=>item.key));
  Object.keys(state.filters).forEach(key=>{ if(!allowed.has(key)) delete state.filters[key]; });

}

function renderActiveChips(){
  if(!chipHost) return;
  const defs=new Map(facetDefinitions(state.category).map(def=>[def.key,def.label]));
  const entries=Object.entries(state.filters).filter(([,value])=>value);
  chipHost.hidden=!entries.length && !state.search;
  const chips=[];
  if(state.search) chips.push(`<button class="active-filter-chip" type="button" data-clear-search style="--filter-accent:#59f5e5"><span>Search: ${state.search.replace(/[&<>"']/g,'')}</span><b>×</b></button>`);
  entries.forEach(([key,value])=>{
    const accent=accentFor(key==='gpuVendor'||key==='platform'||key==='brand'?value:'');
    chips.push(`<button class="active-filter-chip" type="button" data-clear-filter="${key}" style="--filter-accent:${accent}"><span>${defs.get(key)||key}: ${formatFacetValue(key,value)}</span><b>×</b></button>`);
  });
  chipHost.innerHTML=chips.join('');
}

function renderSmartFilters(products){
  if(!filterHost) return;
  const openKeys=new Set([...filterHost.querySelectorAll('details[open]')].map(d=>d.querySelector('[data-filter-key]')?.dataset.filterKey));
  const definitions=facetDefinitions(state.category);
  const blocks=definitions.map(def=>{
    const options=facetOptions(products,state.category,def.key,state.filters);
    if(def.key==='gpuVendor') for(const value of ['NVIDIA','AMD','Intel']) if(!options.some(o=>o.value===value)) options.push({value,count:0});
    const selectedValue=state.filters[def.key] || '';
    if(selectedValue && !options.some(option=>String(option.value)===String(selectedValue))) options.push({value:selectedValue,count:0});
    if(!options.length && !selectedValue) return '';
    const selectedLabel=selectedValue ? formatFacetValue(def.key,selectedValue) : 'All';
    const buttons=[
      `<button class="smart-filter-option ${!selectedValue?'is-selected':''}" type="button" data-filter-key="${def.key}" data-filter-value="" style="--filter-accent:#59f5e5">All<small>${options.reduce((n,item)=>n+item.count,0)} products</small></button>`,
      ...options.map(option=>{
        const selected=String(option.value)===String(selectedValue);
        const branded=def.key==='gpuVendor'||def.key==='platform'||def.key==='brand';
        const accent=accentFor(branded?option.value:'');
        const label=`<span class="filter-brand-name">${formatFacetValue(def.key,option.value)}</span>`;
        return `<button class="smart-filter-option ${selected?'is-selected':''}" type="button" data-filter-key="${def.key}" data-filter-value="${String(option.value).replace(/"/g,'&quot;')}" style="--filter-accent:${accent}">${label}<small>${option.count} product${option.count===1?'':'s'}</small></button>`;
      })
    ].join('');
    return `<details class="smart-filter" ${openKeys.has(def.key)?'open':''} ${selectedValue?'data-has-value="true"':''}><summary><span><b>${def.label}</b><small>${selectedLabel}</small></span></summary><div class="smart-filter-options">${buttons}</div></details>`;
  }).join('');
  filterHost.innerHTML=blocks || '<p class="micro">Choose a category to unlock more filters.</p>';
  renderActiveChips();
}

function bindFilterUI(products,render){
  filterHost?.addEventListener('click',event=>{
    const button=event.target.closest('[data-filter-key]');
    if(!button) return;
    const openKey=button.dataset.filterKey;
    const key=button.dataset.filterKey;
    const value=button.dataset.filterValue || '';
    if(key==='gpuVendor'||key==='platform') delete state.filters.brand;
    if(value) state.filters[key]=value; else delete state.filters[key];
    pruneFilters(products);
    render();
    filterHost.querySelectorAll('details').forEach(d=>{if(d.querySelector(`[data-filter-key="${openKey}"]`))d.open=true;});
  });
  chipHost?.addEventListener('click',event=>{
    const button=event.target.closest('button');
    if(!button) return;
    if(button.hasAttribute('data-clear-search')){ state.search=''; search.value=''; }
    const key=button.dataset.clearFilter;
    if(key) delete state.filters[key];
    render();
  });
}

const groupLinks=[...document.querySelectorAll('[data-department-group]')];
const departmentGroups=[...document.querySelectorAll('.department-group')];
function showDepartmentGroup(id){
  departmentGroups.forEach(group=>{group.hidden=group.id!==id;});
  groupLinks.forEach(link=>{
    const active=link.dataset.departmentGroup===id;
    if(active)link.setAttribute('aria-current','true');else link.removeAttribute('aria-current');
  });
}
const currentCard=[...document.querySelectorAll('.department-card')].find(card=>card.dataset.category===state.category);
showDepartmentGroup(departmentGroups.some(group=>'#'+group.id===landingHash)?landingHash.slice(1):currentCard?.closest('.department-group').id||'pc-components');
groupLinks.forEach(link=>link.addEventListener('click',event=>{event.preventDefault();showDepartmentGroup(link.dataset.departmentGroup);}));
// Header shortcuts should open their matching group even when it is currently hidden.
document.querySelectorAll('a[href*="#gaming-streaming"],a[href*="#laptops"],a[href*="#pc-components"],a[href*="#desk-essentials"]').forEach(link=>{
  if(link.hasAttribute('data-department-group'))return;
  link.addEventListener('click',event=>{const id=new URL(link.href).hash.slice(1);if(!departmentGroups.some(group=>group.id===id))return;event.preventDefault();showDepartmentGroup(id);document.getElementById('departments').scrollIntoView({block:'start'});});
});

if(matchMedia('(max-width:700px)').matches) document.querySelector('.smart-filter-shell').open=false;
selectCategory();
document.addEventListener('pointerdown',e=>document.querySelectorAll('.smart-filter[open],.shop-category-menu[open]').forEach(d=>{if(!d.contains(e.target))d.open=false;}));
document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.smart-filter[open],.shop-category-menu[open]').forEach(d=>{d.open=false;d.querySelector('summary')?.focus();});});

async function init(){
  try{
    const access=await openCatalogue();
    if(!access.open){ showGate(access); return; }
    const { VT, preview }=access;
    const data=await withTimeout(VT.loadStore(access.settings),30000);
    if(data.settings?.catalogue_enabled!==true && !preview){ showGate({reason:'closed'}); return; }
    const products=publicProducts(data.products,preview);
    updateDepartmentImages(products);

    const core=new Set(['gpu','cpu','motherboard','memory','storage','psu','case','cooler']);
    const featured=products.filter(p=>core.has(p.category_slug||p.type) && p.featured && Number(p.stock_qty)>0);
    const picks=(featured.length ? featured : filterProducts(products.filter(p=>core.has(p.category_slug||p.type)),{category:'all',filters:{},sort:'featured'})).slice(0,4);
    const featuredGrid=document.getElementById('featured-grid');

    document.getElementById('shop-featured').hidden=!picks.length || !!query.get('category') || !!query.get('q');
    document.getElementById('featured-heading').textContent=featured.length ? 'Featured upgrades' : 'Explore the catalogue';
    const weekly=products.filter(p=>p.metadata?.compare_at_verified===true&&Number(p.compare_at_price)>Number(p.retail_price)&&Number(p.stock_qty)>0&&Date.parse(p.metadata?.deal_ends_at)>Date.now());
    if(weekly.length){const section=document.createElement('section');section.className='container shop-featured';section.id='weekly-specials';section.innerHTML='<div class="section-heading"><div><p class="eyebrow">LIMITED-TIME OFFERS</p><h2>This week’s specials</h2><p>Limited offers, subject to availability. See each product for its offer end date.</p></div></div><div class="catalogue-grid"></div>';const host=section.querySelector('.catalogue-grid');host.innerHTML=weekly.map(p=>productCard(VT,p,preview)).join('');document.querySelector('.store-catalogue-wrap').after(section);bindImages(host);host.addEventListener('click',e=>{const b=e.target.closest('[data-add]');if(b)addItem(VT,products.find(p=>p.id===b.dataset.add),preview);});}
    featuredGrid.innerHTML=picks.map(p=>productCard(VT,p,preview)).join('');
    bindImages(featuredGrid);
    featuredGrid.addEventListener('click',e=>{const b=e.target.closest('[data-add]');if(b)addItem(VT,products.find(p=>p.id===b.dataset.add),preview);});


    document.getElementById('store-gate').hidden=true;
    document.getElementById('catalogue-loading')?.remove();
    document.getElementById('catalogue').hidden=false;
    document.getElementById('catalogue').dataset.source=data.source||'live';
    document.getElementById('catalogue').dataset.readyMs=String(Math.round(performance.now()));
    document.getElementById('store-state').textContent=preview?'ADMIN PREVIEW / STORE REMAINS LOCKED':`${products.length.toLocaleString('en-ZA')} products to explore`;
    document.getElementById('catalogue-preview').hidden=!preview;
    document.getElementById('store-hero-copy').textContent='PC parts, laptops and gear for work and play.';
    search.value=state.search;
    sort.value=state.sort;
    pruneFilters(products);

    const topPager=document.createElement('div'),bottomPager=document.createElement('div');
    topPager.className='catalogue-page-controls catalogue-page-controls-top';bottomPager.className='catalogue-page-controls';
    grid.before(topPager);grid.after(bottomPager);
    let previousSignature;
    function render(){
      pruneFilters(products);
      const signature=JSON.stringify([state.category,state.filters,state.search,state.sort]);
      if(previousSignature!==undefined&&previousSignature!==signature)state.page=1;
      previousSignature=signature;
      const items=filterProducts(products,state);
      const window=pageWindow(items.length,state.page,state.pageSize);state.page=window.page;
      const visible=items.slice(window.start,window.end);
      const controls=`<label>Show<select data-page-size>${[10,25,50,100].map(n=>`<option ${n===state.pageSize?'selected':''}>${n}</option>`).join('')}</select></label><p role="status">${items.length?window.start+1:0}–${window.end} of ${items.length}</p><nav aria-label="Catalogue pages"><button type="button" data-page="${window.page-1}" ${window.page===1?'disabled':''}>← Previous</button><span>Page ${window.page} of ${window.pages}</span><button type="button" data-page="${window.page+1}" ${window.page===window.pages?'disabled':''}>Next →</button></nav>`;
      topPager.innerHTML=bottomPager.innerHTML=controls;
      count.textContent=`${items.length} product${items.length===1?'':'s'}${state.searchKey===state.search&&state.searchBrand?' · Results for '+state.searchBrand:''}`;
      grid.innerHTML=items.length ? visible.map((p,i)=>productCard(VT,p,preview,i<4)).join('') : '<div class="empty-state"><h3>No components match those filters.</h3><p>Remove a filter, try another category or ask VoltTech about the part you need.</p></div>';
      bindImages(grid);
      grid.querySelectorAll('[data-add]').forEach(button=>button.addEventListener('click',()=>addItem(VT,products.find(p=>p.id===button.dataset.add),preview)));
      renderSmartFilters(products);
      updateUrl();
    }

    for(const pager of [topPager,bottomPager]){
      pager.addEventListener('click',e=>{const b=e.target.closest('button[data-page]');if(!b||!pager.contains(b)||b.disabled)return;state.page=Number(b.dataset.page);render();topPager.scrollIntoView({block:'start'});});
      pager.addEventListener('change',e=>{if(!e.target.matches('[data-page-size]'))return;state.pageSize=pageSize(e.target.value);state.page=1;try{localStorage.setItem('volttech-catalogue-page-size',state.pageSize);}catch{}render();});
    }
    let searchTimer,searchVersion=0;
    async function refreshSearch(){
      const text=state.search,token=++searchVersion;if(text.length<2)return;
      try{
        const result=await searchCatalogue(text);
        if(token!==searchVersion||state.search!==text)return;
        state.searchKey=text;state.searchMatches=new Map(result.matches.map(r=>[r.id,Number(r.score)||0]));state.searchBrand=result.brand;render();
      }catch{/* Local typo-tolerant catalogue search remains usable during an outage. */}
    }
    search.addEventListener('input',()=>{
      searchVersion++;clearTimeout(searchTimer);state.search=search.value.trim();state.searchKey=null;state.searchMatches=null;state.searchBrand=null;
      if(state.search){state.category='all';state.filters={};selectCategory();}
      render();searchTimer=setTimeout(refreshSearch,180);
    });
    sort.addEventListener('change',()=>{ state.sort=sort.value; render(); });
    document.getElementById('reset-filters').addEventListener('click',()=>{
      state.category='all'; state.filters={}; state.search=''; state.sort='featured'; state.page=1;
      search.value=''; sort.value='featured'; selectCategory(); render(); search.focus();
    });
    document.querySelectorAll('[data-category-link],.department-card,[data-store-all]').forEach(link=>link.addEventListener('click',event=>{
      if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
      event.preventDefault();
      const url=new URL(link.href);
      state.category=url.searchParams.get('category')||'all';state.filters={};state.search='';state.page=1;
      FILTER_KEYS.forEach(key=>{if(url.searchParams.has(key))state.filters[key]=url.searchParams.get(key);});
      search.value='';
      const card=[...document.querySelectorAll('.department-card')].find(card=>card.dataset.category===state.category);
      if(card)showDepartmentGroup(card.closest('.department-group').id);
      document.querySelector('.shop-category-menu').open=false;
      selectCategory();render();
      document.getElementById('catalogue').scrollIntoView({block:'start'});
    }));

    filterHost?.addEventListener('toggle',e=>{if(e.target.open)filterHost.querySelectorAll('details').forEach(d=>{if(d!==e.target)d.open=false;});},true);
    bindFilterUI(products,render);
    render();
    if(state.search)refreshSearch();
    if(landingHash==='#catalogue'||query.get('category')||query.get('q')) requestAnimationFrame(()=>document.getElementById('catalogue')?.scrollIntoView({block:'start'}));
    connectCatalogueCart(VT,products,preview);
    VT.analytics('view_item_list',{item_list_name:'VoltTech PC Parts',items:products.slice(0,20).map(p=>({item_id:p.id,item_name:p.name}))});
  }catch(error){
    console.error('VoltTech Store filters:',error?.message||String(error));
    showGate({reason:'connection'});
  }
}
init();
