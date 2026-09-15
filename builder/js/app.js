import {
  CATEGORY_ORDER,REQUIRED_CATEGORIES,CATEGORY_LABELS,createEmptyBuild,selectProduct,removeProduct,clearBuild,
  getProductsByCategory,searchProducts,getBestOffer,getProductPrice,calculateBuildTotal,formatMoney,getSelectedCount,
  getCompletedCategoryCount,getNextCategory,getCategorySummary,getStockLabel,getSelections,isMultiCategory
} from "./build-engine.js?v=0.7.7";
import {getCompatibility,validateBuild,estimatePower} from "./compatibility-engine.js?v=0.7.8.1";
import {buildGuidedRecommendation,profileLabel} from "./guided-engine.js?v=1.5";
import {loadCatalogue} from "./data-loader.js?v=2.2.0";

const e={
  steps:document.getElementById("steps"), search:document.getElementById("search"), compatibleOnly:document.getElementById("compatible-only"),
  categoryTitle:document.getElementById("category-title"), productCount:document.getElementById("product-count"), products:document.getElementById("products"),
  buildList:document.getElementById("build-list"), total:document.getElementById("total"), power:document.getElementById("power"), report:document.getElementById("report"),
  clearBuild:document.getElementById("clear-build"), catalogueNote:document.getElementById("catalogue-note"), modeShell:document.getElementById("mode-shell"),
  guidedPanel:document.getElementById("guided-panel"), builderLayout:document.getElementById("builder-layout"), chooseGuided:document.getElementById("choose-guided"),
  chooseAdvanced:document.getElementById("choose-advanced"), guidedBack:document.getElementById("guided-back"), guidedForm:document.getElementById("guided-form"),
  guidedSubmit:document.getElementById("guided-submit"), guidedError:document.getElementById("guided-error"), heroGuided:document.getElementById("hero-guided"),
  heroAdvanced:document.getElementById("hero-advanced"), guidedResult:document.getElementById("guided-result"), pickerProfile:document.getElementById("picker-profile"),
  copyBuild:document.getElementById("copy-build"), changeMode:document.getElementById("change-mode"), mobileBar:document.getElementById("mobile-buildbar"),
  mobileTotal:document.getElementById("mobile-total"), mobileSummary:document.getElementById("mobile-summary")
};

let catalogue=[],currency="ZAR",activeCategory=CATEGORY_ORDER[0],build=createEmptyBuild(),guidedProfile=null,guidedRecommendation=null;
let generating=false;

init();

async function init(){
  bind();
  try{
    const d=await loadCatalogue();
    catalogue=d.products||[];
    currency=d.currency||"ZAR";
    const imageCount=catalogue.filter(p=>p.media?.primaryImage).length;
    e.catalogueNote.textContent=`${catalogue.length} components loaded · ${imageCount} product images mapped · ${d.offerCount} supplier offers · preview pricing and availability are estimates until VoltTech confirms the quotation.`;
    render();
  }catch(error){
    console.error("VoltTech catalogue load error",error);
    e.catalogueNote.textContent="The component catalogue could not be loaded. Refresh once; if it persists, VoltTech needs to repair the builder data connection.";
    e.products.innerHTML='<div class="empty">The parts catalogue did not load. No build data has been submitted.</div>';
  }
}

function bind(){
  setupGuidedControls();
  e.heroGuided?.addEventListener("click",openGuided);
  e.chooseGuided?.addEventListener("click",openGuided);
  e.heroAdvanced?.addEventListener("click",openManual);
  e.chooseAdvanced?.addEventListener("click",openManual);
  e.guidedBack?.addEventListener("click",showModeChoice);
  e.guidedForm?.addEventListener("submit",onGuidedSubmit);
  e.search?.addEventListener("input",renderProducts);
  e.compatibleOnly?.addEventListener("change",renderProducts);
  e.copyBuild?.addEventListener("click",copyBuildSummary);
  e.changeMode?.addEventListener("click",showModeChoice);
  e.clearBuild?.addEventListener("click",async()=>{
    if(getSelectedCount(build)){
      const ok=await window.VoltTechDialog.confirm({kicker:"PC BUILDER / CLEAR",title:"Clear this entire build?",message:"Every selected component will be removed from the current builder session.",confirmText:"Clear build",tone:"danger"});
      if(!ok)return;
    }
    build=clearBuild();guidedProfile=null;guidedRecommendation=null;activeCategory=CATEGORY_ORDER[0];e.search.value="";render();
    scrollToElement(e.builderLayout);
  });
  e.mobileSummary?.addEventListener("click",()=>scrollToElement(document.querySelector(".summary")));
}

