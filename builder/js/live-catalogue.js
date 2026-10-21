// Public store data only. Never load wholesale offers into a customer builder.
export const PART_TYPES = ['cpu','motherboard','memory','gpu','storage','psu','case','cooler','fan'];
const number = v => { const m=String(v??'').match(/\d+(?:\.\d+)?/);return m?Number(m[0]):undefined; };
const sockets = v => [...new Set((String(v||'').toUpperCase().match(/AM[45]|LGA\s*\d{4}/g)||[]).map(s=>s.replace(/\s/g,'')))];
const sizes = v => [...new Set((String(v||'').toUpperCase().match(/E-?ATX|MICRO[- ]?ATX|M-?ATX|MINI[- ]?ITX|ITX|ATX/g)||[]).map(s=>/^(MICRO|M-?ATX)/.test(s)?'mATX':/ITX/.test(s)?'Mini-ITX':/E-?ATX/.test(s)?'E-ATX':'ATX'))];
const positive = v => Number.isFinite(Number(v))&&Number(v)>0;
export function isGamingPart(p) {
 if(!PART_TYPES.includes(p.type)||p.status!=='active'||p.visibility!=='public'||p.is_demo!==false||p.sale_mode==='hidden'||p.currency!=='ZAR'||!positive(p.retail_price)||!positive(p.stock_qty))return false;
 const n=String(p.name||''),kind=String(p.specs?.productKind||'');
 if(/\b(bundle|upgrade kit|barebone|server|workstation memory|registered|ECC|RDIMM)\b/i.test(n))return false;
 if(p.type==='memory')return /DDR[45]/i.test(n+' '+JSON.stringify(p.specs))&&!/SO[- ]?DIMM|notebook|laptop/i.test(n+' '+kind+' '+(p.specs?.['memory-form-factor']||''));
 if(p.type==='gpu')return /RTX\s*[345]\d{3}|RX\s*[6789]\d{3}|Arc\s*[AB]\d{3}/i.test(n)&&!/mobile|laptop/i.test(n);
 if(p.type==='storage')return !/external|portable|USB|NAS|surveillance|enclosure/i.test(n+' '+kind)&&/SSD|NVMe|SATA|hard (drive|disk)/i.test(n+' '+kind);
 if(p.type==='fan')return /case fan|chassis fan/i.test(n+' '+kind)&&!/standing|circulation|desktop air/i.test(n);
 if(p.type==='cpu')return /Ryzen|Core\s*(?:i[3579]|Ultra)/i.test(n)&&!/Threadripper|Xeon|EPYC/i.test(n);
 return true;
}
export function toBuilderProduct(p) {
 const s={...(p.specs||{})},c={...(p.compatibility||{})},n=p.name;
 const set=(key,value)=>{if(s[key]===undefined&&value!==undefined&&value!==null&&value!=='')s[key]=value;};
 const socket=sockets(s.socket||s['cpu-socket']||n)[0];set('socket',socket);
 set('memoryType',(String(s['memory-generation']||s['memory-type']||n).match(/DDR[45]/i)||[])[0]?.toUpperCase());
 if(p.type==='cpu'){
  set('cores',number(s['cpu-cores']||(n.match(/\d+[- ]Core/i)||[])[0]));
  set('threads',number(s['cpu-threads']));
  if(/^(yes|no)$/i.test(s['cooler-included']||''))set('coolerIncluded',/^yes$/i.test(s['cooler-included']));
 }
 if(p.type==='motherboard'){
  set('formFactor',sizes(s['form-factor']||n)[0]);set('chipset',(n.match(/\b[ABHXZ]\d{3}[A-Z]?\b/i)||[])[0]?.toUpperCase());
  set('dimmSlots',number(s['dimm-slots']||s['memory-slots']));set('maxMemoryGB',number(s['max-memory']||s['memory-capacity']));set('m2Slots',number(s['m-two-slots']));
 }
 if(p.type==='memory'){
  const kit=n.match(/(\d+)\s*[x×]\s*(\d+)\s*GB/i);set('modules',kit?Number(kit[1]):1);
  set('capacityGB',kit?Number(kit[1])*Number(kit[2]):number(s['memory-capacity']||(n.match(/\d+\s*GB/i)||[])[0]));
  set('speedMTs',number(s['memory-clock-speed']||(n.match(/\d{4}\s*(?:MHz|MT\/s)/i)||[])[0]));
 }
 if(p.type==='gpu')set('vramGB',number(s['memory-capacity']||(n.match(/\d+\s*GB/i)||[])[0]));
 if(p.type==='storage'){
  const cap=n.match(/(\d+(?:\.\d+)?)\s*(TB|GB)/i);set('capacityGB',cap?Number(cap[1])*(cap[2].toUpperCase()==='TB'?1000:1):undefined);
  if(/NVMe/i.test(n+' '+s.interface))s.interface='NVMe';else if(/SATA/i.test(n+' '+s.interface)&&!/M\.2/i.test(n))s.interface='SATA';
 }
 if(p.type==='psu'){
  set('wattage',number(s['wattage-w']||(n.match(/\d{3,4}\s*W\b/i)||[])[0]));set('efficiency',s['efficiency-rating']||s['psu-energy-efficient']);
  set('pcie8PinConnectors',number(s['pcie-eightsixtwo']));
 }
 if(p.type==='case'){
  const support=sizes(s['motherboard-support']||s.motherboard_support);if(support.length)set('supportedMotherboardSizes',support);
  set('maxGpuLengthMm',number(s['max-gpu-length']||s.max_gpu_length_mm));set('maxCpuCoolerHeightMm',number(s['max-cpu-cooler-height']||s.max_cooler_height_mm));
  const radiators=String(s['radiator-support']||s.radiator_support||'').match(/\b(?:120|140|240|280|360|420)\b/g);if(radiators)set('radiatorSupportMm',[...new Set(radiators.map(Number))]);
 }
 if(p.type==='cooler'){
  const support=sockets(s['socket-support']||s['socket-compatibility']);if(support.length)set('supportedSockets',support);
  set('coolerType',/liquid|AIO/i.test(n+' '+s.productKind)?'aio':/air cooler|heatsink/i.test(n+' '+s.productKind)?'air':undefined);
  if(s.coolerType==='aio')set('radiatorSizeMm',number(s['radiator-size']||(n.match(/\b(?:120|140|240|280|360|420)\s*mm/i)||[])[0]));
 }
 if(p.type==='fan'){set('sizeMm',number(s['fan-size']||(n.match(/\d{2,3}\s*mm/i)||[])[0]));set('fanCount',number(s['fan-count']||(n.match(/\d+\s*pack/i)||[])[0])||1);}
 const age=Date.now()-Date.parse(p.price_checked_at),freshness=!Number.isFinite(age)?'unknown':age<86400000?'fresh':age<7*86400000?'aging':'stale';
 return {...p,type:p.type==='fan'?'fans':p.type,specs:s,compatibility:c,powerWatts:positive(p.power_watts)?Number(p.power_watts):undefined,
 media:p.media||{primaryImage:p.primary_image,directImage:p.direct_image},metadata:{...(p.metadata||{}),liveStore:true},
 offers:[{productId:p.id,supplier:'volttech',supplierName:'VoltTech',supplierSku:p.identifiers?.sku||'',price:Number(p.retail_price),currency:'ZAR',stockStatus:'in-stock',stockQty:Number(p.stock_qty),lastChecked:p.price_checked_at||null,freshness,stale:freshness==='stale',eligibleForBestPrice:true,source:'live-store'}]};
}
export function buildLiveCatalogue(rows){
 const products=rows.filter(isGamingPart).map(toBuilderProduct);
 return {schemaVersion:'live-store-v1',products,currency:'ZAR',offerCount:products.length,supplierCount:1,storeOverlayMatched:products.length,storeOverlayAvailable:rows.length,storeOverlaySource:'live-store',notice:'Current store prices. Assembly, delivery and final compatibility are confirmed in your VoltTech quote.'};
}
