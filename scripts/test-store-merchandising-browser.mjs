import {createRequire} from 'node:module';import assert from 'node:assert/strict';import fs from 'node:fs';
const {chromium}=createRequire(import.meta.url)('playwright');
const base={type:'gpu',category_slug:'gpu',brand:'ASUS',is_demo:false,status:'active',visibility:'public',sale_mode:'quote',currency:'ZAR',stock_status:'in-stock',specs:{},short_description:'A graphics card for your next upgrade.'};
const products=[{...base,id:'deal',slug:'deal',name:'ASUS GeForce RTX 5070 Featured',stock_qty:5,featured:true,retail_price:10000,compare_at_price:12000,metadata:{compare_at_verified:true,deal_ends_at:'2099-01-01T00:00:00Z'},media:{primaryImage:'/broken-product.png'}},{...base,id:'high',slug:'high',name:'ASUS GeForce RTX 5090',stock_qty:4,retail_price:20000,compare_at_price:25000,metadata:{}},{...base,id:'empty',slug:'empty',name:'ASUS GeForce GT 710',stock_qty:0,retail_price:1000},{...base,id:'laptop',slug:'laptop',category_slug:'laptops',name:'Laptop with an old GPU type',stock_qty:8,retail_price:9000}];
const service=`export const openCatalogue=async()=>({open:true,preview:false,VT:{loadStore:async()=>({settings:{catalogue_enabled:true},products:${JSON.stringify(products)}}),canAdd:p=>p.stock_qty>0,stockLabel:p=>p.stock_qty>0?'In stock':'Out of stock',categoryLabel:t=>t,analytics:()=>{}}});export const showGate=()=>{};export const publicProducts=p=>p;export const withTimeout=p=>p;export const addItem=()=>{};`;
fs.mkdirSync('qa-results/merchandising',{recursive:true});
for(const width of [320,390,1440]){
 const browser=await chromium.launch({headless:true,executablePath:process.env.VT_CHROMIUM_PATH});
 const page=await browser.newPage({viewport:{width,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://**/*',r=>r.abort());await page.route('**/assets/js/services/catalogue.js*',r=>r.fulfill({contentType:'application/javascript',body:service}));await page.route('**/assets/js/services/catalogue-cart.js*',r=>r.fulfill({contentType:'application/javascript',body:'export const connectCatalogueCart=()=>{};'}));
 await page.goto('http://127.0.0.1:4173/store.html?category=gpu#catalogue');await page.locator('#product-grid .catalogue-card').first().waitFor();
 for(const theme of ['light','dark']){
  await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
  assert.equal(await page.locator('#store-gate').isVisible(),false);
  assert.equal(await page.locator('#product-grid .catalogue-card').count(),3);
  assert.match(await page.locator('#product-grid .catalogue-card').first().innerText(),/RTX 5070/);
  assert.equal(await page.locator('#product-grid .was-price').count(),1,'unverified anchors do not display');
  assert.match(await page.locator('#product-grid .deal-saving').innerText(),/2.?000/);
  assert.equal(await page.locator('#product-grid .product-badge').first().innerText(),'SAVE 17%');
  assert.equal(await page.locator('#product-grid .product-image-placeholder').first().isVisible(),true);
  assert.equal(await page.locator('#product-grid .product-image-placeholder img').first().evaluate(img=>img.naturalWidth>0),true);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:`qa-results/merchandising/store-${width}-${theme}.png`});
 }
 await page.locator('#catalogue-sort').selectOption('price-high');assert.match(await page.locator('#product-grid .catalogue-card').first().innerText(),/RTX 5090/);
 await page.locator('#catalogue-sort').selectOption('price-low');assert.match(await page.locator('#product-grid .catalogue-card').first().innerText(),/GT 710/);
 if(width<=700)await page.locator('.mobile-filter-toggle').click();
 const availability=page.locator('details.smart-filter').filter({has:page.locator('[data-filter-key=availability]')});await availability.locator('summary').click();await page.locator('[data-filter-key=availability][data-filter-value="In stock"]').click();
 assert.equal(await page.locator('#product-grid .catalogue-card').count(),2);assert.deepEqual(errors,[]);
 await page.goto('http://127.0.0.1:4173/store.html');await page.locator('#product-grid .catalogue-card').first().waitFor();
 assert.equal(await page.evaluate(()=>[...document.querySelectorAll('.department-card')].every(a=>a.parentElement.classList.contains('department-grid'))),true);
 assert.equal(await page.locator('#shop-featured').isVisible(),true);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 console.log(`PASS: verified deals, stock order, image fallback, category isolation, both themes, sorting and availability at ${width}`);await browser.close();
}