function setupGuidedControls(){
  if(!e.guidedForm)return;
  e.guidedForm.querySelectorAll("[data-choice-group]").forEach(group=>{
    const name=group.dataset.choiceGroup;
    const input=e.guidedForm.querySelector(`input[name="${name}"]`);
    group.querySelectorAll(".choice-card").forEach(btn=>btn.addEventListener("click",()=>{
      group.querySelectorAll(".choice-card").forEach(x=>x.classList.toggle("active",x===btn));
      if(input)input.value=btn.dataset.value||"";
    }));
  });
  const slider=document.getElementById("budget-slider"),output=document.getElementById("budget-output");
  const sync=()=>{
    if(!slider||!output)return;
    const value=Number(slider.value||30000),min=Number(slider.min||10000),max=Number(slider.max||100000);
    output.textContent=`R${value.toLocaleString("en-ZA")}`;
    slider.style.setProperty("--budget-progress",`${Math.max(0,Math.min(100,((value-min)/(max-min))*100))}%`);
  };
  slider?.addEventListener("input",sync);sync();
}

function openGuided(){
  e.modeShell.hidden=true;e.builderLayout.hidden=true;e.guidedPanel.hidden=false;e.guidedResult.hidden=true;e.guidedForm.hidden=false;
  e.guidedError.hidden=true;e.guidedError.textContent="";scrollToElement(e.guidedPanel);
}
function openManual(){
  guidedProfile=null;guidedRecommendation=null;updatePickerProfile();e.modeShell.hidden=true;e.guidedPanel.hidden=true;e.builderLayout.hidden=false;
  render();scrollToElement(document.querySelector(".catalogue"));
}
function showModeChoice(){
  guidedProfile=null;guidedRecommendation=null;e.builderLayout.hidden=true;e.guidedPanel.hidden=true;e.modeShell.hidden=false;updateMobileBar();scrollToElement(e.modeShell);
}
function scrollToElement(el){
  if(!el)return;requestAnimationFrame(()=>requestAnimationFrame(()=>{
    const h=document.querySelector(".topbar")?.getBoundingClientRect().height||0;
    const top=window.scrollY+el.getBoundingClientRect().top-h-8;
    window.scrollTo({top:Math.max(0,top),behavior:"smooth"});
  }));
}

async function onGuidedSubmit(event){
  event.preventDefault();
  if(generating||!catalogue.length)return;
  generating=true;e.guidedError.hidden=true;e.guidedError.textContent="";
  const old=e.guidedSubmit.textContent;e.guidedSubmit.disabled=true;e.guidedSubmit.textContent="Building your recommendation…";
  try{
    const data=new FormData(e.guidedForm);
    guidedProfile={useCase:data.get("useCase")||"gaming",budget:Number(data.get("budget")||30000),target:data.get("target")||"1440p",priority:data.get("priority")||"balanced",fpsTarget:data.get("fpsTarget")||"120",storageNeed:Number(data.get("storageNeed")||1000)};
    guidedRecommendation=buildGuidedRecommendation(guidedProfile,catalogue,currency);
    renderGuidedProfile();
    await new Promise(r=>setTimeout(r,30));scrollToElement(e.guidedResult);
  }catch(error){
    console.error("Guided recommendation failed",error);
    e.guidedError.textContent=`We couldn't generate that combination yet. ${error?.message||"Please change an answer and try again."}`;
    e.guidedError.hidden=false;
  }finally{generating=false;e.guidedSubmit.disabled=false;e.guidedSubmit.textContent=old;}
}

function mediaMarkup(product,variant="catalogue"){
  const src=safeUrl(product?.media?.primaryImage),label=CATEGORY_LABELS[product?.type]||"PC Part";
  const eager=variant==="guided-hero";
  return `<div class="product-media ${variant}${src?"":" no-media"}">${src?`<img src="${esc(src)}" alt="${esc(product.name)} product image" ${eager?'fetchpriority="high"':'loading="lazy"'} decoding="async" referrerpolicy="no-referrer" onerror="this.hidden=true;this.parentElement.classList.add('media-error')">`:""}<div class="media-fallback"><b>${esc(label)}</b><small>Product image unavailable</small></div></div>`;
}
function safeUrl(value){try{const u=new URL(value,location.href);return ["http:","https:"].includes(u.protocol)?u.href:""}catch{return""}}

