// Production source snapshot for the deployed Supabase Edge Function.
// Twitch does not expose a country filter; this scans returned live-stream tags
// and corroborating title/profile signals.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "npm:@supabase/server";

const norm=(v:string)=>String(v||"").toLowerCase().replace(/[^a-z0-9]+/g,"");
function textScore(v:string){
  const t=String(v||"").toLowerCase();let score=0;const signals:string[]=[];
  const rules:Array<[RegExp,string,number]>=[
    [/south\s*africa|south\s*african/,"south-africa-text",100],[/\bmzansi\b/,"mzansi-text",90],
    [/\bjohannesburg\b|\bjoburg\b|\bjozi\b/,"johannesburg-text",70],[/\bpretoria\b|\btshwane\b/,"pretoria-text",70],
    [/\bcape\s*town\b/,"cape-town-text",70],[/\bdurban\b/,"durban-text",70],[/\bgauteng\b/,"gauteng-text",70],
    [/\bwestern\s*cape\b/,"western-cape-text",70],[/\bkwazulu|\bkzn\b/,"kwazulu-natal-text",70]
  ];
  for(const [p,n,pts] of rules)if(p.test(t)){score+=pts;signals.push(n)}
  return{score,signals};
}
function scoreCandidate(stream:any,description=""){
  const rawTags=Array.isArray(stream.tags)?stream.tags.map(String):[];
  const tags=rawTags.map(norm).filter(Boolean);let score=0;const signals:string[]=[];
  for(const tag of tags){
    if(tag==="southafrica"||tag==="southafrican"){score+=120;signals.push("tag:"+tag)}
    else if(tag==="mzansi"){score+=120;signals.push("tag:mzansi")}
    else if(tag==="afrikaans"){score+=60;signals.push("tag:afrikaans")}
    else if(tag==="rsa"){score+=50;signals.push("tag:rsa")}
    else if(tag==="za"){score+=45;signals.push("tag:za")}
  }
  const a=textScore(stream.title||""),b=textScore(description||"");
  score+=a.score+b.score;signals.push(...a.signals.map(x=>"title:"+x),...b.signals.map(x=>"profile:"+x));
  const onlyWeak=score>0&&!signals.some(x=>/southafrica|southafrican|mzansi/.test(x))&&signals.every(x=>/afrikaans|rsa|za/.test(x));
  if(onlyWeak&&signals.length<2)score=Math.min(score,70);
  return{score,signals,rawTags};
}
async function token(id:string,secret:string){
  const p=new URLSearchParams({client_id:id,client_secret:secret,grant_type:"client_credentials"});
  const r=await fetch("https://id.twitch.tv/oauth2/token?"+p.toString(),{method:"POST"});
  if(!r.ok)throw new Error("Twitch token request failed: "+r.status+" "+(await r.text()).slice(0,240));
  return (await r.json()).access_token;
}
async function helix(url:URL,bearer:string,id:string){
  const r=await fetch(url,{headers:{"Client-Id":id,Authorization:"Bearer "+bearer}});
  if(!r.ok)throw new Error("Twitch Helix request failed: "+r.status+" "+(await r.text()).slice(0,240));
  return await r.json();
}
const chunks=(a:any[],n=100)=>Array.from({length:Math.ceil(a.length/n)},(_,i)=>a.slice(i*n,(i+1)*n));

