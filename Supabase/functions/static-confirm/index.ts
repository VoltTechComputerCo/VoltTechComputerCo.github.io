import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend";

const ALLOWED = new Set([
  "https://volttechcomputerco.co.za",
  "https://www.volttechcomputerco.co.za",
  "https://volttechcomputerco.github.io"
]);
const STATIC_SEGMENT = "3ad958a8-be3a-44e3-a726-e070693cc62b";
const STATIC_TOPIC = "094c4d6c-87fa-48e9-8a23-5011ea78e4b0";

function cors(req: Request) {
  const origin=req.headers.get("origin")||"";
  return {
    "Access-Control-Allow-Origin":ALLOWED.has(origin)?origin:"https://volttechcomputerco.co.za",
    "Access-Control-Allow-Headers":"content-type",
    "Access-Control-Allow-Methods":"POST,OPTIONS",
    "Vary":"Origin"
  };
}
function json(req: Request,body: unknown,status=200){
  return Response.json(body,{status,headers:cors(req)});
}
function hex(bytes: Uint8Array){return [...bytes].map(b=>b.toString(16).padStart(2,"0")).join("");}
async function sha256(value:string){
  return hex(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value))));
}

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS") return new Response(null,{status:204,headers:cors(req)});
  if(req.method!=="POST") return json(req,{error:"Method not allowed"},405);

  let body:any={}; try{body=await req.json();}catch{}
  const token=String(body?.token||"").trim();
  if(!/^[a-f0-9]{64}$/i.test(token)) return json(req,{error:"That confirmation link is invalid."},400);

  const url=Deno.env.get("SUPABASE_URL");
  const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!url||!service) return json(req,{error:"Confirmation service unavailable."},500);
  const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});

  const hash=await sha256(token);
  const {data:subscriber,error}=await admin.from("static_subscribers")
    .select("id,email,status")
    .eq("confirmation_token_hash",hash)
    .maybeSingle();
  if(error) return json(req,{error:"Could not confirm your subscription."},500);
  if(!subscriber) return json(req,{error:"That confirmation link is invalid or has expired."},400);

  if(subscriber.status!=="active"){
    const now=new Date().toISOString();
    const {error:updateError}=await admin.from("static_subscribers").update({
      status:"active",
      confirmed_at:now,
      unsubscribed_at:null,
      confirmation_token_hash:null,
      updated_at:now
    }).eq("id",subscriber.id);
    if(updateError) return json(req,{error:"Could not activate your subscription."},500);
  }

  // Best-effort Resend audience sync. Supabase remains the source of truth.
  try{
    const {data:apiKey}=await admin.rpc("vt_get_resend_api_key");
    if(apiKey){
      const resend=new Resend(apiKey);
      await resend.contacts.create({
        email:subscriber.email,
        unsubscribed:false,
        segmentIds:[STATIC_SEGMENT],
        topics:[{id:STATIC_TOPIC,subscription:"opt_in"}]
      } as any);
    }
  }catch{}

  return json(req,{ok:true,message:"You’re subscribed. The next STATIC signal will land in your inbox."});
});
