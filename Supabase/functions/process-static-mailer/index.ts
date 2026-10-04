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
function decodeHtml(value:string){
  return value
    .replaceAll("&amp;","&").replaceAll("&lt;","<").replaceAll("&gt;",">")
    .replaceAll("&quot;",'"').replaceAll("&#39;","'").replaceAll("&#x27;","'")
    .replaceAll("&nbsp;"," ");
}
function cleanText(value:string){
  return decodeHtml(String(value||"").replace(/<[^>]+>/g," ")).replace(/\s+/g," ").trim();
}
function metaValue(html:string,key:string){
  for(const match of html.matchAll(/<meta\b[^>]*>/gi)){
    const tag=match[0];
    const attrs:any={};
    for(const a of tag.matchAll(/([:\w-]+)\s*=\s*["']([^"']*)["']/g)) attrs[a[1].toLowerCase()]=a[2];
    if((attrs.property||attrs.name||"").toLowerCase()===key.toLowerCase()) return decodeHtml(attrs.content||"");
  }
  return "";
}
function classParagraph(html:string,className:string){
  const re=new RegExp(`<p[^>]*class=["'][^"']*\\b${className}\\b[^"']*["'][^>]*>([\\s\\S]*?)<\\/p>`,"i");
  return cleanText(html.match(re)?.[1]||"");
}
function firstArticleParagraphs(html:string,limit=2){
  const article=html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)?.[1]||"";
  return [...article.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
    .map(m=>cleanText(m[1]))
    .filter(Boolean)
    .slice(0,limit);
}
async function enrichArticle(url:string,fallback:string){
  try{
    const response=await fetch(url,{headers:{"User-Agent":"STATIC-Mailer/2.0","Cache-Control":"no-cache"}});
    if(!response.ok) throw new Error("Article HTTP "+response.status);
    const html=await response.text();
    const deck=classParagraph(html,"static-article-dek")||metaValue(html,"og:description")||fallback;
    const paragraphs=firstArticleParagraphs(html,2);
    const summary=paragraphs.length?paragraphs.join("\n\n"):fallback;
    const hero=metaValue(html,"og:image")||metaValue(html,"twitter:image")||
      decodeHtml(html.match(/<figure[^>]*class=["'][^"']*static-article-hero[^"']*["'][^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["']/i)?.[1]||"");
    const kicker=classParagraph(html,"static-article-kicker");
    return {deck,summary,hero,kicker};
  }catch{
    return {deck:fallback,summary:fallback,hero:"",kicker:""};
  }
}
function hex(bytes:Uint8Array){return [...bytes].map(b=>b.toString(16).padStart(2,"0")).join("");}
async function sha256(value:string){
  return hex(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value))));
}
async function hmacHex(secret:string,message:string){
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  return hex(new Uint8Array(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(message))));
}
function emailHtml(title:string,deck:string,summary:string,hero:string,kicker:string,url:string,unsubscribeUrl:string){
  const logo=SITE+"/STATIC-logo-master.png";
  const whatsapp=SITE+"/whatsapp-logo.svg";
  const summaryParts=String(summary||"").split(/\n\n+/).filter(Boolean).slice(0,2);
  const summaryHtml=summaryParts.map(p=>`<p style="margin:0 0 14px;color:#b9c8c5;font-size:15px;line-height:24px;">${esc(p)}</p>`).join("");
  const heroHtml=hero?`<tr><td style="padding:0 24px 0 24px;background-color:#030d0f;"><img src="${esc(hero)}" alt="" width="592" style="display:block;width:100%;max-width:592px;height:auto;border:1px solid rgba(255,180,84,.32);box-shadow:0 0 22px rgba(255,180,84,.10);"></td></tr>`:"";
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta http-equiv="X-UA-Compatible" content="IE=edge"></head>
<body style="margin:0;background-color:#02090a;font-family:Arial,Helvetica,sans-serif;color:#f2f8f7;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" bgcolor="#02090a">
<tr><td align="center" style="padding:30px 12px 36px;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width:640px;background-color:#061214;border:1px solid rgba(255,180,84,.42);box-shadow:0 0 28px rgba(255,180,84,.10);">
  <tr><td align="center" style="padding:27px 28px 23px;background-color:#030d0f;">
    <img src="${logo}" width="190" alt="STATIC" style="display:block;width:190px;max-width:72%;height:auto;margin:0 auto;border:0;">
  </td></tr>
  <tr><td style="height:3px;line-height:3px;font-size:1px;background-color:#ffb454;box-shadow:0 0 16px rgba(255,180,84,.72);">&nbsp;</td></tr>
  ${heroHtml}
  <tr><td style="padding:28px 30px 12px;background:linear-gradient(180deg,#0a1719 0%,#061214 100%);">
    <p style="margin:0 0 9px;color:#ffb454;font-size:10px;line-height:16px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;">// ${esc(kicker||"STATIC / NEW SIGNAL")}</p>
    <h1 style="margin:0 0 14px;color:#ffffff;font-size:30px;line-height:36px;font-weight:900;letter-spacing:-.7px;">${esc(title)}</h1>
    <div style="width:74px;height:2px;background-color:#33d6c5;box-shadow:0 0 12px rgba(51,214,197,.55);margin:0 0 18px;"></div>
    <p style="margin:0;color:#f0d6b7;font-size:17px;line-height:27px;font-weight:600;">${esc(deck)}</p>
  </td></tr>
  <tr><td style="padding:18px 30px 8px;background-color:#061214;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color:#08191b;border:1px solid rgba(51,214,197,.20);box-shadow:inset 0 1px 0 rgba(255,255,255,.03);">
      <tr><td style="padding:20px 20px 8px;">
        <p style="margin:0 0 12px;color:#33d6c5;font-size:10px;line-height:16px;font-weight:900;letter-spacing:1.2px;text-transform:uppercase;">WHY THIS SIGNAL MATTERS</p>
        ${summaryHtml}
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:22px 30px 30px;background-color:#061214;">
    <table cellpadding="0" cellspacing="0" border="0" role="presentation"><tr><td bgcolor="#ffb454" style="border:1px solid #ffd59a;background:linear-gradient(135deg,#d67d2c 0%,#ffb454 52%,#ffd59a 100%);box-shadow:0 0 14px rgba(255,180,84,.38),0 0 28px rgba(255,180,84,.16);">
      <a href="${esc(url)}" style="display:inline-block;padding:14px 22px;color:#130b04;font-size:14px;line-height:18px;font-weight:900;letter-spacing:.4px;text-decoration:none;text-transform:uppercase;">Read the full signal &nbsp;→</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="padding:18px 30px;background-color:#041012;border-top:1px solid rgba(255,180,84,.16);">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
      <tr>
        <td style="color:#f2f8f7;font-size:11px;line-height:17px;font-weight:800;">STATIC by VoltTech Computer Co.</td>
        <td align="right"><table cellpadding="0" cellspacing="0" border="0" role="presentation"><tr>
<td style="padding-left:6px;"><a href="https://www.instagram.com/volttechcomputerco/" style="display:block;padding:6px;background-color:#d62976;border:1px solid rgba(255,255,255,.16);"><img src="https://volttechcomputerco.co.za/instagram-logo.svg" width="18" height="18" alt="Instagram" style="display:block;width:18px;height:18px;border:0;"></a></td>
<td style="padding-left:6px;"><a href="https://www.tiktok.com/@volttechcomputerco" style="display:block;padding:6px;background-color:#111111;border:1px solid rgba(255,255,255,.16);"><img src="https://volttechcomputerco.co.za/tiktok-logo.svg" width="18" height="18" alt="TikTok" style="display:block;width:18px;height:18px;border:0;"></a></td>
<td style="padding-left:6px;"><a href="https://www.facebook.com/share/1MEoYu4i8N/" style="display:block;padding:6px;background-color:#1877f2;border:1px solid rgba(255,255,255,.16);"><img src="https://volttechcomputerco.co.za/facebook-logo.svg" width="18" height="18" alt="Facebook" style="display:block;width:18px;height:18px;border:0;"></a></td>
<td style="padding-left:6px;"><a href="https://wa.me/27618435775" style="display:block;padding:6px;background-color:#25d366;border:1px solid rgba(255,255,255,.16);"><img src="https://volttechcomputerco.co.za/whatsapp-logo.svg" width="18" height="18" alt="WhatsApp" style="display:block;width:18px;height:18px;border:0;"></a></td>
</tr></table></td>
      </tr>
    </table>
    <p style="margin:9px 0 0;color:#6f8581;font-size:10px;line-height:16px;">Tech · gaming · hardware · South Africa builds differently.</p>
    <p style="margin:8px 0 0;color:#6f8581;font-size:10px;line-height:16px;">You received this because you confirmed the STATIC article list. <a href="${esc(unsubscribeUrl)}" style="color:#ffb454;text-decoration:underline;">Unsubscribe</a></p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
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
    const enriched=await enrichArticle(url,description);

    const {error:insertError}=await admin.from("static_newsletter_runs").insert({
      guid,title,url,description:enriched.deck||description,status:"processing"
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
              html:emailHtml(title,enriched.deck||description,enriched.summary||description,enriched.hero||"",enriched.kicker||"",url,unsubscribeUrl),
              text:`STATIC / NEW SIGNAL\n\n${title}\n\n${enriched.deck||description}\n\n${enriched.summary||description}\n\nRead: ${url}\n\nUnsubscribe: ${unsubscribeUrl}`,
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
