import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
function base64ToBytes(v:string){const b=atob(v);return Uint8Array.from(b,c=>c.charCodeAt(0))}
function bytesToBase64(bytes:Uint8Array){let b="";for(const x of bytes)b+=String.fromCharCode(x);return btoa(b)}
function safeEqual(a:string,b:string){if(a.length!==b.length)return false;let r=0;for(let i=0;i<a.length;i++)r|=a.charCodeAt(i)^b.charCodeAt(i);return r===0}
Deno.serve(async(req:Request)=>{
 if(req.method!=="POST")return new Response("Method not allowed",{status:405});
 try{
  const secret=Deno.env.get("YOCO_WEBHOOK_SECRET"),url=Deno.env.get("SUPABASE_URL"),service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!secret||!url||!service)return new Response("Server configuration error",{status:500});
  const id=req.headers.get("webhook-id"),ts=req.headers.get("webhook-timestamp"),sig=req.headers.get("webhook-signature");
  if(!id||!ts||!sig)return new Response("Invalid webhook",{status:400});
  const sec=Number(ts),now=Math.floor(Date.now()/1000);if(!Number.isFinite(sec)||Math.abs(now-sec)>180)return new Response("Stale webhook",{status:403});
  const raw=await req.text(),signed=`${id}.${ts}.${raw}`,encoded=secret.startsWith("whsec_")?secret.substring(6):secret,keyBytes=base64ToBytes(encoded);
  const cryptoKey=await crypto.subtle.importKey("raw",keyBytes,{name:"HMAC",hash:"SHA-256"},false,["sign"]);const buf=await crypto.subtle.sign("HMAC",cryptoKey,new TextEncoder().encode(signed));const expected=bytesToBase64(new Uint8Array(buf));
  const signatures=sig.split(" ").map(v=>v.split(",")).filter(p=>p.length===2&&p[0]==="v1").map(p=>p[1]);if(!signatures.some(s=>safeEqual(s,expected)))return new Response("Invalid signature",{status:403});
  const event=JSON.parse(raw),eventId=event?.id,eventType=event?.type,payload=event?.payload;if(!eventId||!eventType||!payload)return new Response("Invalid event",{status:400});
  const checkoutId=payload?.metadata?.checkoutId||payload?.checkoutId||payload?.metadata?.checkout_id;if(!checkoutId)return new Response("ok",{status:200});
  const admin=createClient(url,service);

  const {data:invoicePayment,error:invLookupError}=await admin.from("payments").select("id,invoice_id,user_id,amount,currency,status,provider_checkout_id").eq("provider","yoco").eq("provider_checkout_id",checkoutId).maybeSingle();
  if(invLookupError)return new Response("Database error",{status:500});
  if(invoicePayment){
    const {error:eventErr}=await admin.from("payment_events").insert({payment_id:invoicePayment.id,provider:"yoco",provider_event_id:eventId,event_type:eventType,payload:event});
    if(eventErr&&eventErr.code!=="23505"&&!eventErr.message?.toLowerCase().includes("duplicate"))return new Response("Database error",{status:500});
    if(eventType!=="payment.succeeded")return new Response("ok",{status:200});
    const amountCents=Number(payload.amount),expectedCents=Math.round(Number(invoicePayment.amount)*100);if(amountCents!==expectedCents||payload.currency!==invoicePayment.currency||payload.status!=="succeeded")return new Response("Payment verification failed",{status:409});
    const paidAt=new Date().toISOString();
    const {error:pErr}=await admin.from("payments").update({status:"succeeded",provider_payment_id:payload.id,paid_at:paidAt,updated_at:paidAt}).eq("id",invoicePayment.id);if(pErr)return new Response("Database error",{status:500});
    const {error:iErr}=await admin.from("invoices").update({status:"paid",paid_at:paidAt}).eq("id",invoicePayment.invoice_id).neq("status","paid");if(iErr)return new Response("Database error",{status:500});
    return new Response("ok",{status:200});
  }

  const {data:storePayment,error:storeLookupError}=await admin.from("store_payments").select("id,request_id,amount,currency,status,paid_at,provider_checkout_id").eq("provider","yoco").eq("provider_checkout_id",checkoutId).maybeSingle();
  if(storeLookupError)return new Response("Database error",{status:500});if(!storePayment)return new Response("ok",{status:200});
  const {error:storeEventErr}=await admin.from("store_payment_events").insert({store_payment_id:storePayment.id,provider:"yoco",provider_event_id:eventId,event_type:eventType,payload:event});
  // Recording a unique event is not proof that the remaining writes committed.
  // On a duplicate delivery, re-run the missing payment/order status updates.
  const duplicateEvent=!!storeEventErr&&(storeEventErr.code==="23505"||storeEventErr.message?.toLowerCase().includes("duplicate"));
  if(storeEventErr&&!duplicateEvent)return new Response("Database error",{status:500});
  if(eventType!=="payment.succeeded"){
    if(eventType.includes("failed")&&storePayment.status!=="succeeded"){
      const {error:failureErr}=await admin.from("store_payments")
        .update({status:"failed",updated_at:new Date().toISOString()})
        .eq("id",storePayment.id).neq("status","succeeded");
      if(failureErr)return new Response("Database error",{status:500});
    }
    return new Response("ok",{status:200});
  }
  const amountCents=Number(payload.amount),expectedCents=Math.round(Number(storePayment.amount)*100);
  if(amountCents!==expectedCents||payload.currency!==storePayment.currency||payload.status!=="succeeded")
    return new Response("Payment verification failed",{status:409});
  const paidAt=storePayment.paid_at||new Date().toISOString();
  if(storePayment.status!=="succeeded"){
    const {error:spErr}=await admin.from("store_payments")
      .update({status:"succeeded",provider_payment_id:payload.id,paid_at:paidAt,updated_at:paidAt})
      .eq("id",storePayment.id);
    if(spErr)return new Response("Database error",{status:500});
  }
  const {data:before,error:beforeErr}=await admin.from("store_requests")
    .select("id,request_number,user_id,payment_status,checkout_stage")
    .eq("id",storePayment.request_id).single();
  if(beforeErr||!before)return new Response("Database error",{status:500});
  let transitioned=false;
  if(before.payment_status!=="paid"){
    // A duplicate must never reset an already fulfilled order.
    const {data:updated,error:srErr}=await admin.from("store_requests")
      .update({payment_status:"paid",checkout_stage:"payment_received",
        automation_status:"ready_for_fulfillment",delivery_status:"awaiting_fulfillment",updated_at:paidAt})
      .eq("id",storePayment.request_id).neq("payment_status","paid")
      .select("id").maybeSingle();
    if(srErr)return new Response("Database error",{status:500});
    transitioned=!!updated;
  }
  const {data:reqRow,error:reqErr}=await admin.from("store_requests")
    .select("id,request_number,user_id,payment_status").eq("id",storePayment.request_id).single();
  if(reqErr||!reqRow||reqRow.payment_status!=="paid")return new Response("Database error",{status:500});
  if(transitioned){
    const {error:eventWriteErr}=await admin.from("store_automation_events").insert({
      request_id:storePayment.request_id,event_type:"payment_received",status:"succeeded",
      payload:{provider:"yoco",payment_id:storePayment.id,provider_payment_id:payload.id,amount:storePayment.amount}
    });
    if(eventWriteErr)console.warn("Store payment audit event not recorded",storePayment.request_id);
  }
  const notes:any[]=[{recipient_user_id:null,recipient_role:"admin",event_type:"store_payment_received",title:"PC parts order paid",message:`${reqRow.request_number} is paid and ready for fulfilment.`,action_url:"/admin-store.html",entity_type:"store_request",entity_id:reqRow.id,priority:"high",dedupe_key:`store-paid-admin:${reqRow.id}`}];
  if(reqRow.user_id)notes.push({recipient_user_id:reqRow.user_id,recipient_role:"customer",event_type:"store_payment_received",title:"Payment received",message:`Payment for ${reqRow.request_number} was received. We are preparing your order for courier collection.`,action_url:"/account.html",entity_type:"store_request",entity_id:reqRow.id,priority:"normal",dedupe_key:`store-paid:${reqRow.id}`});
  const {error:noticeErr}=await admin.from("notifications").upsert(notes,{onConflict:"dedupe_key",ignoreDuplicates:true});
  if(noticeErr)return new Response("Database error",{status:500});
  return new Response("ok",{status:200});
 }catch(e){console.error("yoco-webhook fatal",e);return new Response("Internal server error",{status:500})}
});