import {CATEGORY_ORDER,CATEGORY_LABELS,createEmptyBuild,selectProduct,removeProduct,clearBuild,getProductsByCategory,searchProducts,getBestOffer,getProductPrice,calculateBuildTotal,formatMoney,getSelectedCount,getNextCategory,getCategorySummary,getStockLabel} from "./build-engine.js?v=0.6";
import {getCompatibility,validateBuild,estimatePower} from "./compatibility-engine.js?v=0.6.1";
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
    catalogueNote:document.getElementById("catalogue-note")
};

let catalogue=[],currency="ZAR",activeCategory=CATEGORY_ORDER[0],build=createEmptyBuild();

init();

async function init(){
    bind();
    try{
        const d=await loadCatalogue();
        catalogue=d.products;
        currency=d.currency;
        e.catalogueNote.textContent=`${catalogue.length} prototype products · ${d.offerCount} normalized supplier offers · ${d.supplierCount} supplier feeds · ${d.unmatchedOfferCount} unmatched offers · v0.6.1 diagnostics/scroll fix · test pricing and stock only.`;
        render();
    }catch(x){
        console.error(x);
        e.catalogueNote.textContent="Prototype catalogue could not be loaded.";
        e.products.innerHTML='<div class="empty">Could not load v0.6 catalogue data.</div>';
    }
}

function bind(){
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

function render(){
    renderSteps();
    renderProducts();
    renderBuild();
    renderPower();
    renderReport();
}

function renderSteps(){
    e.steps.innerHTML=CATEGORY_ORDER.map((c,i)=>{
        const p=build[c];
        const cl=["step",c===activeCategory?"active":"",p?"complete":""].filter(Boolean).join(" ");
        return `<button class="${cl}" type="button" data-category="${c}"><span class="step-index">${p?"✓":i+1}</span><span class="step-label"><b>${esc(CATEGORY_LABELS[c])}</b><small>${p?esc(getCategorySummary(p)):"Not selected"}</small></span></button>`;
    }).join("");
    e.steps.querySelectorAll("[data-category]").forEach(b=>b.addEventListener("click",()=>openCategory(b.dataset.category)));
}

function renderProducts(){
    if(!catalogue.length)return;

    e.categoryTitle.textContent=CATEGORY_LABELS[activeCategory];

    const ps=searchProducts(getProductsByCategory(catalogue,activeCategory),e.search.value);
    const evaluated=ps.map(product=>{
        const full=getCompatibility(product,build);
        return {product,result:resultForCandidate(full,product.type)};
    });

    const visible=e.compatibleOnly.checked
        ? evaluated.filter(x=>x.result.compatible||build[activeCategory]?.id===x.product.id)
        : evaluated;

    e.productCount.textContent=`${visible.length} of ${ps.length}`;

    if(!visible.length){
        e.products.innerHTML='<div class="empty">No matching compatible products. Try turning off “Hide incompatible” or changing another component.</div>';
        return;
    }

    e.products.innerHTML=visible.map(({product,result})=>card(product,result)).join("");

    e.products.querySelectorAll("[data-select-product]").forEach(button=>button.addEventListener("click",()=>{
        const product=catalogue.find(x=>x.id===button.dataset.selectProduct);
        if(!product)return;

        if(build[product.type]?.id===product.id){
            build=removeProduct(build,product.type);
            render();
            return;
        }

        const full=getCompatibility(product,build);
        const relevant=resultForCandidate(full,product.type);
        if(!relevant.compatible)return;

        build=selectProduct(build,product);
        const done=getSelectedCount(build)===CATEGORY_ORDER.length;

        if(!done){
            activeCategory=getNextCategory(product.type,build);
        }

        e.search.value="";
        render();

        if(done){
            scrollDone();
        }else{
            scrollCatalogueTop();
        }
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

function card(p,r){
    const o=getBestOffer(p);
    const sel=build[p.type]?.id===p.id;
    const meta=metaOf(p).map(x=>`<span class="meta">${esc(x)}</span>`).join("");
    const issues=r.issues.map(x=>`<div class="product-error">✕ ${esc(textOf(x))}</div>`).join("");
    const warnings=r.warnings.map(x=>`<div class="product-warning">⚠ ${esc(textOf(x))}</div>`).join("");
    const unknowns=r.unknowns.map(x=>`<div class="product-unknown">? ${esc(textOf(x))}</div>`).join("");
    const price=o?formatMoney(o.price,currency):"Price unavailable";
    const supplier=o?`${o.supplierName||o.source} · ${getStockLabel(o.stockStatus,o.freshness)}`:"No supplier offer";

    return `<article class="product ${sel?"selected":""} ${!r.compatible?"incompatible":""}"><div class="product-main"><span class="product-brand">${esc(p.brand||"")}</span><h3>${esc(p.name)}</h3><div class="product-meta">${meta}</div>${issues}${warnings}${unknowns}</div><div class="product-side"><div class="price">${esc(price)}</div><div class="supplier">${esc(supplier)}</div><button type="button" class="select-btn ${sel?"remove":""}" data-select-product="${esc(p.id)}" ${!r.compatible&&!sel?"disabled":""}>${sel?"Remove":r.compatible?"Select":"Incompatible"}</button></div></article>`;
}

function renderBuild(){
    e.buildList.innerHTML=CATEGORY_ORDER.map(c=>{
        const p=build[c];
        return p
            ? `<div class="build-item"><div><span>${esc(CATEGORY_LABELS[c])}</span><div class="build-price">${esc(formatMoney(getProductPrice(p),currency))}</div></div><b>${esc(p.name)}</b></div>`
            : `<div class="build-item"><span>${esc(CATEGORY_LABELS[c])}</span><b>Not selected</b></div>`;
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

    if(n===CATEGORY_ORDER.length){
        if(!r.compatible){
            a.unshift({type:"bad",text:"BUILD COMPLETE — All component categories are filled, but confirmed compatibility issues still need to be resolved."});
        }else if(r.unknowns.length){
            a.unshift({type:"unknown",text:`BUILD COMPLETE ? — All core categories are filled with no confirmed hard conflict, but ${r.unknowns.length} compatibility check${r.unknowns.length===1?" is":"s are"} still unconfirmed. Current prototype parts total: ${formatMoney(calculateBuildTotal(build),currency)}.`});
        }else{
            a.unshift({type:"good",text:`BUILD COMPLETE ✓ — All core components are selected and no confirmed compatibility conflicts were found. Current prototype parts total: ${formatMoney(calculateBuildTotal(build),currency)}.`});
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
        case"memory":
            return[s.capacityGB?`${s.capacityGB}GB`:null,s.modules?`${s.modules} modules`:null,s.memoryType,s.speedMTs?`${s.speedMTs} MT/s`:null].filter(Boolean);
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