function persona(profile){
  const target=profileLabel(profile?.target)||"your target",use=profile?.useCase||"gaming";
  if(use==="gaming")return{badge:"Gaming build · built around you",title:`${target} gaming. Properly done.`,copy:"A gaming-first machine that puts the budget into the parts you actually feel when the match starts — not spec-sheet bragging rights."};
  if(use==="streaming")return{badge:"Gaming + streaming",title:"Play it. Stream it. Clip it.",copy:"A machine built to game hard while the stream, chat and capture workload keep moving in the background."};
  if(use==="creator")return{badge:"Creator build",title:"Make big projects feel smaller.",copy:"More breathing room for timelines, renders and creative apps without forgetting that this PC should still be fun after work."};
  if(use==="workstation")return{badge:"Workstation build",title:"Hardware that earns its desk space.",copy:"Threaded performance, memory and platform capability get more weight for sustained professional work."};
  return{badge:"Everyday build",title:"Fast where it matters. Quiet where it counts.",copy:"A responsive, sensible machine without paying for gaming hardware you may never use."};
}
function merch(product,type){
  const s=product?.specs||{},n=String(product?.name||"").toLowerCase();
  if(type==="gpu")return{badge:"The star of the show",hook:"This is where the frames live.",story:`The GPU gets serious budget weight for ${profileLabel(guidedProfile?.target)||"your display target"}.${s.vramGB?` ${s.vramGB}GB of VRAM gives modern games useful breathing room.`:""}`};
  if(type==="cpu")return{badge:/x3d/.test(n)?"Gaming favourite":"The brains",hook:/x3d/.test(n)?"One of those CPUs gamers talk about.":"Strong enough to let the rest of the build do its thing.",story:"We balance CPU performance against the rest of the machine instead of spending for core-count bragging rights."};
  if(type==="memory")return{badge:"Sweet spot",hook:Number(s.capacityGB||0)>=32?"Enough RAM to stop thinking about RAM.":"Sensible memory. More budget for the fun parts.",story:"A matched kit with the right DDR generation for the selected platform."};
  if(type==="storage")return{badge:"Game library",hook:Number(s.capacityGB||0)>=2000?"Less uninstalling. Finally.":"Fast storage where you feel it every day.",story:"Enough fast space to start comfortably, with expansion still possible later."};
  if(type==="psu")return{badge:"Power sorted",hook:"Nobody flexes the PSU. Everybody notices a bad one.",story:"Power is sized after the main hardware so the machine gets sensible headroom."};
  if(type==="case")return{badge:"The look",hook:"This is where a pile of parts becomes your PC.",story:"Fit and airflow first. Looking clean is the very nice bonus."};
  if(type==="cooler")return{badge:"Keep it cool",hook:"Fast hardware is nicer when it isn't screaming at you.",story:"Cooling is matched to the CPU and case so the machine has thermal breathing room."};
  if(type==="motherboard")return{badge:"The backbone",hook:"Enough board where it matters. No motherboard tax.",story:"The right socket, memory and expansion matter more than paying for a prestige board."};
  return{badge:"VoltTech pick",hook:"This part makes sense here.",story:"It fits the brief, budget and the rest of the machine."};
}
function specChips(product,type){
  const s=product?.specs||{},a=[],add=v=>{if(v)a.push(String(v))};
  if(type==="gpu"){add(s.vramGB&&`${s.vramGB}GB VRAM`);add(s.lengthMm&&`${s.lengthMm}mm`)}
  if(type==="cpu"){add(s.cores&&`${s.cores} cores`);add(s.threads&&`${s.threads} threads`);add(s.socket)}
  if(type==="memory"){add(s.capacityGB&&`${s.capacityGB}GB`);add(s.memoryType);add(s.speedMTs&&`${s.speedMTs} MT/s`)}
  if(type==="storage"){add(s.capacityGB&&(s.capacityGB>=1000?`${s.capacityGB/1000}TB`:`${s.capacityGB}GB`));add(s.interface)}
  if(type==="psu"){add(s.wattage&&`${s.wattage}W`);add(s.efficiency)}
  if(type==="motherboard"){add(s.chipset);add(s.socket);add(s.formFactor)}
  return a.slice(0,3);
}

