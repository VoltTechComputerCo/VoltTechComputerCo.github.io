export const FILTER_KEYS = [
  'brand','gpuVendor','platform','socket','architecture','cores','vramGB','chipset','formFactor',
  'memoryType','capacityGB','speedMTs','interface','pcieGeneration','wattage','efficiency','modular',
  'supportedMotherboardSizes','coolerType','radiatorSizeMm','supportedSockets','sizeMm','fanCount','argb'
];

const BRAND_UI = {
  'NVIDIA':{color:'#76B900',icon:'nvidia'},
  'AMD':{color:'#ED1C24',icon:'amd'},
  'Intel':{color:'#0071C5',icon:'intel'},
  'ASUS':{color:'#F2F5F7',icon:'asus'},
  'MSI':{color:'#FF0000',icon:'msi'},
  'Gigabyte':{color:'#008CD6',icon:'gigabyte'},
  'Sapphire':{color:'#E31B23',icon:'sapphire'},
  'ASRock':{color:'#E7EDF3',icon:'asrock'},
  'Corsair':{color:'#FFD400',icon:'corsair'},
  'G.Skill':{color:'#E31B23',icon:'gskill'},
  'Kingston':{color:'#D71920',icon:'kingstontechnology'},
  'TeamGroup':{color:'#00AEEF',icon:'teamgroup'},
  'Samsung':{color:'#1428A0',icon:'samsung'},
  'Crucial':{color:'#0092D0',icon:'crucial'},
  'Western Digital':{color:'#0067B1',icon:'westerndigital'},
  'Seagate':{color:'#6EBE44',icon:'seagate'},
  'Lexar':{color:'#D51F2B',icon:'lexar'},
  'ARCTIC':{color:'#00AEEF',icon:'arctic'},
  'be quiet!':{color:'#F28C28',icon:'bequiet'},
  'Cooler Master':{color:'#705CF6',icon:'coolermaster'},
  'DeepCool':{color:'#00B5E2',icon:'deepcool'},
  'Noctua':{color:'#C8956C',icon:'noctua'},
  'NZXT':{color:'#7B61FF',icon:'nzxt'},
  'Thermalright':{color:'#F97316',icon:'thermalright'},
  'Fractal Design':{color:'#E4E7EA',icon:'fractaldesign'},
  'Lian Li':{color:'#3BAFEA',icon:'lianli'},
  'Montech':{color:'#00C9A7',icon:'montech'},
  'Phanteks':{color:'#8EA3B0',icon:'phanteks'},
  'Seasonic':{color:'#F28C28',icon:'seasonic'},
  'Super Flower':{color:'#FF4FA3',icon:'superflower'}
};

const CATEGORY_LABELS = {
  gpu:'Graphics cards', cpu:'Processors', motherboard:'Motherboards', memory:'Memory',
  storage:'Storage', cooler:'CPU cooling', case:'Cases', psu:'Power supplies', fan:'Case fans'
};

const QUICK = {
  cpu:{ title:'Choose a processor brand', direct:['AMD','Intel'] },
  gpu:{
    title:'Choose the GPU platform',
    staged:{
      key:'gpuVendor',
      values:{
        NVIDIA:['ASUS','Gigabyte','MSI'],
        AMD:['ASUS','Gigabyte','Sapphire'],
        Intel:['ASRock','Intel']
      }
    }
  },
  motherboard:{
    title:'Choose the platform',
    staged:{
      key:'platform',
      values:{
        AMD:['ASRock','ASUS','Gigabyte','MSI'],
        Intel:['ASRock','ASUS','Gigabyte','MSI']
      }
    }
  },
  memory:{ title:'Choose a memory brand', direct:['Corsair','G.Skill','Kingston','TeamGroup'] },
  storage:{ title:'Choose a storage brand', direct:['Crucial','Kingston','Lexar','Samsung','Seagate','TeamGroup','Western Digital'] },
  psu:{ title:'Choose a PSU brand', direct:['be quiet!','Cooler Master','Corsair','MSI','Seasonic','Super Flower'] },
  case:{ title:'Choose a case brand', direct:['Cooler Master','Corsair','DeepCool','Fractal Design','Lian Li','Montech','NZXT','Phanteks'] },
  cooler:{ title:'Choose a cooling brand', direct:['ARCTIC','be quiet!','Cooler Master','Corsair','DeepCool','Noctua','NZXT','Thermalright'] },
  fan:{ title:'Choose a fan brand', direct:['ARCTIC','be quiet!','Cooler Master','Corsair','Noctua'] }
};

