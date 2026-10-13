import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)('playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.VT_CHROMIUM_PATH});
for(const width of [320,390,1440]){
 const page=await browser.newPage({viewport:{width,height:900}});
 await page.route('https://**/*',r=>r.abort());
 await page.route('**/*.js*',r=>r.request().url().includes('/assets/js/theme.js')?r.continue():r.fulfill({contentType:'application/javascript',body:''}));
 for(const theme of ['light','dark']){
  await page.goto('http://127.0.0.1:4173/account.html');
  await page.evaluate(t=>{document.documentElement.dataset.theme=t;document.querySelector('#authGate').hidden=false;},theme);
  const card=await page.locator('.account-auth-card').boundingBox();
  const copy=await page.locator('.account-auth-copy').boundingBox();
  assert.ok(card.y<copy.y || card.x<copy.x,'login form must precede explanatory copy');
  assert.ok((await page.locator('#authEmail').boundingBox()).y<600,'email visible without scrolling');
  await page.evaluate(()=>document.querySelector('#site-search').showModal());
  const input=await page.locator('#site-search-input').boundingBox();
  const dialog=await page.locator('#site-search').boundingBox();
  assert.ok(input.width>dialog.width*.7 && input.x+input.width<=dialog.x+dialog.width,'full-width search stays inside dialog');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no account overflow');
  await page.goto('http://127.0.0.1:4173/index.html');
  assert.ok(await page.locator('.department-card img').evaluateAll(imgs=>imgs.every(i=>i.getAttribute('src').startsWith('assets/categories/'))),'local category images');
  assert.equal(await page.locator('.department-card').count(),6);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no home shop overflow');
  const cards=await page.locator('.department-card').all();
  for(const c of cards){const i=await c.locator('.department-image').boundingBox(),t=await c.locator('h3').boundingBox();assert.ok(t.y>=i.y+i.height,'category text follows image without overlap');}
  await page.goto('http://127.0.0.1:4173/store.html');
  assert.equal(await page.locator('.store-departments .department-card').count(),20);
  assert.equal(await page.locator('.department-group').count(),3);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no store department overflow');
 }
 console.log(`PASS: login placement, search sizing and local category images at ${width}`);
 await page.close();
}
await browser.close();