function renderGuidedProfile(){
  if(!guidedProfile||!e.guidedResult)return;
  e.guidedForm.hidden=true;e.guidedResult.hidden=false;e.builderLayout.hidden=true;
  const r=guidedRecommendation;
  if(!r?.ok){
    e.guidedResult.innerHTML=`<section class="build-reveal"><span class="reveal-kicker">ALMOST THERE</span><h3>We hit a parts snag.</h3><p class="reveal-copy">${esc(r?.message||"The current catalogue could not complete that combination yet.")}</p><div class="result-actions"><button class="flow-btn secondary" id="guided-edit" type="button">← Tweak my answers</button></div></section>`;
    document.getElementById("guided-edit")?.addEventListener("click",()=>{e.guidedResult.hidden=true;e.guidedForm.hidden=false;scrollToElement(e.guidedForm)});return;
  }
  const p=persona(guidedProfile);const categories=[["gpu","Graphics Card"],["cpu","Processor"],["memory","Memory"],["motherboard","Motherboard"],["storage","Storage"],["case","Case"],["cooler","CPU Cooler"],["psu","Power Supply"]];
  const parts=categories.map(([type,label])=>{
    const product=getSelections(r.build,type)[0];if(!product)return"";const m=merch(product,type),chips=specChips(product,type),price=getProductPrice(product);
    return `<article class="store-part ${type==="gpu"?"hero-part":""}"><div class="part-top"><div><span class="part-label">${esc(label)}</span><span class="part-badge">${esc(m.badge)}</span></div><span class="part-price">${price?esc(formatMoney(price,currency)):"Price pending"}</span></div>${mediaMarkup(product,type==="gpu"?"guided-hero":"guided")}<h4>${esc(product.name)}</h4><p class="part-hook">${esc(m.hook)}</p><p class="part-story">${esc(m.story)}</p>${chips.length?`<div class="part-specs">${chips.map(x=>`<span>${esc(x)}</span>`).join("")}</div>`:""}<div class="part-actions"><button class="part-action" type="button" data-why="${type}">Why this part?</button><button class="part-action alt" type="button" data-swap="${type}">See alternatives →</button></div><div class="part-why" data-why-panel="${type}" hidden>${esc(r.reasons?.[type]||"Selected because it fits your brief, budget and the rest of the build.")}</div></article>`;
  }).join("");
  const budget=r.budgetState==="over"?"Over target":r.budgetState==="under"?"Room to play":"On budget";const report=r.report||{issues:[],unknowns:[],warnings:[]};
  e.guidedResult.innerHTML=`<section class="build-reveal"><span class="reveal-kicker">${esc(p.badge)}</span><h3>This is your machine.<em>${esc(p.title)}</em></h3><p class="reveal-copy">${esc(p.copy)}</p><div class="reveal-price"><span>Current parts total · preview pricing</span><strong>${esc(formatMoney(r.total,currency))}</strong></div></section><div class="build-verdict"><b>This is the fun part.</b> We’ve done the compatibility and power homework. Now explore the hardware, see why it is here, or swap anything that makes you curious.</div><div class="build-dashboard"><div class="build-metric"><span>Budget</span><strong>${esc(budget)}</strong><small>${esc(r.budget?.label||formatMoney(guidedProfile.budget,currency))}</small></div><div class="build-metric"><span>Compatibility</span><strong>${report.issues?.length?"Needs attention":"Looks good"}</strong><small>${report.issues?.length?`${report.issues.length} hard conflict(s)`:report.unknowns?.length?`${report.unknowns.length} check(s) need verification`:"No known hard conflicts"}</small></div><div class="build-metric"><span>Power</span><strong>${esc(`${r.power?.estimated||0} W`)}</strong><small>${r.power?.preferred?`${r.power.preferred} W preferred PSU target`:"Headroom calculated"}</small></div></div><div class="guided-parts">${parts}</div><div class="result-actions"><button class="flow-btn primary-action" id="guided-use" type="button">Make it mine · customise →</button><button class="flow-btn" id="guided-save" type="button">Save to my account</button><button class="flow-btn secondary" id="guided-edit" type="button">← Change the brief</button></div><p class="store-footnote">Preview pricing only. Final stock, compatibility and quotation are confirmed by VoltTech before an order proceeds.</p>`;
  e.guidedResult.querySelectorAll("[data-why]").forEach(btn=>btn.addEventListener("click",()=>{const panel=e.guidedResult.querySelector(`[data-why-panel="${btn.dataset.why}"]`);panel.hidden=!panel.hidden;btn.textContent=panel.hidden?"Why this part?":"Hide details ↑"}));
  e.guidedResult.querySelectorAll("[data-swap]").forEach(btn=>btn.addEventListener("click",()=>applyGuidedBuild(btn.dataset.swap)));
  document.getElementById("guided-use")?.addEventListener("click",()=>applyGuidedBuild(["gaming","streaming"].includes(guidedProfile.useCase)?"gpu":"cpu"));
  document.getElementById("guided-edit")?.addEventListener("click",()=>{e.guidedResult.hidden=true;e.guidedForm.hidden=false;scrollToElement(e.guidedForm)});
  document.getElementById("guided-save")?.addEventListener("click",()=>{applyGuidedBuild("gpu",false);setTimeout(()=>document.getElementById("vt-save-build")?.click(),120)});
}

