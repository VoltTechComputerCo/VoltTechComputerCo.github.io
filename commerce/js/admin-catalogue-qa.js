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
const contractResults=new Map();
const imageHealth=new Map();

function esc(v){return VT.esc(v)}
function safe(v){return VT.safeUrl(v)}

function mediaUrl(p){
  return safe(p.media?.primaryImage||p.media?.primary_image||'');
}

function isOgProxy(p){
  const strategy=String(p.media?.imageStrategy||'').toLowerCase();
  const url=String(p.media?.primaryImage||p.media?.primary_image||'');
  return strategy==='official-og'||url.includes('api.microlink.io/');
}

function identityIssues(p){
  const ids=p.identifiers||{};
  const issues=[];
  if(!p.brand)issues.push('Brand');
  if(!p.model)issues.push('Model');
  if(!p.manufacturer&&!p.brand)issues.push('Manufacturer');
  if(!ids.mpn&&!ids.manufacturerPartNumber&&!ids.manufacturer_part_number&&!ids.partNumber&&!ids.part_number&&!ids.sku&&!ids.model&&!ids.intelSku)
    issues.push('Part identifier');
  return issues;
}

function structureIssues(p){
  const issues=[];
  const contract=contractResults.get(p.id);
  if(!p.short_description)issues.push('Description');
  if(!Array.isArray(p.highlights)||p.highlights.length<1)issues.push('Highlights');

  if(contract){
    (contract.missing_required||[]).forEach(k=>issues.push(`Required spec: ${VT.formatSpecKey(k)}`));
    (contract.missing_compatibility||[]).forEach(k=>issues.push(`Compatibility: ${VT.formatSpecKey(k)}`));
  }else{
    if(!p.specs||Object.keys(p.specs).length<2)issues.push('Specifications');
    if(!p.compatibility||Object.keys(p.compatibility).length<1)issues.push('Compatibility');
  }
  return issues;
}

function mediaIssues(p){
  const issues=[];
  const health=imageHealth.get(p.id);
  if(!mediaUrl(p))issues.push('Missing image');
  if(health && !health.ok)issues.push('Image fails to load');
  if(isOgProxy(p))issues.push('OG proxy image');
  if(p.metadata?.media_review_required)issues.push('Image needs review');
  return issues;
}

function supplierGaps(p){
  const gaps=[];
  if(p.warranty_months==null)gaps.push('Warranty');
  if(p.lead_time_days==null)gaps.push('Lead time');
  if(p.shipping_weight_kg==null)gaps.push('Shipping weight');
  if(p.shipping_length_cm==null||p.shipping_width_cm==null||p.shipping_height_cm==null)gaps.push('Package dimensions');
  if(!p.shipping_class)gaps.push('Shipping class');
  if(!p.shipping_packaging_verified)gaps.push('Packaging verification');
  if(p.retail_price==null||Number(p.retail_price)<=0)gaps.push('Supplier price');
  if(!p.stock_status||['unknown',''].includes(String(p.stock_status).toLowerCase()))gaps.push('Supplier stock');
  return gaps;
}

function structureScore(p){
  const contract=contractResults.get(p.id);
  const contractValid=contract?contract.valid:false;
  const groups=[
    {ok:!!p.brand&&!!p.model,weight:14},
    {ok:identityIssues(p).length===0,weight:12},
    {ok:!!p.short_description,weight:10},
    {ok:Array.isArray(p.highlights)&&p.highlights.length>0,weight:8},
    {ok:contract?((contract.missing_required||[]).length===0):(p.specs&&Object.keys(p.specs).length>=2),weight:20},
    {ok:contract?((contract.missing_compatibility||[]).length===0):(p.compatibility&&Object.keys(p.compatibility).length>=1),weight:16},
    {ok:!!mediaUrl(p),weight:10},
    {ok:!p.metadata?.media_review_required&&!isOgProxy(p),weight:10}
  ];
  return groups.reduce((n,g)=>n+(g.ok?g.weight:0),0);
}

function issueGroups(p){
  return {
    media:mediaIssues(p),
    identity:identityIssues(p),
    structure:structureIssues(p),
    supplier:supplierGaps(p)
  };
}

function allStructureIssues(p){
  const g=issueGroups(p);
  return [...g.media,...g.identity,...g.structure];
}

