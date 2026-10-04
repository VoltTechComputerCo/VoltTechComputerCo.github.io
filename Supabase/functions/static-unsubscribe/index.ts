import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const ALLOWED=new Set([
  "https://volttechcomputerco.co.za",
  "https://www.volttechcomputerco.co.za",
  "https://volttechcomputerco.github.io"
]);
function cors(req:Request){
  const origin=req.headers.get("origin")||"";
  return {
    "Access-Control-Allow-Origin":ALLOWED.has(origin)?origin:"https://volttechcomputerco.co.za",
    "Access-Control-Allow-Headers":"content-type",
    "Access-Control-Allow-Methods":"POST,OPTIONS",
    "Vary":"Origin"
  };
}
function json(req:Request,body:unknown,status=200){
  return Response.json(body,{status,headers:cors(req)});
}
function hex(bytes:Uint8Array){return [...bytes].map(b=>b.toString(16).padStart(2,"0")).join("");}
async function hmacHex(secret:string,message:string){
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  return hex(new Uint8Array(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(message))));
}
function timingSafeEqual(a:string,b:string){
  if(a.length!==b.length)return false;
  let out=0;
  for(let i=0;i<a.length;i++) out|=a.charCodeAt(i)^b.charCodeAt(i);
  return out===0;
}

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS") return new Response(null,{status:204,headers:cors(req)});
  if(req.method!=="POST") return json(req,{error:"Method not allowed"},405);

  let body:any={}; try{body=await req.json();}catch{}
  const token=String(body?.token||"").trim();
  const [id,sig]=token.split(".");
  if(!/^[0-9a-f-]{36}$/i.test(id||"") || !/^[0-9a-f]{64}$/i.test(sig||"")){
    return json(req,{error:"That unsubscribe link is invalid."},400);
  }

  const url=Deno.env.get("SUPABASE_URL");
  const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!url||!service) return json(req,{error:"Unsubscribe service unavailable."},500);
  const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});

  const {data:secret,error:secretError}=await admin.rpc("vt_get_static_signing_secret");
  if(secretError||!secret) return json(req,{error:"Unsubscribe service unavailable."},500);

  const expected=await hmacHex(secret,id);
  if(!timingSafeEqual(expected,sig)) return json(req,{error:"That unsubscribe link is invalid."},400);

  const now=new Date().toISOString();
  const {data:subscriber,error}=await admin.from("static_subscribers")
    .update({status:"unsubscribed",unsubscribed_at:now,updated_at:now})
    .eq("id",id)
    .select("email")
    .maybeSingle();

  if(error) return json(req,{error:"Could not unsubscribe this address."},500);
  if(!subscriber) return json(req,{ok:true,message:"This address is already unsubscribed."});

  // Supabase is authoritative for mail delivery. Resend contact sync is best-effort and may lag.
  return json(req,{ok:true,message:"You’re unsubscribed from STATIC article emails."});
});
