import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const {chromium}=createRequire(import.meta.url)('playwright');
const pages=[['index.html','.site-header'],['store.html','.site-header'],['product.html','.site-header'],['account.html','.site-header'],['quote.html','.site-header'],['admin.html','main>.top'],['admin-store.html','.store-nav'],['builder/index.html','.site-header'],['static.html','.static-topbar'],['static-building-a-pc-2026.html','body>nav']];
fs.mkdirSync('qa-results/theme',{recursive:true});
for(const width of [320,390,1440]){
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width,height:900}});
 await page.route('https://**/*',r=>r.abort());
 // Isolate appearance from account, payment and notification side effects.
 await page.route('**/*.js*',r=>r.request().url().includes('/assets/js/theme.js')?r.continue():r.fulfill({contentType:'application/javascript',body:''}));
 for(const [path,header] of pages){
  await page.goto('http://127.0.0.1:4173/'+path);
  await page.locator('[data-theme-toggle]').waitFor();
  const initial=await page.evaluate(()=>({theme:document.documentElement.dataset.theme,bg:getComputedStyle(document.body).backgroundColor,fg:getComputedStyle(document.body).color}));
  assert.equal(initial.theme,'light',path+' defaults to light');
  assert.equal(initial.bg,'rgb(255, 255, 255)',path+' white canvas');
  assert.equal(initial.fg,'rgb(23, 46, 44)',path+' readable body text');
  // Exercise the header with its real mobile controls shown.
  await page.evaluate(()=>{document.querySelector('.menu-toggle')?.removeAttribute('hidden');});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,path+' width '+width);
  await page.locator('[data-theme-toggle]').click();
  assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),'dark');
  assert.notEqual(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgb(255, 255, 255)',path+' dark canvas');
  await page.reload();await page.locator('[data-theme-toggle]').waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),'dark',path+' saved preference');
  await page.locator('[data-theme-toggle]').click();
  await page.evaluate(()=>{const filler=document.createElement('div');filler.style.height='2500px';document.querySelector('main')?.append(filler);window.scrollTo({top:500,behavior:'instant'});});
  const h=page.locator(header).first();if(await h.count())assert.ok(Math.abs((await h.boundingBox()).y)<3,path+' persistent header');
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await page.screenshot({path:'qa-results/theme/'+path.replaceAll('/','-')+'-'+width+'.png',fullPage:false});
 }
 await browser.close();console.log('PASS: light/dark, persistence, header and no overflow at '+width);
}
