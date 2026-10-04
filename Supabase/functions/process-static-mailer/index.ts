import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SITE="https://volttechcomputerco.co.za";
const FEED=SITE+"/static-feed.xml";

function esc(value:unknown){
  return String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
}
function decodeXml(value:string){
  return value
    .replace(/^<!\[CDATA\[/,"").replace(/\]\]>$/,"")
    .replaceAll("&amp;","&").replaceAll("&lt;","<").replaceAll("&gt;",">")
    .replaceAll("&quot;",'"').replaceAll("&#39;","'");
}
function field(item:string,tag:string){
  const match=item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`,"i"));
  return match?decodeXml(match[1].trim()):"";
}
function hex(bytes:Uint8Array){return [...bytes].map(b=>b.toString(16).padStart(2,"0")).join("");}
async function sha256(value:string){
  return hex(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value))));
}
async function hmacHex(secret:string,message:string){
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  return hex(new Uint8Array(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(message))));
}
function emailHtml(title:string,description:string,url:string,unsubscribeUrl:string){
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta http-equiv="X-UA-Compatible" content="IE=edge"></head>
<body style="margin:0;background-color:#100b07;font-family:Arial,Helvetica,sans-serif;color:#fff8f0;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" bgcolor="#100b07"><tr><td align="center" style="padding-top:32px;padding-right:16px;padding-bottom:32px;padding-left:16px;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width:600px;background-color:#17100b;border:1px solid #ff7a32;">
<tr><td bgcolor="#17100b" style="padding-top:28px;padding-right:28px;padding-bottom:18px;padding-left:28px;">
<p style="margin-top:0;margin-right:0;margin-bottom:8px;margin-left:0;font-size:12px;line-height:18px;color:#ff7a32;font-family:Arial,Helvetica,sans-serif;font-weight:700;letter-spacing:1.2px;">STATIC / NEW SIGNAL</p>
<h1 style="margin-top:0;margin-right:0;margin-bottom:12px;margin-left:0;font-size:28px;line-height:34px;color:#ffffff;font-family:Arial,Helvetica,sans-serif;">${esc(title)}</h1>
<p style="margin-top:0;margin-right:0;margin-bottom:22px;margin-left:0;font-size:16px;line-height:25px;color:#d8c5b6;font-family:Arial,Helvetica,sans-serif;">${esc(description)}</p>
<table cellpadding="0" cellspacing="0" border="0" role="presentation"><tr><td bgcolor="#ff7a32" style="padding-top:12px;padding-right:18px;padding-bottom:12px;padding-left:18px;">
<a href="${esc(url)}" style="font-size:15px;line-height:20px;color:#160b05;font-family:Arial,Helvetica,sans-serif;font-weight:700;text-decoration:none;">Read the full signal</a>
</td></tr></table>
</td></tr>
<tr><td style="padding-top:18px;padding-right:28px;padding-bottom:26px;padding-left:28px;border-top:1px solid #3b2416;">
<p style="margin-top:0;margin-right:0;margin-bottom:8px;margin-left:0;font-size:12px;line-height:18px;color:#b48e70;font-family:Arial,Helvetica,sans-serif;">STATIC · Tech, gaming &amp; nerd culture by VoltTech</p>
<p style="margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;font-size:12px;line-height:18px;color:#8c6c55;font-family:Arial,Helvetica,sans-serif;">You received this because you confirmed the STATIC article list. <a href="${esc(unsubscribeUrl)}" style="color:#ff9a60;text-decoration:underline;">Unsubscribe</a></p>
</td></tr></table></td></tr></table></body></html>`;
}