export const FACETS = {
  all:[
    {key:'brand',label:'Brand'}
  ],
  cpu:[
    {key:'brand',label:'Brand'},
    {key:'socket',label:'Socket'},
    {key:'architecture',label:'Architecture'},
    {key:'cores',label:'CPU cores'}
  ],
  gpu:[
    {key:'gpuVendor',label:'GPU maker'},
    {key:'brand',label:'Board partner'},
    {key:'vramGB',label:'VRAM'}
  ],
  motherboard:[
    {key:'platform',label:'Platform'},
    {key:'brand',label:'Manufacturer'},
    {key:'socket',label:'Socket'},
    {key:'chipset',label:'Chipset'},
    {key:'formFactor',label:'Form factor'},
    {key:'memoryType',label:'Memory'}
  ],
  memory:[
    {key:'brand',label:'Brand'},
    {key:'memoryType',label:'Generation'},
    {key:'capacityGB',label:'Capacity'},
    {key:'speedMTs',label:'Speed'}
  ],
  storage:[
    {key:'brand',label:'Brand'},
    {key:'interface',label:'Interface'},
    {key:'pcieGeneration',label:'PCIe generation'},
    {key:'capacityGB',label:'Capacity'},
    {key:'formFactor',label:'Form factor'}
  ],
  psu:[
    {key:'brand',label:'Brand'},
    {key:'wattage',label:'Wattage'},
    {key:'efficiency',label:'Efficiency'},
    {key:'modular',label:'Modularity'}
  ],
  case:[
    {key:'brand',label:'Brand'},
    {key:'supportedMotherboardSizes',label:'Motherboard size'}
  ],
  cooler:[
    {key:'brand',label:'Brand'},
    {key:'coolerType',label:'Cooler type'},
    {key:'radiatorSizeMm',label:'Radiator'},
    {key:'supportedSockets',label:'Socket'}
  ],
  fan:[
    {key:'brand',label:'Brand'},
    {key:'sizeMm',label:'Fan size'},
    {key:'fanCount',label:'Pack size'},
    {key:'argb',label:'ARGB'}
  ]
};

export function accentFor(value){
  return BRAND_UI[value]?.color || '#59f5e5';
}

export function brandMark(value,label=value){
  const ui=BRAND_UI[value];
  if(!ui) return `<span class="filter-brand-lockup"><span class="filter-brand-name">${label}</span></span>`;
  const logo=`https://cdn.simpleicons.org/${encodeURIComponent(ui.icon)}`;
  return `<span class="filter-brand-lockup"><span class="filter-brand-logo"><img src="${logo}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.parentElement.hidden=true"></span><span class="filter-brand-name">${label}</span></span>`;
}

export function gpuVendor(product){
  const brand=String(product?.brand||'').trim().toLowerCase();
  const haystack=`${product?.name||''} ${product?.model||''}`.toLowerCase();
  if(brand==='intel' || /\bintel\s+arc\b|\barc\s*[ab]\d{3,4}\b/.test(haystack)) return 'Intel';
  if(/geforce|\brtx\b|\bgtx\b/.test(haystack)) return 'NVIDIA';
  if(/radeon|\brx\s*\d/.test(haystack)) return 'AMD';
  if(/\barc\b/.test(haystack)) return 'Intel';
  return '';
}

export function platformFor(product){
  const socket=String(product?.specs?.socket||'').toUpperCase();
  if(socket.startsWith('AM')) return 'AMD';
  if(socket.startsWith('LGA')) return 'Intel';
  return '';
}

