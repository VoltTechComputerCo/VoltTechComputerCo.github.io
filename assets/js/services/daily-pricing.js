export const dailyPriceNotice='RAM, storage and GPU prices can change daily. Quotes containing these items are valid for one day from issue. After expiry, prices and stock must be reconfirmed before payment.';
export function hasDailyPricedItems(items){return items.some(p=>{
 const type=String(p.type||p.category_slug||'').toLowerCase();
 if(type)return ['gpu','memory','storage'].includes(type);
 const name=String(p.description||p.name||'');
 return !/heatsink|water.?block|enclosure|adapter|cooler/i.test(name)&&/\b(?:RAM|DDR[345]|SSD|NVMe|HDD|GPU|RTX|GTX|GeForce|Radeon)\b|hard[ -]?drive|graphics card/i.test(name);
});}
