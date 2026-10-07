export const canonicalOrigin='https://volttechcomputerco.co.za';
export const isProduction=()=>[canonicalOrigin,'https://www.volttechcomputerco.co.za'].includes(location.origin);
export const canTransactHere=()=>location.origin===canonicalOrigin;
const sdk='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/dist/umd/supabase.js';
let ready;
export async function getClient(){
 if(!ready)ready=(async()=>{if(!window.supabase)await new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=sdk;const timer=setTimeout(()=>reject(Error('The account service timed out. Please reload to retry.')),12000);el.onload=()=>{clearTimeout(timer);resolve();};el.onerror=()=>{clearTimeout(timer);reject(Error('The account service could not connect.'));};document.head.append(el);});const cfg=window.VOLTTECH_SUPABASE;if(!cfg?.url||!cfg?.publishableKey)throw Error('Account configuration unavailable.');window.volttechAuth ||= window.supabase.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:isProduction(),autoRefreshToken:isProduction(),detectSessionInUrl:isProduction()}});return window.volttechAuth;})();
 return ready;
}
export function safeReturnPath(raw=new URLSearchParams(location.search).get('returnTo')){try{if(!raw)return '';const u=new URL(raw,location.origin);return u.origin===location.origin&&['http:','https:'].includes(u.protocol)&&!u.pathname.endsWith('/account.html')&&!u.username&&!u.password?u.pathname+u.search+u.hash:'';}catch{return '';}}
export const accountCallbackUrl=(path=safeReturnPath())=>canonicalOrigin+'/account.html'+(path?'?returnTo='+encodeURIComponent(path):'');
export async function getAccountClient(){if(!isProduction())throw Error('Sign-in and customer records are available on the live VoltTech domain. This preview does not access your account.');return getClient();}
export async function loadAccountNotifications(client){const {startNotifications}=await import('../notifications.js');await startNotifications(client);}
export async function requireUser(){const client=await getAccountClient();const {data,error}=await client.auth.getUser();if(error||!data?.user){location.assign(new URL('account.html?returnTo='+encodeURIComponent(location.pathname+location.search),new URL('../../',import.meta.url)));return null;}return{client,user:data.user};}
export function forwardLegacyCallback(){if(location.hostname!=='volttechcomputerco.github.io')return false;const p=new URLSearchParams(location.search);if(!p.has('code')&&!p.has('error')&&!/access_token=|refresh_token=|error=/.test(location.hash))return false;location.replace(canonicalOrigin+'/account.html'+location.search+location.hash);return true;}
