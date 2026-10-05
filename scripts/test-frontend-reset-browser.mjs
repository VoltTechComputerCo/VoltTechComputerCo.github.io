import fs from 'node:fs';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.VT_PLAYWRIGHT_MODULE || 'playwright');
const launch={headless:true};
if(process.env.VT_CHROMIUM_EXECUTABLE){launch.executablePath=process.env.VT_CHROMIUM_EXECUTABLE;launch.args=["--no-sandbox","--disable-dev-shm-usage","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"];}
if(process.env.VT_CHROMIUM_MODULE){const {default:c}=await import(process.env.VT_CHROMIUM_MODULE);launch.executablePath=await c.executablePath();launch.args=c.args;}
const browser=await chromium.launch(launch);
const base=process.env.VT_QA_BASE||'http://127.0.0.1:4173';
const out='qa-results/frontend-reset';fs.mkdirSync(out,{recursive:true});
const results=[];
try{
 for(const width of [360,390,768,1024,1440,1920]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  await context.route('**/rest/v1/**',route=>route.fulfill({json:route.request().url().includes('store_settings')?[{catalogue_enabled:true,builder_enabled:true}]:[]}));
  for(const route of ['index.html','design-system.html']){
   const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(`${base}/${route}`);await page.evaluate(()=>document.fonts.ready);
   await page.locator('h1').waitFor();
   await page.locator('img').evaluateAll(images=>images.forEach(img=>{img.loading='eager';}));await page.waitForFunction(()=>[...document.images].every(img=>img.complete));
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${route} overflows ${width}`);
   const small=await page.locator('button,.button,.icon-button').evaluateAll(items=>items.filter(e=>e.getClientRects().length&&e.getBoundingClientRect().height<43.5).map(e=>e.outerHTML));assert.deepEqual(small,[],'Small touch control');
   await page.screenshot({path:`${out}/${route.replace('.html','')}-${width}.png`,fullPage:true});
   if(width<900){
    const opener=page.getByRole('button',{name:'Open navigation'});await opener.click();const menu=page.locator('#menu-sheet');assert.ok(await menu.evaluate(e=>e.open));
    const links=menu.locator('a');await links.last().focus();await page.keyboard.press('Tab');assert.ok(await menu.getByRole('button',{name:'Close navigation'}).evaluate(e=>document.activeElement===e));
    await page.keyboard.press('Escape');await page.waitForFunction(()=>document.documentElement.style.overflow==='');assert.ok(await opener.evaluate(e=>document.activeElement===e));assert.equal(await page.evaluate(()=>document.documentElement.style.overflow),'');
   }
   await page.getByRole('button',{name:'Search components',exact:true}).click();await page.locator('#site-query').fill('RTX 5070');await page.locator('#search-sheet form').evaluate(e=>e.addEventListener('submit',event=>event.preventDefault()));
   const search=await page.locator('#search-sheet form').evaluate(e=>({action:e.getAttribute('action'),q:new FormData(e).get('q')}));assert.deepEqual(search,{action:'store.html',q:'RTX 5070'});await page.getByRole('button',{name:'Close search',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('#search-sheet').open && document.activeElement===document.querySelector('[data-open="search-sheet"]'));
   await page.evaluate(()=>{localStorage.setItem('vt_store_quote_cart_v1',JSON.stringify([{productId:'saved-id',quantity:2}]));window.dispatchEvent(new Event('vt-store-cart-change'));});assert.equal(await page.locator('[data-cart-count]').textContent(),'2');
   if(route==='index.html'){await page.getByRole('status').filter({hasText:'public catalogue is being prepared'}).waitFor();}
   else {await page.getByRole('tab',{name:'Specifications'}).focus();await page.keyboard.press('ArrowRight');await page.waitForFunction(()=>document.getElementById('fit-tab').getAttribute('aria-selected')==='true');await page.locator('#demo-name').fill('Example');await page.locator('#demo-email').fill('example@example.com');await page.getByRole('button',{name:'Check form'}).click();assert.match(await page.locator('[data-form-status]').textContent(),/does not send/);await page.getByRole('button',{name:'Open dialog'}).click();await page.keyboard.press('Escape');}
   assert.deepEqual(errors,[]);results.push({route,width,status:'PASS'});await page.close();
  }
  await context.close();
 }
 const context=await browser.newContext({viewport:{width:390,height:900}});await context.route('**/rest/v1/**',route=>route.abort());const page=await context.newPage();await page.goto(`${base}/index.html`);await page.getByRole('status').filter({hasText:'could not confirm'}).waitFor();results.push({route:'index.html',state:'offline',status:'PASS'});await context.close();
 fs.writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));console.log(`PASS: ${results.length} browser scenarios`);
}finally{await browser.close();}
