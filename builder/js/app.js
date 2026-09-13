import {CATEGORY_ORDER,REQUIRED_CATEGORIES,CATEGORY_LABELS,createEmptyBuild,selectProduct,removeProduct,clearBuild,getProductsByCategory,searchProducts,getBestOffer,getProductPrice,calculateBuildTotal,formatMoney,getSelectedCount,getCompletedCategoryCount,getNextCategory,getCategorySummary,getStockLabel,getSelections,hasCategory,isMultiCategory} from "./build-engine.js?v=0.7.7";
import {getCompatibility,validateBuild,estimatePower} from "./compatibility-engine.js?v=0.7.8.1";
import {buildGuidedRecommendation,profileLabel} from "./guided-engine.js?v=1.1";
import {loadCatalogue} from "./data-loader.js?v=0.6";

const e={
    steps:document.getElementById("steps"),
    search:document.getElementById("search"),
    compatibleOnly:document.getElementById("compatible-only"),
    categoryTitle:document.getElementById("category-title"),
    productCount:document.getElementById("product-count"),
    products:document.getElementById("products"),
    buildList:document.getElementById("build-list"),
    total:document.getElementById("total"),
    power:document.getElementById("power"),
    report:document.getElementById("report"),
    clearBuild:document.getElementById("clear-build"),
    catalogueNote:document.getElementById("catalogue-note"),
    modeShell:document.getElementById("mode-shell"),
    guidedPanel:document.getElementById("guided-panel"),
    builderLayout:document.getElementById("builder-layout"),
    chooseGuided:document.getElementById("choose-guided"),
    chooseAdvanced:document.getElementById("choose-advanced"),
    guidedBack:document.getElementById("guided-back"),
    guidedForm:document.getElementById("guided-form"),
    guidedResult:document.getElementById("guided-result"),
    pickerProfile:document.getElementById("picker-profile"),
    copyBuild:document.getElementById("copy-build"),
    changeMode:document.getElementById("change-mode")
};

let catalogue=[],currency="ZAR",activeCategory=CATEGORY_ORDER[0],build=createEmptyBuild(),guidedProfile=null,guidedRecommendation=null;

init();

async function init(){
    bind();
    try{
        const d=await loadCatalogue();
        catalogue=d.products;
        currency=d.currency;
        e.catalogueNote.textContent=`${catalogue.length} prototype products · ${d.offerCount} normalized supplier offers · ${d.supplierCount} supplier feeds · ${d.unmatchedOfferCount} unmatched offers · private preview · v1.1 component intelligence + budget optimizer · temporary pricing and stock only.`;
        render();
    }catch(x){
        console.error(x);
        e.catalogueNote.textContent="Prototype catalogue could not be loaded.";
        e.products.innerHTML='<div class="empty">Could not load the preview catalogue.</div>';
    }
}

function bind(){
    e.chooseGuided?.addEventListener("click",()=>{
        e.modeShell.hidden=true;
        e.builderLayout.hidden=true;
        e.guidedPanel.hidden=false;
        e.guidedResult.hidden=true;
        e.guidedForm.hidden=false;
        e.guidedPanel.scrollIntoView({behavior:"smooth",block:"start"});
    });
    e.chooseAdvanced?.addEventListener("click",()=>{
        guidedProfile=null;
        guidedRecommendation=null;
        updatePickerProfile();
        e.modeShell.hidden=true;
        e.guidedPanel.hidden=true;
        e.builderLayout.hidden=false;
        scrollCatalogueTop();
    });
    e.guidedBack?.addEventListener("click",()=>{
        e.guidedPanel.hidden=true;
        e.builderLayout.hidden=true;
        e.modeShell.hidden=false;
        e.modeShell.scrollIntoView({behavior:"smooth",block:"start"});
    });
    e.guidedForm?.addEventListener("submit",event=>{
        event.preventDefault();
        const data=new FormData(e.guidedForm);
        guidedProfile={
            useCase:data.get("useCase"),
            budget:data.get("budget"),
            target:data.get("target"),
            priority:data.get("priority"),
            fpsTarget:data.get("fpsTarget"),
            storageNeed:data.get("storageNeed")
        };
        guidedRecommendation=buildGuidedRecommendation(guidedProfile,catalogue,currency);
        renderGuidedProfile();
    });
    e.copyBuild?.addEventListener("click",copyBuildSummary);
    e.changeMode?.addEventListener("click",()=>{
        guidedProfile=null;
        guidedRecommendation=null;
        e.builderLayout.hidden=true;
        e.guidedPanel.hidden=true;
        e.modeShell.hidden=false;
        e.modeShell.scrollIntoView({behavior:"smooth",block:"start"});
    });

    e.search.addEventListener("input",renderProducts);
    e.compatibleOnly.addEventListener("change",renderProducts);
    e.clearBuild.addEventListener("click",()=>{
        build=clearBuild();
        activeCategory=CATEGORY_ORDER[0];
        e.search.value="";
        render();
        window.scrollTo({top:0,behavior:"smooth"});
    });
}


