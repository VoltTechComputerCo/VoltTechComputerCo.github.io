import { loadCatalogue } from "./data-loader.js?v=2.0.0";
import {
  REQUIRED_CATEGORIES, CATEGORY_ORDER, CATEGORY_LABELS, createEmptyBuild, isMultiCategory,
  getSelections, hasCategory, selectProduct, removeProduct, clearBuild, getProductsByCategory,
  getBestOffer, getProductPrice, calculateBuildTotal, formatMoney, getSelectedCount,
  getCategorySummary, getStockLabel
} from "./build-engine.js?v=0.7.7";
import { getCompatibility, validateBuild, estimatePower } from "./compatibility-engine.js?v=0.7.8.1";
import { buildGuidedRecommendation, profileLabel } from "./guided-engine.js?v=1.1";

const STORAGE_KEY = "volttech-builder-v2";
const MODE_KEY = "volttech-builder-mode-v2";
const SHARE_PARAM = "build";
const AUTH_PENDING_KEY = "volttech-builder-auth-pending";

const CATEGORY_META = {
  cpu:{title:"Processor",help:"The CPU drives game logic, general responsiveness and heavier threaded workloads."},
  motherboard:{title:"Motherboard",help:"The board must match the CPU socket and memory generation, then provide the expansion you need."},
  memory:{title:"Memory",help:"Choose a matched RAM kit. Capacity and DDR generation both matter."},
  gpu:{title:"Graphics Card",help:"The biggest gaming-performance decision in most builds. Physical size and power also matter."},
  case:{title:"Case",help:"More than looks: it has to fit the board, graphics card and cooling hardware."},
  cooler:{title:"CPU Cooler",help:"Cooling must fit the CPU platform and the case, with enough thermal capacity for the processor."},
  psu:{title:"Power Supply",help:"Choose enough clean power with sensible headroom — not just the biggest wattage number."},
  storage:{title:"Storage",help:"Fast NVMe storage is a strong default. You can add multiple drives when the platform has room."},
  fans:{title:"Case Fans",help:"Optional airflow tuning. Fan size, count and case capacity are checked where data is available."}
};

const state = {
  catalogue:null, products:[], currency:"ZAR", build:createEmptyBuild(), activeCategory:"cpu",
  mode:"guided", guided:null, query:"", brand:"all", sort:"recommended", compatibleOnly:true, stockOnly:false,
  modalProductId:null, authClient:null, user:null, savedBuildId:null, savedBuildStatus:null, pendingAccountAction:null
};

const $ = (id)=>document.getElementById(id);
const refs = {};
let toastTimer = null;

window.addEventListener("DOMContentLoaded", init);

async function init(){
  cacheRefs();
  bindStaticEvents();
  setLoading(true);
  try{
    const catalogue = await loadCatalogue();
    state.catalogue = catalogue;
    state.products = catalogue.products || [];
    state.currency = catalogue.currency || "ZAR";
    hydrateBuild();
    await initAccount();
    state.mode = localStorage.getItem(MODE_KEY) || "guided";
    if(!["guided","manual"].includes(state.mode)) state.mode="guided";
    refs.heroProductCount.textContent = `${state.products.length} PARTS`;
    refs.heroSupplierCount.textContent = `${catalogue.supplierCount || 0} FEEDS`;
    refs.systemStatus.textContent = "Catalogue ready. Compatibility engine active.";
    setMode(state.mode,false);
    renderAll();
  }catch(error){
    console.error(error);
    refs.systemStatus.textContent = "Catalogue failed to load.";
    refs.workspaceHealth.className = "workspace-health bad";
    refs.workspaceHealth.innerHTML = `<span class="status-dot"></span><b>Catalogue unavailable</b>`;
    refs.productGrid.innerHTML = `<div class="empty-state"><b>Builder data could not be loaded.</b><span>Check that the /builder/data and /commerce files were uploaded with their existing folder structure.</span></div>`;
  }finally{setLoading(false)}
}

function cacheRefs(){
  ["heroProductCount","heroSupplierCount","systemStatus","guidedPanel","guidedForm","guidedResult","generateBuildBtn",
  "builderWorkspace","workspaceHealth","categoryList","progressText","clearBuildBtn","categoryKicker","categoryTitle","categoryHelp",
  "resultCount","productSearch","brandFilter","sortFilter","compatibleOnly","stockOnly","resetFilters","catalogueContext","productGrid","emptyState",
  "summaryPanel","summaryStatus","summaryClose","buildTotal","powerEstimate","powerNote","buildHealth","buildList","saveBuildBtn","quoteBtn","myBuildsBtn","shareBtn","copyBtn",
  "mobileSummaryToggle","mobileBuildTotal","mobilePartCount","productModal","modalClose","modalContent","accountBtn","accountBtnText","accountStorageStatus","accountModal","accountModalClose","accountSignedOut","accountSignedIn","builderAuthForm","builderAuthEmail","builderAuthPassword","builderCreateAccount","builderGoogleSignIn","builderAuthStatus","builderAccountEmail","builderSignOut","openMyBuildsFromAccount","savedBuildsModal","savedBuildsClose","savedBuildsList","toast"].forEach(id=>refs[id]=$(id));
}

