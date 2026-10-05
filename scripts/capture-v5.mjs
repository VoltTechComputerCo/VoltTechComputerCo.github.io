import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

// retry after mobile navigation fix
const base='http://127.0.0.1:4173/v5';
const out=path.resolve('qa-screenshots/v5');
fs.mkdirSync(out,{recursive:true});

const profiles={
  mobile:{viewport:{width:390,height:844},isMobile:true,hasTouch:true},
  desktop:{viewport:{width:1440,height:1000},isMobile:false,hasTouch:false}
};

const pages=[
  {key:'home',url:'/index.html'},
  {key:'store',url:'/store.html'},
  {key:'builder',url:'/builder.html'}
];

const manifest={revision:'v5-clean-rebuild',captures:[],issues:[]};

async function capture(page,name,opts={fullPage:true}){
  const file=path.join(out,name+'.jpg');
  await page.screenshot({path:file,type:'jpeg',quality:84,...opts});
  const size=fs.statSync(file).size;
  if(size<3500) throw new Error(`${name}: screenshot too small (${size} bytes)`);
  manifest.captures.push(name+'.jpg');
}
async function settle(page){
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(async()=>{if(document.fonts?.ready)await document.fonts.ready});
  await page.waitForTimeout(500);
}

const browser=await chromium.launch({headless:true});
let failed=false;
try{
  for(const [profileName,profile] of Object.entries(profiles)){
    const context=await browser.newContext({...profile,deviceScaleFactor:1,colorScheme:'light',locale:'en-ZA',timezoneId:'Africa/Johannesburg'});
    for(const spec of pages){
      const page=await context.newPage();
      const errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      try{
        await page.goto(base+spec.url,{waitUntil:'domcontentloaded',timeout:20000});
        await settle(page);
        const overflow=await page.evaluate(()=>Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth);
        if(overflow>2) throw new Error(`${spec.key}: horizontal overflow ${overflow}px`);
        await capture(page,`${profileName}--${spec.key}--full`);

        if(profileName==='mobile'&&spec.key==='home'){
          await page.locator('[data-menu]').click();
          await page.locator('#site-nav:not([hidden])').waitFor({state:'visible'});
          const navBox=await page.locator('#site-nav').boundingBox();
          if(!navBox||navBox.height<500) throw new Error('mobile menu did not fill screen');
          const file=path.join(out,'mobile--home--menu.jpg');
          await page.locator('#site-nav').screenshot({path:file,type:'jpeg',quality:84});
          if(fs.statSync(file).size<2500) throw new Error('mobile menu capture too small');
          manifest.captures.push('mobile--home--menu.jpg');
        }

        if(spec.key==='builder'){
          const next=page.locator('[data-next]');
          for(let i=0;i<4;i++){
            const visibleChoice=page.locator('.step.active .choice').first();
            if(await visibleChoice.count()) await visibleChoice.click();
            await next.click();
            await page.waitForTimeout(100);
          }
          const summary=page.locator('.step.active .build-summary');
          if(!(await summary.isVisible())) throw new Error('builder summary not visible after flow');
          const file=path.join(out,`${profileName}--builder--summary.jpg`);
          await summary.screenshot({path:file,type:'jpeg',quality:84});
          if(fs.statSync(file).size<2500) throw new Error('builder summary capture too small');
          manifest.captures.push(`${profileName}--builder--summary.jpg`);
        }
      }catch(e){
        failed=true;errors.push(e instanceof Error?e.message:String(e));
      }
      if(errors.length) manifest.issues.push({profile:profileName,page:spec.key,errors});
      await page.close();
    }
    await context.close();
  }
}finally{await browser.close()}

fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
if(failed){console.error(JSON.stringify(manifest.issues,null,2));process.exit(1)}
console.log(`V5 visual QA passed with ${manifest.captures.length} captures`);