function renderGuidedProfile(){
    if(!guidedProfile||!e.guidedResult)return;
    e.guidedForm.hidden=true;
    e.guidedResult.hidden=false;

    if(!guidedRecommendation?.ok){
        e.guidedResult.innerHTML=`<h3>We couldn’t generate this build yet</h3><p>${esc(guidedRecommendation?.message||"The prototype catalogue could not produce a complete recommendation for this profile.")}</p><div class="guided-result-actions"><button type="button" class="flow-btn secondary" id="guided-edit">← Change answers</button></div>`;
        document.getElementById("guided-edit")?.addEventListener("click",()=>{e.guidedResult.hidden=true;e.guidedForm.hidden=false;});
        return;
    }

    const r=guidedRecommendation;
    const budgetClass=r.budgetState==="within"?"Within target":r.budgetState==="under"?"Below target":"Above target";
    const confidence={confirmed:"Compatibility confirmed",review:"Compatible · review notes","needs-data":"Compatible · some data unknown",conflict:"Compatibility conflict"}[r.confidence]||r.confidence;
    const cats=[["cpu","CPU"],["motherboard","Motherboard"],["memory","Memory"],["gpu","Graphics Card"],["case","Case"],["cooler","CPU Cooler"],["psu","Power Supply"],["storage","Storage"]];

    const parts=cats.map(([type,label])=>{
        const p=getSelections(r.build,type)[0]; if(!p)return"";
        const price=getProductPrice(p);
        return `<div class="guided-part"><span class="gp-cat">${esc(label)}</span><div><b>${esc(p.name)}</b><small>${esc(r.reasons[type]||"Compatibility-aware recommendation.")}</small></div><span class="gp-price">${esc(price?formatMoney(price,currency):"Price unavailable")}</span></div>`;
    }).join("");

    e.guidedResult.innerHTML=`
      <h3>Your VoltTech starting build</h3>
      <p>This is a compatible starting point based on your answers. Prices and availability are still preview data, so this is not a final quotation.</p>
      <div class="guided-result-grid">
        <div class="guided-parts">${parts}</div>
        <aside class="guided-side">
          <div class="guided-stat"><span>Parts total</span><strong>${esc(formatMoney(r.total,currency))}</strong><small>${esc(budgetClass)} · selected budget ${esc(r.budget.label)}</small></div>
          <div class="guided-stat"><span>Power</span><strong>${esc(`${r.power.estimated} W`)}</strong><small>Preferred PSU headroom: ${esc(`${r.power.preferred} W`)}</small></div>
          <div class="guided-stat"><span>Optimizer</span><strong style="font-size:14px">${esc(`${r.optimizer?.applied?.length||0} adjustments`)}</strong><small>${esc(`${r.optimizer?.evaluated||0} compatible CPU/GPU upgrade candidates evaluated · internal relative performance data`)}</small></div>
          <div class="guided-stat"><span>Compatibility</span><strong style="font-size:14px">${esc(confidence)}</strong><small>${esc((r.report.issues||[]).length)} conflicts · ${esc((r.report.warnings||[]).length)} attention items · ${esc((r.report.unknowns||[]).length)} unknowns</small></div>
          <div class="guided-notes">${(r.notes||[]).map(n=>`• ${esc(n)}`).join("<br>")}</div>
        </aside>
      </div>
      <div class="guided-result-actions">
        <button type="button" class="flow-btn secondary" id="guided-edit">← Change answers</button>
        <button type="button" class="flow-btn" id="guided-use">Use This Build & Customize →</button>
      </div>`;

    document.getElementById("guided-edit")?.addEventListener("click",()=>{e.guidedResult.hidden=true;e.guidedForm.hidden=false;});
    document.getElementById("guided-use")?.addEventListener("click",()=>{
        build=cloneBuild(r.build); activeCategory=CATEGORY_ORDER[0];
        e.guidedPanel.hidden=true; e.builderLayout.hidden=false; updatePickerProfile(); render(); scrollCatalogueTop();
    });
}

