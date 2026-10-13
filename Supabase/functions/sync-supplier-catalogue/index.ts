import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { gamingProductAllowed } from "./gaming-policy.js";

const VAT=1.15;
const TARSUS_URL="https://feedgen.tarsusonline.co.za/api/DataFeed/Customer-ProductCatalogue";
const ORIGINS=new Set(["https://volttechcomputerco.co.za","https://www.volttechcomputerco.co.za","https://volttechcomputerco.github.io"]);

function cors(origin:string|null){const allowed=origin&&ORIGINS.has(origin)?origin:"https://volttechcomputerco.co.za";return{"Access-Control-Allow-Origin":allowed,"Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin","Content-Type":"application/json"}}
function reply(body:unknown,status=200,origin:string|null=null){return new Response(JSON.stringify(body),{status,headers:cors(origin)})}
function txt(v:unknown){return String(v??"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim()}
function num(v:unknown){const n=Number(v);return Number.isFinite(n)?n:null}
function cleanId(v:unknown){return String(v??"").trim().toUpperCase().replace(/\s+/g,"")}
function stockStatus(q:number){return q<=0?"out-of-stock":q<=2?"low-stock":"in-stock"}
function typeOf(name:string,category:string,productType:string){const s=(name+" "+category+" "+productType).toLowerCase();
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
async function stableId(supplier:string,sku:string){const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(supplier+":"+sku));return supplier+"-"+[...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,"0")).join("").slice(0,16)}
function activePromo(row:any){const p=num(row.promo_price);if(p===null||p<0)return null;const now=new Date();const a=row.promo_starts?new Date(row.promo_starts):null,b=row.promo_ends?new Date(row.promo_ends):null;if(a&&now<a)return null;if(b&&now>b)return null;return p}

async function allProducts(admin:any){
 const out:any[]=[];for(let from=0;;from+=1000){const {data,error}=await admin.from("store_products").select("id,type,brand,manufacturer,name,short_description,media,metadata,identifiers,specs,visibility,status,sale_mode").range(from,from+999);if(error)throw error;out.push(...(data||[]));if(!data||data.length<1000)break}return out
}
function indexes(products:any[]){const map=new Map<string,string>();for(const p of products){const ids=p.identifiers||{};for(const k of ["mpn","ean","gtin","upc","sku","supplierSku"]){const v=cleanId(ids[k]);if(v&&!map.has(k+":"+v))map.set(k+":"+v,p.id)}}return map}
function matchProduct(ix:Map<string,string>,ids:any){for(const k of ["mpn","ean","gtin","upc","sku"]){const v=cleanId(ids[k]);if(v&&ix.has(k+":"+v))return ix.get(k+":"+v)||null}return null}

async function fetchTarsus(token:string){
 const attempts=[
  ["authorization",{"Authorization":"Bearer "+token}],
  ["x-api-key",{"X-API-Key":token}],
  ["api-token",{"Api-Token":token}],
  ["x-api-token",{"X-Api-Token":token}],
  ["token",{"Token":token}]
 ] as const;
 const statuses:any[]=[];
 for(const [scheme,headers] of attempts){const r=await fetch(TARSUS_URL,{headers:{Accept:"application/json",...headers}});statuses.push({scheme,status:r.status});if(r.ok){const j=await r.json();return{data:j,scheme,statuses}}if(![401,403].includes(r.status))break}
 throw new Error("Tarsus API authentication failed ("+statuses.map(x=>x.scheme+":"+x.status).join(", ")+")")
}
async function fetchSyntech(url:string){const r=await fetch(url,{headers:{Accept:"application/json"}});if(!r.ok)throw new Error("Syntech feed returned HTTP "+r.status);return await r.json()}

function normaliseTarsus(payload:any){
 const rows=Array.isArray(payload?.Products)?payload.Products:[];
 return rows.map((r:any)=>{
  const sku=String(r.Product_Number??"").trim(),mpn=String(r.Manufacturing_Part_Number??"").trim(),ean=String(r.BarCode??"").trim();
  const name=txt(r.Product_Description||r.Short_Advertising_Description||sku),desc=txt(r.Short_Advertising_Description||r.Product_Description);
  const category=txt(r.Category),ptype=txt(r.Product_Type),type=typeOf(name,category,ptype),q=Math.max(0,Math.trunc(num(r.Available_Stock)??0)),ex=num(r.Price_ex_Vat);
  if(!sku||!name||ex===null||ex<0||!type||!gamingProductAllowed(type,name,desc))return null;
  return{sku,mpn,ean,name,desc,type,brand:txt(r.Manufacturer)||"Unspecified",category,cost:Math.round(ex*VAT*100)/100,qty:q,status:stockStatus(q),image:String(r.Image_URL??"").trim()||null,sourceUrl:null,checked:String(r.Export_Date||new Date().toISOString()),specs:{},meta:{eta:r.ETA_Date||null,price_ex_vat:ex,non_discount_price_ex_vat:num(r.Non_Discount_Price_ex_Vat),discount_quantity:num(r.Discount_Quantity),dimensions:{width:num(r.Each_Width),height:num(r.Each_Height),length:num(r.Each_Length),weight:num(r.Each_Weight)}}}
 }).filter(Boolean)
}
function normaliseSyntech(payload:any){
 const root=payload?.syntechstock||payload||{},rows=Array.isArray(root.products)?root.products:Array.isArray(root.stock)?root.stock:[];
 return rows.map((r:any)=>{
  const sku=String(r.sku??"").trim(),attrs=r.attributes||{},mpn=String(attrs["manufacturer-part-number"]||attrs.mpn||"").trim(),ean=String(attrs.ean||"").trim();
  const name=txt(r.name||sku),desc=txt(r.shortdesc||r.description),category=txt(r.categories||r.categorytree),type=typeOf(name,category,""),normal=num(r.price),promo=activePromo(r),ex=promo??normal;
  const j=Math.max(0,Math.trunc(num(r.jhbstock)??0)),c=Math.max(0,Math.trunc(num(r.cptstock)??0)),d=Math.max(0,Math.trunc(num(r.dbnstock)??0)),q=j+c+d;
  if(!sku||!name||ex===null||ex<0||!type||!gamingProductAllowed(type,name,desc))return null;
  const images=[r.featured_image,...(Array.isArray(r.additional_images)?r.additional_images:[])].filter(Boolean);
  return{sku,mpn,ean,name,desc,type,brand:txt(attrs.brand)||"Unspecified",category,cost:Math.round(ex*VAT*100)/100,qty:q,status:stockStatus(q),image:images[0]||null,images,sourceUrl:String(r.url||"").trim()||null,checked:String(r.last_modified||new Date().toISOString()),specs:attrs,meta:{rrp_incl:num(r.rrp_incl),recommended_margin:num(r.recommended_margin),promo_price:promo,branches:{jhb:j,cpt:c,dbn:d},next_shipment_eta:r.nextshipmenteta||null}}
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
   id,slug:current?.slug||id,type:current?.type||item.type,brand:current?.brand&&current.brand!=="Unspecified"?current.brand:item.brand,manufacturer:current?.manufacturer&&current.manufacturer!=="Unspecified"?current.manufacturer:item.brand,name:current?.name||item.name,
   status:"active",visibility:current?.visibility||"public",sale_mode:current?.sale_mode||"quote",retail_price:current?.retail_price??null,currency:"ZAR",
   stock_status:item.status,stock_qty:item.qty,price_checked_at:new Date().toISOString(),short_description:descCurated?current.short_description:item.desc,highlights:current?.highlights||[],
   identifiers:{...(current?.identifiers||{}),...ids},specs:{...(item.specs||{}),...(current?.specs||{})},compatibility:current?.compatibility||{},media,seo:current?.seo||{description:item.desc},
   metadata:{...meta,source:current?.metadata?.source||supplier.id+"-feed",supplier:current?.metadata?.supplier||supplier.id,connected_suppliers:Array.from(new Set([...(meta.connected_suppliers||[]),supplier.id])),stock_connected:true,pricing_state:"quote-first",auto_markup_disabled:true,last_supplier_sync:new Date().toISOString()},
   featured:current?.featured||false,is_new:current?.is_new??true,sort_priority:current?.sort_priority||0,category_slug:current?.category_slug||item.type,condition:current?.condition||"new",is_demo:false,
   shipping_weight_kg:current?.shipping_weight_kg??(num(item.meta?.dimensions?.weight)?Number(item.meta.dimensions.weight)/1000:null),
   shipping_length_cm:current?.shipping_length_cm??num(item.meta?.dimensions?.length),shipping_width_cm:current?.shipping_width_cm??num(item.meta?.dimensions?.width),shipping_height_cm:current?.shipping_height_cm??num(item.meta?.dimensions?.height),shipping_packaging_verified:current?.shipping_packaging_verified||false,
   updated_at:new Date().toISOString()
  });
  offers.push({product_id:id,supplier_id:supplier.id,supplier_name:supplier.name,supplier_sku:item.sku,cost_price:item.cost,currency:"ZAR",stock_qty:item.qty,stock_status:item.status,last_checked:new Date(item.checked||Date.now()).toISOString(),source_url:item.sourceUrl,metadata:{...item.meta,category:item.category,mpn:item.mpn,ean:item.ean,cost_vat_basis:"inclusive-normalized"}});
  affected.add(id)
 }
 for(let i=0;i<productRows.length;i+=100){const {error}=await admin.from("store_products").upsert(productRows.slice(i,i+100),{onConflict:"id"});if(error)throw error}
 for(let i=0;i<offers.length;i+=100){const {error}=await admin.from("store_supplier_offers").upsert(offers.slice(i,i+100),{onConflict:"product_id,supplier_id,supplier_sku"});if(error)throw error}
 const ids=[...affected];const priorities=new Map<string,number>();const {data:sups}=await admin.from("store_suppliers").select("id,priority");for(const s of sups||[])priorities.set(s.id,Number(s.priority||100));
 for(let i=0;i<ids.length;i+=100){const chunk=ids.slice(i,i+100);const {data:os,error}=await admin.from("store_supplier_offers").select("product_id,supplier_id,supplier_name,stock_qty,stock_status,last_checked,cost_price").in("product_id",chunk);if(error)throw error;const grouped=new Map<string,any[]>();for(const o of os||[]){const a=grouped.get(o.product_id)||[];a.push(o);grouped.set(o.product_id,a)}
  for(const [pid,a] of grouped){a.sort((x,y)=>{const xs=Number(x.stock_qty)>0?0:1,ys=Number(y.stock_qty)>0?0:1;if(xs!==ys)return xs-ys;const xp=priorities.get(x.supplier_id)||100,yp=priorities.get(y.supplier_id)||100;if(xp!==yp)return xp-yp;return Number(x.cost_price||1e15)-Number(y.cost_price||1e15)});const best=a[0];await admin.from("store_products").update({stock_qty:best.stock_qty,stock_status:best.stock_status,price_checked_at:best.last_checked,metadata:{...(byId.get(pid)?.metadata||{}),preferred_supplier:best.supplier_id,preferred_supplier_name:best.supplier_name,connected_suppliers:Array.from(new Set(a.map(x=>x.supplier_id))),stock_connected:true,pricing_state:"quote-first"},updated_at:new Date().toISOString()}).eq("id",pid)}
 }
 await admin.from("store_suppliers").update({feed_status:"live",feed_last_synced_at:new Date().toISOString(),metadata:{...(supplier.metadata||{}),last_sync_rows:items.length,...(authScheme?{api_auth_scheme:authScheme}:{})},updated_at:new Date().toISOString()}).eq("id",supplier.id);
 return{products:productRows.length,offers:offers.length}
}

