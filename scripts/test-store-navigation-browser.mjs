import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=createRequire(import.meta.url)('playwright');
const products=[
 {id:'gpu',type:'gpu',category_slug:'gpu',name:'GeForce RTX 5060',brand:'MSI',retail_price:6000},
 {id:'lap',type:'peripheral',category_slug:'laptops',name:'Gaming Laptop',brand:'Acer',retail_price:15000,specs:{laptopPurpose:'Gaming'}},
 {id:'cable',type:'accessory',category_slug:'cables',name:'HDMI cable',brand:'Ugreen',retail_price:120}
].map(p=>({...p,visibility:'public',status:'active',is_demo:false,sale_mode:'quote',stock_qty:10,stock_status:'in_stock',media:{primaryImage:'/assets/categories/store-gpu.webp'}}));
const service=`window.catalogueLoads=0;export const openCatalogue=async()=>({open:true,preview:false,VT:{loadStore:async()=>{window.catalogueLoads++;return {settings:{catalogue_enabled:true},products:${JSON.stringify(products)}}},canAdd:()=>false,stockLabel:()=>'In stock',categoryLabel:t=>t,analytics:()=>{}}});export const showGate=()=>{};export const publicProducts=p=>p;export const withTimeout=p=>p;export const addItem=()=>{};`;
const browser=await chromium.launch({headless:true,executablePath:process.env.VT_CHROMIUM_PATH});
await fs.mkdir('qa-results/theme',{recursive:true});
for(const width of [320,390,1440]){
 const page=await browser.newPage({viewport:{width,height:1000}});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.route('https://**/*',r=>r.abort());
 await page.route('**/assets/js/services/catalogue.js*',r=>r.fulfill({contentType:'application/javascript',body:service}));
 await page.route('**/assets/js/services/catalogue-cart.js*',r=>r.fulfill({contentType:'application/javascript',body:'export const connectCatalogueCart=()=>{};'}));
 await page.goto('http://127.0.0.1:4173/store.html');
 await page.locator('#product-grid .catalogue-card').first().waitFor();
 assert.ok((await page.locator('.department-heading').boundingBox()).y<350,'category heading is immediately visible');
 assert.ok(await page.locator('.department-card[data-category=gpu]').isVisible());
 assert.equal(await page.locator('.store-department-tabs a').count(),4);
 for(const card of await page.locator('.department-group:not([hidden]) .department-card').all()){
  const box=await card.locator('.department-image').boundingBox();
  const label=await card.locator('h3').boundingBox();
  if(width<=1100)assert.ok(label.y>=box.y+box.height,'category labels stay below image');
  if(await card.locator('img').count()){
   const image=await card.locator('img').boundingBox();
   assert.ok(image.y>=box.y&&image.y+image.height<=box.y+box.height+1,'image stays inside thumbnail');
  }
 }
 for(const theme of ['light','dark']){
  await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
  await page.screenshot({path:`qa-results/theme/store-navigation-${width}-${theme}.png`,fullPage:true});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no overflow');
 }
 await page.locator('[data-department-group=laptops]').click();
 assert.ok(await page.locator('#laptops [data-category=desktops]').isVisible());
 assert.equal(await page.locator('#pc-components [data-category=gpu]').isVisible(),false);
 await page.locator('#laptops .department-card').first().click();
 assert.equal(new URL(page.url()).searchParams.get('laptopPurpose'),'Gaming');
 assert.equal(await page.locator('#product-grid .catalogue-card').count(),1);
 assert.ok(await page.locator('#departments').isVisible(),'categories remain available during browsing');
 await page.locator('.browse-category-return').click();
 await page.locator('[data-department-group=desk-essentials]').click();
 await page.locator('#desk-essentials [data-category=cables]').click();
 assert.match(await page.locator('#product-grid').innerText(),/HDMI cable/);
 if(width<=700){await page.locator('.shop-category-menu summary').click();await page.locator('[data-category-link=all]').click();}
 else await page.locator('.shop-category-bar [data-store-all]').click();
 assert.equal(await page.locator('#product-grid .catalogue-card').count(),3,'All products clears the category');
 assert.equal(await page.evaluate(()=>window.catalogueLoads),1,'category switching does not reload catalogue');
 await page.locator('#catalogue-search').fill('missing item');
 assert.equal(await page.locator('#product-grid .catalogue-card').count(),0);
 await page.locator('#reset-filters').click();
 assert.equal(await page.locator('#product-grid .catalogue-card').count(),3);
 await page.reload();await page.locator('#product-grid .catalogue-card').first().waitFor();
 assert.ok(await page.locator('#departments').isVisible());
 assert.deepEqual(errors,[]);
 console.log(`PASS: discoverable categories, group navigation, laptop purpose, instant category switching, search and reset at ${width}`);
 await page.close();
}
await browser.close();