Deno.serve(withSupabase({auth:"secret:automations"},async(_req,ctx)=>{
  const clientId=Deno.env.get("TWITCH_CLIENT_ID")||"",secret=Deno.env.get("TWITCH_CLIENT_SECRET")||"";
  if(!clientId||!secret)return Response.json({error:"Twitch credentials are not configured"},{status:500});
  const admin=ctx.supabaseAdmin;
  try{
    const {data:cfg,error:cfgErr}=await admin.schema("private").from("creator_discovery_config").select("scan_pages,auto_register_threshold").eq("id","default").single();
    if(cfgErr)throw new Error("Discovery config failed: "+cfgErr.message);
    const pages=Math.max(1,Math.min(50,Number(cfg?.scan_pages||12))),threshold=Math.max(1,Number(cfg?.auto_register_threshold||100)),bearer=await token(clientId,secret);
    const seen=new Map<string,any>();let after="";
    for(let page=0;page<pages;page++){
      const url=new URL("https://api.twitch.tv/helix/streams");url.searchParams.set("first","100");url.searchParams.append("language","en");url.searchParams.append("language","other");if(after)url.searchParams.set("after",after);
      const body=await helix(url,bearer,clientId),rows=Array.isArray(body?.data)?body.data:[];
      for(const row of rows)if(row?.user_id&&row?.user_login)seen.set(String(row.user_id),row);
      after=String(body?.pagination?.cursor||"");if(!after||!rows.length)break;
    }
    const prelim=[...seen.values()].filter(s=>scoreCandidate(s,"").score>0),users:any[]=[];
    for(const batch of chunks(prelim.map(x=>x.user_id))){
      const url=new URL("https://api.twitch.tv/helix/users");for(const id of batch)url.searchParams.append("id",id);
      const body=await helix(url,bearer,clientId);if(Array.isArray(body?.data))users.push(...body.data);
    }
    const userMap=new Map(users.map(x=>[String(x.id),x])),hits:any[]=[],auto:any[]=[];
    for(const stream of prelim){
      const user=userMap.get(String(stream.user_id));if(!user?.id||!user?.login)continue;
      const scored=scoreCandidate(stream,user.description||"");if(scored.score<=0)continue;
      const hit={streamer_login:String(user.login).toLowerCase(),twitch_user_id:String(user.id),display_name:String(user.display_name||stream.user_name||user.login),profile_image_url:String(user.profile_image_url||""),description:String(user.description||"").trim(),stream_title:String(stream.title||""),game_name:String(stream.game_name||""),viewer_count:Number(stream.viewer_count||0),tags:scored.rawTags,discovery_score:scored.score,discovery_source:"twitch_tag_scan",evidence:{signals:scored.signals,scanned_live:true,threshold},auto_registered:scored.score>=threshold,last_seen_at:new Date().toISOString()};
      hits.push(hit);if(hit.auto_registered)auto.push(hit);
    }
    if(hits.length){const{error}=await admin.from("creator_discovery_hits").upsert(hits,{onConflict:"streamer_login"});if(error)throw error}
    if(auto.length){
      const now=new Date().toISOString();
      let r=await admin.from("streamers").upsert(auto.map(h=>({login:h.streamer_login,display_name:h.display_name,profile_image_url:h.profile_image_url,description:h.description,enabled:true,updated_at:now,last_profile_sync_at:now})),{onConflict:"login"});if(r.error)throw r.error;
      r=await admin.from("streamer_status").upsert(auto.map(h=>({streamer_login:h.streamer_login,checked_at:"1970-01-01T00:00:00Z"})),{onConflict:"streamer_login",ignoreDuplicates:true});if(r.error)throw r.error;
      const ids=auto.map(h=>h.twitch_user_id),existingRes=await admin.from("creator_registrations").select("twitch_user_id").in("twitch_user_id",ids);if(existingRes.error)throw existingRes.error;
      const existing=new Set((existingRes.data||[]).map((x:any)=>String(x.twitch_user_id))),newRegs=auto.filter(h=>!existing.has(h.twitch_user_id)).map(h=>({twitch_user_id:h.twitch_user_id,streamer_login:h.streamer_login,registration_source:"twitch_tag_discovery",self_declared_south_africa:false,twitch_owner_verified_at:null,evidence:h.evidence,updated_at:now}));
      if(newRegs.length){const ins=await admin.from("creator_registrations").insert(newRegs);if(ins.error)throw ins.error}
    }
    await admin.rpc("record_creator_discovery_result",{p_success:true,p_error:null});
    return Response.json({ok:true,scanned_streams:seen.size,tagged_or_signalled:hits.length,auto_registered:auto.length,threshold});
  }catch(error){
    const message=error instanceof Error?error.message:String(error);
    try{await ctx.supabaseAdmin.rpc("record_creator_discovery_result",{p_success:false,p_error:message})}catch(_){}
    return Response.json({error:message},{status:500});
  }
}));
