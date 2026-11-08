import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import {createRequire} from 'node:module';

const snapshot=JSON.parse(gunzipSync(readFileSync('assets/data/catalogue.json.gz')).toString('utf8'));
assert.equal(snapshot.schemaVersion,1);
assert.ok(snapshot.settings?.catalogue_enabled===true,'last public snapshot must be sellable/visible as a reference');
assert.ok(snapshot.products.length>100,'static snapshot must contain the existing VoltTech product range');
assert.ok(snapshot.products.every(p=>p.status==='active'&&p.visibility==='public'&&p.is_demo===false&&p.sale_mode!=='hidden'));
console.log('PASS existing compressed public catalogue:',snapshot.products.length,'products, generated',snapshot.generatedAt);

const {chromium}=createRequire(import.meta.url)('playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.VT_CHROMIUM_PATH||'/usr/bin/google-chrome'});
try{
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:960},serviceWorkers:'block'});
  const supabaseRequests=[],errors=[];
  page.on('request',request=>{if(request.url().includes('.supabase.co'))supabaseRequests.push(request.url());});
  page.on('pageerror',err=>errors.push(err.message));
  // Simulate production hostname and existing customer sessions while keeping
  // all resources local; a missed API bypass would become a recorded request.
  if (width === 1440) await page.addInitScript(() => localStorage.setItem('sb-qdqhfnvwqvgesfdmocir-auth-token','{"access_token":"fixture-old-session"}'));
  await page.route('https://**/*',r=>r.abort());
  await page.route('https://volttechcomputerco.co.za/**',async route=>{
   const u=new URL(route.request().url());
   const response=await route.fetch({url:'http://127.0.0.1:4173'+u.pathname+u.search});
   return route.fulfill({response});
  });
  await page.goto('https://volttechcomputerco.co.za/store.html',{waitUntil:'domcontentloaded'});
  await page.locator('#product-grid .catalogue-card').first().waitFor({timeout:18000});
  assert.equal(await page.locator('#catalogue').isVisible(),true,'public catalogue renders without Supabase');
  assert.equal(await page.locator('body').getAttribute('data-store-mode'),'snapshot');
  assert.match(await page.locator('.mobile-nav-cart a').first().getAttribute('href'),/store\.html\?cart=1/);
  assert.equal(await page.locator('#store-gate').isVisible(),false);
  const count=await page.locator('#product-grid .catalogue-card').count();
  assert.ok(count>0,'actual product cards must be visible');
  const availability = /Out of stock\. Contact us for restock information\.|Supplier stock available\. Confirm availability when ordering\.|Contact us for current pricing and availability\./;
  assert.match(await page.locator('#product-grid .catalogue-card .micro').first().innerText(),availability);
  const add = page.locator('#product-grid button[data-add-snapshot]').first();
  assert.equal(await add.isVisible(),true,'in-stock products can be added to the cart');
  assert.equal(await page.locator('#product-grid a[href*="wa.me"]').count(),0);
  assert.equal(supabaseRequests.length,0,'public Store browsing must have zero Supabase API traffic');
  const first=await page.locator('#product-grid .catalogue-card').filter({has:page.locator('[data-add-snapshot]')}).first().locator('.catalogue-image-link').getAttribute('href');
  assert.match(first,/^product\.html\?slug=/);
  await page.goto('https://volttechcomputerco.co.za/'+first,{waitUntil:'domcontentloaded'});
  await page.locator('#product-detail .component-summary h2').waitFor({timeout:18000});
  assert.equal(await page.locator('#product-detail').isVisible(),true);
  assert.match(await page.locator('#product-detail').innerText(),availability);
  assert.equal(await page.locator('#product-detail button[data-add-snapshot]').isVisible(),true);
  assert.equal(await page.locator('#product-detail a[href*="wa.me"]').count(),0);
  assert.equal(supabaseRequests.length,0,'product details must load without Supabase');
  await page.goto('https://volttechcomputerco.co.za/',{waitUntil:'domcontentloaded'});
  assert.match(await page.locator('.mobile-nav-cart a').first().getAttribute('href'),/store\.html\?cart=1/);
  assert.equal(supabaseRequests.length,0,'public homepage must not contact Supabase, even with a saved auth session');
  assert.deepEqual(errors,[],'no client script errors');
  console.log('PASS',width+'px','Store and product details load offline from static catalogue, zero Supabase requests');
  if (width === 390) {
   const api = 'https://qdqhfnvwqvgesfdmocir.supabase.co';
   const cors = {'access-control-allow-origin':'*','access-control-allow-headers':'*'};
   await page.route(api + '/rest/v1/store_settings?*', route => route.fulfill({headers:cors,json:[snapshot.settings]}));
   await page.route(api + '/rest/v1/store_products?*', route => {
    const filter = new URL(route.request().url()).searchParams.get('id');
    assert.ok(filter?.startsWith('in.('),'cart reads only the requested product IDs');
    const ids = filter.slice(4,-1).split(',').map(id => id.replaceAll('"',''));
    return route.fulfill({headers:cors,json:snapshot.products.filter(product => ids.includes(product.id))});
   });
   await page.goto('https://volttechcomputerco.co.za/store.html');
   await page.locator('#product-grid button[data-add-snapshot]').first().click();
   await page.getByText(/added to your cart/).waitFor();
   await page.goto('https://volttechcomputerco.co.za/store.html?cart=1');
   await page.locator('#cart-checkout').click();
   await page.locator('#checkout-form').waitFor({state:'visible'});
   assert.equal(await page.locator('#checkout-items .checkout-item').count(),1);
   assert.match(await page.locator('#checkout-account').innerText(),/Guest checkout|Enter your contact details/);
  }
  // Wait for production-hostname route fixtures to finish before disposing
  // the page; otherwise late images can throw TargetClosedError in CI.
  await page.unrouteAll({behavior:'wait'});
  await page.close();
 }
}finally{await browser.close();}
