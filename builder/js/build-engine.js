export const CATEGORY_ORDER = ["cpu","motherboard","memory","gpu","storage","psu","case","cooler"];

export const CATEGORY_LABELS = {
    cpu:"CPU",
    motherboard:"Motherboard",
    memory:"Memory",
    gpu:"Graphics Card",
    storage:"Storage",
    psu:"Power Supply",
    case:"Case",
    cooler:"CPU Cooler"
};

export function createEmptyBuild(){return{cpu:null,motherboard:null,memory:null,gpu:null,storage:null,psu:null,case:null,cooler:null}}
export function selectProduct(build,product){return{...build,[product.type]:product}}
export function removeProduct(build,type){return{...build,[type]:null}}
export function clearBuild(){return createEmptyBuild()}
export function getProductsByCategory(products,category){return products.filter(product=>product.type===category)}

export function searchProducts(products,query){
    const normalized=String(query||"").trim().toLowerCase();
    if(!normalized)return products;

    return products.filter(product=>[
        product.brand,
        product.name,
        product.model,
        product.mpn,
        product.identifiers?.ean,
        product.identifiers?.gtin,
        product.identifiers?.upc
    ].filter(Boolean).join(" ").toLowerCase().includes(normalized));
}

export function getBestOffer(product){
    const offers=Array.isArray(product?.offers)?product.offers:[];
    if(!offers.length)return null;

    const usable=offers.filter(offer=>
        offer.eligibleForBestPrice!==false &&
        !["out-of-stock","discontinued"].includes(String(offer.stockStatus||"").toLowerCase())
    );

    const fallback=offers.filter(offer=>
        !["out-of-stock","discontinued"].includes(String(offer.stockStatus||"").toLowerCase())
    );

    const candidates=usable.length?usable:fallback.length?fallback:offers;

    return [...candidates].sort((a,b)=>
        offerRank(a)-offerRank(b) ||
        Number(a.price||Infinity)-Number(b.price||Infinity)
    )[0]||null;
}

export function getProductPrice(product){return Number(getBestOffer(product)?.price||0)}

export function calculateBuildTotal(build){
    return Object.values(build).filter(Boolean).reduce(
        (total,product)=>total+getProductPrice(product),0
    );
}

export function formatMoney(value,currency="ZAR"){
    return new Intl.NumberFormat("en-ZA",{
        style:"currency",
        currency,
        maximumFractionDigits:0
    }).format(Number(value||0));
}

export function getSelectedCount(build){return Object.values(build).filter(Boolean).length}

export function getNextCategory(currentCategory,build){
    const currentIndex=CATEGORY_ORDER.indexOf(currentCategory);
    const afterCurrent=CATEGORY_ORDER.slice(Math.max(currentIndex+1,0));
    return afterCurrent.find(category=>!build[category])||
        CATEGORY_ORDER.find(category=>!build[category])||
        currentCategory;
}

export function getFirstIncompleteCategory(build){
    return CATEGORY_ORDER.find(category=>!build[category])||CATEGORY_ORDER[0];
}

export function getCategorySummary(product){
    if(!product)return"Not selected";
    const s=product.specs||{};

    switch(product.type){
        case"cpu":return[s.socket,s.cores?`${s.cores}C/${s.threads}T`:null].filter(Boolean).join(" · ");
        case"motherboard":return[s.chipset,s.formFactor,s.memoryType].filter(Boolean).join(" · ");
        case"memory":return[s.capacityGB?`${s.capacityGB}GB`:null,s.memoryType,s.speedMTs?`${s.speedMTs} MT/s`:null].filter(Boolean).join(" · ");
        case"gpu":return[s.vramGB?`${s.vramGB}GB VRAM`:null,s.lengthMm?`${s.lengthMm}mm`:null].filter(Boolean).join(" · ");
        case"storage":return[s.capacityGB?formatCapacity(s.capacityGB):null,s.interface].filter(Boolean).join(" · ");
        case"psu":return[s.wattage?`${s.wattage}W`:null,s.efficiency].filter(Boolean).join(" · ");
        case"case":return[s.supportedMotherboardSizes?.join("/"),s.maxGpuLengthMm?`${s.maxGpuLengthMm}mm GPU`:null].filter(Boolean).join(" · ");
        case"cooler":return s.coolerType==="aio"?`${s.radiatorSizeMm}mm AIO`:s.heightMm?`${s.heightMm}mm air cooler`:"CPU cooler";
        default:return"";
    }
}

export function getStockLabel(status,freshness=null){
    if(freshness==="stale")return"Supplier data stale";

    switch(String(status||"").toLowerCase()){
        case"in-stock":return freshness==="aging"?"In stock · aging data":"In stock";
        case"supplier-stock":return"Available from supplier";
        case"low-stock":return"Low supplier stock";
        case"available-to-order":return"Available to order";
        case"expected-soon":return"Expected soon";
        case"out-of-stock":return"Out of stock";
        case"discontinued":return"Discontinued";
        default:return"Stock unconfirmed";
    }
}

function offerRank(offer){
    const rank={fresh:0,aging:1,unknown:2,stale:3};
    return rank[offer.freshness]??4;
}

function formatCapacity(capacityGB){
    const gb=Number(capacityGB||0);
    if(gb>=1000){
        const tb=gb/1000;
        return Number.isInteger(tb)?`${tb}TB`:`${tb.toFixed(1)}TB`;
    }
    return`${gb}GB`;
}