function cloneBuild(source){
  const fresh=createEmptyBuild();for(const category of CATEGORY_ORDER){const items=getSelections(source,category);fresh[category]=isMultiCategory(category)?[...items]:(items[0]||null)}return fresh;
}
function applyGuidedBuild(category="gpu",scroll=true){
  if(!guidedRecommendation?.ok)return;build=cloneBuild(guidedRecommendation.build);activeCategory=CATEGORY_ORDER.includes(category)?category:"gpu";e.guidedPanel.hidden=true;e.builderLayout.hidden=false;updatePickerProfile();render();if(scroll)scrollToElement(document.querySelector(".catalogue"));
}
function updatePickerProfile(){
  if(!e.pickerProfile)return;if(!guidedProfile){e.pickerProfile.hidden=true;e.pickerProfile.textContent="";return}e.pickerProfile.hidden=false;e.pickerProfile.innerHTML=`<b>Your build goal:</b> ${esc(profileLabel(guidedProfile.useCase))} · max ${esc(formatMoney(Number(guidedProfile.budget||0),currency))} · ${esc(profileLabel(guidedProfile.target))} · ${esc(profileLabel(guidedProfile.priority))} · ${esc(guidedProfile.fpsTarget||"")}+ FPS target. Every part can still be changed.`;
}

function render(){updatePickerProfile();renderSteps();renderProducts();renderBuild();renderPower();renderReport();updateMobileBar()}
function renderSteps(){
  e.steps.innerHTML=CATEGORY_ORDER.map((type,index)=>{const selected=getSelections(build,type),complete=selected.length>0,optional=!REQUIRED_CATEGORIES.includes(type);return `<button class="step ${type===activeCategory?"active":""} ${complete?"complete":""}" type="button" data-category="${type}"><span class="step-index">${complete?"✓":optional?"＋":index+1}</span><span class="step-label"><b>${esc(CATEGORY_LABELS[type])}${optional?" · Optional":""}</b><small>${complete?esc(getCategorySummary(selected,type)):optional?"Add if needed":"Not selected"}</small></span></button>`}).join("");
  e.steps.querySelectorAll("[data-category]").forEach(btn=>btn.addEventListener("click",()=>openCategory(btn.dataset.category)));
}
function openCategory(type){if(!CATEGORY_ORDER.includes(type))return;activeCategory=type;e.search.value="";renderSteps();renderProducts();scrollToElement(document.querySelector(".catalogue"))}

