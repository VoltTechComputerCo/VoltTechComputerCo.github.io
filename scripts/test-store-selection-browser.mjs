import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)('playwright');
const products=[{id:'gpu',type:'gpu',name:'MSI GeForce RTX 3060 Ti',brand:'MSI'},{id:'ram',type:'memory',name:'Kingston DDR4',brand:'Kingston',specs:{memoryType:'DDR4'}}];
const service=`export const openCatalogue=async()=>({open:true,preview:false,VT:{loadStore:async()=>({settings:{catalogue_enabled:true},products:${JSON.stringify(products)}}),canAdd:()=>false,stockLabel:()=>'',categoryLabel:t=>t,analytics:()=>{}}});export const showGate=()=>{};export const publicProducts=p=>p;export const withTimeout=p=>p;export const addItem=()=>{};`;
for(const width of [390,1440]){
 const browser=await chromium.launch({headless:true,executablePath:process.env.VT_CHROMIUM_PATH,args:['--no-sandbox','--single-process','--no-zygote','--disable-gpu']});
 const page=await browser.newPage({viewport:{width,height:1000}});
 await page.route('https://**/*',r=>r.abort());
 await page.route('**/assets/js/services/catalogue.js',r=>r.fulfill({contentType:'application/javascript',body:service}));
 await page.route('**/assets/js/services/catalogue-cart.js',r=>r.fulfill({contentType:'application/javascript',body:'export const connectCatalogueCart=()=>{};'}));
 await page.goto('http://127.0.0.1:4173/store.html');
 await page.locator('[data-category-link=gpu]').click();
 for(const maker of ['NVIDIA','AMD','Intel','NVIDIA']){
  if(!await page.locator(`[data-stage-value="${maker}"]`).count()) await page.locator('[data-category-link=gpu]').click();
  await page.locator(`[data-stage-value="${maker}"]`).click();
  assert.equal(new URL(page.url()).searchParams.get('gpuVendor'),maker);
  assert.match(await page.locator('#active-filter-chips').innerText(),new RegExp(maker));
  assert.equal(await page.locator('#result-count').innerText(),maker==='NVIDIA'?'1 component':'0 components');
 }
 await page.locator('#catalogue-smart-filters details').filter({has:page.locator('[data-filter-key=brand]')}).locator('summary').click();
 await page.locator('[data-filter-key=brand][data-filter-value=MSI]').click();
 if(!await page.locator('[data-stage-value=AMD]').count()) await page.locator('[data-category-link=gpu]').click();
 await page.locator('[data-stage-value=AMD]').click();
 assert.equal(new URL(page.url()).searchParams.has('brand'),false);
 await page.locator('[data-category-link=memory]').click();
 await page.locator('.category-filter-menu a[data-quick-brand=Corsair]').click();
 assert.equal(new URL(page.url()).searchParams.get('brand'),'Corsair');
 assert.equal(await page.locator('#result-count').innerText(),'0 components');
 await page.reload();
 await page.locator('#active-filter-chips').waitFor({state:'visible'});
 assert.equal(new URL(page.url()).searchParams.get('brand'),'Corsair');
 console.log('PASS: GPU maker, stale partner, unavailable brand and reload persistence at '+width);
 await browser.close();
}
