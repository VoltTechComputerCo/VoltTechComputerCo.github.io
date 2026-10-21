// Only anonymous, public product fields are present in this CDN snapshot.
const snapshotUrl=new URL('../../data/catalogue.json.gz',import.meta.url);
// Rotate the CDN cache key with the catalogue refresh interval.
snapshotUrl.searchParams.set('v',String(Math.floor(Date.now()/900000)));
const fresh=payload=>payload?.schemaVersion===1&&Array.isArray(payload.products)&&payload.settings&&Number.isFinite(Date.parse(payload.generatedAt))&&Date.now()-Date.parse(payload.generatedAt)>=-60000&&Date.now()-Date.parse(payload.generatedAt)<45*60000;
let pending;
export function readPublicCatalogue(request=fetch){
 if(!pending)pending=(async()=>{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),3000);
  try{
   const response=await request(snapshotUrl,{signal:controller.signal});
   if(!response.ok)return null;
   const bytes=await response.arrayBuffer();
   const magic=new Uint8Array(bytes,0,Math.min(2,bytes.byteLength));
   const decoded=magic[0]===31&&magic[1]===139?new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))):new Response(bytes);
   const payload=await decoded.json();
   return fresh(payload)?payload:null;
  }catch{return null;}finally{clearTimeout(timer);}
 })();
 return pending;
}