function cloneBuild(source){
    const fresh=createEmptyBuild();
    for(const category of CATEGORY_ORDER){
        const items=getSelections(source,category);
        fresh[category]=isMultiCategory(category)?[...items]:(items[0]||null);
    }
    return fresh;
}

function updatePickerProfile(){
    if(!e.pickerProfile)return;
    if(!guidedProfile){e.pickerProfile.hidden=true;e.pickerProfile.textContent="";return;}
    e.pickerProfile.hidden=false;
    e.pickerProfile.innerHTML=`<b>Your build goal:</b> ${esc(profileLabel(guidedProfile.useCase))} · ${esc(profileLabel(guidedProfile.target))} · ${esc(profileLabel(guidedProfile.priority))} · ${esc(guidedProfile.fpsTarget||"")}+ FPS target. Every part can still be changed manually.`;
}

async function copyBuildSummary(){
    const lines=["VoltTech PC Build Summary"];
    if(guidedProfile)lines.push(`Profile: ${profileLabel(guidedProfile.useCase)} · ${profileLabel(guidedProfile.target)} · ${profileLabel(guidedProfile.priority)}`);
    for(const category of CATEGORY_ORDER){
        const items=getSelections(build,category); if(!items.length)continue;
        const groups=new Map();
        items.forEach(p=>{const g=groups.get(p.id)||{p,qty:0};g.qty++;groups.set(p.id,g);});
        for(const {p,qty} of groups.values()){
            const price=getProductPrice(p);
            lines.push(`${CATEGORY_LABELS[category]}: ${p.name}${qty>1?` ×${qty}`:""}${price?` — ${formatMoney(price*qty,currency)}`:""}`);
        }
    }
    lines.push(`Parts total: ${formatMoney(calculateBuildTotal(build),currency)}`);
    if(guidedRecommendation?.optimizer)lines.push(`Optimizer: ${guidedRecommendation.optimizer.applied.length} adjustments from ${guidedRecommendation.optimizer.evaluated} evaluated upgrade candidates`);
    const power=estimatePower(build); lines.push(`Power estimate: ${power.estimated} W · Preferred PSU headroom ${power.preferred} W`);
    lines.push("Preview pricing only — final availability and quotation must be confirmed by VoltTech.");
    try{await navigator.clipboard.writeText(lines.join("\n"));const old=e.copyBuild.textContent;e.copyBuild.textContent="Copied ✓";setTimeout(()=>e.copyBuild.textContent=old,1600);}
    catch{alert(lines.join("\n"));}
}


function render(){
    updatePickerProfile();
    renderSteps();
    renderProducts();
    renderBuild();
    renderPower();
    renderReport();
}

function renderSteps(){
    e.steps.innerHTML=CATEGORY_ORDER.map((c,i)=>{
        const selected=getSelections(build,c);
        const complete=selected.length>0;
        const cl=["step",c===activeCategory?"active":"",complete?"complete":""].filter(Boolean).join(" ");
        const optional=!REQUIRED_CATEGORIES.includes(c);
        return `<button class="${cl}" type="button" data-category="${c}"><span class="step-index">${complete?"✓":optional?"＋":i+1}</span><span class="step-label"><b>${esc(CATEGORY_LABELS[c])}${optional?" · Optional":""}</b><small>${complete?esc(getCategorySummary(selected,c)):optional?"Add only if needed":"Not selected"}</small></span></button>`;
    }).join("");
    e.steps.querySelectorAll("[data-category]").forEach(b=>b.addEventListener("click",()=>openCategory(b.dataset.category)));
}

