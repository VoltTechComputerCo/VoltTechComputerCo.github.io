import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { gamingProductAllowed } from "./gaming-policy.js";

const ORIGINS = new Set([
  "https://volttechcomputerco.co.za",
  "https://www.volttechcomputerco.co.za",
  "https://volttechcomputerco.github.io"
]);
const MAX_BODY_BYTES = 5_000_000;
const MIN_FEED_ROWS = 500;

const coreCategoryMap = new Map<string,string>([
  ["CPU-AMD Ryzen 5","cpu"],["CPU-AMD Ryzen 7","cpu"],["CPU-Intel LGA1700","cpu"],["CPU-Intel LGA1851","cpu"],
  ["Graphics Cards - NVIDIA","gpu"],
  ["Motherboard-Intel-LGA1700","motherboard"],["Motherboard Intel LGA1851","motherboard"],["Motherboard-AMD","motherboard"],
  ["Memory (Desktop)-DDR4","memory"],["Memory (Desktop)-DDR5","memory"],["Memory (Desktop)","memory"],
  ["Hard Disk (SSD)","storage"],["Power Supply Units(PSU)","psu"],
  ["Computer Case (Mid-Tower)","case"],["Computer Case","case"],
  ["CPU Heat sink and Fan-AMD","cooler"],["CPU Heat sink and Fan-Intel","cooler"],
  ["CPU Heat sink and Fan-Hybrid","cooler"],["Gaming Cooling Solutions","cooler"]
]);