Deno.serve(async(req:Request)=>{
  if(req.method!=="POST") return new Response("Method not allowed",{status:405});

  const supabaseUrl=Deno.env.get("SUPABASE_URL");
  const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!supabaseUrl||!service) return Response.json({error:"Runtime configuration unavailable"},{status:500});
  const admin=createClient(supabaseUrl,service,{auth:{persistSession:false,autoRefreshToken:false}});

  const {data:expected,error:tokenError}=await admin.rpc("vt_get_mailer_cron_token");
  if(tokenError||!expected||req.headers.get("x-volttech-mailer-token")!==expected){
    return Response.json({error:"Unauthorized"},{status:401});
  }

  try{
    const feedResponse=await fetch(FEED,{headers:{"User-Agent":"STATIC-Mailer/1.0","Cache-Control":"no-cache"}});
    if(!feedResponse.ok) throw new Error(`RSS HTTP ${feedResponse.status}`);
    const xml=await feedResponse.text();
    const item=xml.match(/<item>([\s\S]*?)<\/item>/i)?.[1];
    if(!item) throw new Error("STATIC feed contains no article");

    const title=field(item,"title");
    const url=field(item,"link");
    const guid=field(item,"guid")||url;
    const description=field(item,"description");
    if(!title||!url||!guid) throw new Error("STATIC feed lead article is incomplete");

    const {error:insertError}=await admin.from("static_newsletter_runs").insert({
      guid,title,url,description,status:"processing"
    });
    if(insertError){
      if(insertError.code==="23505") return Response.json({ok:true,skipped:true,reason:"already_processed",guid});
      throw insertError;
    }

    const {data:subscribers,error:subError}=await admin.from("static_subscribers")
      .select("id,email")
      .eq("status","active")
      .order("created_at",{ascending:true});
    if(subError) throw subError;

    const list=subscribers||[];
    if(!list.length){
      await admin.from("static_newsletter_runs").update({
        status:"no_subscribers",subscriber_count:0,sent_count:0,failed_count:0,completed_at:new Date().toISOString()
      }).eq("guid",guid);
      return Response.json({ok:true,guid,status:"no_subscribers"});
    }

    const [{data:apiKey,error:keyError},{data:signingSecret,error:signError}]=await Promise.all([
      admin.rpc("vt_get_resend_api_key"),
      admin.rpc("vt_get_static_signing_secret")
    ]);
    if(keyError||!apiKey) throw new Error("Resend API key unavailable");
    if(signError||!signingSecret) throw new Error("STATIC signing secret unavailable");

    let sent=0,failed=0;

    for(let start=0;start<list.length;start+=10){
      const chunk=list.slice(start,start+10);
      await Promise.all(chunk.map(async(subscriber:any)=>{
        try{
          const sig=await hmacHex(signingSecret,subscriber.id);
          const unsubscribeToken=`${subscriber.id}.${sig}`;
          const unsubscribeUrl=`${SITE}/static.html?unsubscribe=${encodeURIComponent(unsubscribeToken)}#subscribe`;
          const idempotencyHash=(await sha256(guid)).slice(0,24);
          const response=await fetch("https://api.resend.com/emails",{
            method:"POST",
            headers:{
              "Authorization":`Bearer ${apiKey}`,
              "Content-Type":"application/json",
              "Idempotency-Key":`static-${idempotencyHash}-${subscriber.id}`
            },
            body:JSON.stringify({
              from:"STATIC <static@volttechcomputerco.co.za>",
              to:[subscriber.email],
              subject:`STATIC: ${title}`,
              html:emailHtml(title,description,url,unsubscribeUrl),
              text:`STATIC / NEW SIGNAL\n\n${title}\n\n${description}\n\nRead: ${url}\n\nUnsubscribe: ${unsubscribeUrl}`,
              headers:{
                "List-Unsubscribe":`<${unsubscribeUrl}>`,
                "List-Unsubscribe-Post":"List-Unsubscribe=One-Click"
              },
              tags:[{name:"kind",value:"static_article"}]
            })
          });
          const responseBody=await response.json().catch(()=>({}));
          if(!response.ok) throw new Error(responseBody?.message||`Resend HTTP ${response.status}`);
          await admin.from("static_newsletter_deliveries").upsert({
            run_guid:guid,subscriber_id:subscriber.id,recipient_email:subscriber.email,
            status:"sent",provider_message_id:responseBody?.id||null,error_message:null,sent_at:new Date().toISOString()
          },{onConflict:"run_guid,subscriber_id"});
          sent++;
        }catch(error){
          const message=error instanceof Error?error.message:String(error);
          await admin.from("static_newsletter_deliveries").upsert({
            run_guid:guid,subscriber_id:subscriber.id,recipient_email:subscriber.email,
            status:"failed",provider_message_id:null,error_message:message,sent_at:null
          },{onConflict:"run_guid,subscriber_id"});
          failed++;
        }
      }));
    }

    const status=failed===0?"sent":sent>0?"partial":"failed";
    await admin.from("static_newsletter_runs").update({
      status,subscriber_count:list.length,sent_count:sent,failed_count:failed,
      completed_at:new Date().toISOString(),
      error_message:failed&&sent===0?"All STATIC deliveries failed":null
    }).eq("guid",guid);

    return Response.json({ok:true,guid,status,subscriber_count:list.length,sent_count:sent,failed_count:failed});
  }catch(error){
    const message=error instanceof Error?error.message:String(error);
    return Response.json({error:message},{status:500});
  }
});
