import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const ALLOWED = new Set([
  "https://volttechcomputerco.co.za",
  "https://www.volttechcomputerco.co.za",
  "https://volttechcomputerco.github.io"
]);

function cors(req: Request) {
  const origin = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED.has(origin) ? origin : "https://volttechcomputerco.co.za",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Vary": "Origin"
  };
}
function json(req: Request, body: unknown, status=200) {
  return Response.json(body, { status, headers: cors(req) });
}
function hex(bytes: Uint8Array) {
  return [...bytes].map(b=>b.toString(16).padStart(2,"0")).join("");
}
async function sha256(value: string) {
  return hex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))));
}
function confirmationHtml(link: string) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta http-equiv="X-UA-Compatible" content="IE=edge"></head>
<body style="margin:0;background-color:#100b07;font-family:Arial,Helvetica,sans-serif;color:#fff8f0;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" bgcolor="#100b07"><tr><td align="center" style="padding-top:32px;padding-right:16px;padding-bottom:32px;padding-left:16px;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width:600px;background-color:#17100b;border:1px solid #ff7a32;">
<tr><td style="padding-top:28px;padding-right:28px;padding-bottom:28px;padding-left:28px;">
<p style="margin-top:0;margin-right:0;margin-bottom:8px;margin-left:0;font-size:12px;line-height:18px;color:#ff7a32;font-family:Arial,Helvetica,sans-serif;font-weight:700;letter-spacing:1.2px;">STATIC / SUBSCRIBE</p>
<h1 style="margin-top:0;margin-right:0;margin-bottom:14px;margin-left:0;font-size:28px;line-height:34px;color:#ffffff;font-family:Arial,Helvetica,sans-serif;">Confirm your signal.</h1>
<p style="margin-top:0;margin-right:0;margin-bottom:22px;margin-left:0;font-size:16px;line-height:25px;color:#d8c5b6;font-family:Arial,Helvetica,sans-serif;">Confirm your email to receive new STATIC articles. No store promotions and no unrelated marketing.</p>
<table cellpadding="0" cellspacing="0" border="0" role="presentation"><tr><td bgcolor="#ff7a32" style="padding-top:12px;padding-right:18px;padding-bottom:12px;padding-left:18px;">
<a href="${link}" style="font-size:15px;line-height:20px;color:#160b05;font-family:Arial,Helvetica,sans-serif;font-weight:700;text-decoration:none;">Confirm subscription</a>
</td></tr></table>
</td></tr></table></td></tr></table></body></html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null,{status:204,headers:cors(req)});
  if (req.method !== "POST") return json(req,{error:"Method not allowed"},405);

  let body: any = {};
  try { body = await req.json(); } catch {}
  if (String(body?.website || "").trim()) return json(req,{ok:true,message:"Check your inbox to confirm."});

  const email = String(body?.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
    return json(req,{error:"Enter a valid email address."},400);
  }

  const url=Deno.env.get("SUPABASE_URL");
  const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!url||!service) return json(req,{error:"Subscription service unavailable."},500);
  const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});

  const {data:existing}=await admin.from("static_subscribers")
    .select("id,status,confirmation_sent_at")
    .ilike("email",email)
    .maybeSingle();

  if(existing?.status==="active"){
    return json(req,{ok:true,message:"You’re already subscribed to STATIC."});
  }
  if(existing?.confirmation_sent_at && Date.now()-new Date(existing.confirmation_sent_at).getTime() < 5*60*1000){
    return json(req,{ok:true,message:"A confirmation email was already sent. Check your inbox."});
  }

  const tokenBytes=new Uint8Array(32); crypto.getRandomValues(tokenBytes);
  const token=hex(tokenBytes);
  const tokenHash=await sha256(token);
  const now=new Date().toISOString();

  if(existing?.id){
    const {error}=await admin.from("static_subscribers").update({
      status:"pending",
      confirmation_token_hash:tokenHash,
      consent_at:now,
      consent_version:"1.0",
      unsubscribed_at:null,
      updated_at:now
    }).eq("id",existing.id);
    if(error) return json(req,{error:"Could not save your subscription."},500);
  } else {
    const {error}=await admin.from("static_subscribers").insert({
      email,status:"pending",source:"static_site",consent_version:"1.0",
      consent_at:now,confirmation_token_hash:tokenHash
    });
    if(error) return json(req,{error:"Could not save your subscription."},500);
  }

  const {data:apiKey,error:keyError}=await admin.rpc("vt_get_resend_api_key");
  if(keyError||!apiKey) return json(req,{error:"Email service unavailable."},500);

  const link=`https://volttechcomputerco.co.za/static.html?confirm=${encodeURIComponent(token)}#subscribe`;
  const send=await fetch("https://api.resend.com/emails",{
    method:"POST",
    headers:{"Authorization":`Bearer ${apiKey}`,"Content-Type":"application/json"},
    body:JSON.stringify({
      from:"STATIC <static@volttechcomputerco.co.za>",
      to:[email],
      subject:"Confirm your STATIC subscription",
      html:confirmationHtml(link),
      text:`Confirm your STATIC subscription: ${link}\n\nYou requested new STATIC article alerts only.`
    })
  });
  const sent=await send.json().catch(()=>({}));
  if(!send.ok) return json(req,{error:sent?.message||"Could not send confirmation email."},502);

  await admin.from("static_subscribers").update({
    confirmation_sent_at:new Date().toISOString(),
    updated_at:new Date().toISOString()
  }).ilike("email",email);

  return json(req,{ok:true,message:"Check your inbox and confirm your STATIC subscription."});
});
