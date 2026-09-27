// Production source snapshot for the deployed Supabase Edge Function.
// Deployed directly to VoltTech Production before this repository sync.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"GET, POST, OPTIONS","Content-Type":"application/json"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:corsHeaders});

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
  const twitchClientId=Deno.env.get("TWITCH_CLIENT_ID")||"";
  const supabaseUrl=Deno.env.get("SUPABASE_URL")||"";
  const serviceRole=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
  if(!supabaseUrl||!serviceRole)return json({error:"Supabase service configuration is unavailable."},500);
  if(req.method==="GET"){
    if(!twitchClientId)return json({error:"Twitch Client ID is not configured."},503);
    return json({client_id:twitchClientId,redirect_uri:"https://volttechcomputerco.co.za/creator-register.html",scope:"openid"});
  }
  if(req.method!=="POST")return json({error:"GET or POST required."},405);
  if(!twitchClientId)return json({error:"Twitch Client ID is not configured."},503);

  const admin=createClient(supabaseUrl,serviceRole,{auth:{persistSession:false,autoRefreshToken:false}});
  try{
    const body=await req.json();
    const twitchAccessToken=String(body?.twitch_access_token||"").trim();
    const southAfricaConfirmed=body?.south_africa_confirmed===true;
    const volttechAccessToken=String(body?.volttech_access_token||"").trim();
    if(!twitchAccessToken)return json({error:"Twitch access token is required."},400);
    if(!southAfricaConfirmed)return json({error:"South African creator confirmation is required."},400);

    const validationRes=await fetch("https://id.twitch.tv/oauth2/validate",{headers:{Authorization:"OAuth "+twitchAccessToken}});
    if(!validationRes.ok)return json({error:"Twitch sign-in could not be verified."},401);
    const validation=await validationRes.json();
    if(!validation?.user_id||!validation?.login||validation?.client_id!==twitchClientId)return json({error:"Twitch identity did not match the VoltTech Twitch application."},403);

    const userRes=await fetch("https://api.twitch.tv/helix/users?id="+encodeURIComponent(String(validation.user_id)),{headers:{"Client-Id":twitchClientId,Authorization:"Bearer "+twitchAccessToken}});
    if(!userRes.ok)return json({error:"Twitch profile could not be loaded."},502);
    const userBody=await userRes.json();
    const user=Array.isArray(userBody?.data)?userBody.data[0]:null;
    if(!user?.id||!user?.login)return json({error:"Twitch profile was not returned."},502);
    const login=String(user.login).toLowerCase();
    if(!/^[a-z0-9_]{1,60}$/.test(login))return json({error:"Twitch login format is not supported."},400);

    let volttechUserId:string|null=null;
    if(volttechAccessToken){
      const {data,error}=await admin.auth.getUser(volttechAccessToken);
      if(!error&&data?.user?.id)volttechUserId=data.user.id;
    }
    const now=new Date().toISOString();

    if(volttechUserId){
      const {error}=await admin.from("creator_registrations").update({volttech_user_id:null,updated_at:now}).eq("volttech_user_id",volttechUserId).neq("streamer_login",login);
      if(error)throw new Error("Could not refresh VoltTech creator link: "+error.message);
    }

    const {error:streamerError}=await admin.from("streamers").upsert({login,display_name:String(user.display_name||login),profile_image_url:String(user.profile_image_url||""),description:String(user.description||"").trim(),enabled:true,sort_priority:10000,updated_at:now,last_profile_sync_at:now},{onConflict:"login"});
    if(streamerError)throw new Error("Could not add creator: "+streamerError.message);

    const {error:statusError}=await admin.from("streamer_status").upsert({streamer_login:login,checked_at:"1970-01-01T00:00:00Z"},{onConflict:"streamer_login",ignoreDuplicates:true});
    if(statusError)throw new Error("Could not create creator status row: "+statusError.message);

    const {error:registrationError}=await admin.from("creator_registrations").upsert({twitch_user_id:String(user.id),streamer_login:login,volttech_user_id:volttechUserId,registration_source:"twitch_self",self_declared_south_africa:true,twitch_owner_verified_at:now,evidence:{method:"twitch_oauth",twitch_client_id:twitchClientId,twitch_login:login,self_declared_south_africa:true},updated_at:now},{onConflict:"twitch_user_id"});
    if(registrationError)throw new Error("Could not save creator registration: "+registrationError.message);

    return json({ok:true,creator:{login,display_name:String(user.display_name||login),profile_image_url:String(user.profile_image_url||""),description:String(user.description||"").trim(),twitch_url:"https://www.twitch.tv/"+encodeURIComponent(login)},volttech_account_linked:Boolean(volttechUserId)});
  }catch(error){
    const message=error instanceof Error?error.message:String(error);
    console.error(message);return json({error:message},500);
  }
});