function matchesFilter(p){
  const f=filter?.value||'all';
  const g=issueGroups(p);
  if(f==='image')return g.media.length>0;
  if(f==='identity')return g.identity.length>0;
  if(f==='specs')return g.structure.length>0;
  if(f==='shipping')return g.supplier.length>0;
  if(f==='ready')return allStructureIssues(p).length===0;
  return true;
}

function visibleProducts(){
  const q=(search?.value||'').trim().toLowerCase();
  return products.filter(p=>{
    if(!matchesFilter(p))return false;
    if(!q)return true;
    const g=issueGroups(p);
    const hay=[
      p.name,p.brand,p.model,p.type,
      ...g.media,...g.identity,...g.structure,...g.supplier,
      JSON.stringify(p.specs||{}),
      JSON.stringify(p.compatibility||{})
    ].join(' ').toLowerCase();
    return hay.includes(q);
  });
}

function renderSummary(){
  const image=products.filter(p=>mediaIssues(p).length).length;
  const broken=products.filter(p=>imageHealth.has(p.id)&&!imageHealth.get(p.id).ok).length;
  const identity=products.filter(p=>identityIssues(p).length).length;
  const structure=products.filter(p=>structureIssues(p).length).length;
  const avg=products.length?Math.round(products.reduce((n,p)=>n+structureScore(p),0)/products.length):0;

  summary.innerHTML=`
    <div class="qa-stat"><b>${products.length}</b><span>Demo fixtures</span></div>
    <div class="qa-stat ${image?'warn':''}"><b>${image}</b><span>Media reviews</span></div>
    <div class="qa-stat ${broken?'danger':''}"><b>${broken}</b><span>Broken images</span></div>
    <div class="qa-stat ${identity?'warn':''}"><b>${identity}</b><span>Identity gaps</span></div>
    <div class="qa-stat ${structure?'warn':''}"><b>${structure}</b><span>Structure gaps</span></div>
    <div class="qa-stat"><b>${avg}%</b><span>Architecture score</span></div>`;
}

function structureTags(p){
  const issues=allStructureIssues(p);
  if(!issues.length)return '<span class="qa-issue ok">Architecture complete</span>';
  return issues.slice(0,8).map(x=>`<span class="qa-issue">${esc(x)}</span>`).join('')+
    (issues.length>8?`<span class="qa-issue">+${issues.length-8} more</span>`:'');
}

function supplierTags(p){
  const gaps=supplierGaps(p);
  if(!gaps.length)return '<span class="qa-supplier-chip ready">Supplier data complete</span>';
  return gaps.slice(0,8).map(x=>`<span class="qa-supplier-chip">${esc(x)}</span>`).join('')+
    (gaps.length>8?`<span class="qa-supplier-chip">+${gaps.length-8} more</span>`:'');
}