function renderProducts(){
    if(!catalogue.length)return;

    e.categoryTitle.textContent=CATEGORY_LABELS[activeCategory];

    const ps=searchProducts(getProductsByCategory(catalogue,activeCategory),e.search.value);
    const evaluated=ps.map(product=>{
        const candidate=resultForCandidate(getCompatibility(product,build),product.type);
        const qty=getSelections(build,product.type).filter(p=>p.id===product.id).length;
        const display=qty?resultForCurrentBuild(product.type):candidate;
        return {product,candidate,display,qty};
    });

    const visible=e.compatibleOnly.checked
        ? evaluated.filter(x=>x.candidate.compatible||x.qty>0)
        : evaluated;

    e.productCount.textContent=`${visible.length} of ${ps.length}`;

    if(!visible.length){
        e.products.innerHTML='<div class="empty">No matching compatible products. Try turning off “Hide incompatible” or changing another component.</div>';
        return;
    }

    const resource=activeCategory==="fans"?fanCapacityInfo():null;
    const psuGuide=activeCategory==="psu"?psuRecommendationInfo():null;
    const coreDone=getCompletedCategoryCount(build)===REQUIRED_CATEGORIES.length;
    const storageReady=activeCategory==="storage"&&getSelections(build,"storage").length>0;
    const storageCue=storageReady
        ? `<div class="resource-note good flow-note"><b>Storage selected ✓</b><br>Add another drive if you need one, or continue when you’re happy with the storage setup.<button type="button" class="flow-btn" data-flow-next="fans">Continue to Case Fans →</button></div>`
        : "";
    const completionCue=activeCategory==="fans"&&coreDone
        ? `<div class="resource-note good flow-note"><b>Core build complete ✓</b><br>Case fans are optional. Add them if needed, or review the finished build now.<button type="button" class="flow-btn" data-flow-review>Review Final Build ↓</button></div>`
        : "";
    const banner=resource?`<div class="resource-note ${resource.tone}">${esc(resource.text)}</div>`:"";
    const psuBanner=psuGuide?`<div class="resource-note good"><b>Power supply recommendation</b><br>${esc(psuGuide.text)}</div>`:"";
    e.products.innerHTML=psuBanner+storageCue+completionCue+banner+visible.map(x=>card(x.product,x.display,x.candidate,x.qty)).join("");

    e.products.querySelectorAll("[data-flow-next]").forEach(button=>button.addEventListener("click",()=>{
        openCategory(button.dataset.flowNext);
    }));
    e.products.querySelectorAll("[data-flow-review]").forEach(button=>button.addEventListener("click",()=>{
        scrollDone();
    }));

    e.products.querySelectorAll("[data-select-product]").forEach(button=>button.addEventListener("click",()=>{
        const product=catalogue.find(x=>x.id===button.dataset.selectProduct);
        if(!product)return;

        const multi=isMultiCategory(product.type);
        const selectedCount=getSelections(build,product.type).filter(p=>p.id===product.id).length;

        if(!multi && selectedCount){
            build=removeProduct(build,product.type,product.id);
            render();
            return;
        }

        const relevant=resultForCandidate(getCompatibility(product,build),product.type);
        if(!relevant.compatible)return;

        const wasDone=getCompletedCategoryCount(build)===REQUIRED_CATEGORIES.length;
        build=selectProduct(build,product);
        const done=getCompletedCategoryCount(build)===REQUIRED_CATEGORIES.length;
        const justCompleted=!wasDone&&done;

        if(!multi && !done){
            activeCategory=getNextCategory(product.type,build);
        }

        e.search.value="";
        render();

        if(product.type==="storage"){
            scrollCatalogueTop();
        }else if(justCompleted&&product.type!=="fans"){
            activeCategory="storage";
            render();
            scrollCatalogueTop();
        }else if(done && !multi){
            scrollDone();
        }else if(!multi){
            scrollCatalogueTop();
        }
    }));

    e.products.querySelectorAll("[data-remove-product]").forEach(button=>button.addEventListener("click",()=>{
        const type=button.dataset.productType||activeCategory;
        build=removeProduct(build,type,button.dataset.removeProduct);
        render();
    }));
}

