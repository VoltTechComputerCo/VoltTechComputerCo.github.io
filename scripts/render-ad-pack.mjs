
import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {execFileSync} from 'node:child_process';
const {chromium}=createRequire(import.meta.url)('playwright');
const context={window:{}};vm.runInNewContext(fs.readFileSync('supabase-config.js','utf8'),context);const cfg=context.window.VOLTTECH_SUPABASE;
const {PRESETS,ready,caption}=await import('../assets/js/marketing/ad-renderer.js');
assert.equal(ready({status:'active',visibility:'public',sale_mode:'quote',stock_qty:0,retail_price:100}),false);
const dir='assets/ads';fs.mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.VT_CHROMIUM_PATH||'/usr/bin/google-chrome'});
const page=await browser.newPage();await page.goto('http://127.0.0.1:4173/admin-ad-studio.html');
const captions=[];
try{for(const preset of PRESETS){
 const u=new URL(cfg.url+'/rest/v1/store_products');u.searchParams.set('select','id,name,retail_price,stock_qty,status,visibility,sale_mode,is_demo,media');u.searchParams.set('id','eq.'+preset.id);
 let r=await fetch(u,{headers:{apikey:cfg.publishableKey}});assert.ok(r.ok,'catalogue HTTP '+r.status);const [product]=await r.json();assert.ok(ready(product),'preset must have supplier stock: '+preset.key);
 r=await fetch(cfg.url+'/functions/v1/supplier-ad-image?id='+encodeURIComponent(product.id));assert.ok(r.ok,'supplier image '+preset.key+': '+r.status);const img='data:'+r.headers.get('content-type')+';base64,'+Buffer.from(await r.arrayBuffer()).toString('base64');
 for(const story of [false,true]){
  const png=await page.evaluate(async ({product,preset,img,story})=>{const m=await import('/assets/js/marketing/ad-renderer.js');const cv=document.createElement('canvas');await m.render(cv,product,preset,{story,imageSource:img,logoSource:'/assets/brand/volttech-logo.webp',fontSource:'/assets/fonts/bender.otf'});if(cv.width!==1080||cv.height!==(story?1920:1350))throw Error('Wrong output size');if(!document.fonts.check('700 24px Bender'))throw Error('Bender failed to load');const small=document.createElement('canvas');small.width=360;small.height=story?640:450;small.getContext('2d').drawImage(cv,0,0,small.width,small.height);return {png:cv.toDataURL('image/png').split(',')[1],preview:small.toDataURL('image/webp',.8).split(',')[1]};},{product,preset,img,story});
  fs.writeFileSync(dir+'/'+preset.key+'-'+(story?'story':'feed')+'.png',Buffer.from(png.png,'base64'));
 }
 captions.push(preset.key.toUpperCase()+'\n'+caption(product,preset));console.log('PASS: real supplier image, Bender font and both formats for '+preset.key);
}}finally{await browser.close();}
fs.writeFileSync(dir+'/captions.txt',captions.join('\n\n------------------------------\n\n'));
fs.writeFileSync(dir+'/posting-guide.txt','VoltTech launch posts — generated '+new Date().toISOString()+'\n\nUse feed PNGs for Instagram and Facebook; story PNGs for Stories. Captions are in captions.txt. Refresh price and supplier availability in Operations Hub > Marketing before publishing. The custom PC post illustrates a case, not a fixed-price complete build. Start with 2–3 product themes. Promote the posts that bring qualified enquiries, then expand. No posts have been published and no advertising spend has been started.\n');
execFileSync('zip',['-j',dir+'/volttech-launch-pack.zip',...fs.readdirSync(dir).filter(f=>/\.(png|txt)$/.test(f)).map(f=>dir+'/'+f)]);
if(process.env.GITHUB_TOKEN){
 const repo=process.env.GITHUB_REPOSITORY,base='https://api.github.com/repos/'+repo,headers={Authorization:'Bearer '+process.env.GITHUB_TOKEN,Accept:'application/vnd.github+json','Content-Type':'application/json'};
 async function api(path,method='GET',body){const r=await fetch(base+path,{method,headers,...(body?{body:JSON.stringify(body)}:{})});if(!r.ok)throw Error('GitHub '+r.status+': '+await r.text());return r.json();}
 const files=fs.readdirSync(dir).filter(f=>/\.(png|webp|txt|zip)$/.test(f)),entries=[];
 for(const file of files){const blob=await api('/git/blobs','POST',{content:fs.readFileSync(dir+'/'+file).toString('base64'),encoding:'base64'});entries.push({path:dir+'/'+file,mode:'100644',type:'blob',sha:blob.sha});}
 const ref=await api('/git/ref/heads/main'),head=await api('/git/commits/'+ref.object.sha),tree=await api('/git/trees','POST',{base_tree:head.tree.sha,tree:entries}),commit=await api('/git/commits','POST',{message:'Add six VoltTech campaign posts, story formats and ready-to-post captions',parents:[head.sha],tree:tree.sha});
 await api('/git/refs/heads/main','PATCH',{sha:commit.sha,force:false});console.log('Published downloadable pack: '+commit.sha);
}