export function facetValue(product,key){
  if(key==='brand') return product?.brand || '';
  if(key==='gpuVendor') return gpuVendor(product);
  if(key==='platform') return platformFor(product);
  return product?.specs?.[key];
}

function scalarValues(value){
  if(Array.isArray(value)) return value.flatMap(v=>scalarValues(v));
  if(value===null || value===undefined || value==='') return [];
  return [String(value)];
}

export function matchesFacet(product,key,wanted){
  if(wanted===null || wanted===undefined || wanted==='') return true;
  const target=String(wanted).toLowerCase();
  return scalarValues(facetValue(product,key)).some(value=>value.toLowerCase()===target);
}

export function matchesFacetFilters(product,filters={},skipKey=''){
  return Object.entries(filters).every(([key,value])=>key===skipKey || !value || matchesFacet(product,key,value));
}

export function facetDefinitions(category){
  return FACETS[category] || FACETS.all;
}

function categoryMatch(product,category){
  return category==='all' || product?.category_slug===category || product?.type===category;
}

export function facetOptions(products,category,key,filters={}){
  const counts=new Map();
  products
    .filter(p=>categoryMatch(p,category))
    .filter(p=>matchesFacetFilters(p,filters,key))
    .forEach(product=>{
      scalarValues(facetValue(product,key)).forEach(value=>counts.set(value,(counts.get(value)||0)+1));
    });
  return [...counts.entries()]
    .map(([value,count])=>({value,count}))
    .sort((a,b)=>{
      const na=Number(a.value), nb=Number(b.value);
      if(Number.isFinite(na)&&Number.isFinite(nb)) return na-nb;
      return a.value.localeCompare(b.value,undefined,{numeric:true,sensitivity:'base'});
    });
}

export function formatFacetValue(key,value){
  const s=String(value);
  if(key==='vramGB') return `${s} GB`;
  if(key==='capacityGB'){
    const n=Number(value);
    return n>=1000 && n%1000===0 ? `${n/1000} TB` : `${s} GB`;
  }
  if(key==='speedMTs') return `${s} MT/s`;
  if(key==='wattage') return `${s} W`;
  if(key==='radiatorSizeMm'||key==='sizeMm') return `${s} mm`;
  if(key==='cores') return `${s} cores`;
  if(key==='fanCount') return Number(value)===1 ? 'Single fan' : `${s}-fan pack`;
  if(key==='modular'){
    if(s==='true') return 'Modular';
    if(s==='false') return 'Non-modular';
  }
  if(key==='argb') return s==='true' ? 'ARGB' : s==='false' ? 'No ARGB' : s;
  return s;
}

function storeHref(category,filters={}){
  const url=new URL('store.html',location.href);
  if(category && category!=='all') url.searchParams.set('category',category);
  Object.entries(filters).forEach(([key,value])=>{ if(value) url.searchParams.set(key,value); });
  url.hash='catalogue';
  return url.pathname.split('/').pop()+url.search+url.hash;
}

function menuLink(category,label,filters={},className=''){
  const identity=filters.brand || filters.gpuVendor || filters.platform || '';
  const accent=accentFor(identity);
  const content=identity ? brandMark(identity,label) : `<span class="filter-brand-name">${label}</span>`;
  return `<a class="filter-menu-option ${className}" style="--filter-accent:${accent}" href="${storeHref(category,filters)}">${content}<b aria-hidden="true">→</b></a>`;
}

function renderDirect(category,config){
  return `<div class="filter-menu-options">${config.direct.map(brand=>menuLink(category,brand,{brand})).join('')}</div>`;
}