function resultForCandidate(result,category){
    const relevant=x=>x && (x.category===category||x.alternateCategory===category);
    const issues=(result.issues||[]).filter(relevant);
    const warnings=(result.warnings||[]).filter(relevant);
    const unknowns=(result.unknowns||[]).filter(relevant);

    return {
        compatible:issues.length===0,
        confirmed:issues.length===0&&unknowns.length===0,
        status:issues.length?"incompatible":unknowns.length?"unknown":warnings.length?"warning":"compatible",
        issues,
        warnings,
        unknowns
    };
}

function resultForCurrentBuild(category){
    return resultForCandidate(validateBuild(build),category);
}

function fanCapacityInfo(){
    const pcCase=build.case;
    if(!pcCase)return {text:"Select a case to calculate available fan positions.",tone:"neutral"};
    const max=Number(pcCase.compatibility?.fanMountCount ?? pcCase.specs?.fanMountCount ?? pcCase.compatibility?.maxCaseFans ?? pcCase.specs?.maxCaseFans ?? 0);
    if(!max)return {text:"Fan-position capacity is not available for this case yet.",tone:"neutral"};
    const selected=getSelections(build,"fans").reduce((n,p)=>n+Number(p.specs?.fanCount||1),0);
    const radiator=Number(build.cooler?.specs?.radiatorSizeMm||0);
    const reserved=radiator?Math.ceil(radiator/120):0;
    const remaining=Math.max(0,max-reserved-selected);
    const aio=reserved?` · ${reserved} position${reserved===1?"":"s"} reserved by ${radiator}mm AIO`:"";
    return {
        text:`Approx. fan capacity: ${selected} case fan${selected===1?"":"s"} selected${aio} · ${remaining} of ${max} position${max===1?"":"s"} still available.`,
        tone:remaining===0?"full":"good"
    };
}



function psuRecommendationInfo(){
    const power=estimatePower({...build,psu:null});
    if(!power.estimated)return {text:"Select the main system components first to calculate PSU requirements."};
    return {
        text:`Current system estimate: ${power.estimated} W load · ${power.minimum} W minimum target · ${power.preferred} W preferred headroom. Choose a PSU at or above the preferred target where practical.`
    };
}

function addLimitMessage(product){
    if(product.type==="storage"){
        const board=build.motherboard;
        if(!board)return "No additional drive can be added with the current build.";

        const current=getSelections(build,"storage");
        const kind=product.compatibility?.interface||product.specs?.interface;

        if(kind==="NVMe"){
            const used=current.filter(p=>(p.compatibility?.interface||p.specs?.interface)==="NVMe").length;
            const max=Number(board.compatibility?.m2Slots ?? board.specs?.m2Slots ?? 0);
            if(max){
                if(used>=max)return `Limit reached: ${used} of ${max} M.2 slot${max===1?"":"s"} ${max===1?"is":"are"} already in use.`;
                return `This drive would exceed the motherboard limit: ${used} of ${max} M.2 slots are currently in use, so only ${Math.max(0,max-used)} remain${max-used===1?"s":""}.`;
            }
        }

        if(kind==="SATA"){
            const used=current.filter(p=>(p.compatibility?.interface||p.specs?.interface)==="SATA").length;
            const max=Number(board.compatibility?.sataPorts ?? board.specs?.sataPorts ?? 0);
            if(max){
                if(used>=max)return `Limit reached: ${used} of ${max} SATA port${max===1?"":"s"} ${max===1?"is":"are"} already in use.`;
                return `This drive would exceed the motherboard limit: ${used} of ${max} SATA ports are currently in use, so only ${Math.max(0,max-used)} remain.`;
            }
        }
    }

    if(product.type==="fans"){
        const pcCase=build.case;
        if(!pcCase)return "Select a case before adding case fans.";

        const max=Number(pcCase.compatibility?.fanMountCount ?? pcCase.specs?.fanMountCount ?? pcCase.compatibility?.maxCaseFans ?? pcCase.specs?.maxCaseFans ?? 0);
        if(max){
            const selected=getSelections(build,"fans").reduce((n,p)=>n+Number(p.specs?.fanCount||1),0);
            const radiator=Number(build.cooler?.specs?.radiatorSizeMm||0);
            const reserved=radiator?Math.ceil(radiator/120):0;
            const used=selected+reserved;
            const remain=Math.max(0,max-used);
            const pack=Number(product.specs?.fanCount||1);

            if(remain<=0){
                const aioText=reserved?` (${reserved} reserved by the ${radiator}mm AIO)`:"";
                return `Fan capacity reached — all ${max} case-fan positions are already allocated${aioText}.`;
            }

            if(pack>remain){
                const aioText=reserved?` The ${radiator}mm AIO reserves ${reserved} position${reserved===1?"":"s"}.`:"";
                const indiv=remain===1
                    ? `You can still add 1 individual compatible fan.`
                    : `You can still add up to ${remain} individual compatible fans.`;
                return `Cannot add another ${pack}-fan pack — only ${remain} of ${max} fan positions remain. ${indiv}${aioText}`;
            }
        }
    }

    return "No additional unit can be added with the current build.";
}