function renderProducts(){
  if(!catalogue.length)return;e.categoryTitle.textContent=CATEGORY_LABELS[activeCategory];const raw=searchProducts(getProductsByCategory(catalogue,activeCategory),e.search.value||"");
  const evaluated=raw.map(product=>{const candidate=relevantCompatibility(getCompatibility(product,build),product.type),qty=getSelections(build,product.type).filter(p=>p.id===product.id).length;return{product,candidate,display:qty?relevantCompatibility(validateBuild(build),product.type):candidate,qty}});
  const visible=e.compatibleOnly.checked?evaluated.filter(x=>x.candidate.compatible||x.qty>0):evaluated;e.productCount.textContent=`${visible.length} of ${raw.length}`;
  if(!visible.length){e.products.innerHTML='<div class="empty">No matching compatible products. Turn off “Compatible only” or change another component.</div>';return}
  const info=[];if(activeCategory==="psu")info.push(psuRecommendation());if(activeCategory==="fans")info.push(fanCapacity());
  e.products.innerHTML=info.filter(Boolean).map(t=>`<div class="resource-note good">${esc(t)}</div>`).join("")+visible.map(x=>productCard(x.product,x.display,x.candidate,x.qty)).join("");
  e.products.querySelectorAll("[data-select-product]").forEach(btn=>btn.addEventListener("click",()=>selectFromCard(btn.dataset.selectProduct)));
  e.products.querySelectorAll("[data-remove-product]").forEach(btn=>btn.addEventListener("click",()=>{build=removeProduct(build,btn.dataset.productType||activeCategory,btn.dataset.removeProduct);render()}));
}
function relevantCompatibility(result,category){const relevant=x=>x&&(x.category===category||x.alternateCategory===category);const issues=(result.issues||[]).filter(relevant),warnings=(result.warnings||[]).filter(relevant),unknowns=(result.unknowns||[]).filter(relevant);return{compatible:issues.length===0,status:issues.length?"bad":unknowns.length?"unknown":warnings.length?"warn":"good",issues,warnings,unknowns}}
function productCard(product,display,candidate,qty){
  const offer=getBestOffer(product),price=offer?formatMoney(offer.price,currency):"Price pending",supplier=offer?`${offer.supplierName||offer.supplier||offer.source||"Supplier"} · ${getStockLabel(offer.stockStatus,offer.freshness)}`:"Supplier match pending";
  const selected=qty>0,multi=isMultiCategory(product.type);const diagnostics=[...display.issues.map(x=>`<div class="product-error">✕ ${esc(textOf(x))}</div>`),...display.warnings.map(x=>`<div class="product-warning">⚠ ${esc(textOf(x))}</div>`),...display.unknowns.map(x=>`<div class="product-unknown">? ${esc(textOf(x))}</div>`)].join("");
  const controls=multi&&selected?`<div class="qty-wrap"><div class="qty-label">Selected ×${qty}</div><div class="qty-control"><button type="button" data-remove-product="${esc(product.id)}" data-product-type="${esc(product.type)}" aria-label="Remove one">−</button><span>${qty}</span><button type="button" data-select-product="${esc(product.id)}" ${candidate.compatible?"":"disabled"} aria-label="Add another">＋</button></div></div>`:`<button class="select-btn" type="button" data-select-product="${esc(product.id)}" ${candidate.compatible?"":"disabled"}>${candidate.compatible?(selected&&!multi?"Selected":multi?"Add to build":"Select"):"Incompatible"}</button>`;
  return `<article class="product ${selected?"selected":""} ${!candidate.compatible&&!selected?"incompatible":""}"><div class="product-main">${mediaMarkup(product,"catalogue")}<span class="product-brand">${esc(product.brand||product.manufacturer||"")}</span><h3>${esc(product.name)}</h3><div class="product-meta">${metaOf(product).map(x=>`<span class="meta">${esc(x)}</span>`).join("")}</div>${diagnostics}</div><div class="product-side"><div class="price">${esc(price)}</div><div class="supplier">${esc(supplier)}</div>${controls}</div><div class="product-pitch"><b>Why it’s worth a look:</b> ${esc(productPitch(product))}</div></article>`;
}
function selectFromCard(id){
  const product=catalogue.find(p=>p.id===id);if(!product)return;const multi=isMultiCategory(product.type),selected=getSelections(build,product.type).filter(p=>p.id===product.id).length;
  if(selected&&!multi){build=removeProduct(build,product.type,product.id);render();return}
  const compat=relevantCompatibility(getCompatibility(product,build),product.type);if(!compat.compatible)return;
  const wasComplete=getCompletedCategoryCount(build)===REQUIRED_CATEGORIES.length;build=selectProduct(build,product);const complete=getCompletedCategoryCount(build)===REQUIRED_CATEGORIES.length;
  if(!multi&&!complete)activeCategory=getNextCategory(product.type,build);e.search.value="";render();
  if(!multi&&(!wasComplete||!complete))scrollToElement(document.querySelector(".catalogue"));else if(complete)scrollToElement(document.querySelector(".summary"));
}
function textOf(x){return x?.text||String(x)}
function productPitch(product){
  const s=product.specs||{},n=String(product.name||"").toLowerCase();if(product.type==="gpu"){const v=Number(s.vramGB||0);return v>=16?"Serious graphics territory with a large VRAM pool for demanding games and creative workloads.":v>=12?"A strong premium gaming sweet spot with useful VRAM headroom.":"A sensible graphics choice that keeps the budget focused on real frame-rate gains."}if(product.type==="cpu")return /x3d/.test(n)?"A gaming-focused CPU with the extra cache enthusiasts care about.":Number(s.cores||0)>=12?"Strong multi-core headroom for gaming plus heavier work.":"A balanced processor choice that leaves enough budget for the GPU and rest of the platform.";if(product.type==="memory")return Number(s.capacityGB||0)>=32?"A comfortable modern capacity for games, Discord, browser tabs and background apps.":"A leaner matched kit that protects budget for higher-impact components.";if(product.type==="storage")return Number(s.capacityGB||0)>=2000?"Plenty of fast space for a serious game library.":"Fast everyday storage for Windows, apps and your core game library.";if(product.type==="psu")return"The unglamorous part that protects everything else. Wattage and connector headroom matter more than a flashy label.";if(product.type==="case")return"Fit and airflow come first. The clean look is the bonus.";if(product.type==="cooler")return"Cooling matched to the CPU and case helps keep performance stable without unnecessary noise.";if(product.type==="motherboard")return"The right socket, memory support and expansion matter more than paying a motherboard prestige tax.";if(product.type==="fans")return"Optional airflow tuning when the case and cooler leave useful fan positions available.";return"A compatible option that fits the current build.";
}
function metaOf(product){const s=product.specs||{};switch(product.type){case"cpu":return[s.socket,s.cores&&`${s.cores} cores`,s.threads&&`${s.threads} threads`,s.tdpWatts&&`${s.tdpWatts}W TDP`].filter(Boolean);case"motherboard":return[s.socket,s.chipset,s.formFactor,s.memoryType,s.wifi?"Wi-Fi":null].filter(Boolean);case"memory":return[s.capacityGB&&`${s.capacityGB}GB`,s.memoryType,s.speedMTs&&`${s.speedMTs} MT/s`].filter(Boolean);case"gpu":return[s.vramGB&&`${s.vramGB}GB VRAM`,s.lengthMm&&`${s.lengthMm}mm`,s.slots&&`${s.slots}-slot`,s.recommendedPsuWatts&&`${s.recommendedPsuWatts}W PSU`].filter(Boolean);case"storage":return[s.capacityGB&&(s.capacityGB>=1000?`${s.capacityGB/1000}TB`:`${s.capacityGB}GB`),s.interface,s.formFactor,s.pcieGeneration&&`PCIe ${s.pcieGeneration}.0`].filter(Boolean);case"psu":return[s.wattage&&`${s.wattage}W`,s.efficiency,s.modular,s.atxVersion].filter(Boolean);case"case":return[s.supportedMotherboardSizes?.join(" / "),s.maxGpuLengthMm&&`${s.maxGpuLengthMm}mm GPU`].filter(Boolean);case"cooler":return[s.coolerType==="aio"?"Liquid AIO":"Air cooler",s.radiatorSizeMm&&`${s.radiatorSizeMm}mm radiator`,s.heightMm&&`${s.heightMm}mm height`].filter(Boolean);case"fans":return[s.sizeMm&&`${s.sizeMm}mm`,s.fanCount?`${s.fanCount}-pack`:"1 fan",s.pwm?"PWM":null,s.argb?"ARGB":null].filter(Boolean);default:return[]}}
function psuRecommendation(){const p=estimatePower({...build,psu:null});return p.estimated?`Power target: ${p.estimated} W estimated load · ${p.minimum} W minimum · ${p.preferred} W preferred PSU headroom.`:"Select the main hardware first and VoltTech will calculate a PSU target."}
function fanCapacity(){const c=build.case;if(!c)return"Select a case first to calculate fan capacity.";const max=Number(c.compatibility?.fanMountCount??c.specs?.fanMountCount??c.compatibility?.maxCaseFans??c.specs?.maxCaseFans??0);if(!max)return"Detailed fan-position capacity is not available for this case yet.";const selected=getSelections(build,"fans").reduce((n,p)=>n+Number(p.specs?.fanCount||1),0),rad=Number(build.cooler?.specs?.radiatorSizeMm||0),reserved=rad?Math.ceil(rad/120):0;return`Approx. fan capacity: ${selected} case fan(s) selected${reserved?` · ${reserved} positions reserved by the ${rad}mm AIO`:""} · ${Math.max(0,max-selected-reserved)} of ${max} positions remain.`}

