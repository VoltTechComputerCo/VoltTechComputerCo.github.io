export const CATEGORY_ORDER=["cpu","motherboard","memory","gpu","storage","psu","case","cooler"];
export const MULTI_CATEGORIES=new Set(["storage"]);
export const CATEGORY_LABELS={cpu:"CPU",motherboard:"Motherboard",memory:"Memory",gpu:"Graphics Card",storage:"Storage",psu:"Power Supply",case:"Case",cooler:"CPU Cooler"};

export function createEmptyBuild(){return{cpu:null,motherboard:null,memory:null,gpu:null,storage:[],psu:null,case:null,cooler:null}}
export function isMultiCategory(type){return MULTI_CATEGORIES.has(type)}
export function getSelections(build,type){const v=build[type];return isMultiCategory(type)?(Array.isArray(v)?v:[]):(v?[v]:[])}
export function hasCategory(build,type){return getSelections(build,type).length>0}

export function selectProduct(build,product){
    if(isMultiCategory(product.type))return{...build,[product.type]:[...getSelections(build,product.type),product]};
    return{...build,[product.type]:product};
}
export function removeProduct(build,type,productId=null){
    if(isMultiCategory(type)){
        const list=[...getSelections(build,type)];
        if(productId===null)return{...build,[type]:[]};
        const i=list.findIndex(p=>p.id===productId);
        if(i>=0)list.splice(i,1);
        return{...build,[type]:list};
    }
    return{...build,[type]:null};
}
export function clearBuild(){return createEmptyBuild()}
export function getProductsByCategory(products,category){return products.filter(p=>p.type===category)}
export function searchProducts(products,query){
    const q=String(query||"").trim().toLowerCase(); if(!q)return products;
    return products.filter(p=>[p.brand,p.name,p.model,p.mpn,p.identifiers?.ean,p.identifiers?.gtin,p.identifiers?.upc].filter(Boolean).join(" ").toLowerCase().includes(q));
}
export function getBestOffer(product){
    const offers=Array.isArray(product?.offers)?product.offers:[]; if(!offers.length)return null;
    const usable=offers.filter(o=>o.eligibleForBestPrice!==false&&![ "out-of-stock","discontinued"].includes(String(o.stockStatus||"").toLowerCase()));
    const fallback=offers.filter(o=>![ "out-of-stock","discontinued"].includes(String(o.stockStatus||"").toLowerCase()));
    const candidates=usable.length?usable:fallback.length?fallback:offers;
    return [...candidates].sort((a,b)=>offerRank(a)-offerRank(b)||Number(a.price||Infinity)-Number(b.price||Infinity))[0]||null;
}
export function getProductPrice(product){return Number(getBestOffer(product)?.price||0)}
export function calculateBuildTotal(build){return CATEGORY_ORDER.flatMap(c=>getSelections(build,c)).reduce((t,p)=>t+getProductPrice(p),0)}
export function formatMoney(value,currency="ZAR"){return new Intl.NumberFormat("en-ZA",{style:"currency",currency,maximumFractionDigits:0}).format(Number(value||0))}
export function getSelectedCount(build){return CATEGORY_ORDER.reduce((n,c)=>n+getSelections(build,c).length,0)}
export function getCompletedCategoryCount(build){return CATEGORY_ORDER.filter(c=>hasCategory(build,c)).length}
export function getNextCategory(currentCategory,build){
    const i=CATEGORY_ORDER.indexOf(currentCategory);
    return CATEGORY_ORDER.slice(Math.max(i+1,0)).find(c=>!hasCategory(build,c))||CATEGORY_ORDER.find(c=>!hasCategory(build,c))||currentCategory;
}
export function getFirstIncompleteCategory(build){return CATEGORY_ORDER.find(c=>!hasCategory(build,c))||CATEGORY_ORDER[0]}
export function getCategorySummary(value,type=null){
    const list=Array.isArray(value)?value:(value?[value]:[]); if(!list.length)return"Not selected";
    const t=type||list[0].type;
    if(t==="memory"){
        const p=list[0],s=p.specs||{};
        const total=Number(s.capacityGB||0);
        const dimms=Number(s.modules||0);
        const perDimm=total&&dimms?total/dimms:0;
        const config=dimms&&perDimm?`${dimms}×${Number.isInteger(perDimm)?perDimm:perDimm.toFixed(1)}GB`:null;
        return[total?`${total}GB`:null,config,s.memoryType,s.speedMTs?`${s.speedMTs} MT/s`:null].filter(Boolean).join(" · ");
    }
    if(t==="storage"){
        const total=list.reduce((n,p)=>n+Number(p.specs?.capacityGB||0),0);
        return`${formatCapacity(total)} · ${list.length} drive${list.length===1?"":"s"}`;
    }
    const p=list[0],s=p.specs||{};
    switch(t){
        case"cpu":return[s.socket,s.cores?`${s.cores}C/${s.threads}T`:null].filter(Boolean).join(" · ");
        case"motherboard":return[s.chipset,s.formFactor,s.memoryType].filter(Boolean).join(" · ");
        case"gpu":return[s.vramGB?`${s.vramGB}GB VRAM`:null,s.lengthMm?`${s.lengthMm}mm`:null].filter(Boolean).join(" · ");
        case"psu":return[s.wattage?`${s.wattage}W`:null,s.efficiency].filter(Boolean).join(" · ");
        case"case":return[s.supportedMotherboardSizes?.join("/"),s.maxGpuLengthMm?`${s.maxGpuLengthMm}mm GPU`:null].filter(Boolean).join(" · ");
        case"cooler":return s.coolerType==="aio"?`${s.radiatorSizeMm}mm AIO`:s.heightMm?`${s.heightMm}mm air cooler`:"CPU cooler";
        default:return"";
    }
}
export function getStockLabel(status,freshness=null){
    if(freshness==="stale")return"Supplier data stale";
    switch(String(status||"").toLowerCase()){case"in-stock":return freshness==="aging"?"In stock · aging data":"In stock";case"supplier-stock":return"Available from supplier";case"low-stock":return"Low supplier stock";case"available-to-order":return"Available to order";case"expected-soon":return"Expected soon";case"out-of-stock":return"Out of stock";case"discontinued":return"Discontinued";default:return"Stock unconfirmed"}
}
function offerRank(o){return({fresh:0,aging:1,unknown:2,stale:3}[o.freshness]??4)}
function formatCapacity(gb){gb=Number(gb||0);if(gb>=1000){const tb=gb/1000;return Number.isInteger(tb)?`${tb}TB`:`${tb.toFixed(1)}TB`}return`${gb}GB`}