function openCategory(c){
    if(!CATEGORY_ORDER.includes(c))return;
    activeCategory=c;
    e.search.value="";
    renderSteps();
    renderProducts();
    scrollCatalogueTop();
}

function scrollCatalogueTop(){
    requestAnimationFrame(()=>requestAnimationFrame(()=>setTimeout(()=>{
        const target=document.querySelector(".catalogue");
        if(!target)return;

        const topbar=document.querySelector(".topbar");
        const offset=(topbar?.getBoundingClientRect().height||0)+10;
        const top=window.scrollY+target.getBoundingClientRect().top-offset;

        window.scrollTo({top:Math.max(0,top),behavior:"smooth"});
    },60)));
}

function scrollDone(){
    requestAnimationFrame(()=>requestAnimationFrame(()=>setTimeout(()=>{
        e.total?.scrollIntoView({behavior:"smooth",block:"center"});
    },120)));
}

function textOf(x){
    return x?.text||String(x);
}

function card(p,displayResult,candidateResult,qty=0){
    const o=getBestOffer(p);
    const sel=qty>0;
    const multi=isMultiCategory(p.type);
    const meta=metaOf(p).map(x=>`<span class="meta">${esc(x)}</span>`).join("");
    const issues=displayResult.issues.map(x=>`<div class="product-error">✕ ${esc(textOf(x))}</div>`).join("");
    const warnings=displayResult.warnings.map(x=>`<div class="product-warning">⚠ ${esc(textOf(x))}</div>`).join("");
    const unknowns=displayResult.unknowns.map(x=>`<div class="product-unknown">? ${esc(textOf(x))}</div>`).join("");
    const price=o?formatMoney(o.price,currency):"Price unavailable";
    const supplier=o?`${o.supplierName||o.source} · ${getStockLabel(o.stockStatus,o.freshness)}`:"No supplier offer";
    const cardIncompatible=!sel&&!candidateResult.compatible;
    const addBlocked=multi&&!candidateResult.compatible;
    const addIssue=addBlocked?addLimitMessage(p):"";

    let controls="";
    if(multi&&sel){
        const selectedLabel=p.type==="fans"
            ? `Selected ×${qty} · ${qty*Number(p.specs?.fanCount||1)} fan${qty*Number(p.specs?.fanCount||1)===1?"":"s"} total`
            : p.type==="storage"
                ? `Selected ×${qty} drive${qty===1?"":"s"}`
                : `Selected ×${qty}`;
        controls=`<div class="qty-wrap"><div class="qty-label">${esc(selectedLabel)}</div><div class="qty-control"><button type="button" aria-label="Remove one ${esc(p.name)}" data-remove-product="${esc(p.id)}" data-product-type="${esc(p.type)}">−</button><span>${qty}</span><button type="button" aria-label="Add another ${esc(p.name)}" data-select-product="${esc(p.id)}" ${addBlocked?"disabled":""}>＋</button></div>${addBlocked?`<div class="limit-note">${esc(addIssue)}</div>`:""}</div>`;
    }else{
        controls=`<button type="button" class="select-btn" data-select-product="${esc(p.id)}" ${!candidateResult.compatible?"disabled":""}>${candidateResult.compatible?(multi?"Add":"Select"):"Incompatible"}</button>`;
    }

    return `<article class="product ${sel?"selected":""} ${cardIncompatible?"incompatible":""}"><div class="product-main"><span class="product-brand">${esc(p.brand||"")}</span><h3>${esc(p.name)}</h3><div class="product-meta">${meta}</div>${issues}${warnings}${unknowns}</div><div class="product-side"><div class="price">${esc(price)}</div><div class="supplier">${esc(supplier)}</div>${controls}</div></article>`;
}

