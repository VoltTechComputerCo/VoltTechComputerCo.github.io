import { openCatalogue, showGate, publicProducts, withTimeout, addItem } from '../services/catalogue.js';
import { productCard, filterProducts, bindImages } from '../components/catalogue-view.js?v=2.2.0';
import { connectCatalogueCart } from '../services/catalogue-cart.js';
import { FILTER_KEYS, accentFor, brandMark, facetDefinitions, facetOptions, formatFacetValue, installCategoryFilterMenus } from '../components/store-filter-menu.js?v=1.2.0';

const query=new URLSearchParams(location.search);
const categories=[...document.querySelectorAll('[data-category-link]')];
const selected=categories.find(a=>a.dataset.categoryLink===query.get('category'));
const filters={};
FILTER_KEYS.forEach(key=>{ const value=query.get(key); if(value!==null && value!=='') filters[key]=value; });

const state={
  category:selected?.dataset.categoryLink || 'all',
  filters,
  search:query.get('q') || '',
  sort:['featured','name','brand'].includes(query.get('sort')) ? query.get('sort') : 'featured'
};

const search=document.getElementById('catalogue-search');
const sort=document.getElementById('catalogue-sort');
const grid=document.getElementById('product-grid');
const count=document.getElementById('result-count');
const filterHost=document.getElementById('catalogue-smart-filters');
const chipHost=document.getElementById('active-filter-chips');

function categoryLabel(){
  return categories.find(a=>a.dataset.categoryLink===state.category)?.dataset.label || 'All components';
}

function selectCategory(){
  categories.forEach(a=>{
    if(a.dataset.categoryLink===state.category) a.setAttribute('aria-current','page');
    else a.removeAttribute('aria-current');
  });
  document.getElementById('category-name').textContent=state.category==='all' ? 'Every part. One purpose.' : categoryLabel();
  const contact=document.getElementById('category-enquiry');
  contact.href=`https://wa.me/27618435775?text=${encodeURIComponent('Hi VoltTech, I would like help choosing '+(state.category==='all'?'PC components':categoryLabel().toLowerCase())+' for my setup.')}`;
}

function updateUrl(){
  const url=new URL(location.href);
  ['category','q','sort',...FILTER_KEYS].forEach(key=>url.searchParams.delete(key));
  if(state.category!=='all') url.searchParams.set('category',state.category);
  if(state.search) url.searchParams.set('q',state.search);
  if(state.sort!=='featured') url.searchParams.set('sort',state.sort);
  Object.entries(state.filters).forEach(([key,value])=>{ if(value) url.searchParams.set(key,value); });
  url.hash='catalogue';
  history.replaceState(null,'',url);
}

function pruneFilters(products){
  const definitions=facetDefinitions(state.category);
  const allowed=new Set(definitions.map(item=>item.key));
  Object.keys(state.filters).forEach(key=>{ if(!allowed.has(key)) delete state.filters[key]; });
  let changed=true;
  let guard=0;
  while(changed && guard<definitions.length+2){
    changed=false; guard++;
    definitions.forEach(def=>{
      const selectedValue=state.filters[def.key];
      if(!selectedValue) return;
      const available=facetOptions(products,state.category,def.key,state.filters).some(option=>String(option.value)===String(selectedValue));
      if(!available){ delete state.filters[def.key]; changed=true; }
    });
  }
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
  const definitions=facetDefinitions(state.category);
  const blocks=definitions.map(def=>{
    const options=facetOptions(products,state.category,def.key,state.filters);
    const selectedValue=state.filters[def.key] || '';
    if(!options.length && !selectedValue) return '';
    const selectedLabel=selectedValue ? formatFacetValue(def.key,selectedValue) : 'All';
    const buttons=[
      `<button class="smart-filter-option ${!selectedValue?'is-selected':''}" type="button" data-filter-key="${def.key}" data-filter-value="" style="--filter-accent:#59f5e5">All<small>${options.reduce((n,item)=>n+item.count,0)} products</small></button>`,
      ...options.map(option=>{
        const selected=String(option.value)===String(selectedValue);
        const branded=def.key==='gpuVendor'||def.key==='platform'||def.key==='brand';
        const accent=accentFor(branded?option.value:'');
        const label=branded ? brandMark(option.value,formatFacetValue(def.key,option.value)) : `<span class="filter-brand-name">${formatFacetValue(def.key,option.value)}</span>`;
        return `<button class="smart-filter-option ${selected?'is-selected':''}" type="button" data-filter-key="${def.key}" data-filter-value="${String(option.value).replace(/"/g,'&quot;')}" style="--filter-accent:${accent}">${label}<small>${option.count} product${option.count===1?'':'s'}</small></button>`;
      })
    ].join('');
    return `<details class="smart-filter" ${selectedValue?'data-has-value="true"':''}><summary><span><b>${def.label}</b><small>${selectedLabel}</small></span></summary><div class="smart-filter-options">${buttons}</div></details>`;
  }).join('');
  filterHost.innerHTML=blocks || '<p class="micro">Choose a category to unlock more filters.</p>';
  renderActiveChips();
}