Deno.serve(async(req:Request)=>{
 const origin=req.headers.get("origin");if(req.method==="OPTIONS")return new Response("ok",{headers:cors(origin)});if(req.method!=="POST")return reply({error:"Method not allowed"},405,origin);if(origin&&!ORIGINS.has(origin))return reply({error:"Origin not allowed"},403,origin);
 try{
  const url=Deno.env.get("SUPABASE_URL"),anonKey=Deno.env.get("SUPABASE_ANON_KEY"),serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");if(!url||!anonKey||!serviceKey)return reply({error:"Server configuration error"},500,origin);
  const auth=req.headers.get("authorization")||"";const userClient=createClient(url,anonKey,{global:{headers:{Authorization:auth}}});const {data:{user}}=await userClient.auth.getUser();if(!user)return reply({error:"Sign in required"},401,origin);
  const admin=createClient(url,serviceKey);const {data:adminRow}=await admin.from("admin_users").select("role").eq("user_id",user.id).maybeSingle();if(!adminRow)return reply({error:"Admin access required"},403,origin);
  const body=await req.json().catch(()=>({})),supplierId=String(body?.supplier||"").toLowerCase(),mode=String(body?.mode||"full");
  const {data:supplier,error:supplierError}=await admin.from("store_suppliers").select("*").eq("id",supplierId).maybeSingle();if(supplierError||!supplier)return reply({error:"Unknown supplier"},400,origin);
  await admin.from("store_suppliers").update({feed_status:"syncing",updated_at:new Date().toISOString()}).eq("id",supplierId);
  let items:any[]=[],scheme:string|null=null;
  if(supplierId==="tarsus"){const {data:token,error}=await admin.rpc("vt_supplier_secret",{p_name:"tarsus_api_token"});if(error||!token)throw new Error("Tarsus API token is not configured");const result=await fetchTarsus(token);scheme=result.scheme;items=normaliseTarsus(result.data)}
  else if(supplierId==="syntech"){const secretName=mode==="update"?"syntech_update_feed_url":"syntech_full_feed_url";const {data:feedUrl,error}=await admin.rpc("vt_supplier_secret",{p_name:secretName});if(error||!feedUrl)throw new Error("Syntech "+mode+" feed URL is not configured yet");items=normaliseSyntech(await fetchSyntech(feedUrl))}
  else return reply({error:"Esquire continues to use its existing CSV importer."},409,origin);
  if(!items.length)throw new Error("Supplier feed returned no eligible VoltTech catalogue rows");
  const saved=await persist(admin,supplier,items,scheme);return reply({ok:true,supplier:supplierId,mode,eligible_rows:items.length,...saved},200,origin)
 }catch(e){console.error("supplier sync failed",e);try{const url=Deno.env.get("SUPABASE_URL"),serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");if(url&&serviceKey){const admin=createClient(url,serviceKey);const body=await req.clone().json().catch(()=>({}));if(body?.supplier)await admin.from("store_suppliers").update({feed_status:"error",metadata:{last_error:String(e?.message||e).slice(0,300)},updated_at:new Date().toISOString()}).eq("id",String(body.supplier).toLowerCase())}}catch{}return reply({error:String(e?.message||"Supplier catalogue sync failed")},500,origin)}
});