function renderStaged(category,config,panel,selected=''){
  const key=config.staged.key;
  const values=Object.keys(config.staged.values);
  const stageButtons=values.map(value=>`<button class="filter-menu-option filter-stage-button ${selected===value?'is-selected':''}" type="button" data-stage-value="${value}" style="--filter-accent:${accentFor(value)}" aria-pressed="${selected===value?'true':'false'}">${brandMark(value)}<b aria-hidden="true">↓</b></button>`).join('');
  const partners=selected ? config.staged.values[selected] || [] : [];
  const label=key==='gpuVendor'?'Board partner':'Manufacturer';
  const categoryWord=category==='gpu'?'GPUs':'components';
  const partnerMarkup=selected ? `<div class="filter-menu-substage"><div class="filter-menu-subhead"><span>${label}</span></div><div class="filter-menu-options">${menuLink(category,`All ${selected} ${categoryWord}`,{[key]:selected},'filter-menu-all')}${partners.map(brand=>menuLink(category,brand,{[key]:selected,brand})).join('')}</div></div>` : '<p class="filter-menu-help">Choose the platform first, then narrow it by manufacturer.</p>';
  panel.dataset.stage=selected;
  return `<div class="filter-menu-options filter-menu-stage">${stageButtons}</div><div data-stage-target>${partnerMarkup}</div>`;
}

function closeMenus(except=null){
  document.querySelectorAll('.category-filter-menu').forEach(panel=>{
    if(panel===except) return;
    panel.remove();
  });
  document.querySelectorAll('[data-filter-menu-open="true"]').forEach(card=>{
    if(except && card.nextElementSibling===except) return;
    card.dataset.filterMenuOpen='false';
    card.setAttribute('aria-expanded','false');
  });
}

function openMenu(card,category){
  const existing=card.nextElementSibling?.classList.contains('category-filter-menu') ? card.nextElementSibling : null;
  if(existing){ closeMenus(); return; }
  closeMenus();
  const config=QUICK[category];
  if(!config){ location.href=storeHref(category); return; }
  const panel=document.createElement('div');
  panel.className='category-filter-menu';
  panel.setAttribute('role','group');
  panel.setAttribute('aria-label',`${CATEGORY_LABELS[category]||category} filters`);
  panel.innerHTML=`<div class="filter-menu-head"><div><span class="eyebrow">QUICK FILTER</span><strong>${config.title}</strong></div>${menuLink(category,`Browse all ${CATEGORY_LABELS[category]||'components'}`,{},'filter-menu-all')}</div><div data-filter-menu-body></div>`;
  const body=panel.querySelector('[data-filter-menu-body]');
  if(config.direct) body.innerHTML=renderDirect(category,config);
  else body.innerHTML=renderStaged(category,config,panel,'');
  card.insertAdjacentElement('afterend',panel);
  card.dataset.filterMenuOpen='true';
  card.setAttribute('aria-expanded','true');
  if(config.staged){
    panel.addEventListener('click',event=>{
      const button=event.target.closest('[data-stage-value]');
      if(!button) return;
      event.preventDefault();
      const value=button.dataset.stageValue;
      body.innerHTML=renderStaged(category,config,panel,value);
    });
  }
}

export function installCategoryFilterMenus(root=document){
  const cards=[
    ...root.querySelectorAll('.component-card[data-category]'),
    ...root.querySelectorAll('.store-category[data-category-link]')
  ];
  cards.forEach(card=>{
    if(card.dataset.filterMenuBound==='true') return;
    card.dataset.filterMenuBound='true';
    const category=card.dataset.category || card.dataset.categoryLink;
    card.setAttribute('aria-haspopup','true');
    card.setAttribute('aria-expanded','false');
    const arrow=card.querySelector('.card-arrow') || card.querySelector(':scope > span:last-child');
    if(arrow) arrow.textContent='⌄';
    card.addEventListener('click',event=>{
      if(event.target.closest('.category-filter-menu')) return;
      event.preventDefault();
      openMenu(card,category);
    });
  });
  document.addEventListener('click',event=>{
    if(event.target.closest('.category-filter-menu') || event.target.closest('.component-card[data-category]') || event.target.closest('.store-category[data-category-link]')) return;
    closeMenus();
  });
  document.addEventListener('keydown',event=>{ if(event.key==='Escape') closeMenus(); });
}
