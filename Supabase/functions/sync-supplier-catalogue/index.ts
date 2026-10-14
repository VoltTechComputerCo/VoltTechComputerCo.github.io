import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { systemKind } from "./system-classification.js";
import { gamingProductAllowed } from "./gaming-policy.js";

const VAT=1.15;
const TARSUS_URL="https://feedgen.tarsusonline.co.za/api/DataFeed/Customer-ProductCatalogue";
const ORIGINS=new Set(["https://volttechcomputerco.co.za","https://www.volttechcomputerco.co.za","https://volttechcomputerco.github.io"]);

function cors(origin:string|null){const allowed=origin&&ORIGINS.has(origin)?origin:"https://volttechcomputerco.co.za";return{"Access-Control-Allow-Origin":allowed,"Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin","Content-Type":"application/json"}}
function reply(body:unknown,status=200,origin:string|null=null){return new Response(JSON.stringify(body),{status,headers:cors(origin)})}
function txt(v:unknown){return String(v??"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim()}
function num(v:unknown){if(v===null||v===undefined||typeof v==="boolean"||v===""||v==="N/A")return null;const n=Number(v);return Number.isFinite(n)?n:null}
function positive(v:unknown){const n=num(v);return n!==null&&n>0?n:null}
function cleanId(v:unknown){return String(v??"").trim().toUpperCase().replace(/\s+/g,"")}
function stockStatus(q:number){return q<=0?"out-of-stock":q<=2?"low-stock":"in-stock"}

function laptopProduct(name:string,category:string){
 return systemKind(name,category)==="laptop";
}
function laptopSpecs(name:string,attrs:any={}){
 const text=String(name||""),gaming=/gaming|geforce|rtx\s*\d|rog|tuf gaming|legion|\bloq\b|katana|cyborg|predator|nitro|omen|victus|alienware|raider|stealth|pulse|sword/.test(text.toLowerCase()),specs:any={laptopPurpose:gaming?"Gaming":"Work & everyday",useCase:gaming?"Gaming & creator":"Office"};
 const pick=(...keys:string[])=>keys.map(k=>attrs[k]).find(v=>v!==null&&v!==undefined&&v!=="");
 const cpu=pick("processor","cpu","processor-model")||text.match(/(?:Intel\s*)?(?:Core\s+(?:Ultra\s+\d+\s*\w*|i[3579][ -]*\d*\w*)|Ryzen\s+[3579]\s*\w*)/i)?.[0];
 const ram=pick("ram","memory","memory-capacity")||text.match(/\b(\d+)\s*GB\s*(?:DDR[345]|RAM)/i)?.[0];
 const storage=pick("storage","ssd","storage-capacity")||text.match(/\b\d+(?:\.\d+)?\s*(?:GB|TB)\s*(?:SSD|NVMe|HDD)/i)?.[0];
 const screen=pick("screen-size","display-size")||text.match(/\b1[0-9](?:\.\d+)?\s*(?:inch|["″])/i)?.[0];
 const os=pick("operating-system","operating_system","os")||text.match(/Windows\s*(?:10|11)(?:\s*(?:Pro|Home))?|ChromeOS|macOS|FreeDOS/gi)?.[0];
 if(cpu)specs.laptopProcessor=txt(cpu);if(ram){const gb=String(ram).match(/(\d+)\s*GB/i);if(gb)specs.ramGB=Number(gb[1]);}if(storage)specs.storageCapacity=txt(storage);if(screen){const inches=String(screen).match(/\d+(?:\.\d+)?/);if(inches)specs.screenSize=Number(inches[0]);}if(os)specs.operatingSystem=txt(os);
 const gpu=pick("graphics","graphics-card","gpu")||text.match(/RTX\s*\d{4}(?:\s*Ti)?|Intel\s*(?:Iris\s*Xe|Arc\s*\w*)/i)?.[0];if(gpu)specs.laptopGraphics=txt(gpu);return specs;
}

function typeOf(name:string,category:string,productType:string){const system=systemKind(name,category+" "+productType);if(system)return system==="laptop"?"laptop":"peripheral";const s=(name+" "+category+" "+productType).toLowerCase();
 if(/cpu cooler|liquid cooler|\baio\b|heatsink/.test(s))return"cooler";
 if(/motherboard|mainboard/.test(s))return"motherboard";
 if(/monitor/.test(s)&&!/arm|stand|mount|bracket/.test(s))return"peripheral";
 if(/graphics|gpu|geforce|radeon|rtx\s*\d|rx\s*\d/.test(s))return"gpu";
 if(/processor|\bcpu\b|ryzen|core i[3579]|core ultra/.test(s))return"cpu";
 if(/motherboard|mainboard/.test(s))return"motherboard";
 if(/ddr[45]|desktop memory|dimm/.test(s))return"memory";
 if(/nvme|solid state|\bssd\b/.test(s))return"storage";
 if(/power supply|\bpsu\b/.test(s))return"psu";
 if(/computer case|pc case|chassis|mid[- ]?tower|full[- ]?tower/.test(s))return"case";
 if(/cpu cooler|liquid cooler|\baio\b|heatsink/.test(s))return"cooler";
 if(/case fan|cooling fan|120mm fan|140mm fan/.test(s))return"fan";
 if(/keyboard|mouse|headset|monitor|webcam|microphone|speaker|mousepad|mouse mat/.test(s))return"peripheral";
 if(/thermal paste|thermal compound/.test(s))return"accessory";
 return null}

function categoryOf(type:string,name:string,category:string){
 const n=(name+" "+category).toLowerCase();if(systemKind(name,category)==="desktop")return "desktops";if(type==="laptop")return "laptops";if(!["peripheral","accessory"].includes(type))return type;
 if(/monitor/.test(n)&&!/\b(arm|stand|mount|bracket)\b/.test(n))return "monitors";
 if(/keyboard/.test(n))return "keyboards";if(/mousepad|mouse pad|mouse mat|wrist/.test(n))return "desk-accessories";if(/\bmouse\b|\bmice\b/.test(n))return "mice";
 if(/headset|headphone/.test(n))return "headsets";if(/microphone|gaming mic|speaker|audio interface/.test(n))return "audio";if(/webcam|web camera/.test(n))return "webcams";
 if(/controller|racing|wheel|pedal|joystick|flight/.test(n))return "controllers";if(/thermal paste|thermal compound/.test(n))return "thermal-paste";
 if(/adapter|adaptor|hub|docking/.test(n))return "adapters";if(/cable/.test(n))return "cables";return "desk-accessories";
}

async function stableId(supplier:string,sku:string){const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(supplier+":"+sku));return supplier+"-"+[...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,"0")).join("").slice(0,16)}
function activePromo(row:any){const p=num(row.promo_price);if(p===null||p<0||!row.promo_starts||!row.promo_ends)return null;const day=(v:any,end:boolean)=>new Date(/^\d{4}-\d{2}-\d{2}$/.test(String(v))?String(v)+(end?"T23:59:59.999+02:00":"T00:00:00+02:00"):String(v));const a=day(row.promo_starts,false),b=day(row.promo_ends,true),now=new Date();if(!Number.isFinite(a.getTime())||!Number.isFinite(b.getTime())||now<a||now>b)return null;return p;}

async function allProducts(admin:any){
 const out:any[]=[];for(let from=0;;from+=1000){const {data,error}=await admin.from("store_products").select("*").order('id').range(from,from+999);if(error)throw error;out.push(...(data||[]));if(!data||data.length<1000)break}return out
}
function indexes(products:any[]){const map=new Map<string,string>();for(const p of products){const ids=p.identifiers||{};for(const k of ["mpn","ean","gtin","upc","sku","supplierSku"]){const v=cleanId(ids[k]);if(v&&!['N/A','NA','-','NONE','NULL','UNKNOWN','0'].includes(v)&&!map.has(k+":"+v))map.set(k+":"+v,p.id)}}return map}
function matchProduct(ix:Map<string,string>,ids:any){for(const k of ["mpn","ean","gtin","upc","sku"]){const v=cleanId(ids[k]);if(v&&ix.has(k+":"+v))return ix.get(k+":"+v)||null}return null}

async function fetchTarsus(token:string){
 const r=await fetch(TARSUS_URL,{headers:{Accept:"application/json",Authorization:"Bearer "+token}});
 if(!r.ok)throw new Error("Tarsus API returned HTTP "+r.status);
 return {data:await r.json(),scheme:"authorization",statuses:[{scheme:"authorization",status:r.status}]};
}
async function fetchSyntech(url:string){const u=new URL(url);if(u.protocol!=="https:"||!(u.hostname==="syntech.co.za"||u.hostname.endsWith(".syntech.co.za")))throw new Error("Invalid Syntech feed host");let r:Response;let target=url;for(let hop=0;;hop++){const next=new URL(target);if(next.protocol!=="https:"||!(next.hostname==="syntech.co.za"||next.hostname.endsWith(".syntech.co.za")))throw new Error("Syntech redirected to an unsupported host");r=await fetch(target,{headers:{Accept:"application/json"},redirect:"manual"});if(![301,302,303,307,308].includes(r.status))break;const location=r.headers.get("location");if(!location||hop>=3)throw new Error("Syntech feed redirect could not be resolved");target=new URL(location,target).href;}if(!r.ok)throw new Error("Syntech feed returned HTTP "+r.status);const payload=await r.json();const root=payload?.syntechstock||payload;if(root.currency!=="ZAR"||!Array.isArray(root.products)||root.products.length!==Number(root.count))throw new Error("Incomplete feed or unsupported currency; catalogue unchanged");return payload;}

function normaliseTarsus(payload:any){
 const rows=Array.isArray(payload?.Products)?payload.Products:[];
 return rows.map((r:any)=>{
  const sku=String(r.Product_Number??"").trim(),mpn=String(r.Manufacturing_Part_Number??"").trim(),ean=String(r.BarCode??"").trim();
  const name=txt(r.Product_Description||r.Short_Advertising_Description||sku),desc=txt(r.Short_Advertising_Description||r.Product_Description);
  const category=txt(r.Category),ptype=txt(r.Product_Type),type=typeOf(name,category,ptype),q=Math.max(0,Math.trunc(num(r.Available_Stock)??0)),ex=num(r.Price_ex_Vat);
  if(!sku||!name||ex===null||ex<0||!type||!gamingProductAllowed(type,name,desc))return null;
  return{sku,mpn,ean,name,desc,type,brand:txt(r.Manufacturer)||"Unspecified",category,cost:Math.round(ex*VAT*100)/100,qty:q,status:stockStatus(q),image:String(r.Image_URL??"").trim()||null,sourceUrl:null,checked:String(r.Export_Date||new Date().toISOString()),specs:type==="laptop"?laptopSpecs(name):{},meta:{eta:r.ETA_Date||null,price_ex_vat:ex,non_discount_price_ex_vat:num(r.Non_Discount_Price_ex_Vat),discount_quantity:num(r.Discount_Quantity),dimensions:{width:num(r.Each_Width),height:num(r.Each_Height),length:num(r.Each_Length),weight:num(r.Each_Weight)}}}
 }).filter(Boolean)
}
function normaliseSyntech(payload:any,existing:Map<string,any>){
 const root=payload?.syntechstock||payload||{},rows=Array.isArray(root.products)?root.products:Array.isArray(root.stock)?root.stock:[];
 return rows.map((r:any)=>{
  const sku=String(r.sku??"").trim();let current=existing.get(sku);if(!current){const category=txt(r.categorytree||r.categories||"");if(!r.name||!laptopProduct(txt(r.name),category))return null;current={type:"laptop",name:txt(r.name),brand:txt(r.attributes?.brand)||"Unspecified",short_description:txt(r.shortdesc||r.description||""),metadata:{supplier_category:category}};}if(!["jhbstock","cptstock","dbnstock"].every(k=>num(r[k])!==null&&Number.isInteger(num(r[k]))&&Number(r[k])>=0))throw new Error("Incomplete branch stock; catalogue unchanged");const attrs=r.attributes||{},mpn=String(attrs["manufacturer-part-number"]||attrs.mpn||"").trim(),ean=String(attrs.ean||"").trim();
  const name=txt(r.name||current.name),desc=txt(r.shortdesc||r.description||current.short_description),category=txt(r.categorytree||r.categories||current.metadata?.supplier_category||current.short_description),type=current.type,normal=num(r.price),promo=activePromo(r),ex=promo??normal;
  const j=Math.max(0,Math.trunc(num(r.jhbstock)??0)),c=Math.max(0,Math.trunc(num(r.cptstock)??0)),d=Math.max(0,Math.trunc(num(r.dbnstock)??0)),q=j+c+d;
  if(!sku||!name||ex===null||ex<0||!type||!gamingProductAllowed(type,name,desc))return null;
  const images=[r.featured_image,...(Array.isArray(r.additional_images)?r.additional_images:[])].filter(Boolean);
  return{sku,mpn,ean,name,desc,type,brand:txt(attrs.brand)||current.brand||"Unspecified",category,cost:Math.round(ex*VAT*100)/100,qty:q,status:stockStatus(q),image:images[0]||null,images,sourceUrl:String(r.url||current.metadata?.product_url||"").trim()||null,checked:new Date().toISOString(),specs:type==="laptop"?{...attrs,...laptopSpecs(name,attrs)}:attrs,meta:{rrp_incl:num(r.rrp_incl),recommended_margin:num(r.recommended_margin),promo_price:promo,branches:{jhb:j,cpt:c,dbn:d},next_shipment_eta:r.nextshipmenteta||null}}
 }).filter(Boolean)
}

async function persist(admin:any,supplier:any,items:any[],authScheme:string|null){
 const products=await allProducts(admin),ix=indexes(products),byId=new Map(products.map(p=>[p.id,p])),affected=new Set<string>(),productRows:any[]=[],offers:any[]=[];
 for(const item of items){
  const ids={mpn:item.mpn||null,ean:item.ean||null,sku:item.sku,supplier:supplier.id,supplierSku:item.sku};
  let id=matchProduct(ix,ids);if(!id){id=await stableId(supplier.id,item.sku);ix.set("sku:"+cleanId(item.sku),id)}
  const current=byId.get(id),meta=current?.metadata||{},mediaCurated=meta.media_curated===true||meta.media_curated==="true",descCurated=meta.description_curated===true||meta.description_curated==="true";
  const media=item.image&&!mediaCurated?{primaryImage:item.image,directImage:item.image,images:item.images||[item.image],sourceType:"supplier-feed",imageStrategy:supplier.id+"-feed"}:(current?.media||{});
  productRows.push({
   id,slug:current?.slug||id,type:meta.identity_curated?current.type:item.type,brand:current?.brand&&current.brand!=="Unspecified"?current.brand:item.brand,manufacturer:current?.manufacturer&&current.manufacturer!=="Unspecified"?current.manufacturer:item.brand,name:current?.name||item.name,
   status:"active",visibility:current?.visibility||"public",sale_mode:current?.sale_mode||"quote",retail_price:current?.retail_price??Math.round(item.cost*1.20*100)/100,currency:"ZAR",
   stock_status:item.status,stock_qty:item.qty,price_checked_at:new Date().toISOString(),short_description:descCurated?current.short_description:item.desc,highlights:current?.highlights||[],
   identifiers:{...(current?.identifiers||{}),...ids},specs:{...(item.specs||{}),...(current?.specs||{})},compatibility:current?.compatibility||{},media,seo:current?.seo||{description:item.desc},
   metadata:{...meta,source:current?.metadata?.source||supplier.id+"-feed",supplier:current?.metadata?.supplier||supplier.id,connected_suppliers:Array.from(new Set([...(meta.connected_suppliers||[]),supplier.id])),stock_connected:true,pricing_state:"quote-first",auto_markup_disabled:meta.auto_markup_disabled??false,markup_percent:meta.markup_percent??20,last_supplier_sync:new Date().toISOString()},
   featured:current?.featured||false,is_new:current?.is_new??true,sort_priority:current?.sort_priority||0,category_slug:meta.identity_curated?current.category_slug:categoryOf(item.type,item.name,item.category),condition:current?.condition||"new",is_demo:false,
   shipping_weight_kg:current?.shipping_weight_kg??(positive(item.meta?.dimensions?.weight)?Number(item.meta.dimensions.weight)/1000:null),
   shipping_length_cm:current?.shipping_length_cm??positive(item.meta?.dimensions?.length),shipping_width_cm:current?.shipping_width_cm??positive(item.meta?.dimensions?.width),shipping_height_cm:current?.shipping_height_cm??positive(item.meta?.dimensions?.height),shipping_packaging_verified:current?.shipping_packaging_verified||false,
   updated_at:new Date().toISOString()
  });
  offers.push({product_id:id,supplier_id:supplier.id,supplier_name:supplier.name,supplier_sku:item.sku,cost_price:item.cost,currency:"ZAR",stock_qty:item.qty,stock_status:item.status,last_checked:new Date(item.checked||Date.now()).toISOString(),source_url:item.sourceUrl,metadata:{...item.meta,category:item.category,mpn:item.mpn,ean:item.ean,cost_vat_basis:"inclusive-normalized"}});
  affected.add(id)
 }
 const mergedProducts=[...new Map(productRows.map(p=>[p.id,p])).values()];
 const uniqueOffers=[...new Map(offers.map(o=>[JSON.stringify([o.product_id,o.supplier_id,o.supplier_sku]),o])).values()];
 for(let i=0;i<mergedProducts.length;i+=100){const {error}=await admin.from("store_products").upsert(mergedProducts.slice(i,i+100),{onConflict:"id"});if(error)throw error}
 for(let i=0;i<uniqueOffers.length;i+=100){const {error}=await admin.from("store_supplier_offers").upsert(uniqueOffers.slice(i,i+100),{onConflict:"product_id,supplier_id,supplier_sku"});if(error)throw error}
 const ids=[...affected];for(let i=0;i<ids.length;i+=500){const {error}=await admin.rpc("vt_update_preferred_offer_products",{p_ids:ids.slice(i,i+500)});if(error)throw error;}
 const {data:latestSupplier}=await admin.from("store_suppliers").select("metadata").eq("id",supplier.id).maybeSingle();
 await admin.from("store_suppliers").update({feed_status:"live",feed_last_synced_at:new Date().toISOString(),metadata:{...(latestSupplier?.metadata||supplier.metadata||{}),last_error:null,sync_paused_until:null,last_sync_rows:items.length,...(authScheme?{api_auth_scheme:authScheme}:{})},updated_at:new Date().toISOString()}).eq("id",supplier.id);
 return{products:mergedProducts.length,offers:uniqueOffers.length}
}

Deno.serve(async(req:Request)=>{
 const origin=req.headers.get("origin");if(req.method==="OPTIONS")return new Response("ok",{headers:cors(origin)});if(req.method!=="POST")return reply({error:"Method not allowed"},405,origin);if(origin&&!ORIGINS.has(origin))return reply({error:"Origin not allowed"},403,origin);
 let requestedSupplier="";
 try{
  const url=Deno.env.get("SUPABASE_URL"),anonKey=Deno.env.get("SUPABASE_ANON_KEY"),serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");if(!url||!anonKey||!serviceKey)return reply({error:"Server configuration error"},500,origin);
  const admin=createClient(url,serviceKey);let scheduled=false;
  const cronToken=req.headers.get("x-supplier-cron-token");
  if(cronToken){const {data:expected}=await admin.rpc("vt_supplier_secret",{p_name:"supplier_sync_cron_token"});if(!expected||cronToken!==expected)return reply({error:"Not authorised"},401,origin);scheduled=true;}
  if(!scheduled){const auth=req.headers.get("authorization")||"";const userClient=createClient(url,anonKey,{global:{headers:{Authorization:auth}}});const {data:{user}}=await userClient.auth.getUser();if(!user)return reply({error:"Sign in required"},401,origin);const {data:isAdmin,error:adminError}=await userClient.rpc("is_volttech_admin");if(adminError||isAdmin!==true)return reply({error:"Admin access required"},403,origin);}
  const body=await req.json().catch(()=>({})),supplierId=String(body?.supplier||"").toLowerCase(),mode=String(body?.mode||"full");
  if(!["full","update"].includes(mode))return reply({error:"Invalid sync mode"},400,origin);
  requestedSupplier=supplierId;
  if(scheduled&&!["syntech","tarsus"].includes(supplierId))return reply({error:"Invalid scheduled supplier"},400,origin);
  const {data:supplier,error:supplierError}=await admin.from("store_suppliers").select("*").eq("id",supplierId).maybeSingle();if(supplierError||!supplier)return reply({error:"Unknown supplier"},400,origin);

  let items:any[]=[],scheme:string|null=null;
  if(scheduled&&supplierId==="tarsus"&&supplier.feed_status==="blocked")return reply({ok:true,skipped:true,message:"Tarsus is refusing API access; use manual Sync feed after access is restored."},200,origin);
  if(supplierId==="tarsus"){const {data:token,error}=await admin.rpc("vt_supplier_secret",{p_name:"tarsus_api_token"});if(error||!token)throw new Error("Tarsus API token is not configured");const result=await fetchTarsus(token);scheme=result.scheme;items=normaliseTarsus(result.data)}
  else if(supplierId==="syntech"){const secretName=mode==="update"?"syntech_update_feed_url":"syntech_full_feed_url";const {data:feedUrl,error}=await admin.rpc("vt_supplier_secret",{p_name:secretName});if(error||!feedUrl)throw new Error("Syntech "+mode+" feed URL is not configured yet");const {data:claimed,error:claimError}=await admin.rpc("vt_claim_syntech_sync");if(claimError)throw claimError;if(!claimed)return reply({ok:true,skipped:true,message:"Sync paused or recently attempted"},200,origin);
   const existingProducts=await allProducts(admin),existing=new Map<string,any>();for(const p of existingProducts){if((p.metadata?.connected_suppliers||[]).includes("syntech"))existing.set(String(p.metadata?.supplierSku||p.identifiers?.sku||p.identifiers?.mpn),p);}
   const payload=await fetchSyntech(feedUrl);items=normaliseSyntech(payload,existing);
   if(mode==="full"){const root=payload?.syntechstock||payload,present=new Set(root.products.map((p:any)=>String(p.sku)));const gone=Array.from(existing.keys()).filter(sku=>!present.has(sku));for(let i=0;i<gone.length;i+=100){const {error}=await admin.from("store_supplier_offers").update({stock_qty:0,stock_status:"out-of-stock",last_checked:new Date().toISOString()}).eq("supplier_id","syntech").in("supplier_sku",gone.slice(i,i+100));if(error)throw error;}if(gone.length){const {error}=await admin.rpc("vt_update_preferred_offer_products",{p_ids:gone.map(sku=>existing.get(sku).id)});if(error)throw error;}}}
  else return reply({error:"Esquire continues to use its existing CSV importer."},409,origin);
  if(!items.length)throw new Error("Supplier feed returned no eligible VoltTech catalogue rows");
  const saved=await persist(admin,supplier,items,scheme);return reply({ok:true,supplier:supplierId,mode,eligible_rows:items.length,...saved},200,origin)
 }catch(e){console.error("supplier sync failed");try{const url=Deno.env.get("SUPABASE_URL"),serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");if(url&&serviceKey){const admin=createClient(url,serviceKey);const {data:previous}=await admin.from("store_suppliers").select("metadata").eq("id",requestedSupplier).maybeSingle();if(requestedSupplier)await admin.from("store_suppliers").update({feed_status:String(e?.message||e).includes("HTTP 403")?"blocked":"error",metadata:{...(previous?.metadata||{}),last_error:String(e?.message||e).slice(0,300),...(String(e?.message||e).includes("HTTP 429")?{sync_paused_until:new Date(Date.now()+3600000).toISOString()}:{})},updated_at:new Date().toISOString()}).eq("id",requestedSupplier)}}catch{}return reply({error:String(e?.message||"Supplier catalogue sync failed")},500,origin)}
});