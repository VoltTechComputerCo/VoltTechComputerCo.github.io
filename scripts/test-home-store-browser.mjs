import {createRequire} from 'node:module';import assert from 'node:assert/strict';import fs from 'node:fs';
const {chromium}=createRequire(import.meta.url)('playwright');
fs.mkdirSync('qa-results/home-store',{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.VT_CHROMIUM_PATH});
for(const width of [320,390,768,1440]){
 const page=await browser.newPage({viewport:{width,height:900}});let errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://**/*',r=>r.abort());await page.goto('http://127.0.0.1:4173/index.html');
 assert.deepEqual(await page.locator('main>section').evaluateAll(s=>s.map(x=>x.id||x.className)),['home-hero','components','stream-support','services']);
 assert.equal(await page.locator('.department-card').count(),6);assert.equal(await page.locator('.service-card').count(),6);
 for(const theme of ['light','dark']){
 await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`overflow at ${width}/${theme}`);
 assert.equal(await page.locator('.hero-description').evaluate(x=>getComputedStyle(x).color),theme==='light'?'rgb(77, 101, 97)':await page.locator('.hero-description').evaluate(x=>getComputedStyle(x).color));
 assert.equal(await page.locator('.stream-support-tags span').evaluateAll(xs=>xs.every(x=>x.scrollWidth<=x.clientWidth)),true,'labels fit');
 assert.equal(await page.locator('.hero-copy .button').first().getAttribute('href'),'store.html');
 await page.locator('#services').scrollIntoViewIfNeeded();await page.locator('#stream-support').scrollIntoViewIfNeeded();await page.locator('#components').scrollIntoViewIfNeeded();
 assert.equal(await page.locator('.home-services .service-grid').evaluate(x=>getComputedStyle(x).gridTemplateColumns.split(' ').length),width<=700?2:3);
 await page.screenshot({path:`qa-results/home-store/home-${width}-${theme}.png`,fullPage:true});
 }
 assert.deepEqual(errors,[]);console.log(`PASS: four sections, store priority, labels, both themes and no overflow at ${width}`);await page.close();
}await browser.close();