function renderBuild(){
  e.buildList.innerHTML=CATEGORY_ORDER.map(type=>{const items=getSelections(build,type),optional=!REQUIRED_CATEGORIES.includes(type);if(!items.length)return`<div class="build-item"><div><span>${esc(CATEGORY_LABELS[type])}</span><b>${optional?"Optional":"Not selected"}</b></div></div>`;if(isMultiCategory(type)){const groups=new Map();items.forEach(p=>{const g=groups.get(p.id)||{p,qty:0};g.qty++;groups.set(p.id,g)});const detail=[...groups.values()].map(({p,qty})=>`<div class="build-detail-row"><span>${esc(p.name)}${qty>1?` ×${qty}`:""}</span><b>${esc(getProductPrice(p)?formatMoney(getProductPrice(p)*qty,currency):"Pending")}</b></div>`).join("");return`<details class="build-group" open><summary><span>${esc(CATEGORY_LABELS[type])}</span><b>${esc(getCategorySummary(items,type))}</b></summary><div class="build-details">${detail}</div></details>`}const p=items[0];return`<div class="build-item"><div><span>${esc(CATEGORY_LABELS[type])}</span><b>${esc(p.name)}</b><div class="build-price">${esc(getProductPrice(p)?formatMoney(getProductPrice(p),currency):"Price pending")}</div></div></div>`}).join("");
  const total=calculateBuildTotal(build);e.total.textContent=formatMoney(total,currency);e.mobileTotal.textContent=formatMoney(total,currency);
}
function renderPower(){const p=estimatePower(build);e.power.innerHTML=p.estimated?`<div class="power-title">Power estimate</div><div class="power-grid"><span>Estimated load</span><strong>${p.estimated} W</strong><span>Minimum target</span><strong>${p.minimum} W</strong><span>Preferred headroom</span><strong>${p.preferred} W</strong></div>`:'<div class="power-title">Power estimate</div><div class="power-grid"><span>Estimated load</span><strong>—</strong><span>Recommended PSU</span><strong>—</strong></div>'}
function renderReport(){
  const r=validateBuild(build),count=getSelectedCount(build),completed=getCompletedCategoryCount(build),items=[];if(!count)items.push({type:"good",text:"Start with any component. Compatibility checks update automatically."});else if(r.compatible&&!r.unknowns?.length)items.push({type:"good",text:`No confirmed compatibility conflicts across ${count} selected component${count===1?"":"s"}.`});else if(r.compatible)items.push({type:"unknown",text:`No hard conflict is known, but ${r.unknowns.length} check${r.unknowns.length===1?"":"s"} still need final verification.`});(r.issues||[]).forEach(d=>items.push({type:"bad",d}));(r.warnings||[]).forEach(d=>items.push({type:"warn",d}));(r.unknowns||[]).forEach(d=>items.push({type:"unknown",d}));if(completed===REQUIRED_CATEGORIES.length)items.unshift({type:r.compatible?(r.unknowns?.length?"unknown":"good"):"bad",text:r.compatible?`BUILD COMPLETE ${r.unknowns?.length?"?":"✓"} — Core categories are filled. Preview parts total: ${formatMoney(calculateBuildTotal(build),currency)}.`:"BUILD COMPLETE — Core categories are filled, but a confirmed compatibility conflict still needs to be resolved."});e.report.innerHTML=items.map(item=>{const icon=item.type==="good"?"✓":item.type==="warn"?"⚠":item.type==="unknown"?"?":"✕",text=item.text||textOf(item.d);return`<div class="report-item ${item.type}">${icon} ${esc(text)}${item.d?diagnosticActions(item.d):""}</div>`}).join("");e.report.querySelectorAll("[data-fix-category]").forEach(btn=>btn.addEventListener("click",()=>openCategory(btn.dataset.fixCategory)));
}
function diagnosticActions(d){const cats=[];if(d?.category&&CATEGORY_ORDER.includes(d.category))cats.push(d.category);if(d?.alternateCategory&&CATEGORY_ORDER.includes(d.alternateCategory)&&!cats.includes(d.alternateCategory))cats.push(d.alternateCategory);return cats.length?`<div class="diagnostic-actions">${cats.map(c=>`<button class="diagnostic-action" type="button" data-fix-category="${c}">Change ${esc(CATEGORY_LABELS[c])}</button>`).join("")}</div>`:""}
function updateMobileBar(){e.mobileBar.hidden=e.builderLayout.hidden||getSelectedCount(build)<1}