function bindFilterUI(products,render){
  filterHost?.addEventListener('click',event=>{
    const button=event.target.closest('[data-filter-key]');
    if(!button) return;
    const key=button.dataset.filterKey;
    const value=button.dataset.filterValue || '';
    if(value) state.filters[key]=value; else delete state.filters[key];
    pruneFilters(products);
    render();
    button.closest('details')?.removeAttribute('open');
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

selectCategory();
installCategoryFilterMenus(document);

function applyQuickFilters(params){
  if(params.category) state.category=params.category;
  const next={...state.filters};
  FILTER_KEYS.forEach(key=>{
    if(Object.prototype.hasOwnProperty.call(params,key)){
      const value=params[key];
      if(value) next[key]=value; else delete next[key];
    }
  });
  state.filters=next;
  selectCategory();
}

async function init(){
  try{
    const access=await openCatalogue();
    if(!access.open){ showGate(access); return; }
    const { VT, preview }=access;
    const data=await withTimeout(VT.loadStore());
    if(data.settings?.catalogue_enabled!==true && !preview){ showGate({reason:'closed'}); return; }
    const products=publicProducts(data.products,preview);

    document.getElementById('store-gate').hidden=true;
    document.getElementById('catalogue').hidden=false;
    document.getElementById('store-state').textContent=preview?'ADMIN PREVIEW / STORE REMAINS LOCKED':'COMPONENT CATALOGUE';
    document.getElementById('catalogue-preview').hidden=!preview;
    document.getElementById('store-hero-copy').textContent='Explore component details, filter by the specs that matter and discuss the right parts for your setup.';
    search.value=state.search;
    sort.value=state.sort;
    pruneFilters(products);

    function render(){
      pruneFilters(products);
      const items=filterProducts(products,state);
      count.textContent=`${items.length} component${items.length===1?'':'s'}`;
      grid.innerHTML=items.length ? items.map(p=>productCard(VT,p,preview)).join('') : '<div class="empty-state"><h3>No components match those filters.</h3><p>Remove a filter, try another category or ask VoltTech about the part you need.</p></div>';
      bindImages(grid);
      grid.querySelectorAll('[data-add]').forEach(button=>button.addEventListener('click',()=>addItem(VT,products.find(p=>p.id===button.dataset.add),preview)));
      renderSmartFilters(products);
      updateUrl();
    }

    search.addEventListener('input',()=>{ state.search=search.value.trim(); render(); });
    sort.addEventListener('change',()=>{ state.sort=sort.value; render(); });
    document.getElementById('reset-filters').addEventListener('click',()=>{
      state.category='all'; state.filters={}; state.search=''; state.sort='featured';
      search.value=''; sort.value='featured'; selectCategory(); render(); search.focus();
    });
    document.querySelector('[data-category-link="all"]')?.addEventListener('click',event=>{
      event.preventDefault(); state.category='all'; state.filters={}; selectCategory(); render(); document.getElementById('catalogue').scrollIntoView({block:'start'});
    });

    document.addEventListener('volttech:quick-filter-stage',event=>{
      const detail=event.detail||{};
      if(detail.category && detail.key && detail.value){
        applyQuickFilters({category:detail.category,[detail.key]:detail.value});
        pruneFilters(products);
        render();
      }
    });

    document.addEventListener('click',event=>{
      const link=event.target.closest('.category-filter-menu a[data-quick-category]');
      if(!link) return;
      event.preventDefault();
      const params={category:link.dataset.quickCategory};
      FILTER_KEYS.forEach(key=>{
        const dataKey='quick'+key[0].toUpperCase()+key.slice(1);
        if(link.dataset[dataKey]!==undefined) params[key]=link.dataset[dataKey];
      });
      state.filters={};
      applyQuickFilters(params);
      pruneFilters(products);
      render();
      document.getElementById('catalogue')?.scrollIntoView({block:'start'});
    });

    bindFilterUI(products,render);
    render();
    if(location.hash==='#catalogue') requestAnimationFrame(()=>document.getElementById('catalogue')?.scrollIntoView({block:'start'}));
    connectCatalogueCart(VT,products,preview);
    VT.analytics('view_item_list',{item_list_name:'VoltTech PC Parts',items:products.slice(0,20).map(p=>({item_id:p.id,item_name:p.name}))});
  }catch(error){
    console.error('VoltTech Store filters:',error);
    showGate({reason:'connection'});
  }
}
init();
