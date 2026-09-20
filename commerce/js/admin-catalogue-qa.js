(function(){
'use strict';

const VT=window.VoltTechStore;
if(!VT)return;

const client=VT.getClient();
const panel=document.getElementById('catalogueQaPanel');
const list=document.getElementById('catalogueQaList');
const summary=document.getElementById('catalogueQaSummary');
const search=document.getElementById('catalogueQaSearch');
const filter=document.getElementById('catalogueQaFilter');

let products=[];

function esc(v){return VT.esc(v)}
function safe(v){return VT.safeUrl(v)}
function value(v){return v==null||v===''?'—':String(v)}

function mediaUrl(p){
  return safe(p.media?.primaryImage||p.media?.primary_image||'');
}

function identityIssues(p){
  const ids=p.identifiers||{};
  const issues=[];
  if(!p.brand)issues.push('Brand');
  if(!p.model)issues.push('Model');
  if(!p.manufacturer)issues.push('Manufacturer');
  if(!ids.mpn&&!ids.manufacturerPartNumber&&!ids.manufacturer_part_number&&!ids.partNumber&&!ids.part_number)issues.push('MPN');
  if(!ids.sku&&!ids.supplierSku&&!ids.supplier_sku)issues.push('Supplier SKU');
  return issues;
}

function specIssues(p){
  const issues=[];
  if(!p.specs||Object.keys(p.specs).length<2)issues.push('Specifications');
  if(!p.compatibility||Object.keys(p.compatibility).length<1)issues.push('Compatibility');
  if(!p.short_description)issues.push('Description');
  if(!Array.isArray(p.highlights)||p.highlights.length<1)issues.push('Highlights');
  return issues;
}

function shippingIssues(p){
  const issues=[];
  if(p.warranty_months==null)issues.push('Warranty');
  if(p.lead_time_days==null)issues.push('Lead time');
  if(p.shipping_weight_kg==null)issues.push('Weight');
  if(p.shipping_length_cm==null||p.shipping_width_cm==null||p.shipping_height_cm==null)issues.push('Package size');
  if(!p.shipping_class)issues.push('Shipping class');
  if(!p.shipping_packaging_verified)issues.push('Packaging verification');
  return issues;
}

function mediaIssues(p){
  const issues=[];
  if(!mediaUrl(p))issues.push('Missing image');
  if(p.metadata?.media_review_required)issues.push('Image needs review');
  return issues;
}

function score(p){
  const groups=[
    {ok:!!p.brand&&!!p.model,weight:10},
    {ok:!!p.short_description,weight:8},
    {ok:Array.isArray(p.highlights)&&p.highlights.length>0,weight:6},
    {ok:p.specs&&Object.keys(p.specs).length>=2,weight:14},
    {ok:p.compatibility&&Object.keys(p.compatibility).length>=1,weight:12},
    {ok:!!mediaUrl(p),weight:12},
    {ok:!p.metadata?.media_review_required,weight:8},
    {ok:identityIssues(p).length===0,weight:12},
    {ok:p.warranty_months!=null,weight:6},
    {ok:p.shipping_weight_kg!=null&&p.shipping_length_cm!=null&&p.shipping_width_cm!=null&&p.shipping_height_cm!=null,weight:8},
    {ok:!!p.shipping_class&&!!p.shipping_packaging_verified,weight:4}
  ];
  return groups.reduce((n,g)=>n+(g.ok?g.weight:0),0);
}

function issuesFor(p){
  return {
    image:mediaIssues(p),
    identity:identityIssues(p),
    specs:specIssues(p),
    shipping:shippingIssues(p)
  };
}

function allIssues(p){
  const x=issuesFor(p);
  return [...x.image,...x.identity,...x.specs,...x.shipping];
}

function matchesFilter(p){
  const f=filter?.value||'all';
  const issues=issuesFor(p);
  if(f==='image')return issues.image.length>0;
  if(f==='identity')return issues.identity.length>0;
  if(f==='specs')return issues.specs.length>0;
  if(f==='shipping')return issues.shipping.length>0;
  if(f==='ready')return allIssues(p).length===0;
  return true;
}

function visibleProducts(){
  const q=(search?.value||'').trim().toLowerCase();
  return products.filter(p=>{
    if(!matchesFilter(p))return false;
    if(!q)return true;
    const hay=[
      p.name,p.brand,p.model,p.type,
      ...(allIssues(p)),
      JSON.stringify(p.specs||{}),
      JSON.stringify(p.compatibility||{})
    ].join(' ').toLowerCase();
    return hay.includes(q);
  });
}

function renderSummary(){
  const image=products.filter(p=>mediaIssues(p).length).length;
  const identity=products.filter(p=>identityIssues(p).length).length;
  const shipping=products.filter(p=>shippingIssues(p).length).length;
  const avg=products.length?Math.round(products.reduce((n,p)=>n+score(p),0)/products.length):0;

  summary.innerHTML=`
    <div class="qa-stat"><b>${products.length}</b><span>Demo fixtures</span></div>
    <div class="qa-stat ${image?'warn':''}"><b>${image}</b><span>Images to review</span></div>
    <div class="qa-stat ${identity?'warn':''}"><b>${identity}</b><span>Identity gaps</span></div>
    <div class="qa-stat ${shipping?'warn':''}"><b>${shipping}</b><span>Shipping-data gaps</span></div>
    <div class="qa-stat"><b>${avg}%</b><span>Avg structure score</span></div>`;
}

function issueTags(p){
  const issues=allIssues(p);
  if(!issues.length)return '<span class="qa-issue ok">Structure complete</span>';
  return issues.slice(0,8).map(x=>`<span class="qa-issue">${esc(x)}</span>`).join('')+
    (issues.length>8?`<span class="qa-issue">+${issues.length-8} more</span>`:'');
}

function card(p){
  const img=mediaUrl(p);
  const official=safe(p.media?.officialUrl);
  const s=score(p);
  const reviewed=!p.metadata?.media_review_required;

  return `<article class="qa-card" data-qa-card="${esc(p.id)}">
    <div class="qa-image">
      ${img?`<img src="${esc(img)}" alt="${esc(p.name)}" loading="lazy">`:
        `<div class="qa-image-missing">NO IMAGE</div>`}
      <span class="qa-demo">DEMO</span>
      <span class="qa-score ${s<65?'low':s<85?'mid':'high'}">${s}%</span>
    </div>

    <div class="qa-body">
      <div class="qa-title-row">
        <div>
          <div class="kicker">${esc(p.brand||'Unknown brand')} // ${esc(VT.categoryLabel(p.type))}</div>
          <h3>${esc(p.name)}</h3>
          <small>${esc(p.model||'Model not loaded')}</small>
        </div>
        <span class="qa-review-state ${reviewed?'reviewed':'pending'}">${reviewed?'IMAGE REVIEWED':'IMAGE REVIEW NEEDED'}</span>
      </div>

      <div class="qa-issues">${issueTags(p)}</div>

      <div class="qa-meta">
        <span><b>Specs</b>${Object.keys(p.specs||{}).length}</span>
        <span><b>Compatibility</b>${Object.keys(p.compatibility||{}).length}</span>
        <span><b>Warranty</b>${p.warranty_months!=null?esc(p.warranty_months+' mo'):'—'}</span>
        <span><b>Package</b>${p.shipping_packaging_verified?'Verified':'Missing'}</span>
      </div>

      <details class="qa-editor">
        <summary>IMAGE & SOURCE QA</summary>
        <label>Primary image URL
          <input class="admin-input" type="url" value="${esc(img)}" data-qa-image="${esc(p.id)}" placeholder="https://…">
        </label>
        <div class="qa-editor-actions">
          <button class="btn small" type="button" data-qa-save-image="${esc(p.id)}">Save image URL</button>
          <button class="btn small" type="button" data-qa-review="${esc(p.id)}">${reviewed?'Mark review needed':'Mark image reviewed'}</button>
        </div>
        <p class="muted qa-source-note">Official source: ${official?`<a href="${esc(official)}" target="_blank" rel="noopener">Open manufacturer page ↗</a>`:'Not loaded'}</p>
      </details>

      <div class="qa-actions">
        <a class="btn small primary" href="product.html?slug=${encodeURIComponent(p.slug)}&preview=1" target="_blank" rel="noopener">Preview product</a>
        ${official?`<a class="btn small" href="${esc(official)}" target="_blank" rel="noopener">Official page ↗</a>`:''}
      </div>
    </div>
  </article>`;
}

function render(){
  renderSummary();
  const rows=visibleProducts();
  if(!rows.length){
    list.innerHTML='<div class="empty-state"><strong>No matching demo products</strong>Try another search or QA filter.</div>';
    return;
  }
  list.innerHTML=rows.map(card).join('');
  bindRows();
}

function bindRows(){
  list.querySelectorAll('[data-qa-save-image]').forEach(b=>b.addEventListener('click',()=>saveImage(b.dataset.qaSaveImage,b)));
  list.querySelectorAll('[data-qa-review]').forEach(b=>b.addEventListener('click',()=>toggleReview(b.dataset.qaReview,b)));
}

async function saveImage(id,button){
  const input=document.querySelector(`[data-qa-image="${CSS.escape(id)}"]`);
  const url=(input?.value||'').trim();

  if(url&&!safe(url)){
    VT.toast('Enter a valid http/https image URL.','error');
    return;
  }

  const p=products.find(x=>x.id===id);
  if(!p)return;

  button.disabled=true;
  try{
    const media={...(p.media||{})};
    if(url)media.primaryImage=url;
    else delete media.primaryImage;

    const metadata={...(p.metadata||{}),media_review_required:true};
    const {error}=await client.from('store_products').update({
      media,
      metadata,
      updated_at:new Date().toISOString()
    }).eq('id',id);

    if(error)throw error;
    p.media=media;
    p.metadata=metadata;
    VT.toast('Demo image updated. Review it before approving.');
    render();
  }catch(error){
    console.error(error);
    VT.toast(error.message||'Could not update image.','error');
  }finally{
    button.disabled=false;
  }
}

async function toggleReview(id,button){
  const p=products.find(x=>x.id===id);
  if(!p)return;

  const next=!p.metadata?.media_review_required;
  button.disabled=true;

  try{
    const metadata={...(p.metadata||{}),media_review_required:next};
    const {error}=await client.from('store_products').update({
      metadata,
      updated_at:new Date().toISOString()
    }).eq('id',id);

    if(error)throw error;
    p.metadata=metadata;
    VT.toast(next?'Image marked for another review.':'Image marked reviewed.');
    render();
  }catch(error){
    console.error(error);
    VT.toast(error.message||'Could not update review state.','error');
  }finally{
    button.disabled=false;
  }
}

async function load(){
  const {data,error}=await client.from('store_products')
    .select('*')
    .eq('is_demo',true)
    .order('type')
    .order('brand')
    .order('name');

  if(error)throw error;
  products=data||[];
  render();
}

function setupTabs(){
  document.querySelectorAll('[data-admin-tab]').forEach(b=>b.addEventListener('click',()=>{
    const tab=b.dataset.adminTab;
    panel.hidden=tab!=='qa';
    if(tab==='qa'){
      document.getElementById('requestsPanel').hidden=true;
      document.getElementById('cataloguePanel').hidden=true;
      if(!products.length)load().catch(error=>{
        console.error(error);
        list.innerHTML='<div class="empty-state"><strong>Could not load catalogue QA</strong>Check the admin connection and try again.</div>';
      });
    }
  }));

  search?.addEventListener('input',render);
  filter?.addEventListener('change',render);
}

async function init(){
  try{
    const {data:{user}}=await client.auth.getUser();
    if(!user)return;
    const {data,error}=await client.rpc('is_volttech_admin');
    if(error||!data)return;
    setupTabs();
  }catch(error){
    console.error('Catalogue QA:',error);
  }
}

init();
})();