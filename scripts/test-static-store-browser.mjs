// Production-mode public browsing must work without the Supabase API.
// GitHub Pages/CDN snapshot fixture only. No real orders or supplier calls.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.VT_CHROMIUM_PATH});
for(const width of [390,1440]){
 const page=await browser.newPage({viewport:{width,height:900}});
 const errors=[],backend=[];
 page.on('pageerror',err=>errors.push(err.message));
 page.on('request',req=>{if(/supabase\.co|\/rest\/v1\/|\/auth\/v1\/|\/functions\/v1\//i.test(req.url()))backend.push(req.url())});
 // Force the production policy on localhost. No real Supabase request allowed.
 await page.route('**/assets/js/services/storefront-mode.js*',route=>route.fulfill({
   contentType:'application/javascript',body:'export const STATIC_ENQUIRY_MODE=true;'
 }));
 await page.route('https://**/*',route=>route.abort());
 await page.goto('http://127.0.0.1:4173/store.html',{waitUntil:'domcontentloaded'});
 await page.locator('#product-grid .catalogue-card').first().waitFor({timeout:15000});
 assert.ok(await page.locator('#catalogue').isVisible(),'static catalogue is visible');
 assert.equal(await page.locator('[data-cart-link]:visible').count(),0,'unusable checkout cart is hidden');
 assert.ok(await page.locator('#store-gate').isHidden(),'large outage warning does not block browsing');
 assert.ok((await page.locator('#store-state').innerText()).includes('WhatsApp'),'availability disclaimer is visible');
 const card=page.locator('#product-grid .catalogue-card').first();
 assert.ok(await card.locator('a[href*="wa.me/27618435775"]').isVisible(),
   'WhatsApp quote CTA must be visible and tappable on mobile and desktop');
 const text=await card.innerText();
 assert.ok(/Current price and availability confirmed personally/i.test(text),'no outdated price represented as current');
 const detail=await card.locator('a[href*="product.html?slug="]').first().getAttribute('href');
 assert.ok(detail,'product detail uses supplier-free public slug');
 await page.locator('#catalogue-search').fill('nonsense-zzzz');
 assert.equal(await page.locator('#product-grid .catalogue-card').count(),0,'search respects query');
 await page.goto(new URL(detail,'http://127.0.0.1:4173/store.html').href,{waitUntil:'domcontentloaded'});
 await page.locator('#product-detail .component-overview').waitFor({timeout:15000});
 assert.ok(await page.locator('#product-detail').isVisible(),'product specs stay viewable');
 assert.ok(await page.locator('#store-gate').isHidden(),'product page is not covered by outage notice');
 assert.ok(await page.locator('#product-detail a[href*="wa.me/27618435775"]').isVisible(),'product can be quoted via WhatsApp');
 assert.equal(backend.length,0,'Store and product must make zero Supabase calls: '+JSON.stringify(backend));
 await page.goto('http://127.0.0.1:4173/index.html',{waitUntil:'domcontentloaded'});
 await page.locator('main h1').first().waitFor({timeout:15000});
 assert.ok(await page.locator('main').isVisible(),'homepage remains browsable without backend');
 assert.equal(backend.length,0,'homepage also makes zero Supabase calls: '+JSON.stringify(backend));
 assert.deepEqual(errors,[],'no uncaught browser errors');
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow');
 console.log('PASS: independent static Store and product browsing at '+width+'px, zero Supabase calls');
 await page.close();
}
await browser.close();
