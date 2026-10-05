import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE=process.env.VT_BASE||'http://127.0.0.1:4173';
const OUT=path.resolve('v5/qa/screenshots');
fs.mkdirSync(OUT,{recursive:true});

const profiles={
  mobile360:{width:360,height:800},
  mobile390:{width:390,height:844},
  desktop1440:{width:1440,height:1000}
};
const pages=[
  {key:'home',url:'/v5/index.html'},
  {key:'store',url:'/v5/store.html'},
  {key:'builder',url:'/v5/builder.html'}
];

const manifest={revision:'v5-clean-rebuild',generated_at:new Date().toISOString(),captures:[],issues:[]};
let failed=false;

async function saveShot(page,name,selector=null,minBytes=3500){
  const file=path.join(OUT,name+'.jpg');
  if(selector){
    const loc=page.locator(selector).first();
    if(!(await loc.count()) || !(await loc.isVisible().catch(()=>false))) throw new Error('Missing visible selector '+selector);
    await loc.screenshot({path:file,type:'jpeg',quality:84});
  } else {
    await page.screenshot({path:file,type:'jpeg',quality:82,fullPage:true});
  }
  const size=fs.statSync(file).size;
  if(size<minBytes) throw new Error('Capture too small: '+name+' '+size+' bytes');
  manifest.captures.push({name,file:path.relative(process.cwd(),file),bytes:size});
}

const browser=await chromium.launch({headless:true});
try{
  for(const [profile,viewport] of Object.entries(profiles)){
    const context=await browser.newContext({viewport,deviceScaleFactor:1,locale:'en-ZA',timezoneId:'Africa/Johannesburg',colorScheme:'light'});
    for(const spec of pages){
      const page=await context.newPage();
      const issues=[];
      page.on('pageerror',e=>issues.push('pageerror: '+e.message));
      try{
        await page.goto(BASE+spec.url,{waitUntil:'domcontentloaded',timeout:30000});
        await page.evaluate(async()=>{if(document.fonts?.ready)await document.fonts.ready}).catch(()=>{});
        await page.waitForTimeout(1000);

        const overflow=await page.evaluate(()=>Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth);
        if(overflow>2) throw new Error('Horizontal overflow '+overflow+'px');

        await saveShot(page,profile+'--'+spec.key+'--full');

        if(profile!=='desktop1440'){
          const menu=page.locator('[data-menu]');
          if(!(await menu.isVisible())) throw new Error('Mobile menu button not visible');
          await menu.click();
          await page.waitForTimeout(120);
          const nav=page.locator('.v5-nav.open');
          if(!(await nav.isVisible())) throw new Error('Opened mobile menu not visible');
          const links=await nav.locator('a').count();
          if(links<3) throw new Error('Opened mobile menu missing links');
          const box=await nav.boundingBox();
          if(!box || box.height<500) throw new Error('Opened mobile menu too short: '+(box?.height||0));
          await saveShot(page,profile+'--'+spec.key+'--menu','.v5-nav.open',2200);
          await page.keyboard.press('Escape');
        }
      }catch(e){
        failed=true;
        issues.push(e instanceof Error?e.message:String(e));
      }
      if(issues.length) manifest.issues.push({profile,page:spec.key,issues:[...new Set(issues)]});
      await page.close();
    }
    await context.close();
  }
}finally{
  await browser.close();
}
fs.writeFileSync(path.join(OUT,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({captures:manifest.captures.length,issues:manifest.issues},null,2));
if(failed) process.exit(1);
