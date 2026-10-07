import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)('playwright');
for(const width of [390,1440]) {
 const browser=await chromium.launch({headless:true,executablePath:process.env.VT_CHROMIUM_PATH,args:['--no-sandbox','--single-process','--no-zygote','--disable-gpu']});
 const page=await browser.newPage({viewport:{width,height:700}});
 await page.route('https://**/*',r=>r.abort());
 for(const [path,selector] of [['index.html','.site-header'],['store.html','.site-header'],['account.html','.site-header'],['quote.html','.site-header'],['admin.html','main > .top'],['admin-store.html','.store-nav'],['static.html','.static-topbar']]) {
  await page.goto('http://127.0.0.1:4173/'+path);
  await page.evaluate(()=>{const filler=document.createElement('div');filler.style.height='2500px';document.querySelector('main')?.append(filler);});
  await page.evaluate(()=>window.scrollTo({top:600,behavior:'instant'}));
  const header=page.locator(selector).first();
  assert.ok(Math.abs((await header.boundingBox()).y)<2,`${path} header remains at top at ${width}`);
 }
 console.log('PASS: persistent headers on public, customer, admin and STATIC pages at '+width);
 await browser.close();
}
