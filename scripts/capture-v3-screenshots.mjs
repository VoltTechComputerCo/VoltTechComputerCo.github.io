import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.VT_CAPTURE_BASE || 'http://127.0.0.1:4173';
const OUT = path.resolve('qa-screenshots/v3');
fs.mkdirSync(OUT,{recursive:true});

const profiles = {
  desktop: { viewport:{width:1440,height:1000}, deviceScaleFactor:1, isMobile:false, hasTouch:false },
  mobile: { viewport:{width:390,height:844}, deviceScaleFactor:1, isMobile:true, hasTouch:true }
};

const pages = [
  {key:'home',url:'/index.html',sections:[
    ['hero','.home-hero'],['components','#components'],['tools','.tool-section'],
    ['services','#services'],['discovery','.discovery-section'],['creators','.creator-strip'],['contact','.contact-section']
  ]},
  {key:'store',url:'/store.html',sections:[
    ['hero','.store-hero'],['categories','#components'],['catalogue','.store-catalogue-wrap'],['advice','.store-advice']
  ]},
  {key:'builder',url:'/builder/index.html?inspect=1',sections:[
    ['hero','.hero'],['trust','.builder-trust'],['modes','.mode-shell'],['workspace','.builder-layout']
  ]},
  {key:'repair',url:'/pc-repair-pretoria.html',sections:[['hero','.service-hero'],['network','.service-network']]},
  {key:'upgrades',url:'/pc-upgrades-pretoria.html'},
  {key:'performance',url:'/pc-performance-optimisation.html'},
  {key:'security',url:'/virus-malware-removal-pretoria.html'},
  {key:'windows',url:'/windows-installation-pretoria.html'},
  {key:'signal-scan',url:'/signal-scan.html',sections:[['hero','.scan-heading'],['workspace','.scan-layout']]},
  {key:'exposure-scan',url:'/exposure-scan.html',sections:[['hero','.hero'],['scanner','.scan-shell']]},
  {key:'stream-support',url:'/streaming-setup-south-africa.html',sections:[['hero','.service-hero'],['tools','.creator-tool-nav']]},
  {key:'stream-scan',url:'/stream-scan.html',sections:[['hero','.scan-heading'],['workspace','.scan-layout']]},
  {key:'creator-hub',url:'/creator-hub-south-africa.html',sections:[['hero','.creator-hero'],['spotlight','.creator-panel']]},
  {key:'creator-register',url:'/creator-register.html',sections:[['hero','.creator-register-hero'],['registration','.creator-register-grid']]},
  {key:'account',url:'/account.html',sections:[['hero','.account-hero'],['body','.account-body']]},
  {key:'quotes',url:'/quotes.html'},
  {key:'builds',url:'/builds.html'},
  {key:'documents',url:'/documents.html'},
  {key:'activity',url:'/activity.html'},
  {key:'checkout',url:'/checkout.html',sections:[['heading','.transaction-heading'],['flow','.transaction-grid']]},
  {key:'order-status',url:'/order-status.html',sections:[['heading','.transaction-heading'],['flow','.transaction-grid']]},
  {key:'privacy-center',url:'/privacy-center.html',sections:[['hero','.privacy-hero'],['body','.privacy-grid']]},
  {key:'legal',url:'/legal.html',sections:[['hero','.legal-hero'],['content','.legal-content']]},
  {key:'terms',url:'/terms.html'},
  {key:'static',url:'/static.html',sections:[['hero','.static-hero'],['lead','.static-lead'],['mailer','.static-mailer']]},
  {key:'static-article',url:'/static-amd-world-labs-spatial-ai-acquisition.html',sections:[['hero','.static-article-hero'],['article','.static-article-main article']]},
  {key:'not-found',url:'/404.html',sections:[['hero','.error-home-hero'],['routes','.error-route-section']]}
];

const safe = value => value.replace(/[^a-z0-9._-]+/gi,'-').replace(/^-|-$/g,'');
const manifest = {generated_at:new Date().toISOString(),base:BASE,profiles:{},issues:[]};

async function settle(page){
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(async()=>{ if(document.fonts?.ready) await document.fonts.ready; }).catch(()=>{});
  await page.waitForTimeout(1600);
}

async function shot(page,file,locator=null){
  const destination=path.join(OUT,file);
  if(locator){
    const target=page.locator(locator).first();
    if(await target.count() && await target.isVisible().catch(()=>false)){
      await target.screenshot({path:destination,type:'jpeg',quality:82});
      return true;
    }
    return false;
  }
  await page.screenshot({path:destination,type:'jpeg',quality:80,fullPage:true});
  return true;
}

