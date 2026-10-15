import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {execFileSync} from 'node:child_process';
const {chromium}=createRequire(import.meta.url)('playwright');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync('supabase-config.js','utf8'),ctx);const cfg=ctx.window.VOLTTECH_SUPABASE;
const presets=[
 {key:'rtx5060',id:'syntech-43244b41bbe0e930',title:'RTX 5060. FOR LESS.'},
 {key:'fizz-magnetic',id:'syntech-67b846df867b5681',title:'FIZZ MAGNETIC.'},
 {key:'storm-mouse',id:'syntech-43580d274eaac5a1',title:'STORM. ON SPECIAL.'},
 {key:'zeus-pro',id:'syntech-afa96ab08bfb2c20',title:'ZEUS PRO. FOR LESS.'}
];
const dir='assets/ads/week-20261015';fs.mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.VT_CHROMIUM_PATH||'/usr/bin/google-chrome'}),page=await browser.newPage();await page.goto('http://127.0.0.1:4173/admin-ad-studio.html');
const records=[];
try{for(const preset of presets){
 const u=new URL(cfg.url+'/rest/v1/store_products');u.searchParams.set('select','id,slug,name,retail_price,compare_at_price,stock_qty,status,visibility,sale_mode,is_demo,metadata,media');u.searchParams.set('id','eq.'+preset.id);
 let res=await fetch(u,{headers:{apikey:cfg.publishableKey}});assert.ok(res.ok);const[p]=await res.json();assert.ok(p&&p.stock_qty>0&&Number(p.compare_at_price)>Number(p.retail_price));assert.equal(p.metadata.deal_campaign,'weekend-upgrades-20261015');
 const product={id:p.id,slug:p.slug,name:p.name,retail_price:p.retail_price,compare_at_price:p.compare_at_price,stock_qty:p.stock_qty,status:p.status,visibility:p.visibility,sale_mode:p.sale_mode,is_demo:p.is_demo,ends:p.metadata.deal_ends_at};
 res=await fetch(cfg.url+'/functions/v1/supplier-ad-image?id='+p.id);assert.ok(res.ok,'supplier image '+preset.key);const img='data:'+res.headers.get('content-type')+';base64,'+Buffer.from(await res.arrayBuffer()).toString('base64');
 for(const story of [false,true]){
  const result=await page.evaluate(async({product,preset,img,story})=>{
   const {render,money}=await import('/assets/js/marketing/ad-renderer.js');const cv=document.createElement('canvas');await render(cv,product,preset,{story:false,imageSource:img,logoSource:'/assets/brand/volttech-logo.webp',fontSource:'/assets/fonts/bender.otf'});
   const c=cv.getContext('2d'),h=cv.height;c.fillStyle='#63ffcf';c.beginPath();c.roundRect(54,293,972,42,9);c.fill();c.fillStyle='#062326';c.font='25px Bender';c.fillText('THIS WEEK ONLY  /  ENDS 18 OCT · 23:59 SAST',76,322);
   c.fillStyle='#b9d3d1';c.font='28px Bender';c.fillText('PREVIOUS PRICE '+money({retail_price:product.compare_at_price}),66,h-312);const saving=Number(product.compare_at_price)-Number(product.retail_price);c.fillStyle='#63ffcf';c.font='27px Bender';c.fillText('SAVE '+money({retail_price:saving}),660,h-312);
   let output=cv;if(story){output=document.createElement('canvas');output.width=1080;output.height=1920;const out=output.getContext('2d');const bg=out.createLinearGradient(0,0,1080,1920);bg.addColorStop(0,'#081b24');bg.addColorStop(1,'#073b3b');out.fillStyle=bg;out.fillRect(0,0,1080,1920);out.drawImage(cv,60,280,960,1200);}const small=document.createElement('canvas');small.width=360;small.height=story?640:450;small.getContext('2d').drawImage(output,0,0,small.width,small.height);return{png:output.toDataURL('image/png').split(',')[1],preview:small.toDataURL('image/webp',.85).split(',')[1]};
  },{product,preset,img,story});
  const file=preset.key+'-'+(story?'story':'feed');fs.writeFileSync(dir+'/'+file+'.png',Buffer.from(result.png,'base64'));fs.writeFileSync(dir+'/'+file+'-preview.webp',Buffer.from(result.preview,'base64'));
 }
 records.push({...preset,...product});console.log('PASS: price, genuine previous selling price, stock and both formats: '+preset.key);
}}finally{await browser.close();}
fs.writeFileSync(dir+'/campaign.json',JSON.stringify(records,null,2));
const tmp='/tmp/volttech-weekly-video';fs.mkdirSync(tmp,{recursive:true});
for(const preset of presets)execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-loop','1','-i',dir+'/'+preset.key+'-story.png','-f','lavfi','-i','anullsrc=channel_layout=stereo:sample_rate=44100','-t','4','-vf','fps=30,format=yuv420p,fade=t=in:st=0:d=0.2,fade=t=out:st=3.8:d=0.2','-c:v','libx264','-preset','veryfast','-crf','20','-c:a','aac','-b:a','128k','-shortest',tmp+'/'+preset.key+'.mp4']);
fs.writeFileSync(tmp+'/clips.txt',presets.map(p=>"file '"+tmp+'/'+p.key+".mp4'").join('\n'));execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',tmp+'/clips.txt','-c','copy','-movflags','+faststart',dir+'/weekend-upgrades-reel.mp4']);
const probe=JSON.parse(execFileSync('ffprobe',['-v','quiet','-show_streams','-show_format','-of','json',dir+'/weekend-upgrades-reel.mp4'],{encoding:'utf8'}));assert.ok(Number(probe.format.duration)>=15&&Number(probe.format.duration)<18);assert.ok(probe.streams.some(s=>s.codec_type==='video'&&s.width===1080&&s.height===1920));console.log('PASS: 1080x1920 H.264/AAC Instagram Reel, 16 seconds');
if(process.env.GITHUB_TOKEN){
 const base='https://api.github.com/repos/'+process.env.GITHUB_REPOSITORY,headers={Authorization:'Bearer '+process.env.GITHUB_TOKEN,Accept:'application/vnd.github+json','Content-Type':'application/json'};
 const api=async(path,method='GET',body)=>{const r=await fetch(base+path,{method,headers,...(body?{body:JSON.stringify(body)}:{})});if(!r.ok)throw Error('GitHub '+r.status+': '+await r.text());return r.json();};
 const tree=[];for(const name of fs.readdirSync(dir)){const blob=await api('/git/blobs','POST',{content:fs.readFileSync(dir+'/'+name).toString('base64'),encoding:'base64'});tree.push({path:dir+'/'+name,mode:'100644',type:'blob',sha:blob.sha});}
 const ref=await api('/git/ref/heads/main'),head=await api('/git/commits/'+ref.object.sha),t=await api('/git/trees','POST',{base_tree:head.tree.sha,tree}),commit=await api('/git/commits','POST',{message:'Publish weekly special posts, Stories and Reel through 18 October',parents:[head.sha],tree:t.sha});await api('/git/refs/heads/main','PATCH',{sha:commit.sha,force:false});console.log('Campaign media commit '+commit.sha);
}

