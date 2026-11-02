import { excludedCatalogueIds } from './catalogue-exclusions.js?v=20261102-gpu3';
// Only anonymous, public product fields are present in this CDN snapshot.
// Accept a snapshot for up to 10 hours: publisher runs several hours apart.
// Checkout still confirms stock and current prices before payment.
const snapshotUrl=new URL('../../data/catalogue.json.gz',import.meta.url);
// CDN cache key refreshes every 15 minutes independently of the 2-hour publisher;
// this avoids stale CDN hits when GitHub Actions publishes a delayed snapshot.
snapshotUrl.searchParams.set('v',String(Math.floor(Date.now()/900000)));
const valid=payload=>payload?.schemaVersion===1&&Array.isArray(payload.products)&&payload.settings&&Number.isFinite(Date.parse(payload.generatedAt))&&Date.now()-Date.parse(payload.generatedAt)>=-60000;
// The normal store only accepts reasonably fresh pricing and stock.
// Emergency browsing may use an older public snapshot, with all prices and stock hidden.
const fresh=payload=>valid(payload)&&Date.now()-Date.parse(payload.generatedAt)<10*60*60*1000;
let pending;
export function readPublicCatalogue(request=fetch,allowStale=false){
 if(!pending)pending=(async()=>{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),3000);
  try{
   const response=await request(snapshotUrl,{signal:controller.signal});
   if(!response.ok)return null;
   const bytes=await response.arrayBuffer();
   const magic=new Uint8Array(bytes,0,Math.min(2,bytes.byteLength));
   const decoded=magic[0]===31&&magic[1]===139?new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))):new Response(bytes);
   const payload=await decoded.json();
   if(valid(payload))payload.products=payload.products.filter(product=>!excludedCatalogueIds.has(product?.id));
   return valid(payload)?payload:null;
  }catch{return null;}finally{clearTimeout(timer);}
 })();
 return pending.then(payload=>payload&&(allowStale||fresh(payload))?payload:null);
}
