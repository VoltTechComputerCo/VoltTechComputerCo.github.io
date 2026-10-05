// V4 generated-head validation trigger
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE=process.env.VT_CAPTURE_BASE||'http://127.0.0.1:4173';
const OUT=path.resolve('qa-screenshots/v4');
fs.mkdirSync(OUT,{recursive:true});

const profiles={
  mobile390:{viewport:{width:390,height:844},isMobile:true,hasTouch:true},
  mobile360:{viewport:{width:360,height:800},isMobile:true,hasTouch:true},
  desktop:{viewport:{width:1440,height:1000},isMobile:false,hasTouch:false}
};

const pages=[
  {key:'home',url:'/index.html',sections:[['hero','.v4-home-hero'],['routes','.v4-route-section'],['hardware','.v4-hardware-stage'],['builder','.v4-builder-feature'],['services','.v4-services'],['scan','.v4-scan-band'],['culture','.v4-culture'],['contact','.v4-contact']]},
  {key:'store',url:'/store.html',sections:[['hero','.v4-store-hero'],['categories','.v4-store-categories'],['workspace','.v4-store-workspace'],['help','.v4-store-help']]},
  {key:'builder',url:'/builder/index.html?inspect=1',sections:[['hero','.hero'],['trust','.builder-trust'],['modes','.mode-shell'],['workspace','.builder-layout']]},
  {key:'repair',url:'/pc-repair-pretoria.html',sections:[['hero','.service-hero'],['symptoms','.service-symptom-rail']]},
  {key:'upgrades',url:'/pc-upgrades-pretoria.html'},
  {key:'performance',url:'/pc-performance-optimisation.html'},
  {key:'security',url:'/virus-malware-removal-pretoria.html'},
  {key:'windows',url:'/windows-installation-pretoria.html'},
  {key:'signal',url:'/signal-scan.html',sections:[['heading','.scan-heading'],['workspace','.scan-layout']]},
  {key:'stream',url:'/streaming-setup-south-africa.html',sections:[['hero','.service-hero']]},
  {key:'stream-scan',url:'/stream-scan.html',sections:[['heading','.scan-heading'],['workspace','.scan-layout']]},
  {key:'creator',url:'/creator-hub-south-africa.html',sections:[['hero','.creator-hero'],['live','.creator-live-layout']]},
  {key:'account',url:'/account.html',sections:[['hero','.account-hero']]},
  {key:'checkout',url:'/checkout.html',sections:[['heading','.transaction-heading'],['flow','.transaction-grid']]},
  {key:'product',url:'/product.html'},
  {key:'legal',url:'/legal.html'},
  {key:'404',url:'/404.html',sections:[['hero','.error-home-hero'],['routes','.error-route-grid']]},
  {key:'static',url:'/static.html',sections:[['hero','.static-hero'],['lead','.static-lead']]},
  {key:'exposure',url:'/exposure-scan.html',sections:[['hero','.hero'],['scanner','.scan-shell']]}
];

const manifest={revision:'v4-clean-slate-redesign',generated_at:new Date().toISOString(),captures:[],issues:[]};
const safe=s=>s.replace(/[^a-z0-9._-]+/gi,'-');

async function validateFile(file){
  const stat=fs.statSync(file);
  if(stat.size<5000) throw new Error('Screenshot too small or empty: '+file+' ('+stat.size+' bytes)');
}
async function capture(page,name,selector=null){
  const file=path.join(OUT,name+'.jpg');
  if(selector){
    const loc=page.locator(selector).first();
    if(!(await loc.count()) || !(await loc.isVisible().catch(()=>false))) throw new Error('Missing visible selector '+selector);
    await loc.screenshot({path:file,type:'jpeg',quality:84});
  }else{
    await page.screenshot({path:file,type:'jpeg',quality:82,fullPage:true});
  }
  await validateFile(file);
  manifest.captures.push(name+'.jpg');
}
async function settle(page){
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(async()=>{if(document.fonts?.ready)await document.fonts.ready}).catch(()=>{});
  await page.waitForTimeout(1200);
}

const browser=await chromium.launch({headless:true});
let fatal=false;
try{
  for(const [profileName,profile] of Object.entries(profiles)){
    const context=await browser.newContext({...profile,deviceScaleFactor:1,locale:'en-ZA',timezoneId:'Africa/Johannesburg',colorScheme:'light'});
    for(const spec of pages){
      const page=await context.newPage();
      const issues=[];
      page.on('pageerror',e=>issues.push('pageerror: '+e.message));
      try{
        await page.goto(BASE+spec.url,{waitUntil:'domcontentloaded',timeout:30000});
        await settle(page);
        if(spec.key==='store'){
          await page.locator('#catalogue:not([hidden])').waitFor({state:'visible',timeout:8000}).catch(()=>{});
          await page.waitForTimeout(500);
        }
        const overflow=await page.evaluate(()=>Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-window.innerWidth);
        if(overflow>2) throw new Error('Horizontal overflow '+overflow+'px');

        // Full pages are mandatory except Store/Builder where section captures are safer and more useful.
        if(!['store','builder'].includes(spec.key)) await capture(page,profileName+'--'+spec.key+'--full');
        for(const [section,selector] of spec.sections||[]) await capture(page,profileName+'--'+spec.key+'--'+safe(section),selector);

        if(profileName!=='desktop' && spec.key==='home'){
          const toggle=page.locator('[data-menu-toggle]');
          if(await toggle.isVisible()){
            await toggle.click();
            await page.waitForTimeout(150);
            await capture(page,profileName+'--home--menu','#primary-navigation');
            await page.keyboard.press('Escape');
          }else throw new Error('Mobile menu toggle is not visible');
        }
      }catch(error){
        fatal=true;
        issues.push(error instanceof Error?error.message:String(error));
      }
      if(issues.length) manifest.issues.push({profile:profileName,page:spec.key,issues:[...new Set(issues)]});
      await page.close();
    }
    await context.close();
  }
}finally{await browser.close()}

fs.writeFileSync(path.join(OUT,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('V4 captures:',manifest.captures.length);
if(manifest.issues.length) console.log(JSON.stringify(manifest.issues,null,2));
if(fatal) process.exit(1);