function cors(origin:string|null){
  const allowed = origin && ORIGINS.has(origin) ? origin : "https://volttechcomputerco.co.za";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
    "Content-Type": "application/json"
  };
}
function reply(body:unknown,status=200,origin:string|null=null){
  return new Response(JSON.stringify(body),{status,headers:cors(origin)});
}
function parseCsv(text:string){
  const rows:string[][]=[]; let row:string[]=[], field="", quoted=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(c === '"'){
      if(quoted && text[i+1] === '"'){ field += '"'; i++; }
      else quoted = !quoted;
    }else if(c === "," && !quoted){
      row.push(field); field="";
    }else if((c === "\n" || c === "\r") && !quoted){
      if(c === "\r" && text[i+1] === "\n") i++;
      row.push(field); field="";
      if(row.some(v=>v!=="")) rows.push(row);
      row=[];
    }else field += c;
  }
  if(field.length || row.length){ row.push(field); rows.push(row); }
  if(!rows.length) return [];
  const headers=rows[0].map(x=>x.trim());
  const required=["ProductName","ProductCode","Category","ProductSummary","Price","AvailableQty","Image"];
  if(required.some(h=>!headers.includes(h))) throw new Error("Feed headers do not match the Esquire product format.");
  return rows.slice(1).map(r=>Object.fromEntries(headers.map((h,j)=>[h,r[j] ?? ""])));
}
function cleanSku(v:unknown){
  return String(v??"").trim().replace(/^=/,"").replace(/^"+|"+$/g,"").trim();
}
function shortDescription(v:unknown,max=300){
  const s=String(v??"").replace(/\s+/g," ").trim();
  if(s.length<=max) return s;
  const x=s.slice(0,max-1), p=x.lastIndexOf(" ");
  return (p>180?x.slice(0,p):x)+"…";
}
function stockStatus(qty:number){
  return qty===0 ? "out-of-stock" : qty<=2 ? "low-stock" : "in-stock";
}
function brandOf(name:string){
  const defs:[RegExp,string][]=[
    [/^amd\b/i,"AMD"],[/^intel\b/i,"Intel"],[/^asus\b/i,"ASUS"],[/^msi\b/i,"MSI"],[/^gigabyte\b/i,"Gigabyte"],
    [/^arktek\b/i,"Arktek"],[/^apacer\b/i,"Apacer"],[/^adata\b/i,"ADATA"],[/^(dato|data)\b/i,"Dato"],[/^hp\b/i,"HP"],
    [/^hiksemi\b/i,"Hiksemi"],[/^patriot\b/i,"Patriot"],[/^aerocool\b/i,"AeroCool"],[/^unique\b/i,"UniQue"],
    [/^arctic\b/i,"ARCTIC"],[/^kwg\b/i,"KWG"],[/^rogueware\b/i,"Rogueware"],[/^kioxia\b/i,"Kioxia"],
    [/^crucial\b/i,"Crucial"],[/^logitech\b/i,"Logitech"],[/^redragon\b/i,"Redragon"],[/^rapoo\b/i,"Rapoo"],
    [/^dell\b/i,"Dell"],[/^samsung\b/i,"Samsung"],[/^lg\b/i,"LG"],[/^aoc\b/i,"AOC"],[/^viewsonic\b/i,"ViewSonic"],
    [/^philips\b/i,"Philips"],[/^hikvision\b/i,"Hikvision"],[/^dahua\b/i,"Dahua"],[/^toshiba\b/i,"Toshiba"],
    [/^seagate\b/i,"Seagate"],[/^kingston\b/i,"Kingston"],[/^sandisk\b/i,"SanDisk"],[/^transcend\b/i,"Transcend"],
    [/^corsair\b/i,"Corsair"],[/^deepcool\b/i,"DeepCool"],[/^cooler master\b/i,"Cooler Master"],[/^thermaltake\b/i,"Thermaltake"],
    [/^nzxt\b/i,"NZXT"],[/^antec\b/i,"Antec"],[/^palit\b/i,"Palit"],[/^lenovo\b/i,"Lenovo"]
  ];
  for(const [rx,b] of defs) if(rx.test(name)) return b;
  return null;
}
async function stableId(sku:string){
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(sku));
  return "esquire-"+[...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,"0")).join("").slice(0,16);
}
function existingUpdate(existing:any,item:any,feedDate:string){
  const meta=existing.metadata||{}, mediaCurated=meta.media_curated===true || meta.media_curated==="true";
  const descriptionCurated=meta.description_curated===true || meta.description_curated==="true";
  const identityCurated=meta.identity_curated===true || meta.identity_curated==="true";
  const inferredBrand=brandOf(item.name);
  return {
    id:existing.id,
    brand:identityCurated ? existing.brand : ((!existing.brand || ["unknown","unspecified"].includes(String(existing.brand).toLowerCase())) && inferredBrand ? inferredBrand : existing.brand),
    manufacturer:identityCurated ? existing.manufacturer : ((!existing.manufacturer || ["unknown","unspecified"].includes(String(existing.manufacturer).toLowerCase())) && inferredBrand ? inferredBrand : existing.manufacturer),
    stock_status:item.stockStatus,
    stock_qty:item.qty,
    price_checked_at:feedDate+"T00:00:00Z",
    short_description:descriptionCurated ? existing.short_description : item.shortDescription,
    media:mediaCurated || !item.image ? existing.media : {
      primaryImage:item.image,directImage:item.image,images:[item.image],sourceType:"supplier-csv",imageStrategy:"supplier-feed"
    },
    metadata:{...meta,feed_date:feedDate,supplier_category:item.category,supplier:"esquire",import_version:"esquire-csv-v1",stock_connected:true,pricing_state:"quote-first",auto_markup_disabled:true},
    updated_at:new Date().toISOString()
  };
}
Deno.serve(async(req:Request)=>{
  const origin=req.headers.get("origin");
  if(req.method==="OPTIONS") return new Response("ok",{headers:cors(origin)});
  if(req.method!=="POST") return reply({error:"Method not allowed"},405,origin);
  if(origin && !ORIGINS.has(origin)) return reply({error:"Origin not allowed"},403,origin);
  try{
    const url=Deno.env.get("SUPABASE_URL"), anonKey=Deno.env.get("SUPABASE_ANON_KEY"), serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if(!url||!anonKey||!serviceKey) return reply({error:"Server configuration error"},500,origin);
    const auth=req.headers.get("authorization")||"";
    const userClient=createClient(url,anonKey,{global:{headers:{Authorization:auth}}});
    const {data:{user},error:userError}=await userClient.auth.getUser();
    if(userError||!user) return reply({error:"Sign in required"},401,origin);
    const admin=createClient(url,serviceKey);
    const {data:adminRow}=await admin.from("admin_users").select("role").eq("user_id",user.id).maybeSingle();
    if(!adminRow) return reply({error:"Admin access required"},403,origin);

    const contentLength=Number(req.headers.get("content-length")||0);
    if(contentLength>MAX_BODY_BYTES) return reply({error:"Feed file is too large"},413,origin);
    const contentType=req.headers.get("content-type")||"";
    let csv="", feedDate="";
    if(contentType.includes("application/json")){
      const body=await req.json();
      csv=typeof body?.csv==="string"?body.csv:"";
      feedDate=typeof body?.feedDate==="string"?body.feedDate:"";
    }else{
      csv=await req.text();
      feedDate=new URL(req.url).searchParams.get("feed_date")||"";
    }
    if(!/^\d{4}-\d{2}-\d{2}$/.test(feedDate)) return reply({error:"A YYYY-MM-DD feedDate is required"},400,origin);
    if(!csv || new TextEncoder().encode(csv).byteLength>MAX_BODY_BYTES) return reply({error:"A valid CSV feed is required"},400,origin);

    const parsed=parseCsv(csv);
    if(parsed.length<MIN_FEED_ROWS) return reply({error:"Feed appears incomplete; import stopped"},400,origin);

    const items=parsed.map((r:any)=>{
      const sku=cleanSku(r.ProductCode), name=String(r.ProductName||"").trim(), category=String(r.Category||"").trim();
      const price=Number(String(r.Price||"").replace(/^=/,"").replace(/"/g,""));
      const qty=Number.parseInt(String(r.AvailableQty||""),10);
      if(!sku||!name||!Number.isFinite(price)||price<0||!Number.isInteger(qty)||qty<0) return null;
      return {sku,name,category,shortDescription:shortDescription(r.ProductSummary),image:String(r.Image||"").trim()||null,cost:Math.round(price*100)/100,qty,stockStatus:stockStatus(qty)};
    }).filter(Boolean);
    if(items.length<MIN_FEED_ROWS) return reply({error:"Too many invalid feed rows; import stopped"},400,origin);

    const {data:existing,error:existingError}=await admin.from("store_products")
      .select("id,slug,type,brand,manufacturer,name,short_description,media,metadata,identifiers,category_slug")
      .eq("metadata->>source","esquire-csv");
    if(existingError) throw existingError;
    const bySku=new Map((existing||[]).map((p:any)=>[String(p.identifiers?.supplierSku||""),p]).filter(([sku]:any)=>sku));
    const updates:any[]=[], inserts:any[]=[], offers:any[]=[];
    let ignored=0;
    for(const item of items){
      const current=bySku.get(item.sku);
      let type=current?.type||coreCategoryMap.get(item.category)||null;
      if(!type && /case fan|gemini m1|pacelight/i.test(item.name)) type="fan";
      if(!type && /thermal.*(paste|compound)|heatsink compound/i.test(item.name)) type="accessory";
      if(!type && /monitor|keyboard|mouse|headset|webcam|microphone|speaker|earphone|gaming|wrist rest|kwg orion|thronmax/i.test(item.name)) type="peripheral";
      if(!type || !gamingProductAllowed(type,item.name,item.shortDescription)){ignored++;continue;}
      if(current){
        updates.push(existingUpdate(current,item,feedDate));
        offers.push({product_id:current.id,supplier_id:"esquire",supplier_name:"Esquire Technologies",supplier_sku:item.sku,cost_price:item.cost,currency:"ZAR",stock_qty:item.qty,stock_status:item.stockStatus,last_checked:feedDate+"T00:00:00Z",source_url:null,metadata:{feed_date:feedDate,supplier_category:item.category,image:item.image,import_version:"esquire-csv-v1"}});
        continue;
      }
      const id=await stableId(item.sku), b=brandOf(item.name)||"Unspecified";
      inserts.push({
        id,slug:id,type,brand:b,manufacturer:b,name:item.name,status:"active",visibility:"public",sale_mode:"quote",
        retail_price:null,currency:"ZAR",stock_status:item.stockStatus,stock_qty:item.qty,price_checked_at:feedDate+"T00:00:00Z",
        short_description:item.shortDescription,highlights:[],identifiers:{supplier:"esquire",supplierSku:item.sku,sku:item.sku},
        specs:{},compatibility:{},media:item.image?{primaryImage:item.image,directImage:item.image,images:[item.image],sourceType:"supplier-csv",imageStrategy:"supplier-feed"}:{},
        seo:{description:item.shortDescription},metadata:{source:"esquire-csv",supplier:"esquire",supplier_category:item.category,feed_date:feedDate,public_store_eligible:true,media_review_required:false,supplier_data_required:false,import_version:"esquire-csv-v1",stock_connected:true,pricing_state:"quote-first",auto_markup_disabled:true},
        featured:false,is_new:true,sort_priority:0,category_slug:type,condition:"new",is_demo:false
      });
      offers.push({product_id:id,supplier_id:"esquire",supplier_name:"Esquire Technologies",supplier_sku:item.sku,cost_price:item.cost,currency:"ZAR",stock_qty:item.qty,stock_status:item.stockStatus,last_checked:feedDate+"T00:00:00Z",source_url:null,metadata:{feed_date:feedDate,supplier_category:item.category,image:item.image,import_version:"esquire-csv-v1"}});
    }

    for(let i=0;i<updates.length;i+=100){
      const {error}=await admin.from("store_products").upsert(updates.slice(i,i+100),{onConflict:"id"});
      if(error) throw error;
    }
    for(let i=0;i<inserts.length;i+=100){
      const {error}=await admin.from("store_products").upsert(inserts.slice(i,i+100),{onConflict:"id",ignoreDuplicates:false});
      if(error) throw error;
    }
    for(let i=0;i<offers.length;i+=100){
      const {error}=await admin.from("store_supplier_offers").upsert(offers.slice(i,i+100),{onConflict:"product_id,supplier_id,supplier_sku"});
      if(error) throw error;
    }
    await admin.from("store_settings").update({catalogue_synced_at:new Date().toISOString(),catalogue_generated_at:feedDate}).eq("id","store");
    return reply({ok:true,feedRows:parsed.length,validRows:items.length,updated:updates.length,added:inserts.length,offers:offers.length,ignoredNewRows:ignored,feedDate},200,origin);
  }catch(error){
    console.error("import-esquire-catalogue fatal",error);
    return reply({error:"Esquire catalogue import failed"},500,origin);
  }
});