function renderBuild(){
    e.buildList.innerHTML=CATEGORY_ORDER.map(c=>{
        const items=getSelections(build,c);
        const optional=!REQUIRED_CATEGORIES.includes(c);
        if(!items.length)return `<div class="build-item"><span>${esc(CATEGORY_LABELS[c])}</span><b>${optional?"Optional":"Not selected"}</b></div>`;

        if(isMultiCategory(c)){
            const groups=new Map();
            items.forEach(p=>{
                const g=groups.get(p.id)||{product:p,qty:0};
                g.qty++;
                groups.set(p.id,g);
            });
            const details=[...groups.values()].map(({product,qty})=>{
                const each=getProductPrice(product);
                const price=each?formatMoney(each*qty,currency):"Price unavailable";
                return `<div class="build-detail-row"><span>${esc(product.name)}${qty>1?` ×${qty}`:""}</span><b>${esc(price)}</b></div>`;
            }).join("");
            return `<details class="build-group" open><summary><span>${esc(CATEGORY_LABELS[c])}</span><b>${esc(getCategorySummary(items,c))}</b></summary><div class="build-details">${details}</div></details>`;
        }

        const p=items[0];
        return `<div class="build-item"><div><span>${esc(CATEGORY_LABELS[c])}</span><b>${esc(p.name)}</b><div class="build-price">${esc(getProductPrice(p)?formatMoney(getProductPrice(p),currency):"Price unavailable")}</div></div></div>`;
    }).join("");
    e.total.textContent=formatMoney(calculateBuildTotal(build),currency);
}

function renderPower(){
    const p=estimatePower(build);
    e.power.innerHTML=p.estimated
        ? `<div class="power-title">Power estimate</div><div class="power-grid"><span>Estimated load</span><strong>${p.estimated} W</strong><span>Minimum target</span><strong>${p.minimum} W</strong><span>Preferred headroom</span><strong>${p.preferred} W</strong></div>`
        : '<div class="power-title">Power estimate</div><div class="power-grid"><span>Estimated load</span><strong>—</strong><span>Recommended PSU</span><strong>—</strong></div>';
}

function renderReport(){
    const r=validateBuild(build);
    const n=getSelectedCount(build);
    const completed=getCompletedCategoryCount(build);
    const a=[];

    if(!n){
        a.push({type:"good",text:"Start by selecting a component. Compatibility checks will update automatically."});
    }else if(r.compatible&&r.unknowns.length===0){
        a.push({type:"good",text:`No confirmed compatibility conflicts found across ${n} selected component${n===1?"":"s"}.`});
    }else if(r.compatible&&r.unknowns.length){
        a.push({type:"unknown",text:`No hard conflict is known, but ${r.unknowns.length} compatibility check${r.unknowns.length===1?"":"s"} still need better product data before this build can be called fully confirmed.`});
    }

    r.issues.forEach(x=>a.push({type:"bad",diagnostic:x}));
    r.warnings.forEach(x=>a.push({type:"warn",diagnostic:x}));
    r.unknowns.forEach(x=>a.push({type:"unknown",diagnostic:x}));

    if(completed===REQUIRED_CATEGORIES.length){
        if(!r.compatible){
            a.unshift({type:"bad",text:"BUILD COMPLETE — All required component categories are filled, but confirmed compatibility issues still need to be resolved."});
        }else if(r.unknowns.length){
            a.unshift({type:"unknown",text:`BUILD COMPLETE ? — All required core categories are filled with no confirmed hard conflict, but ${r.unknowns.length} compatibility check${r.unknowns.length===1?" is":"s are"} still unconfirmed. Current prototype parts total: ${formatMoney(calculateBuildTotal(build),currency)}.`});
        }else{
            a.unshift({type:"good",text:`BUILD COMPLETE ✓ — All required core components are selected and no confirmed compatibility conflicts were found. Case fans are optional. Current prototype parts total: ${formatMoney(calculateBuildTotal(build),currency)}.`});
        }
    }

    e.report.innerHTML=a.map(renderReportItem).join("");
    e.report.querySelectorAll("[data-fix-category]").forEach(btn=>btn.addEventListener("click",()=>openCategory(btn.dataset.fixCategory)));
}

