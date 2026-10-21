import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=createRequire(import.meta.url)('playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.VT_CHROMIUM_PATH});
await fs.mkdir('qa-results/theme',{recursive:true});
for(const width of [320,360,390,430,768,896]){
 const height=width>=768?600:900;
 const page=await browser.newPage({viewport:{width,height},serviceWorkers:'block'});
 await page.route('https://**/*',r=>r.abort());
 await page.goto('http://127.0.0.1:4173/index.html');
 for(const theme of ['light','dark']){
  if(await page.locator('html').getAttribute('data-theme')!==theme)await page.locator('[data-theme-toggle]').click();
  await page.locator('#services').scrollIntoViewIfNeeded();
  await page.locator('[data-menu-toggle]').click();
  const menu=page.locator('#primary-navigation');
  await menu.waitFor({state:'visible'});
  const box=await menu.boundingBox();
  assert.ok(box.x>=0&&box.x+box.width<=width,'entire menu is within viewport at '+width+' '+theme+' '+JSON.stringify(box));
  assert.ok(box.y>=0&&box.y+box.height<=height+1,'menu height fits viewport');
  for(const link of await menu.locator('a:visible').all()){
   const b=await link.boundingBox();
   assert.ok(b.x>=box.x&&b.x+b.width<=box.x+box.width+1,'every menu tile is horizontally accessible');
  }
  if([390,768].includes(width))await page.screenshot({path:`qa-results/theme/menu-${width}-${theme}.png`});
  await page.keyboard.press('Escape');
  assert.equal(await menu.isVisible(),false);
  await page.locator('.footer-brand .site-brand-logo').scrollIntoViewIfNeeded();
  const logo=page.locator('.footer-brand .site-brand-logo');
  const bg=await logo.evaluate(el=>getComputedStyle(el).backgroundColor);
  if(theme==='light')assert.equal(bg,'rgb(7, 23, 26)','white wordmark has a dark backing in light mode');
  else assert.ok(['rgba(0, 0, 0, 0)','transparent'].includes(bg),'dark mode retains the transparent logo');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal page or footer overflow');
  if(width===390)await page.screenshot({path:`qa-results/theme/footer-logo-${theme}.png`});
 }
 console.log(`PASS: menu and every tile remain onscreen; light/dark logo contrast; no footer overflow at ${width}`);
 await page.close();
}
await browser.close();
