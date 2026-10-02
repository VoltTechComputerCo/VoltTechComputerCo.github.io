import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_ORIGIN = "https://volttechcomputerco.co.za";
const ALLOWED_ORIGINS = new Set([SITE_ORIGIN, "https://www.volttechcomputerco.co.za", "https://volttechcomputerco.github.io"]);
const originAllowed = (origin: string | null) => !origin || ALLOWED_ORIGINS.has(origin);
const headers = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin && ALLOWED_ORIGINS.has(origin) ? origin : SITE_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
  "Content-Type": "application/json"
});
const reply = (body: unknown, status = 200, origin: string | null = null) => new Response(JSON.stringify(body), { status, headers: headers(origin) });
const clean = (v: unknown, max = 200) => typeof v === "string" ? v.trim().slice(0, max) : "";
const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 254;
const phoneOk = (v: string) => /^[+0-9 ()-]{7,30}$/.test(v);
function randomToken(){const b=new Uint8Array(32);crypto.getRandomValues(b);return [...b].map(x=>x.toString(16).padStart(2,"0")).join("")}
async function sha256Hex(v:string){const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(v));return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,"0")).join("")}
function clientFingerprint(req:Request){
  const forwarded=(req.headers.get("x-forwarded-for")||"").split(",")[0].trim();
  const ip=forwarded||req.headers.get("x-real-ip")||req.headers.get("cf-connecting-ip")||"unknown";
  const ua=(req.headers.get("user-agent")||"unknown").slice(0,220);
  return ip+"|"+ua;
}
async function rateAllowed(admin:any,bucket:string,key:string,limit:number,windowSeconds:number){
  const keyHash=await sha256Hex(key);
  const {data,error}=await admin.rpc("consume_store_edge_rate_limit",{
    p_bucket:bucket,p_key_hash:keyHash,p_limit:limit,p_window_seconds:windowSeconds
  });
  if(error) throw error;
  return data===true;
}


Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: headers(origin) });
  if (req.method !== "POST") return reply({ error: "Method not allowed" }, 405, origin);
  if (!originAllowed(origin)) return reply({ error: "Origin not allowed" }, 403, origin);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceKey) return reply({ error: "Server configuration error" }, 500, origin);

    const admin = createClient(supabaseUrl, serviceKey);
    const authHeader = req.headers.get("authorization") || "";
    let user: any = null;
    if (authHeader.toLowerCase().startsWith("bearer ")) {
      const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
      const auth = await userClient.auth.getUser();
      if (!auth.error) user = auth.data?.user || null;
    }

    const body = await req.json().catch(() => null);
    if (!body || clean(body?.website, 120)) return reply({ error: "Invalid checkout request" }, 400, origin);
    const name = clean(body?.customer?.name, 120);
    const email = clean(body?.customer?.email, 254).toLowerCase();
    const phone = clean(body?.customer?.phone, 30);
    if (!name) return reply({ error: "Please enter your name." }, 400, origin);
    if (!emailOk(email)) return reply({ error: "Please enter a valid email address." }, 400, origin);
    if (!phoneOk(phone)) return reply({ error: "Please enter a valid phone number." }, 400, origin);
    const fingerprint=clientFingerprint(req);
    if(!(await rateAllowed(admin,"checkout_submit_fingerprint",fingerprint,6,900))) return reply({error:"Too many checkout attempts. Please wait a little and try again."},429,origin);
    if(!(await rateAllowed(admin,"checkout_submit_email",email,4,900))) return reply({error:"Too many checkout attempts for this email. Please wait a little and try again."},429,origin);

    const rawItems = Array.isArray(body?.items) ? body.items : [];
    if (!rawItems.length) return reply({ error: "Your cart is empty." }, 400, origin);
    if (rawItems.length > 30) return reply({ error: "Your cart can contain up to 30 different products." }, 400, origin);
    const quantities = new Map<string, number>();
    for (const raw of rawItems) {
      const productId = clean(raw?.productId, 120), quantity = Number(raw?.quantity);
      if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 25) return reply({ error: "One or more cart items are invalid." }, 400, origin);
      quantities.set(productId, Math.min(25, (quantities.get(productId) || 0) + quantity));
    }
    const ids = [...quantities.keys()];

    const method = clean(body?.delivery?.method, 30) || "door";
    if (!new Set(["door", "pickup_point"]).has(method)) return reply({ error: "Invalid delivery method." }, 400, origin);
    let shippingAddress: any = null, pickupProvider: string | null = null, pickupPoint: any = null;
    if (method === "door") {
      const a = body?.delivery?.address || {};
      shippingAddress = {recipient_name:name,phone,address_line1:clean(a.address_line1,160),address_line2:clean(a.address_line2,160)||null,suburb:clean(a.suburb,120)||null,city:clean(a.city,120),province:clean(a.province,120)||null,postal_code:clean(a.postal_code,20)||null,country:"South Africa"};
      if (!shippingAddress.address_line1 || !shippingAddress.city) return reply({ error: "Please complete the delivery address." }, 400, origin);
    } else {
      pickupProvider = clean(body?.delivery?.pickup_provider,60)||null; pickupPoint=body?.delivery?.pickup_point||null;
      if (!pickupProvider || !pickupPoint?.id) return reply({ error: "Please select a pickup point." }, 400, origin);
    }

    const { data: settings, error: settingsError } = await admin.from("store_settings").select("catalogue_enabled,currency").eq("id","store").single();
    if (settingsError || !settings?.catalogue_enabled) return reply({ error: "The VoltTech store is not accepting orders right now." }, 503, origin);
    const { data: products, error: productError } = await admin.from("store_products").select("id,slug,type,brand,name,status,visibility,sale_mode,retail_price,currency,stock_status,stock_qty,price_checked_at,media,specs,compatibility").in("id",ids);
    if (productError) throw productError;
    if (!products || products.length !== ids.length) return reply({ error: "One or more products are no longer available." }, 409, origin);
    const byId = new Map(products.map((p:any)=>[p.id,p]));
    for(const id of ids){const p:any=byId.get(id);if(!p||p.status!=="active"||p.visibility!=="public"||p.sale_mode==="hidden")return reply({error:`${p?.name||"A product"} is no longer available.`},409,origin)}

    const accessToken=randomToken(), tokenHash=await sha256Hex(accessToken), note=clean(body?.customerNote,1600)||null;
    const { data: requestRow, error: requestError } = await admin.from("store_requests").insert({
      user_id:user?.id||null,status:"submitted",source:"store_checkout",customer_note:note,item_count:[...quantities.values()].reduce((a,b)=>a+b,0),guest_name:name,guest_email:email,guest_phone:phone,checkout_stage:"pending_stock_confirmation",delivery_method:method,shipping_address:shippingAddress,pickup_provider:pickupProvider,pickup_point:pickupPoint,delivery_status:"pending",payment_status:"unpaid",public_token_hash:tokenHash,automation_status:"pending_stock_confirmation",metadata:{guest_checkout:!user,account_attached:!!user,currency:settings.currency||"ZAR",checkout_version:"volttech-commerce-v1.3",submitted_from:"store"}
    }).select("id,request_number,status,checkout_stage,submitted_at").single();
    if(requestError)throw requestError;

    const rows=ids.map(id=>{const p:any=byId.get(id);return{request_id:requestRow.id,user_id:user?.id||null,product_id:p.id,product_slug:p.slug,product_name:p.name,product_type:p.type,brand:p.brand,quantity:quantities.get(id),displayed_price:p.retail_price,displayed_currency:p.currency||settings.currency||"ZAR",price_checked_at:p.price_checked_at,stock_status:p.stock_status,image_url:p?.media?.primaryImage||p?.media?.primary_image||null,product_snapshot:{specs:p.specs||{},compatibility:p.compatibility||{},sale_mode:p.sale_mode,stock_qty:p.stock_qty,stock_status:p.stock_status}}});
    const {error:itemError}=await admin.from("store_request_items").insert(rows);if(itemError){await admin.from("store_requests").delete().eq("id",requestRow.id);throw itemError}
    await admin.from("store_automation_events").insert({request_id:requestRow.id,event_type:"checkout_submitted",status:"succeeded",payload:{account_attached:!!user,delivery_method:method}});

    const notifications:any[]=[{recipient_user_id:null,recipient_role:"admin",event_type:"store_checkout_submitted",title:"New PC parts checkout",message:`${requestRow.request_number} is waiting for stock, pricing and delivery confirmation.`,action_url:"/admin-store.html",entity_type:"store_request",entity_id:requestRow.id,priority:"high",dedupe_key:`store-checkout-admin:${requestRow.id}`}];
    if(user)notifications.push({recipient_user_id:user.id,recipient_role:"customer",event_type:"store_checkout_submitted",title:"Order received",message:`${requestRow.request_number} is being checked for stock and delivery before payment.`,action_url:"/account.html",entity_type:"store_request",entity_id:requestRow.id,priority:"normal",dedupe_key:`store-checkout:${requestRow.id}`});
    await admin.from("notifications").insert(notifications);

    return reply({ok:true,request:requestRow,account_attached:!!user,access_token:accessToken,status_url:`/order-status.html?ref=${encodeURIComponent(requestRow.request_number)}&token=${encodeURIComponent(accessToken)}`,message:"Order received. VoltTech is confirming stock, final pricing and delivery before payment."},200,origin);
  } catch (error) {
    console.error("submit-store-checkout fatal", error);
    return reply({ error: "We could not place the order. Please try again." }, 500, origin);
  }
});