async function copyBuildSummary(){
  const lines=["VoltTech PC Build Summary"];if(guidedProfile)lines.push(`Profile: ${profileLabel(guidedProfile.useCase)} · ${profileLabel(guidedProfile.target)} · ${profileLabel(guidedProfile.priority)}`);for(const type of CATEGORY_ORDER){const items=getSelections(build,type);if(!items.length)continue;const groups=new Map();items.forEach(p=>{const g=groups.get(p.id)||{p,qty:0};g.qty++;groups.set(p.id,g)});for(const {p,qty} of groups.values()){const price=getProductPrice(p);lines.push(`${CATEGORY_LABELS[type]}: ${p.name}${qty>1?` ×${qty}`:""}${price?` — ${formatMoney(price*qty,currency)}`:""}`)}}lines.push(`Parts total: ${formatMoney(calculateBuildTotal(build),currency)}`);const power=estimatePower(build);if(power.estimated)lines.push(`Power estimate: ${power.estimated} W · ${power.preferred} W preferred PSU target`);lines.push("Preview pricing only — final stock and quotation must be confirmed by VoltTech.");try{await navigator.clipboard.writeText(lines.join("\n"));const old=e.copyBuild.textContent;e.copyBuild.textContent="Copied ✓";setTimeout(()=>e.copyBuild.textContent=old,1500)}catch{await window.VoltTechDialog.message({kicker:"PC BUILDER / SUMMARY",title:"Your build summary",message:"Clipboard access is unavailable on this device. You can select and copy the summary below.",details:lines.join("\n"),confirmText:"Close"})}
}
function esc(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
