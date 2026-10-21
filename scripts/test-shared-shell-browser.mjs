import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)('playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.VT_CHROMIUM_PATH});
for(const width of [320,390,1440]){
 const page=await browser.newPage({serviceWorkers:'block',viewport:{width,height:900}});
 const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',e.message);});page.on('console',m=>{if(m.type()==='warning')console.log('PAGE WARNING',m.text());});
 await page.route('https://**/*',route=>route.abort());
 await page.route('**/assets/js/services/site-config.js*',route=>route.fulfill({contentType:'application/javascript',body:`export const isProduction=()=>true;export const sdkUrl='/assets/vendor/supabase-2.116.0.js';export const canonicalOrigin=location.origin;export const canTransactHere=()=>true;export const transactionOrigin=location.origin;`}));
 await page.addInitScript(()=>{
  localStorage.setItem('sb-fixture-auth-token','fixture');
  window.authDatabaseCalls=0;
  let inCallback=false;
  const session={user:{id:'fixture-user'}};
  window.supabase={createClient:()=>({
   auth:{getSession:async()=>({data:{session}}),getUser:async()=>({data:{user:session.user}}),onAuthStateChange:cb=>{inCallback=true;cb('INITIAL_SESSION',session);inCallback=false;return {data:{subscription:{unsubscribe(){}}}};}},
   rpc:async()=>{if(inCallback)throw Error('Database request inside auth callback');window.authDatabaseCalls++;return {data:true};},
   from:()=>{const q={select(){return q;},is(){return q;},eq(){return q;},order(){return q;},limit(){return q;},then(resolve){return Promise.resolve({data:[]}).then(resolve);}};return q;},
   channel:()=>{const c={on(){return c;},subscribe(){return c;}};return c;},removeChannel(){}
  })};
 });
 for(const path of ['index.html#services','pc-repair-pretoria.html','pc-upgrades-pretoria.html','pc-performance-optimisation.html','virus-malware-removal-pretoria.html','windows-installation-pretoria.html','streaming-setup-south-africa.html']){
  await page.goto('http://127.0.0.1:4173/'+path);
  await page.locator('#vtNotifyButton').waitFor({timeout:5000}).catch(async error=>{console.log('NOTIFICATION DEBUG',path,errors,await page.evaluate(()=>({config:!!window.VOLTTECH_SUPABASE,sdk:!!window.supabase,auth:!!window.volttechAuth,boot:window.__voltTechNotificationsV5,scripts:[...document.scripts].map(s=>s.src).filter(s=>s.includes('notification')),keys:Object.keys(localStorage)})));throw error;});
  assert.equal(await page.locator('.retail-category-nav').count(),0,'Store category navigation is absent outside Store');
  assert.equal(await page.locator('[data-theme-toggle]').count(),1,'one stable theme control');
  assert.equal(await page.locator('[data-notifications-host]').count(),1);
  for(const href of await page.locator('[data-service-email],[data-stream-contact=email]').evaluateAll(links=>links.map(a=>a.href)))assert.ok(href.startsWith('mailto:info@volttechcomputerco.co.za'),'correct email alias');
  await page.locator('#vtNotifyButton').click();
  await page.locator('#vtNotifyPanel').waitFor({state:'visible'});
  assert.ok(await page.locator('#vtNotifyPanel').evaluate(panel=>{
   const r=panel.getBoundingClientRect(),hit=document.elementFromPoint(r.x+20,r.y+20);
   return r.top>=0&&r.bottom<=innerHeight&&panel.contains(hit);
  }),'notification panel is on top and within viewport');
  await page.locator('#vtNotifyClose').click();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no header overflow');
 }
 assert.deepEqual(errors,[]);
 await page.close();
 const store=await browser.newPage({serviceWorkers:'block',viewport:{width,height:900}});
 await store.route('https://**/*',route=>route.abort());
 await store.addInitScript(()=>{
  localStorage.setItem('sb-fixture-auth-token','fixture');
  window.supabase={createClient:()=>({auth:{getSession:()=>new Promise(()=>{}),onAuthStateChange:()=>{}},from:()=>{throw Error('Snapshot rendering should not request product rows')}})};
 });
 await store.route('**/assets/data/catalogue.json.gz',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({schemaVersion:1,generatedAt:new Date().toISOString(),settings:{catalogue_enabled:true},categories:[],products:[{id:'gpu1',slug:'gpu1',name:'MSI RTX 5060',brand:'MSI',type:'gpu',category_slug:'gpu',status:'active',visibility:'public',is_demo:false,sale_mode:'quote',retail_price:6000,stock_qty:10,stock_status:'in_stock'}]})}));
 const started=Date.now();await store.goto('http://127.0.0.1:4173/store.html');
 await store.locator('#product-grid .catalogue-card').first().waitFor({timeout:5000});
 assert.ok(Date.now()-started<5000,'products appear while the account session is still blocked');
 assert.equal(await store.locator('#catalogue-loading').count(),0);
 assert.equal(await store.locator('.retail-category-nav').count(),1);
 await store.close();
 console.log(`PASS: service/header email links, notifications above sticky navigation, stable controls, and CDN products independent of auth at ${width}`);
}
await browser.close();
