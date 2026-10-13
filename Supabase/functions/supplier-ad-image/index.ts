import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "https://esm.sh/@supabase/supabase-js@2";
const origins=new Set(['https://volttechcomputerco.co.za','https://www.volttechcomputerco.co.za','https://volttechcomputerco.github.io']);
const allowed=(url:URL)=>url.protocol==='https:'&&((url.hostname==='s3.amazonaws.com'&&url.pathname.startsWith('/tarsus.co.za/'))||['syntech.co.za','esquire.co.za','tarsus.co.za','tarsusonline.co.za','tarsusdistribution.co.za'].some(h=>url.hostname===h||url.hostname.endsWith('.'+h)));
Deno.serve(async req=>{
 const origin=req.headers.get('origin'),headers={'Access-Control-Allow-Origin':origin&&origins.has(origin)?origin:'https://volttechcomputerco.co.za','Vary':'Origin','X-Content-Type-Options':'nosniff'};
 if(origin&&!origins.has(origin))return new Response('Origin not allowed',{status:403,headers});
 if(req.method==='OPTIONS')return new Response('ok',{headers:{...headers,'Access-Control-Allow-Methods':'GET, OPTIONS'}});
 if(req.method!=='GET')return new Response('Method not allowed',{status:405,headers});
 try{
  const id=new URL(req.url).searchParams.get('id')||'';if(!/^[a-zA-Z0-9_-]{1,100}$/.test(id))return new Response('Invalid product',{status:400,headers});
  const client=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!);
  const {data,error}=await client.from('store_products').select('media').eq('id',id).eq('status','active').eq('visibility','public').neq('sale_mode','hidden').maybeSingle();
  if(error||!data)return new Response('Product unavailable',{status:404,headers});
  let target=String(data.media?.primaryImage||data.media?.directImage||''),response:Response;
  for(let hop=0;;hop++){const url=new URL(target);if(!allowed(url))return new Response('Supplier image host unsupported',{status:422,headers});response=await fetch(url,{redirect:'manual'});if(![301,302,303,307,308].includes(response.status))break;const next=response.headers.get('location');if(!next||hop>=3)throw Error();target=new URL(next,url).href;}
  const type=response.headers.get('content-type')||'';if(!response.ok||!/^image\/(png|jpeg|webp|avif)/i.test(type))throw Error();const bytes=await response.arrayBuffer();if(bytes.byteLength>12000000)throw Error();
  return new Response(bytes,{headers:{...headers,'Content-Type':type,'Cache-Control':'public, max-age=86400'}});
 }catch{return new Response('Supplier image could not load',{status:502,headers});}
});