function renderReportItem(item){
    const d=item.diagnostic;
    const text=item.text||textOf(d);
    const icon=item.type==="good"?"✓":item.type==="warn"?"⚠":item.type==="unknown"?"?":"✕";
    const actions=d?diagnosticActions(d):"";
    return `<div class="report-item ${item.type}">${icon} ${esc(text)}${actions}</div>`;
}

function diagnosticActions(d){
    const cats=[];
    if(d?.category&&CATEGORY_ORDER.includes(d.category))cats.push(d.category);
    if(d?.alternateCategory&&CATEGORY_ORDER.includes(d.alternateCategory)&&!cats.includes(d.alternateCategory))cats.push(d.alternateCategory);
    if(!cats.length)return"";

    return `<div class="diagnostic-actions">${cats.map(c=>`<button type="button" class="diagnostic-action" data-fix-category="${esc(c)}">Change ${esc(CATEGORY_LABELS[c])}</button>`).join("")}</div>`;
}

function metaOf(p){
    const s=p.specs||{};
    switch(p.type){
        case"cpu":
            return[s.socket,s.cores?`${s.cores} cores`:null,s.threads?`${s.threads} threads`:null,s.tdpWatts?`${s.tdpWatts}W TDP`:null].filter(Boolean);
        case"motherboard":
            return[s.socket,s.chipset,s.formFactor,s.memoryType,s.wifi?"Wi-Fi":null].filter(Boolean);
        case"memory":{
            const modules=Number(s.modules||0);
            const capacity=Number(s.capacityGB||0);
            const perDimm=modules&&capacity?capacity/modules:0;
            const config=modules&&perDimm?`${modules}×${Number.isInteger(perDimm)?perDimm:perDimm.toFixed(1)}GB`:null;
            return[capacity?`${capacity}GB`:null,config,s.memoryType,s.speedMTs?`${s.speedMTs} MT/s`:null].filter(Boolean);
        }
        case"gpu":
            return[s.vramGB?`${s.vramGB}GB VRAM`:null,s.lengthMm?`${s.lengthMm}mm`:null,s.slots?`${s.slots}-slot`:null,s.recommendedPsuWatts?`${s.recommendedPsuWatts}W PSU`:null].filter(Boolean);
        case"storage":
            return[s.capacityGB?(s.capacityGB>=1000?`${s.capacityGB/1000}TB`:`${s.capacityGB}GB`):null,s.interface,s.formFactor,s.pcieGeneration?`PCIe ${s.pcieGeneration}.0`:null].filter(Boolean);
        case"psu":
            return[s.wattage?`${s.wattage}W`:null,s.efficiency,s.modular,s.atxVersion].filter(Boolean);
        case"case":
            return[s.supportedMotherboardSizes?.join(" / "),s.maxGpuLengthMm?`${s.maxGpuLengthMm}mm GPU`:null,s.maxCpuCoolerHeightMm?`${s.maxCpuCoolerHeightMm}mm cooler`:null].filter(Boolean);
        case"cooler":
            return[s.coolerType==="aio"?"Liquid AIO":"Air cooler",s.radiatorSizeMm?`${s.radiatorSizeMm}mm radiator`:null,s.heightMm?`${s.heightMm}mm height`:null].filter(Boolean);
        case"fans":
            return[s.sizeMm?`${s.sizeMm}mm`:null,s.fanCount?`${s.fanCount}-pack`:"1 fan",s.pwm?"PWM":null,s.argb?"ARGB":null].filter(Boolean);
        default:
            return[];
    }
}

function esc(v){
    return String(v??"")
        .replaceAll("&","&amp;")
        .replaceAll("<","&lt;")
        .replaceAll(">","&gt;")
        .replaceAll('"',"&quot;")
        .replaceAll("'","&#039;");
}