function bindStaticEvents(){
  document.querySelectorAll("[data-start-mode]").forEach(btn=>btn.addEventListener("click",()=>{
    setMode(btn.dataset.startMode);
    (btn.dataset.startMode==="guided"?refs.guidedPanel:refs.builderWorkspace).scrollIntoView({behavior:"smooth",block:"start"});
  }));
  document.querySelectorAll("[data-mode]").forEach(btn=>btn.addEventListener("click",()=>setMode(btn.dataset.mode)));
  refs.guidedForm.addEventListener("submit", onGuidedSubmit);
  refs.categoryList.addEventListener("click",e=>{
    const btn=e.target.closest("[data-category]"); if(!btn)return;
    state.activeCategory=btn.dataset.category; resetCatalogueFilters(false); renderCatalogue(); renderCategories();
    if(window.innerWidth<821) refs.productGrid.scrollIntoView({behavior:"smooth",block:"start"});
  });
  refs.productSearch.addEventListener("input",()=>{state.query=refs.productSearch.value;renderProducts()});
  refs.brandFilter.addEventListener("change",()=>{state.brand=refs.brandFilter.value;renderProducts()});
  refs.sortFilter.addEventListener("change",()=>{state.sort=refs.sortFilter.value;renderProducts()});
  refs.compatibleOnly.addEventListener("change",()=>{state.compatibleOnly=refs.compatibleOnly.checked;renderProducts()});
  refs.stockOnly.addEventListener("change",()=>{state.stockOnly=refs.stockOnly.checked;renderProducts()});
  refs.resetFilters.addEventListener("click",()=>{resetCatalogueFilters();renderCatalogue()});
  refs.productGrid.addEventListener("click",onProductGridClick);
  refs.buildList.addEventListener("click",onBuildListClick);
  refs.clearBuildBtn.addEventListener("click",clearCurrentBuild);
  refs.saveBuildBtn.addEventListener("click",()=>saveBuildToAccount(false));
  refs.quoteBtn.addEventListener("click",requestQuote);
  refs.myBuildsBtn.addEventListener("click",openSavedBuilds);
  refs.accountBtn.addEventListener("click",openAccountModal);
  refs.accountModalClose.addEventListener("click",()=>closeAccountModal());
  refs.accountModal.addEventListener("click",e=>{if(e.target===refs.accountModal)closeAccountModal()});
  refs.builderAuthForm.addEventListener("submit",signInBuilderEmail);
  refs.builderCreateAccount.addEventListener("click",createBuilderAccount);
  refs.builderGoogleSignIn.addEventListener("click",googleBuilderSignIn);
  refs.builderSignOut.addEventListener("click",signOutBuilder);
  refs.openMyBuildsFromAccount.addEventListener("click",()=>{closeAccountModal();openSavedBuilds()});
  refs.savedBuildsClose.addEventListener("click",closeSavedBuilds);
  refs.savedBuildsModal.addEventListener("click",e=>{if(e.target===refs.savedBuildsModal)closeSavedBuilds()});
  refs.savedBuildsList.addEventListener("click",onSavedBuildAction);
  refs.shareBtn.addEventListener("click",shareBuild);
  refs.copyBtn.addEventListener("click",copyBuildSummary);
  refs.mobileSummaryToggle.addEventListener("click",()=>toggleSummary());
  refs.summaryClose.addEventListener("click",()=>toggleSummary(false));
  refs.modalClose.addEventListener("click",closeModal);
  refs.productModal.addEventListener("click",e=>{if(e.target===refs.productModal)closeModal()});
  refs.modalContent.addEventListener("click",e=>{
    const select=e.target.closest("[data-modal-select]"); if(select)chooseProduct(select.dataset.modalSelect);
  });
  document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeModal();toggleSummary(false);closeAccountModal();closeSavedBuilds()}});
  window.addEventListener("popstate",()=>{if(readShareBuild())renderAll()});
}

function setLoading(on){if(refs.generateBuildBtn) refs.generateBuildBtn.disabled=on}

function setMode(mode,persist=true){
  state.mode=mode;
  if(persist)localStorage.setItem(MODE_KEY,mode);
  document.querySelectorAll("[data-mode]").forEach(btn=>{
    const active=btn.dataset.mode===mode;btn.classList.toggle("active",active);btn.setAttribute("aria-selected",String(active));
  });
  refs.guidedPanel.classList.toggle("hidden",mode!=="guided");
}

function onGuidedSubmit(e){
  e.preventDefault(); if(!state.products.length)return;
  const data=new FormData(refs.guidedForm);
  const profile=Object.fromEntries(data.entries());
  profile.fpsTarget=Number(profile.fpsTarget||120); profile.storageNeed=Number(profile.storageNeed||1000);
  const result=buildGuidedRecommendation(profile,state.products,state.currency);
  if(!result.ok){refs.guidedResult.classList.remove("hidden");refs.guidedResult.innerHTML=`<div class="guided-note">${escapeHtml(result.message||"A guided build could not be generated from the current catalogue.")}</div>`;return}
  state.guided=result; state.build=result.build; state.activeCategory=firstUsefulCategory();
  persistBuild(); renderGuidedResult(result); renderAll();
  refs.guidedResult.classList.remove("hidden");
  refs.guidedResult.scrollIntoView({behavior:"smooth",block:"nearest"});
  toast("Guided build created — you can now swap any part.");
}

