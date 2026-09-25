import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const base=(process.env.VT_QA_BASE||'http://127.0.0.1:4173').replace(/\/+$/,'');
const baseOrigin=new URL(base).origin;
const outDir=path.resolve('qa-results/step-9.3');
fs.mkdirSync(outDir,{recursive:true});
const results=[]; let failures=0;
const record=(name,status,detail='')=>{results.push({name,status,detail});if(status==='FAIL')failures++;console.log(`${status}: ${name}${detail?` — ${detail}`:''}`)};
const assert=(v,m)=>{if(!v)throw new Error(m)};
async function run(name,fn){try{await fn();record(name,'PASS')}catch(e){record(name,'FAIL',e?.message||String(e))}}

async function context(browser, launchSettings=null, failSettings=false){
  const ctx=await browser.newContext({
    viewport:{width:390,height:844},hasTouch:true,serviceWorkers:'block',
    colorScheme:'dark',reducedMotion:'reduce'
  });
  await ctx.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.origin===baseOrigin)return route.continue();
    if(url.hostname==='qdqhfnvwqvgesfdmocir.supabase.co' && url.pathname==='/rest/v1/store_settings'){
      if(failSettings)return route.abort('failed');
      if(launchSettings)return route.fulfill({
        status:200,contentType:'application/json',
        body:JSON.stringify([launchSettings])
      });
    }
    return route.abort('blockedbyclient');
  });
  return ctx;
}
async function open(page,rel){
  const response=await page.goto(`${base}/${rel}`,{waitUntil:'domcontentloaded',timeout:15000});
  assert(response?.ok(),`${rel}: HTTP ${response?.status()}`);
  await page.waitForTimeout(180);
}
const off={catalogue_enabled:false,builder_enabled:false,direct_payment_enabled:false};
const catalogueOnly={catalogue_enabled:true,builder_enabled:false,direct_payment_enabled:false};
const validToken='a'.repeat(64);
const browser=await chromium.launch({headless:true});
try{
  await run('Store closed flag shows gated catalogue',async()=>{
    const ctx=await context(browser,off);const page=await ctx.newPage();
    try{await open(page,'store.html');await page.waitForSelector('#store-gate:not([hidden])');
      assert(await page.locator('#catalogue').isHidden(),'catalogue exposed while Store flag is off');
      assert(await page.locator('#store-gate').getAttribute('data-state')==='closed','closed gate state missing');
    }finally{await page.close();await ctx.close()}
  });

  await run('Store connection failure fails closed with recovery copy',async()=>{
    const ctx=await context(browser,null,true);const page=await ctx.newPage();
    try{await open(page,'store.html');await page.waitForSelector('#store-gate:not([hidden])');
      assert((await page.locator('[data-gate-title]').innerText()).includes('connection unavailable'),'connection failure title missing');
      assert((await page.locator('[data-gate-copy]').innerText()).toLowerCase().includes('reload'),'recovery instruction missing');
      assert(await page.locator('#catalogue').isHidden(),'catalogue exposed after settings failure');
    }finally{await page.close();await ctx.close()}
  });

  await run('Store preview query cannot bypass closed launch gate',async()=>{
    const ctx=await context(browser,off);const page=await ctx.newPage();
    try{await open(page,'store.html?preview=1');await page.waitForSelector('#store-gate:not([hidden])');
      assert(await page.locator('#store-gate').getAttribute('data-state')==='preview','preview-denied state missing');
      assert(await page.locator('#catalogue').isHidden(),'preview query unlocked catalogue on non-production host');
    }finally{await page.close();await ctx.close()}
  });

  await run('Builder remains closed by default on preview host',async()=>{
    const ctx=await context(browser);const page=await ctx.newPage();
    try{await open(page,'builder/index.html');await page.waitForSelector('#builderGate:not([hidden])');
      assert(await page.locator('#builderApp').isHidden(),'Builder app exposed on preview host');
    }finally{await page.close();await ctx.close()}
  });

  await run('Builder inspection mode is explicit and read-only',async()=>{
    const ctx=await context(browser);const page=await ctx.newPage();
    try{await open(page,'builder/index.html?inspect=1');await page.waitForSelector('#builderApp:not([hidden])');
      const safety=(await page.locator('#builderSafety').innerText()).toLowerCase();
      assert(safety.includes('read-only inspection'),'read-only inspection warning missing');
      assert(safety.includes('prototype catalogue data only'),'prototype data warning missing');
      assert((await page.locator('#builderState').innerText()).includes('READ-ONLY INSPECTION'),'inspection state label missing');
    }finally{await page.close();await ctx.close()}
  });

  await run('Checkout stays closed when Store flag is off',async()=>{
    const ctx=await context(browser,off);const page=await ctx.newPage();
    try{await open(page,'checkout.html');await page.waitForTimeout(100);
      assert((await page.locator('#checkout-state-title').innerText()).includes('not accepting orders'),'closed checkout message missing');
      assert(await page.locator('#checkout-form').isHidden(),'checkout form exposed while Store is off');
    }finally{await page.close();await ctx.close()}
  });

  await run('Checkout refuses non-canonical origin even if catalogue flag is mocked open',async()=>{
    const ctx=await context(browser,catalogueOnly);const page=await ctx.newPage();
    try{await open(page,'checkout.html');await page.waitForTimeout(100);
      assert((await page.locator('#checkout-state-title').innerText()).includes('unavailable on this page'),'origin gate message missing');
      assert(await page.locator('#checkout-form').isHidden(),'checkout form exposed on preview origin');
    }finally{await page.close();await ctx.close()}
  });

  await run('Order tracking requires complete private link',async()=>{
    const ctx=await context(browser);const page=await ctx.newPage();
    try{await open(page,'order-status.html?ref=VT-123');
      assert((await page.locator('#order-state-title').innerText()).includes('private order link'),'private-link boundary missing');
      assert(await page.locator('#pay-order').isHidden(),'payment button exposed without private token');
    }finally{await page.close();await ctx.close()}
  });

  await run('Order tracking refuses transaction access on preview origin',async()=>{
    const ctx=await context(browser);const page=await ctx.newPage();
    try{await open(page,`order-status.html?ref=VT-123&token=${validToken}`);
      assert((await page.locator('#order-state-title').innerText()).includes('unavailable on this page'),'order origin gate missing');
      assert(await page.locator('#pay-order').isHidden(),'payment button exposed on preview origin');
    }finally{await page.close();await ctx.close()}
  });

  await run('Legal centre visibly preserves ecommerce launch gate',async()=>{
    const ctx=await context(browser);const page=await ctx.newPage();
    try{await open(page,'legal.html');
      assert((await page.locator('.legal-notice').innerText()).includes('Production ecommerce remains launch-gated'),'legal ecommerce boundary missing');
    }finally{await page.close();await ctx.close()}
  });

  await run('PAIA page visibly preserves compliance blocker',async()=>{
    const ctx=await context(browser);const page=await ctx.newPage();
    try{await open(page,'paia.html');
      const notice=await page.locator('.legal-notice').innerText();
      assert(notice.includes('Release blocker'),'PAIA release blocker label missing');
      assert(notice.includes('Information Officer'),'Information Officer blocker missing');
      await page.screenshot({path:path.join(outDir,'paia-release-blocker-mobile.png'),fullPage:false});
    }finally{await page.close();await ctx.close()}
  });
}finally{await browser.close()}

const summary={step:'9.3-browser',total:results.length,passed:results.length-failures,failed:failures,status:failures?'FAIL':'PASS',results};
fs.writeFileSync(path.join(outDir,'browser-summary.json'),JSON.stringify(summary,null,2)+'\n');
console.log(`\nStep 9.3 browser certification: ${summary.passed}/${summary.total}`);
process.exit(failures?1:0);
