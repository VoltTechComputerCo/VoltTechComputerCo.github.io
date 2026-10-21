import {createRequire} from 'node:module';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {gunzipSync,gzipSync} from 'node:zlib';
const {chromium}=createRequire(import.meta.url)('playwright');
const snapshot=JSON.parse(gunzipSync(fs.readFileSync('assets/data/catalogue.json.gz')));snapshot.generatedAt=new Date().toISOString();snapshot.settings.builder_enabled=true;
const browser=await chromium.launch({headless:true});
for(const width of [390,1440]){
 const page=await browser.newPage({viewport:{width,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.hostname.endsWith('supabase.co')){
   if(u.pathname.includes('store_settings'))return route.fulfill({json:[snapshot.settings]});
   return route.fulfill({json:[]});
  }
  if(u.hostname==='volttechcomputerco.co.za'){
   if(u.pathname.endsWith('catalogue.json.gz'))return route.fulfill({body:gzipSync(JSON.stringify(snapshot)),contentType:'application/octet-stream'});
   const f=path.join(process.cwd(),u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname);
   if(fs.existsSync(f)&&fs.statSync(f).isFile())return route.fulfill({path:f});
  }
  return route.abort();
 });
 await page.goto('https://volttechcomputerco.co.za/builder/');
 await page.waitForFunction(()=>window.__VT_BUILDER_CATALOGUE?.length>100);
 await page.locator('#hero-advanced').click();
 await page.locator('[data-select-product]').first().click();
 assert.ok((await page.locator('#total').textContent()).includes('R'));
 await page.locator('[data-category="gpu"]').click();
 assert.ok(await page.locator('[data-select-product]').count()>0);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`Overflow ${width}`);
 assert.ok(await page.locator('#vt-save-build').count());assert.ok(await page.locator('#vt-request-quote').count());
 assert.ok(!(await page.locator('#catalogue-note').textContent()).includes('mock'));
 const part=await page.evaluate(()=>window.__VT_BUILDER_CATALOGUE.find(p=>p.type==='gpu'));
 await page.goto('https://volttechcomputerco.co.za/builder/?add='+part.id);
 await page.waitForFunction(id=>document.querySelector('#build-list')?.textContent.includes(window.__VT_BUILDER_CATALOGUE?.find(p=>p.id===id)?.name),part.id);
 assert.equal(new URL(page.url()).searchParams.has('add'),false);
 assert.deepEqual(errors,[]);
 console.log('PASS browser',width,'live load, selection, store handoff, account controls and no overflow');
 await page.close();
}
await browser.close();