function renderGuidedResult(result){
  const parts=CATEGORY_ORDER.flatMap(type=>getSelections(result.build,type).map(p=>({type,p})));
  const notes=[...(result.notes||[])].slice(0,3);
  refs.guidedResult.innerHTML=`
    <div class="guided-result-head">
      <div><span class="eyebrow">STARTING BUILD READY</span><h3>${escapeHtml(profileLabel(result.profile.useCase))} build</h3><p>${escapeHtml(result.budget?.label||"")} · ${escapeHtml(profileLabel(result.profile.priority))} · ${escapeHtml(profileLabel(result.profile.target))}</p></div>
      <div class="guided-total"><span>Estimated parts</span><strong>${formatMoney(result.total,state.currency)}</strong></div>
    </div>
    <div class="guided-parts">${parts.map(({type,p})=>`<article class="guided-part"><span>${escapeHtml(CATEGORY_LABELS[type]||type)}</span><div><b>${escapeHtml(p.name)}</b><small>${escapeHtml(result.reasons?.[type]||getCategorySummary(p,type)||"")}</small></div><strong>${priceText(p)}</strong></article>`).join("")}</div>
    <div class="guided-notes">${notes.map(n=>`<div class="guided-note">${escapeHtml(n)}</div>`).join("")}</div>
    <div class="guided-result-actions"><button type="button" class="btn btn-primary" data-fine-tune>Fine tune this build</button><button type="button" class="btn btn-secondary" data-guided-save>Save to my account</button><button type="button" class="btn btn-secondary" data-guided-quote>Request a proper quote</button></div>`;
  refs.guidedResult.querySelector("[data-fine-tune]")?.addEventListener("click",()=>{setMode("manual");refs.builderWorkspace.scrollIntoView({behavior:"smooth",block:"start")});
  refs.guidedResult.querySelector("[data-guided-save]")?.addEventListener("click",()=>saveBuildToAccount(false));
  refs.guidedResult.querySelector("[data-guided-quote]")?.addEventListener("click",requestQuote);
}

function renderAll(){renderCategories();renderCatalogue();renderSummary()}

function renderCategories(){
  const required=effectiveRequiredCategories();
  const completed=required.filter(type=>hasCategory(state.build,type)).length;
  refs.progressText.textContent=`${completed} / ${required.length}`;
  refs.categoryList.innerHTML=CATEGORY_ORDER.map((type,i)=>{
    const selections=getSelections(state.build,type); const done=selections.length>0;
    const summary=done?getCategorySummary(selections,type):type==="fans"?"Optional":"Not selected";
    return `<button type="button" class="category-btn ${state.activeCategory===type?"active":""}" data-category="${type}"><span class="category-index">${String(i+1).padStart(2,"0")}</span><span class="category-copy"><b>${escapeHtml(CATEGORY_LABELS[type]||type)}</b><small>${escapeHtml(summary||selections[0]?.name||"")}</small></span><span class="category-state ${done?"done":"open"}">${done?"✓":"·"}</span></button>`
  }).join("");
}

function renderCatalogue(){
  const meta=CATEGORY_META[state.activeCategory]||{title:CATEGORY_LABELS[state.activeCategory],help:"Choose a component."};
  const index=CATEGORY_ORDER.indexOf(state.activeCategory)+1;
  refs.categoryKicker.textContent=`STEP ${String(index).padStart(2,"0")}`;
  refs.categoryTitle.textContent=meta.title; refs.categoryHelp.textContent=meta.help;
  populateBrands(); renderCatalogueContext(); renderProducts();
}

function resetCatalogueFilters(updateInputs=true){
  state.query="";state.brand="all";state.sort="recommended";state.compatibleOnly=true;state.stockOnly=false;
  if(updateInputs){refs.productSearch.value="";refs.sortFilter.value="recommended";refs.compatibleOnly.checked=true;refs.stockOnly.checked=false}
}

function populateBrands(){
  const brands=[...new Set(getProductsByCategory(state.products,state.activeCategory).map(p=>p.brand).filter(Boolean))].sort();
  refs.brandFilter.innerHTML=`<option value="all">All brands</option>${brands.map(b=>`<option value="${escapeAttr(b)}">${escapeHtml(b)}</option>`).join("")}`;
  if(brands.includes(state.brand))refs.brandFilter.value=state.brand;else{state.brand="all";refs.brandFilter.value="all"}
}

function renderCatalogueContext(){
  const chosen=getSelections(state.build,state.activeCategory);
  const report=validateBuild(state.build);
  let html="";
  if(chosen.length){html=`<div class="context-note good"><b>Selected:</b> ${escapeHtml(chosen.map(p=>p.name).join(", "))}. Pick another option to ${isMultiCategory(state.activeCategory)?"add another":"replace it"}.</div>`}
  else if(report.issues?.length){html=`<div class="context-note">This build currently has a conflict. Compatible choices are prioritised while you repair it.</div>`}
  refs.catalogueContext.innerHTML=html;
}

function renderProducts(){
  let list=getProductsByCategory(state.products,state.activeCategory).map(product=>({product,compat:getCompatibility(product,state.build),offer:getBestOffer(product)}));
  const q=state.query.trim().toLowerCase();
  if(q)list=list.filter(x=>searchBlob(x.product).includes(q));
  if(state.brand!=="all")list=list.filter(x=>x.product.brand===state.brand);
  if(state.compatibleOnly)list=list.filter(x=>!x.compat.issues?.length || isSelected(x.product));
  if(state.stockOnly)list=list.filter(x=>isOfferAvailable(x.offer));
  list.sort(productSorter(state.sort));
  refs.resultCount.textContent=`${list.length} part${list.length===1?"":"s"}`;
  refs.emptyState.classList.toggle("hidden",list.length>0);
  refs.productGrid.innerHTML=list.map(({product,compat,offer},i)=>productCard(product,compat,offer,i)).join("");
  bindProductImages(refs.productGrid);
}

function productSorter(sort){
  return (a,b)=>{
    if(sort==="price-asc")return priceSort(a.product,b.product,1);
    if(sort==="price-desc")return priceSort(a.product,b.product,-1);
    if(sort==="name")return a.product.name.localeCompare(b.product.name);
    const selectedDiff=Number(isSelected(b.product))-Number(isSelected(a.product)); if(selectedDiff)return selectedDiff;
    const compatDiff=statusRank(a.compat)-statusRank(b.compat);if(compatDiff)return compatDiff;
    const stockDiff=Number(isOfferAvailable(b.offer))-Number(isOfferAvailable(a.offer));if(stockDiff)return stockDiff;
    return priceSort(a.product,b.product,1);
  }
}
function priceSort(a,b,dir){const ap=getProductPrice(a)||Infinity,bp=getProductPrice(b)||Infinity;return(ap-bp)*dir}
function statusRank(r){return r.issues?.length?3:r.unknowns?.length?2:r.warnings?.length?1:0}

function productCard(product,compat,offer,index){
  const selected=isSelected(product), conflict=compat.issues?.length>0, unknown=!conflict&&compat.unknowns?.length>0, warning=!conflict&&!unknown&&compat.warnings?.length>0;
  const status=selected?"selected":conflict?"bad":unknown||warning?"warn":"good";
  const badge=selected?"Selected":conflict?"Conflict":unknown?"Needs data":warning?"Review":"Compatible";
  const message=compatMessage(compat,selected);
  const image=safeUrl(product.media?.primaryImage);
  const specs=specChips(product).slice(0,4);
  const stock=getStockLabel(offer?.stockStatus,offer?.freshness);
  const stockClass=isOfferAvailable(offer)?"good":offer?.stockStatus==="low-stock"?"warn":"";
  const actionLabel=selected?"Selected":isMultiCategory(product.type)?"Add to build":getSelections(state.build,product.type).length?"Replace":"Select";
  return `<article class="product-card ${selected?"selected":""} ${conflict?"conflict":""}" data-product-card="${escapeAttr(product.id)}">
    <div class="product-media">
      ${image?`<img data-product-image src="${escapeAttr(image)}" alt="${escapeAttr(product.name)}" loading="${index<4?"eager":"lazy"}" decoding="async" referrerpolicy="no-referrer">`:""}
      <div class="image-fallback"><b>${escapeHtml(categoryMonogram(product.type))}</b><small>Image unavailable</small></div>
      <div class="card-badges"><span class="badge ${status}">${badge}</span>${offer?.freshness?`<span class="badge">${escapeHtml(offer.freshness)}</span>`:""}</div>
    </div>
    <div class="product-body">
      <span class="product-brand">${escapeHtml(product.brand||product.manufacturer||"PC COMPONENT")}</span>
      <h4>${escapeHtml(product.name)}</h4>
      <div class="spec-chips">${specs.map(s=>`<span class="spec-chip">${escapeHtml(s)}</span>`).join("")}</div>
      <div class="compat-line ${status}">${escapeHtml(message)}</div>
      <div class="price-row"><div class="price-block"><span>${offer?"Best preview price":"Price"}</span><strong>${priceText(product)}</strong><small>${offer?.supplier?escapeHtml(offer.supplier):"Supplier match pending"}</small></div><div class="stock-label ${stockClass}">${escapeHtml(stock)}</div></div>
      <div class="card-actions"><button type="button" class="select-product ${selected?"selected":""}" data-select-product="${escapeAttr(product.id)}" ${conflict&&!selected?"disabled":""}>${actionLabel}</button><button type="button" class="details-product" data-details-product="${escapeAttr(product.id)}" aria-label="View details for ${escapeAttr(product.name)}">＋</button></div>
    </div>
  </article>`;
}

function onProductGridClick(e){
  const select=e.target.closest("[data-select-product]");if(select){chooseProduct(select.dataset.selectProduct);return}
  const detail=e.target.closest("[data-details-product]");if(detail)openModal(detail.dataset.detailsProduct)
}

function chooseProduct(id){
  const product=state.products.find(p=>p.id===id);if(!product)return;
  if(isSelected(product)){toast("That part is already in the build.");return}
  const compat=getCompatibility(product,state.build);
  if(compat.issues?.length){toast(compat.issues[0]?.text||"That part conflicts with the current build.");return}
  if(isMultiCategory(product.type)) state.build=selectProduct(state.build,product);
  else state.build=selectProduct(state.build,product);
  state.guided=null; persistBuild(); closeModal();
  const next=findNextIncomplete(product.type);if(next)state.activeCategory=next;
  renderAll(); toast(`${product.name} added to your build.`)
}

function onBuildListClick(e){
  const remove=e.target.closest("[data-remove]");
  if(remove){const [type,id]=remove.dataset.remove.split("|");state.build=removeProduct(state.build,type,id||null);state.activeCategory=type;state.guided=null;persistBuild();renderAll();return}
  const edit=e.target.closest("[data-edit]");
  if(edit){state.activeCategory=edit.dataset.edit;renderCategories();renderCatalogue();toggleSummary(false);refs.productGrid.scrollIntoView({behavior:"smooth",block:"start"})}
}

function renderSummary(){
  const total=calculateBuildTotal(state.build);const power=estimatePower(state.build);const report=validateBuild(state.build);
  const required=effectiveRequiredCategories();const complete=required.filter(type=>hasCategory(state.build,type)).length;const ready=complete===required.length&&!report.issues?.length;
  refs.buildTotal.textContent=formatMoney(total,state.currency);refs.mobileBuildTotal.textContent=formatMoney(total,state.currency);
  refs.mobilePartCount.textContent=getSelectedCount(state.build);refs.progressText.textContent=`${complete} / ${required.length}`;
  refs.powerEstimate.textContent=power.estimated?`${power.estimated} W`:"—";refs.powerNote.textContent=power.preferred?`${power.preferred} W preferred PSU target`:"Add core parts";
  refs.summaryStatus.textContent=report.issues?.length?"CONFLICT":ready?"READY TO REVIEW":"IN PROGRESS";
  refs.buildHealth.innerHTML=healthMarkup(report,complete,required.length);
  refs.buildList.innerHTML=CATEGORY_ORDER.map(type=>summaryCategory(type)).join("");
  refs.saveBuildBtn.disabled=getSelectedCount(state.build)<1;
  refs.quoteBtn.disabled=getSelectedCount(state.build)<3;
  updateWorkspaceHealth(report,complete,required.length);
}

function healthMarkup(report,complete,total){
  if(report.issues?.length)return `<div class="health-card bad"><strong>● Compatibility conflict</strong><p>${escapeHtml(report.issues[0].text)}${report.issues.length>1?` +${report.issues.length-1} more`:""}</p></div>`;
  if(report.unknowns?.length)return `<div class="health-card warn"><strong>● Needs final verification</strong><p>${escapeHtml(report.unknowns[0].text)}${report.unknowns.length>1?` +${report.unknowns.length-1} more`:""}</p></div>`;
  if(report.warnings?.length)return `<div class="health-card warn"><strong>● Compatible with notes</strong><p>${escapeHtml(report.warnings[0].text)}${report.warnings.length>1?` +${report.warnings.length-1} more`:""}</p></div>`;
  if(complete===total)return `<div class="health-card good"><strong>● Compatibility checks clear</strong><p>No conflicts were found in the current product data. VoltTech still confirms the final build before order.</p></div>`;
  return `<div class="health-card"><strong>● Build in progress</strong><p>${total-complete} required categor${total-complete===1?"y":"ies"} still need a selection.</p></div>`
}

function updateWorkspaceHealth(report,complete,total){
  if(report.issues?.length){refs.workspaceHealth.className="workspace-health bad";refs.workspaceHealth.innerHTML=`<span class="status-dot"></span><b>${report.issues.length} conflict${report.issues.length===1?"":"s"}</b>`}
  else if(report.unknowns?.length||report.warnings?.length){refs.workspaceHealth.className="workspace-health warn";refs.workspaceHealth.innerHTML=`<span class="status-dot"></span><b>${report.unknowns.length+report.warnings.length} item${report.unknowns.length+report.warnings.length===1?"":"s"} to review</b>`}
  else{refs.workspaceHealth.className="workspace-health good";refs.workspaceHealth.innerHTML=`<span class="status-dot"></span><b>${complete===total?"Build checks clear":"Compatibility active"}</b>`}
}

function summaryCategory(type){
  const items=getSelections(state.build,type);const label=CATEGORY_LABELS[type]||type;
  if(!items.length)return `<div class="build-row"><div class="build-row-head"><div><span class="build-row-label">${escapeHtml(label)}</span><span class="build-row-empty">${type==="fans"?"Optional":"Not selected"}</span></div><button class="build-row-price" data-edit="${type}">＋</button></div></div>`;
  if(isMultiCategory(type))return `<div class="build-row"><span class="build-row-label">${escapeHtml(label)}</span>${items.map(p=>`<div class="multi-item"><div><span class="build-row-name">${escapeHtml(p.name)}</span><div class="build-row-actions"><button data-edit="${type}">Add / change</button><button data-remove="${type}|${escapeAttr(p.id)}">Remove</button></div></div><span class="build-row-price">${priceText(p)}</span></div>`).join("")}</div>`;
  const p=items[0];return `<div class="build-row"><div class="build-row-head"><div><span class="build-row-label">${escapeHtml(label)}</span><span class="build-row-name">${escapeHtml(p.name)}</span><div class="build-row-actions"><button data-edit="${type}">Change</button><button data-remove="${type}|">Remove</button></div></div><span class="build-row-price">${priceText(p)}</span></div></div>`
}

function openModal(id){
  const product=state.products.find(p=>p.id===id);if(!product)return;state.modalProductId=id;
  const compat=getCompatibility(product,state.build);const offer=getBestOffer(product);const selected=isSelected(product);const image=safeUrl(product.media?.primaryImage);
  const source=safeUrl(product.media?.sourcePage);const specs=specEntries(product);const offers=(product.offers||[]).slice(0,5);
  refs.modalContent.innerHTML=`<div class="modal-grid"><div class="modal-media">${image?`<img data-product-image src="${escapeAttr(image)}" alt="${escapeAttr(product.name)}" decoding="async" referrerpolicy="no-referrer">`:""}<div class="image-fallback"><b>${escapeHtml(categoryMonogram(product.type))}</b><small>Image unavailable</small></div></div><div class="modal-info"><span class="product-brand">${escapeHtml(product.brand||product.manufacturer||"")}</span><h2 id="modalTitle">${escapeHtml(product.name)}</h2><div class="modal-price">${priceText(product)}</div><div class="modal-stock">${escapeHtml(getStockLabel(offer?.stockStatus,offer?.freshness))}${offer?.supplier?` · ${escapeHtml(offer.supplier)}`:""}</div><section class="modal-section"><h3>Key specifications</h3><div class="spec-table">${specs.map(([k,v])=>`<div class="spec-row"><span>${escapeHtml(k)}</span><b>${escapeHtml(v)}</b></div>`).join("")}</div></section><section class="modal-section"><h3>Compatibility with your current build</h3><div class="compat-detail">${diagnosticsMarkup(compat)}</div></section>${offers.length?`<section class="modal-section"><h3>Preview supplier offers</h3><div class="offers">${offers.map(o=>`<div class="offer"><div><span>${escapeHtml(o.supplier||"Supplier")}</span><small>${escapeHtml(getStockLabel(o.stockStatus,o.freshness))} · ${escapeHtml(o.freshness||"unknown freshness")}</small></div><b>${formatMoney(o.price,state.currency)}</b></div>`).join("")}</div></section>`:""}${source?`<a class="media-source" href="${escapeAttr(source)}" target="_blank" rel="noopener noreferrer">Open product image source ↗</a>`:""}<div class="modal-actions"><button type="button" class="btn btn-primary" data-modal-select="${escapeAttr(product.id)}" ${compat.issues?.length&&!selected?"disabled":""}>${selected?"Already selected":isMultiCategory(product.type)?"Add to build":"Select this part"}</button></div></div></div>`;
  refs.productModal.classList.remove("hidden");document.body.style.overflow="hidden";bindProductImages(refs.productModal)
}
function closeModal(){if(refs.productModal.classList.contains("hidden"))return;refs.productModal.classList.add("hidden");document.body.style.overflow="";state.modalProductId=null}

function diagnosticsMarkup(report){
  const items=[];
  (report.issues||[]).forEach(d=>items.push(`<div class="diag bad">${escapeHtml(d.text||d)}</div>`));
  (report.warnings||[]).forEach(d=>items.push(`<div class="diag warn">${escapeHtml(d.text||d)}</div>`));
  (report.unknowns||[]).forEach(d=>items.push(`<div class="diag warn">${escapeHtml(d.text||d)}</div>`));
  if(!items.length)items.push(`<div class="diag good">No compatibility conflict was found against the parts currently selected.</div>`);
  return items.join("")
}

function clearCurrentBuild(){
  if(getSelectedCount(state.build)&&!window.confirm("Clear every part from this build?"))return;
  state.build=clearBuild();state.guided=null;state.savedBuildId=null;state.activeCategory="cpu";persistBuild();renderAll();toast("Build cleared.")
}

function persistBuild(){
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify({version:2,build:serializeBuild(state.build),savedAt:new Date().toISOString()}))}catch(error){console.warn("Could not save build",error)}
}
function hydrateBuild(){
  if(readShareBuild())return;
  try{const raw=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");if(raw?.build)state.build=deserializeBuild(raw.build)}catch(error){console.warn("Could not restore build",error)}
}
function serializeBuild(build){const out={};CATEGORY_ORDER.forEach(type=>{const items=getSelections(build,type);out[type]=isMultiCategory(type)?items.map(p=>p.id):(items[0]?.id||null)});return out}
function deserializeBuild(data){const map=new Map(state.products.map(p=>[p.id,p]));const build=createEmptyBuild();CATEGORY_ORDER.forEach(type=>{const value=data?.[type];if(isMultiCategory(type))build[type]=(Array.isArray(value)?value:[]).map(id=>map.get(id)).filter(Boolean);else build[type]=map.get(value)||null});return build}
function readShareBuild(){
  const param=new URL(location.href).searchParams.get(SHARE_PARAM);if(!param)return false;
  try{let b64=param.replace(/-/g,"+").replace(/_/g,"/");b64+="=".repeat((4-b64.length%4)%4);const parsed=JSON.parse(atob(b64));state.build=deserializeBuild(parsed);persistBuild();return true}catch(error){console.warn("Invalid shared build",error);return false}
}
function encodeShareBuild(){const json=JSON.stringify(serializeBuild(state.build));return btoa(json).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"")}