const browser = await chromium.launch({headless:true});
try{
  for(const [profileName,profile] of Object.entries(profiles)){
    const context=await browser.newContext({
      viewport:profile.viewport,deviceScaleFactor:profile.deviceScaleFactor,
      isMobile:profile.isMobile,hasTouch:profile.hasTouch,
      locale:'en-ZA',timezoneId:'Africa/Johannesburg',
      colorScheme:'dark',reducedMotion:'no-preference'
    });
    manifest.profiles[profileName]=[];

    for(const spec of pages){
      const page=await context.newPage();
      const pageIssues=[];
      page.on('pageerror',err=>pageIssues.push('pageerror: '+err.message));
      page.on('console',msg=>{
        if(msg.type()==='error'){
          const text=msg.text();
          if(!/Failed to load resource.*(401|403|404)/i.test(text)) pageIssues.push('console: '+text);
        }
      });
      page.on('response',res=>{
        if(res.url().startsWith(BASE) && res.status()>=400) pageIssues.push(`HTTP ${res.status()} ${res.url()}`);
      });

      try{
        await page.goto(BASE+spec.url,{waitUntil:'domcontentloaded',timeout:30000});
        await settle(page);

        // Make dynamic public surfaces settle where possible without fabricating data.
        if(spec.key==='store'){
          await page.locator('#catalogue:not([hidden])').waitFor({state:'visible',timeout:8000}).catch(()=>{});
          await page.waitForTimeout(700);
        }
        if(spec.key==='creator-hub') await page.waitForTimeout(1000);

        const full=`${profileName}--${spec.key}--full.jpg`;
        await shot(page,full);
        manifest.profiles[profileName].push({page:spec.key,url:spec.url,file:full});

        for(const [sectionName,selector] of spec.sections||[]){
          const file=`${profileName}--${spec.key}--${safe(sectionName)}.jpg`;
          if(await shot(page,file,selector)) manifest.profiles[profileName].push({page:spec.key,section:sectionName,file});
        }

        if(profileName==='mobile' && spec.key==='home'){
          const toggle=page.locator('[data-menu-toggle]');
          if(await toggle.isVisible().catch(()=>false)){
            await toggle.click();
            await page.waitForTimeout(250);
            const file='mobile--home--system-map-open.jpg';
            if(await shot(page,file,'#primary-navigation')) manifest.profiles[profileName].push({page:'home',section:'system-map-open',file});
            await page.keyboard.press('Escape');
          }
        }

        if(spec.key==='store'){
          const gpu=page.locator('[data-category-link="gpu"]').first();
          if(await gpu.isVisible().catch(()=>false)){
            await gpu.click();
            await page.waitForTimeout(350);
            const file=`${profileName}--store--gpu-quick-filter.jpg`;
            const filter=page.locator('.category-filter-menu').first();
            if(await filter.isVisible().catch(()=>false)){
              await filter.screenshot({path:path.join(OUT,file),type:'jpeg',quality:82});
              manifest.profiles[profileName].push({page:'store',section:'gpu-quick-filter',file});
            }
            await page.keyboard.press('Escape');
          }
        }

        if(spec.key==='exposure-scan'){
          const button=page.locator('#scanButton');
          if(await button.isVisible().catch(()=>false)){
            await button.click();
            await page.locator('#results.show').waitFor({state:'visible',timeout:12000}).catch(()=>{});
            await page.waitForTimeout(350);
            const file=`${profileName}--exposure-scan--results.jpg`;
            if(await shot(page,file,'#results')) manifest.profiles[profileName].push({page:'exposure-scan',section:'results',file});
          }
        }

        // Flag obvious horizontal overflow beyond a small rounding allowance.
        const overflow=await page.evaluate(()=>Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-window.innerWidth);
        if(overflow>3) pageIssues.push(`horizontal overflow: ${overflow}px`);
      }catch(error){
        pageIssues.push('capture: '+(error instanceof Error?error.message:String(error)));
      }

      if(pageIssues.length) manifest.issues.push({profile:profileName,page:spec.key,issues:[...new Set(pageIssues)]});
      await page.close();
    }
    await context.close();
  }
}finally{
  await browser.close();
}

fs.writeFileSync(path.join(OUT,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(`Captured ${Object.values(manifest.profiles).flat().length} V3 screenshots.`);
if(manifest.issues.length){
  console.log(`Recorded ${manifest.issues.length} page/profile issue groups in manifest.json.`);
}