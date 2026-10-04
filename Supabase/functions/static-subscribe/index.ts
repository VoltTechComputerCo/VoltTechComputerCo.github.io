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
  const logo="https://volttechcomputerco.co.za/STATIC-logo-master.png";
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
</head>
<body style="margin:0;background-color:#02090a;font-family:Arial,Helvetica,sans-serif;color:#f2f8f7;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" bgcolor="#02090a">
<tr><td align="center" style="padding:30px 14px 36px 14px;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width:640px;background-color:#061214;border:1px solid rgba(255,180,84,.42);box-shadow:0 0 28px rgba(255,180,84,.10);">
    <tr><td align="center" style="padding:28px 28px 24px 28px;background-color:#030d0f;">
      <img src="${logo}" width="190" alt="STATIC" style="display:block;width:190px;max-width:72%;height:auto;margin:0 auto;border:0;outline:none;">
    </td></tr>
    <tr><td style="height:3px;line-height:3px;font-size:1px;background-color:#ffb454;box-shadow:0 0 16px rgba(255,180,84,.75);">&nbsp;</td></tr>
    <tr><td style="padding:30px;background:linear-gradient(180deg,#0a1719 0%,#061214 100%);">
      <p style="margin:0 0 10px;color:#ffb454;font-size:11px;line-height:16px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;">// STATIC / SUBSCRIBE</p>
      <h1 style="margin:0 0 14px;color:#ffffff;font-size:32px;line-height:38px;font-weight:800;letter-spacing:-.7px;">Confirm your signal.</h1>
      <div style="width:68px;height:2px;background-color:#33d6c5;box-shadow:0 0 12px rgba(51,214,197,.55);margin:0 0 20px;"></div>
      <p style="margin:0 0 24px;color:#b9c8c5;font-size:16px;line-height:26px;">Confirm your email to receive new STATIC articles when they drop. No store promotions. No unrelated marketing. Just the next signal.</p>
      <table cellpadding="0" cellspacing="0" border="0" role="presentation"><tr><td bgcolor="#ffb454" style="border:1px solid #ffd59a;background:linear-gradient(135deg,#d67d2c 0%,#ffb454 52%,#ffd59a 100%);box-shadow:0 0 14px rgba(255,180,84,.38),0 0 28px rgba(255,180,84,.16);">
        <a href="${link}" style="display:inline-block;padding:14px 22px;color:#130b04;font-size:14px;line-height:18px;font-weight:900;letter-spacing:.4px;text-decoration:none;text-transform:uppercase;">Confirm subscription &nbsp;→</a>
      </td></tr></table>
    </td></tr>
    <tr><td style="padding:18px 30px 24px;background-color:#041012;border-top:1px solid rgba(255,180,84,.16);">
      <p style="margin:0 0 5px;color:#f2f8f7;font-size:11px;line-height:17px;font-weight:800;letter-spacing:.4px;">STATIC by VoltTech Computer Co.</p>
      <p style="margin:0;color:#6f8581;font-size:10px;line-height:16px;">Tech · gaming · hardware · South Africa builds differently.</p>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
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