async function shareBuild(){
  if(!getSelectedCount(state.build)){toast("Add a few parts before sharing the build.");return}
  const url=new URL(location.href);url.searchParams.set(SHARE_PARAM,encodeShareBuild());
  const data={title:"VoltTech PC Builder",text:`My VoltTech PC build — ${formatMoney(calculateBuildTotal(state.build),state.currency)} estimated parts total`,url:url.toString()};
  try{if(navigator.share){await navigator.share(data);toast("Build share opened.")}else{await navigator.clipboard.writeText(url.toString());toast("Build link copied.")}}catch(error){if(error?.name!=="AbortError")fallbackCopy(url.toString(),"Build link copied.")}
}

async function copyBuildSummary(){const text=buildSummaryText();try{await navigator.clipboard.writeText(text);toast("Build summary copied.")}catch{fallbackCopy(text,"Build summary copied.")}}

async function requestQuote(){
  if(getSelectedCount(state.build)<3){toast("Add a few parts before requesting a quote.");return}
  await saveBuildToAccount(true);
}

async function initAccount(){
  if(!window.supabase||!window.VOLTTECH_SUPABASE){updateAccountUi();return}
  state.authClient=window.supabase.createClient(VOLTTECH_SUPABASE.url,VOLTTECH_SUPABASE.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const {data:{session}}=await state.authClient.auth.getSession();
  state.user=session?.user||null;updateAccountUi();
  state.authClient.auth.onAuthStateChange((event,session)=>{state.user=session?.user||null;updateAccountUi();if(event==="SIGNED_IN")runPendingAccountAction()});
  if(state.user) setTimeout(runPendingAccountAction,0);
}

function updateAccountUi(){
  const signed=!!state.user;
  refs.accountBtn?.classList.toggle("signed-in",signed);
  if(refs.accountBtnText) refs.accountBtnText.textContent=signed?"My account":"Account";
  if(refs.accountStorageStatus) refs.accountStorageStatus.textContent=signed?"ACCOUNT READY":"SIGN-IN REQUIRED";
  refs.accountSignedOut?.classList.toggle("hidden",signed);
  refs.accountSignedIn?.classList.toggle("hidden",!signed);
  if(refs.builderAccountEmail) refs.builderAccountEmail.textContent=state.user?.email||"Signed in to VoltTech.";
}

function openAccountModal(action=null){state.pendingAccountAction=action;refs.accountModal?.classList.remove("hidden");updateAccountUi();setTimeout(()=>refs.builderAuthEmail?.focus(),50)}
function closeAccountModal(){refs.accountModal?.classList.add("hidden")}
function authStatus(message="",type=""){if(!refs.builderAuthStatus)return;refs.builderAuthStatus.textContent=message;refs.builderAuthStatus.className=`auth-status ${type}`}

async function requireAccount(action){
  if(state.user)return true;
  state.pendingAccountAction=action;try{sessionStorage.setItem(AUTH_PENDING_KEY,action||"")}catch{}
  openAccountModal(action);authStatus("Sign in or create an account to continue.");return false
}
async function runPendingAccountAction(){
  let action=state.pendingAccountAction;try{action=action||sessionStorage.getItem(AUTH_PENDING_KEY)}catch{}
  if(!state.user||!action)return;state.pendingAccountAction=null;try{sessionStorage.removeItem(AUTH_PENDING_KEY)}catch{}
  closeAccountModal();if(action==="save")await saveBuildToAccount(false,true);if(action==="quote")await saveBuildToAccount(true,true);if(action==="builds")await openSavedBuilds(true)
}

async function signInBuilderEmail(e){
  e.preventDefault();if(!state.authClient)return authStatus("Account service is unavailable.","error");authStatus("Signing in…");
  const email=refs.builderAuthEmail.value.trim(),password=refs.builderAuthPassword.value;
  const {data,error}=await state.authClient.auth.signInWithPassword({email,password});
  if(error)return authStatus(error.message,"error");state.user=data?.user||null;updateAccountUi();authStatus("Signed in.","success");await runPendingAccountAction()
}
async function createBuilderAccount(){
  if(!state.authClient)return authStatus("Account service is unavailable.","error");const email=refs.builderAuthEmail.value.trim(),password=refs.builderAuthPassword.value;
  if(!email||password.length<8)return authStatus("Enter an email and a password of at least 8 characters.","error");authStatus("Creating account…");
  const redirectTo=new URL(location.href);redirectTo.searchParams.delete("build");
  const {data,error}=await state.authClient.auth.signUp({email,password,options:{emailRedirectTo:redirectTo.toString()}});
  if(error)return authStatus(error.message,"error");
  if(data?.session?.user){state.user=data.session.user;updateAccountUi();authStatus("Account created.","success");await runPendingAccountAction()}else authStatus("Account created. Confirm your email, then return to this builder and sign in. Your build is still saved on this device.","success")
}
async function googleBuilderSignIn(){
  if(!state.authClient)return authStatus("Account service is unavailable.","error");authStatus("Opening Google sign-in…");
  const redirectTo=new URL(location.href);redirectTo.searchParams.delete("build");
  const {error}=await state.authClient.auth.signInWithOAuth({provider:"google",options:{redirectTo:redirectTo.toString()}});if(error)authStatus(error.message,"error")
}
async function signOutBuilder(){if(!state.authClient)return;await state.authClient.auth.signOut();state.user=null;state.savedBuildId=null;state.savedBuildStatus=null;updateAccountUi();closeAccountModal();toast("Signed out of VoltTech.")}

function buildAccountPayload(){
  const report=validateBuild(state.build),power=estimatePower(state.build),total=calculateBuildTotal(state.build);
  const items=CATEGORY_ORDER.flatMap(type=>getSelections(state.build,type).map(p=>{const offer=getBestOffer(p);return{product_id:p.id,type,name:p.name,brand:p.brand||p.manufacturer||null,quantity:1,unit_price:getProductPrice(p),supplier:offer?.supplier||null,stock_status:offer?.stockStatus||null,price_checked_at:offer?.priceCheckedAt||offer?.checkedAt||null}}));
  return {version:2,serialized:serializeBuild(state.build),items,summary:buildSummaryText(),compatibility:{status:report.issues?.length?"conflict":report.unknowns?.length||report.warnings?.length?"review":"clear",issues:report.issues||[],warnings:report.warnings||[],unknowns:report.unknowns||[]},power,estimated_total:total,saved_at:new Date().toISOString()}
}
function defaultBuildName(){const cpu=state.build.cpu?.model||state.build.cpu?.name,gpu=state.build.gpu?.model||state.build.gpu?.name;return [cpu,gpu].filter(Boolean).join(" + ")||"VoltTech PC Build"}

async function saveBuildToAccount(requestQuote=false,skipAuth=false){
  if(!getSelectedCount(state.build)){toast("Add at least one part before saving.");return null}
  if(!skipAuth&&!await requireAccount(requestQuote?"quote":"save"))return null;
  if(!state.user||!state.authClient)return null;
  const snapshot=buildAccountPayload(),now=new Date().toISOString();
  const payload={user_id:state.user.id,name:defaultBuildName(),build_data:snapshot,estimated_total:snapshot.estimated_total,estimated_power_watts:snapshot.power?.estimated||null,compatibility_status:snapshot.compatibility.status,status:requestQuote?"quote_requested":"saved",updated_at:now};
  if(requestQuote)payload.quote_requested_at=now;
  let result;
  const submittedVersion=["quote_requested","quoted"].includes(state.savedBuildStatus);
  if(submittedVersion){state.savedBuildId=null;state.savedBuildStatus=null}
  if(state.savedBuildId) result=await state.authClient.from("saved_builds").update(payload).eq("id",state.savedBuildId).eq("user_id",state.user.id).select("id,status,quote_id").maybeSingle();
  else result=await state.authClient.from("saved_builds").insert(payload).select("id,status,quote_id").single();
  if(result.error){console.error(result.error);toast(result.error.message?.includes("saved_builds")?"Account build storage needs the Supabase setup file to be applied first.":`Could not save build: ${result.error.message}`);return null}
  state.savedBuildId=result.data?.id||state.savedBuildId;state.savedBuildStatus=result.data?.status||payload.status;
  toast(requestQuote?"Build saved and sent to VoltTech for quotation review.":"Build saved to your VoltTech account.");
  return result.data
}

async function openSavedBuilds(skipAuth=false){
  if(!skipAuth&&!await requireAccount("builds"))return; if(!state.user||!state.authClient)return;
  refs.savedBuildsModal.classList.remove("hidden");refs.savedBuildsList.innerHTML='<p class="saved-build-empty">Loading your saved builds…</p>';
  const {data,error}=await state.authClient.from("saved_builds").select("id,name,status,build_data,estimated_total,estimated_power_watts,compatibility_status,quote_id,quote_requested_at,updated_at").order("updated_at",{ascending:false});
  if(error){refs.savedBuildsList.innerHTML=`<p class="saved-build-empty">${escapeHtml(error.message)}</p>`;return}
  if(!data?.length){refs.savedBuildsList.innerHTML='<p class="saved-build-empty">No account builds yet. Save the build you are working on and it will appear here.</p>';return}
  refs.savedBuildsList.innerHTML=data.map(savedBuildCard).join("")
}
function closeSavedBuilds(){refs.savedBuildsModal?.classList.add("hidden")}
function savedBuildCard(b){const items=b.build_data?.items||[];const parts=items.slice(0,5).map(i=>i.name).join(" · ")+(items.length>5?` · +${items.length-5} more`:"");const status=b.status||"saved";return `<article class="saved-build-card" data-saved-build="${escapeAttr(b.id)}"><div class="saved-build-head"><div><h3>${escapeHtml(b.name||"PC Build")}</h3><small>Updated ${escapeHtml(formatSavedDate(b.updated_at))}</small></div><span class="saved-status ${status==="quote_requested"?"requested":status==="quoted"?"quoted":""}">${escapeHtml(savedStatusLabel(status))}</span></div><div class="saved-build-total"><span>${items.length} selected part${items.length===1?"":"s"}</span><b>${formatMoney(b.estimated_total,state.currency)}</b></div><p class="saved-build-parts">${escapeHtml(parts||"Saved component configuration")}</p><div class="saved-build-actions"><button type="button" class="primary-small" data-resume-build="${escapeAttr(b.id)}">Resume build</button>${status==="saved"?`<button type="button" data-request-saved-quote="${escapeAttr(b.id)}">Request quote</button>`:""}${b.quote_id?'<a href="../quotes.html">Open quote</a>':status==="quote_requested"?'<a href="../quotes.html">Quotes</a>':""}<button type="button" data-delete-saved-build="${escapeAttr(b.id)}">Delete</button></div></article>`}
function savedStatusLabel(status){return({saved:"Saved",quote_requested:"Quote requested",quoted:"Quote ready",archived:"Archived"}[status]||status)}
function formatSavedDate(v){try{return new Intl.DateTimeFormat("en-ZA",{dateStyle:"medium",timeStyle:"short"}).format(new Date(v))}catch{return"recently"}}
async function onSavedBuildAction(e){
  const id=e.target.dataset.resumeBuild||e.target.dataset.requestSavedQuote||e.target.dataset.deleteSavedBuild;if(!id)return;
  const {data,error}=await state.authClient.from("saved_builds").select("*").eq("id",id).maybeSingle();if(error||!data)return toast("Could not load that saved build.");
  if(e.target.dataset.resumeBuild){state.build=deserializeBuild(data.build_data?.serialized||{});state.savedBuildId=data.id;state.savedBuildStatus=data.status||"saved";persistBuild();renderAll();closeSavedBuilds();refs.builderWorkspace.scrollIntoView({behavior:"smooth",block:"start"});toast("Saved build loaded.");return}
  if(e.target.dataset.requestSavedQuote){const {error:upError}=await state.authClient.from("saved_builds").update({status:"quote_requested",quote_requested_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",id).eq("user_id",state.user.id);if(upError)return toast(`Could not request quote: ${upError.message}`);toast("Quote request sent to VoltTech.");await openSavedBuilds(true);return}
  if(e.target.dataset.deleteSavedBuild){if(!confirm("Delete this saved PC build?"))return;const {error:delError}=await state.authClient.from("saved_builds").delete().eq("id",id).eq("user_id",state.user.id);if(delError)return toast(`Could not delete build: ${delError.message}`);if(state.savedBuildId===id){state.savedBuildId=null;state.savedBuildStatus=null;}toast("Saved build deleted.");await openSavedBuilds(true)}
}

function buildSummaryText(){
  const total=formatMoney(calculateBuildTotal(state.build),state.currency);const power=estimatePower(state.build);const report=validateBuild(state.build);
  const parts=CATEGORY_ORDER.flatMap(type=>getSelections(state.build,type).map(p=>`${CATEGORY_LABELS[type]||type}: ${p.name} — ${priceText(p)}`));
  return ["VoltTech PC Builder","",...parts,"",`Estimated parts total: ${total}`,power.estimated?`Estimated system load: ${power.estimated} W`:null,`Build status: ${report.issues?.length?"Conflict to review":report.unknowns?.length||report.warnings?.length?"Needs final verification":"Current checks clear"}`,"","Estimate only — final stock, pricing and specification must be confirmed by VoltTech."].filter(Boolean).join("\n")
}

function toggleSummary(force){const open=typeof force==="boolean"?force:!refs.summaryPanel.classList.contains("open");refs.summaryPanel.classList.toggle("open",open);refs.mobileSummaryToggle.setAttribute("aria-expanded",String(open))}

function bindProductImages(scope){scope.querySelectorAll("img[data-product-image]").forEach(img=>{const fail=()=>img.closest(".product-media,.modal-media")?.classList.add("broken");if(img.complete&&img.naturalWidth===0)fail();img.addEventListener("error",fail,{once:true})})}

function effectiveRequiredCategories(){
  const cpu=state.build.cpu;const igpu=cpu?.specs?.integratedGraphics===true;
  return igpu&&!state.build.gpu?REQUIRED_CATEGORIES.filter(t=>t!=="gpu"):REQUIRED_CATEGORIES
}
function findNextIncomplete(afterType){const required=effectiveRequiredCategories();const start=Math.max(0,required.indexOf(afterType)+1);return required.slice(start).find(t=>!hasCategory(state.build,t))||required.find(t=>!hasCategory(state.build,t))||null}
function firstUsefulCategory(){return findNextIncomplete("")||"gpu"}
function isSelected(product){return getSelections(state.build,product.type).some(p=>p.id===product.id)}
function isOfferAvailable(offer){if(!offer)return false;return !["out-of-stock","discontinued"].includes(String(offer.stockStatus||"").toLowerCase())}
function priceText(product){const price=getProductPrice(product);return price?formatMoney(price,state.currency):"Price pending"}
function searchBlob(p){return [p.brand,p.manufacturer,p.name,p.model,p.identifiers?.mpn,p.identifiers?.ean,p.specs?.chipset,p.specs?.socket,p.specs?.memoryType,p.specs?.interface].filter(Boolean).join(" ").toLowerCase()}
function compatMessage(report,selected){if(selected)return"Already in your current build.";if(report.issues?.length)return report.issues[0].text||"Conflicts with the current build.";if(report.unknowns?.length)return report.unknowns[0].text||"Some compatibility data still needs verification.";if(report.warnings?.length)return report.warnings[0].text||"Compatible, with a note to review.";return"Fits the parts currently selected."}

function specChips(p){const s=p.specs||{};switch(p.type){case"cpu":return[s.socket,s.cores&&s.threads?`${s.cores}C / ${s.threads}T`:null,s.architecture,s.tdpWatts?`${s.tdpWatts}W TDP`:null].filter(Boolean);case"motherboard":return[s.chipset,s.formFactor,s.memoryType,s.wifi===true?"Wi-Fi":null].filter(Boolean);case"memory":return[s.capacityGB?`${s.capacityGB}GB`:null,s.memoryType,s.speedMTs?`${s.speedMTs} MT/s`:null,s.modules?`${s.modules} DIMMs`:null].filter(Boolean);case"gpu":return[s.vramGB?`${s.vramGB}GB VRAM`:null,s.lengthMm?`${s.lengthMm}mm`:null,s.recommendedPsuWatts?`${s.recommendedPsuWatts}W PSU`:null].filter(Boolean);case"storage":return[s.capacityGB?capacityLabel(s.capacityGB):null,s.interface,s.pcieGeneration?`PCIe ${s.pcieGeneration}`:null,s.formFactor].filter(Boolean);case"psu":return[s.wattage?`${s.wattage}W`:null,s.efficiency,s.modularity].filter(Boolean);case"case":return[(s.supportedMotherboardSizes||[]).join("/"),s.maxGpuLengthMm?`${s.maxGpuLengthMm}mm GPU`:null,s.maxCpuCoolerHeightMm?`${s.maxCpuCoolerHeightMm}mm cooler`:null].filter(Boolean);case"cooler":return[s.coolerType==="aio"?`${s.radiatorSizeMm}mm AIO`:"Air cooler",s.heightMm?`${s.heightMm}mm high`:null,(s.supportedSockets||[]).slice(0,2).join("/")].filter(Boolean);case"fans":return[s.sizeMm?`${s.sizeMm}mm`:null,s.fanCount?`${s.fanCount} pack`:null,s.pwm?"PWM":null].filter(Boolean);default:return[]}}

function specEntries(p){const s=p.specs||{};return Object.entries(s).filter(([,v])=>v!==null&&v!==undefined&&v!==false&&v!==""&&(!Array.isArray(v)||v.length)).slice(0,14).map(([k,v])=>[humanize(k),formatSpecValue(k,v)])}
function formatSpecValue(key,v){if(Array.isArray(v))return v.join(", ");if(typeof v==="boolean")return v?"Yes":"No";if(key.toLowerCase().includes("watts"))return`${v} W`;if(key.toLowerCase().includes("mm"))return`${v} mm`;if(key==="capacityGB")return capacityLabel(v);if(key==="speedMTs")return`${v} MT/s`;return String(v)}
function humanize(s){return String(s).replace(/([a-z0-9])([A-Z])/g,"$1 $2").replace(/^./,m=>m.toUpperCase())}
function capacityLabel(gb){gb=Number(gb||0);return gb>=1000?`${Number.isInteger(gb/1000)?gb/1000:(gb/1000).toFixed(1)}TB`:`${gb}GB`}
function categoryMonogram(type){return({cpu:"CPU",motherboard:"MB",memory:"RAM",gpu:"GPU",storage:"SSD",psu:"PSU",case:"CASE",cooler:"COOL",fans:"FAN"}[type]||"PC")}

function safeUrl(value){try{if(!value)return"";const u=new URL(value,location.href);return ["http:","https:"].includes(u.protocol)?u.href:""}catch{return""}}
function escapeHtml(value){return String(value??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]))}
function escapeAttr(value){return escapeHtml(value).replace(/`/g,"&#96;")}
function fallbackCopy(text,message){const ta=document.createElement("textarea");ta.value=text;ta.style.position="fixed";ta.style.opacity="0";document.body.appendChild(ta);ta.select();document.execCommand("copy");ta.remove();toast(message)}
function toast(message){clearTimeout(toastTimer);refs.toast.textContent=message;refs.toast.classList.add("show");toastTimer=setTimeout(()=>refs.toast.classList.remove("show"),2600)}