function card(p){
  const img=mediaUrl(p);
  const official=safe(p.media?.officialUrl);
  const score=structureScore(p);
  const reviewed=!p.metadata?.media_review_required&&!isOgProxy(p);
  const health=imageHealth.get(p.id);
  const healthLabel=!mediaUrl(p)?'NO IMAGE':!health?'TESTING':health.ok?`LOADS · ${health.width}×${health.height}`:'BROKEN';

  return `<article class="qa-card" data-qa-card="${esc(p.id)}">
    <div class="qa-image">
      ${img?`<img src="${esc(img)}" alt="${esc(p.name)}" loading="lazy">`:
        `<div class="qa-image-missing">NO IMAGE</div>`}
      <span class="qa-demo">DEMO</span>
      <span class="qa-score ${score<65?'low':score<85?'mid':'high'}">${score}%</span>
    </div>

    <div class="qa-body">
      <div class="qa-title-row">
        <div>
          <div class="kicker">${esc(p.brand||'Unknown brand')} // ${esc(VT.categoryLabel(p.type))}</div>
          <h3>${esc(p.name)}</h3>
          <small>${esc(p.model||'Model not loaded')}</small>
        </div>
        <div class="qa-state-stack">
          <span class="qa-review-state ${reviewed?'reviewed':'pending'}">${reviewed?'MEDIA APPROVED':'MEDIA REVIEW NEEDED'}</span>
          <span class="qa-health-state ${health?.ok?'healthy':health?'broken':'testing'}">${healthLabel}</span>
        </div>
      </div>

      <div class="qa-section-label">ARCHITECTURE</div>
      <div class="qa-issues">${structureTags(p)}</div>

      <div class="qa-meta">
        <span><b>Specs</b>${Object.keys(p.specs||{}).length}</span>
        <span><b>Compatibility</b>${Object.keys(p.compatibility||{}).length}</span>
        <span><b>Category contract</b>${contractResults.get(p.id)?.valid?'Pass':'Needs work'}</span>
        <span><b>Supplier data</b>Not required yet</span>
      </div>

      ${contractResults.get(p.id)?`
      <details class="qa-contract">
        <summary>CATEGORY CONTRACT · ${esc(String(p.type||'component').toUpperCase())}</summary>
        <div class="qa-contract-grid">
          <div><b>Required specs</b><span>${(contractResults.get(p.id).required_specs||[]).map(VT.formatSpecKey).join(', ')||'—'}</span></div>
          <div><b>Compatibility</b><span>${(contractResults.get(p.id).required_compatibility||[]).map(VT.formatSpecKey).join(', ')||'—'}</span></div>
          <div><b>Future filters</b><span>${(contractResults.get(p.id).filter_fields||[]).map(VT.formatSpecKey).join(', ')||'—'}</span></div>
          <div><b>Recommended</b><span>${(contractResults.get(p.id).recommended_specs||[]).map(VT.formatSpecKey).join(', ')||'—'}</span></div>
        </div>
      </details>`:''}

      <details class="qa-supplier-gaps">
        <summary>FUTURE SUPPLIER DATA (${supplierGaps(p).length} GAP${supplierGaps(p).length===1?'':'S'})</summary>
        <div class="qa-supplier-chips">${supplierTags(p)}</div>
        <p>These fields are intentionally excluded from the architecture score until real supplier inventory is connected.</p>
      </details>

      <details class="qa-editor">
        <summary>IMAGE & SOURCE QA</summary>
        ${isOgProxy(p)?'<div class="qa-proxy-warning"><b>OG proxy image</b><span>This is pulled from the manufacturer page metadata and is not considered an approved product photo. It may be generic, cropped incorrectly or change without notice.</span></div>':''}
        <label>Primary image URL
          <input class="admin-input" type="url" value="${esc(img)}" data-qa-image="${esc(p.id)}" placeholder="https://…">
        </label>
        <div class="qa-editor-actions">
          <button class="btn small" type="button" data-qa-save-image="${esc(p.id)}">Save image URL</button>
          <button class="btn small" type="button" data-qa-review="${esc(p.id)}">${reviewed?'Mark review needed':'Approve current media'}</button>
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
  if(url&&!safe(url)){VT.toast('Enter a valid http/https image URL.','error');return}

  const p=products.find(x=>x.id===id);
  if(!p)return;

  button.disabled=true;
  try{
    const media={...(p.media||{})};
    if(url){
      media.primaryImage=url;
      media.imageStrategy='manual-review';
    }else{
      delete media.primaryImage;
      delete media.imageStrategy;
    }

    const metadata={...(p.metadata||{}),media_review_required:true};
    const {error}=await client.from('store_products').update({media,metadata,updated_at:new Date().toISOString()}).eq('id',id);
    if(error)throw error;

    p.media=media;
    p.metadata=metadata;
    imageHealth.set(p.id,await VT.probeImage(mediaUrl(p),6500));
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

  if(isOgProxy(p)&&p.metadata?.media_review_required){
    VT.toast('Replace the OG proxy with a direct product image before approving it.','error');
    return;
  }

  const next=!p.metadata?.media_review_required;
  button.disabled=true;

  try{
    const metadata={...(p.metadata||{}),media_review_required:next};
    const {error}=await client.from('store_products').update({metadata,updated_at:new Date().toISOString()}).eq('id',id);
    if(error)throw error;

    p.metadata=metadata;
    VT.toast(next?'Media marked for another review.':'Media approved.');
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

  await Promise.all(products.map(async p=>{
    const {data:validation,error:validationError}=await client.rpc('admin_validate_store_product',{p_product_id:p.id});
    if(!validationError&&validation) contractResults.set(p.id,validation);
  }));

  render();

  await Promise.all(products.map(async p=>{
    const url=mediaUrl(p);
    const result=await VT.probeImage(url,6500);
    imageHealth.set(p.id,result);
  }));

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