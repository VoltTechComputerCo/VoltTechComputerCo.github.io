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
  if (width === 1440) await page.addInitScript(() => localStorage.setItem('sb-qdqhfnvwqvgesfdmocir-auth-token',JSON.stringify({access_token:'fixture-session', user:{id:'fixture-user'}, expires_at:Math.floor(Date.now()/1000)+3600})));
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
  await page.locator('#product-detail h1#component-title').waitFor({timeout:18000});
  assert.equal(await page.locator('main h1').count(),1,'product renders a single heading');
  assert.equal(await page.locator('.component-heading').isVisible(),false,'static fallback is hidden after the product loads');
  const photo = await page.locator('#product-detail .catalogue-media').first().evaluate(figure => {
   const img=figure.querySelector('img[data-product-image]');
   if (!img) return null;
   const box=figure.getBoundingClientRect(), picture=img.getBoundingClientRect();
   return {fit:getComputedStyle(img).objectFit, contained:picture.top>=box.top-1 && picture.bottom<=box.bottom+1 && picture.left>=box.left-1 && picture.right<=box.right+1};
  });
  if (photo) assert.deepEqual(photo,{fit:'contain',contained:true},'the product photo stays within its frame');
  assert.equal(await page.locator('#product-detail').isVisible(),true);
  assert.match(await page.locator('#product-detail').innerText(),availability);
  assert.equal(await page.locator('#product-detail button[data-add-snapshot]').isVisible(),true);
  assert.equal(await page.locator('#product-detail a[href*="wa.me"]').count(),0);
  assert.equal(supabaseRequests.length,0,'product details must load without Supabase');
  await page.goto('https://volttechcomputerco.co.za/',{waitUntil:'domcontentloaded'});
  assert.match(await page.locator('.mobile-nav-cart a').first().getAttribute('href'),/store\.html\?cart=1/);
  if (width === 1440) await page.getByRole('button',{name:'Open side cart',exact:true}).waitFor({state:'visible'});
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
   const drawer=page.getByRole('dialog',{name:'Your cart',exact:true});
   await drawer.waitFor({state:'visible'});
   const drawerBox=await drawer.boundingBox();
   assert.ok(Math.abs(drawerBox.x+drawerBox.width-width)<=1,'cart opens against the right side');
   await drawer.getByRole('button',{name:'Close side cart'}).click();
   await page.getByRole('button',{name:'Open side cart, 1 item'}).click();
   await drawer.getByRole('link',{name:'Continue to checkout →'}).click();
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
