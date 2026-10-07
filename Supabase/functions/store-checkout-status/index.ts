import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const SITE_ORIGIN="https://volttechcomputerco.co.za";
const ALLOWED_ORIGINS=new Set([SITE_ORIGIN,"https://www.volttechcomputerco.co.za","https://volttechcomputerco.github.io"]);
const originAllowed=(origin:string|null)=>!origin||ALLOWED_ORIGINS.has(origin);
const headers=(o:string|null)=>({"Access-Control-Allow-Origin":o&&ALLOWED_ORIGINS.has(o)?o:SITE_ORIGIN,"Access-Control-Allow-Headers":"content-type, apikey, authorization, x-client-info","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json","Vary":"Origin"});
const reply=(b:unknown,s=200,o:string|null=null)=>new Response(JSON.stringify(b),{status:s,headers:headers(o)});
const clean=(v:unknown,m=200)=>typeof v==="string"?v.trim().slice(0,m):"";
async function sha256Hex(v:string){const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(v));return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,"0")).join("")}
function clientFingerprint(req:Request){
  const forwarded=(req.headers.get("x-forwarded-for")||"").split(",")[0].trim();
  const ip=forwarded||req.headers.get("x-real-ip")||req.headers.get("cf-connecting-ip")||"unknown";
  const ua=(req.headers.get("user-agent")||"unknown").slice(0,220);
  return ip+"|"+ua;
}
async function rateAllowed(admin:any,bucket:string,key:string,limit:number,windowSeconds:number){
  const keyHash=await sha256Hex(key);
  const {data,error}=await admin.rpc("consume_store_edge_rate_limit",{p_bucket:bucket,p_key_hash:keyHash,p_limit:limit,p_window_seconds:windowSeconds});
  if(error) throw error;
  return data===true;
}

Deno.serve(async(req:Request)=>{const origin=req.headers.get("origin");if(req.method==="OPTIONS")return new Response("ok",{headers:headers(origin)});if(req.method!=="POST")return reply({error:"Method not allowed"},405,origin);if(!originAllowed(origin))return reply({error:"Origin not allowed"},403,origin);
try{const url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");if(!url||!key)return reply({error:"Server configuration error"},500,origin);const body=await req.json().catch(()=>null),ref=clean(body?.ref,80),token=clean(body?.token,160);if(!ref||!token)return reply({error:"Missing order access details"},400,origin);const hash=await sha256Hex(token),admin=createClient(url,key);if(!(await rateAllowed(admin,"checkout_status_token",ref+"|"+token,90,600)))return reply({error:"Too many status checks. Please wait a moment."},429,origin);if(!(await rateAllowed(admin,"checkout_status_fingerprint",clientFingerprint(req),120,600)))return reply({error:"Too many status checks. Please wait a moment."},429,origin);const {data:r,error}=await admin.from("store_requests").select("id,request_number,checkout_stage,delivery_method,delivery_status,courier_name,tracking_number,tracking_url,shipping_provider,shipping_service,shipping_eta,final_subtotal,final_delivery_fee,final_total,payment_status,submitted_at,confirmed_at,store_request_items(product_name,brand,quantity,displayed_price,displayed_currency,stock_status,image_url)").eq("request_number",ref).eq("public_token_hash",hash).maybeSingle();if(error)throw error;if(!r)return reply({error:"Order not found"},404,origin);const {data:ops,error:opsError}=await admin.from("operations_jobs").select("final_invoice,quote_details,stock_confirmed_at,pricing_confirmed_at,approval,quote_sent_at,supplier_order_at,courier_booked_at,waybill_sent_at,waybill_approved_at,collected_at,in_transit_at,delivered_at").eq("entity_key","store:"+r.id).maybeSingle();if(opsError)throw opsError;
if(body?.action){if(!["accepted","declined"].includes(body.action))return reply({error:"Invalid approval action"},400,origin);const result=await admin.rpc("operations_customer_approval",{p_id:r.id,p_action:body.action});if(result.error)return reply({error:"This quotation is no longer awaiting your approval"},409,origin);return reply({ok:true},200,origin);}
const {data:updates,error:updatesError}=await admin.from("email_outbox").select("payload,created_at").eq("message_kind","operations_customer").eq("source_type","customer_workflow").eq("source_id","store:"+r.id).order("created_at",{ascending:false}).limit(40);if(updatesError)throw updatesError;
const trackingReady=!!ops?.waybill_approved_at;
const gate=await admin.rpc("operations_payment_ready",{p_kind:"store",p_id:r.id});
return reply({ok:true,order:{request_number:r.request_number,checkout_stage:r.checkout_stage,delivery_method:r.delivery_method,delivery_status:r.delivery_status,courier_name:r.courier_name,tracking_number:trackingReady?r.tracking_number:null,tracking_url:trackingReady?r.tracking_url:null,shipping_provider:r.shipping_provider,shipping_service:r.shipping_service,shipping_eta:r.shipping_eta,subtotal:r.final_subtotal,delivery_fee:r.final_delivery_fee,total:r.final_total,payment_status:r.payment_status,submitted_at:r.submitted_at,confirmed_at:r.confirmed_at,workflow:ops||{},updates:(updates||[]).map(u=>({message:u.payload?.message||"Order updated",created_at:u.created_at})),can_pay:!gate.error&&gate.data===true&&r.checkout_stage==="awaiting_payment"&&r.payment_status!=="paid"&&Number(r.final_total)>0,items:r.store_request_items||[]}},200,origin)}catch(e){console.error("store-checkout-status",e);return reply({error:"Could not load the order"},500,origin)}});
