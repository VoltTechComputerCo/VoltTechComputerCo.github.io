import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const root=process.cwd();
const outDir=path.join(root,'qa-results/step-10.4-final');
fs.mkdirSync(outDir,{recursive:true});
const statePath=path.join(outDir,'state.json');
const EXPECTED_MAIN='b5820ad24725ac92087b3811855c52099758db65';

function git(args,{allowFail=false}={}){
  const run=spawnSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024});
  if(!allowFail && run.status!==0) throw new Error(`git ${args.join(' ')} failed\n${run.stdout||''}\n${run.stderr||''}`.trim());
  return run;
}
const stdout=args=>git(args).stdout.trim();
const load=()=>fs.existsSync(statePath)?JSON.parse(fs.readFileSync(statePath,'utf8')):{};
const save=s=>fs.writeFileSync(statePath,JSON.stringify(s,null,2)+'\n','utf8');
function fail(message,state=load()){save({...state,status:'FAIL',error:message});console.error(`FAIL: ${message}`);process.exit(1)}

async function prepare(){
  const cleanHead=stdout(['rev-parse','HEAD']);
  const mainHead=stdout(['rev-parse','origin/main']);
  const state={step:'10.4-final',phase:'prepare',clean_head:cleanHead,previous_main_head:mainHead,pushed:false};

  if(mainHead!==EXPECTED_MAIN) fail(`main moved: expected ${EXPECTED_MAIN}, found ${mainHead}`,state);
  if(!fs.existsSync(path.join(root,'404.html'))) fail('clean branch still does not contain tracked 404.html',state);

  const body=fs.readFileSync(path.join(root,'404.html'),'utf8');
  if(!body.includes('VOLTTECH / SIGNAL LOST') || !body.includes('name="robots" content="noindex, nofollow"')){
    fail('tracked 404.html does not match the certified custom 404 contract',state);
  }

  git(['config','user.name','github-actions[bot]']);
  git(['config','user.email','41898282+github-actions[bot]@users.noreply.github.com']);
  git(['checkout','-B','release-final-404','origin/main']);
  git(['checkout',cleanHead,'--','404.html']);
  git(['add','404.html']);
  git(['commit','-m','release: publish generated custom 404']);

  const changed=stdout(['diff','--name-only','origin/main..HEAD']).split('\n').filter(Boolean);
  state.changed_files=changed;
  if(changed.length!==1 || changed[0]!=='404.html') fail(`promotion contains unexpected files: ${changed.join(', ')}`,state);

  state.promotion_head=stdout(['rev-parse','HEAD']);
  state.status='PREPARED';
  save(state);
  console.log('PASS: final promotion contains only 404.html');
}

async function certify(){
  const state=load();
  const full=JSON.parse(fs.readFileSync(path.join(root,'qa-results/step-9.1-summary.json'),'utf8'));
  const step9=JSON.parse(fs.readFileSync(path.join(root,'qa-results/step-9.3/step-9.3-summary.json'),'utf8'));
  const checks={
    only_404:state.changed_files?.length===1&&state.changed_files[0]==='404.html',
    full:full.status==='PASS'&&full.passed===24&&full.total===24,
    step9:step9.status==='PASS',
    source:step9.gates?.release_source==='15/15',
    device:step9.gates?.device_role==='9/9',
    browser:step9.gates?.release_browser==='11/11',
    commerce_off:step9.commerce_launch_ready===false
  };
  const bad=Object.entries(checks).filter(([,v])=>!v).map(([k])=>k);
  if(bad.length) fail(`certification failed: ${bad.join(', ')}`,{...state,checks});
  state.status='CERTIFIED';state.checks=checks;save(state);
  console.log('PASS: final 404-only promotion certified');
}

async function prepush(){
  const state=load();
  const current=stdout(['rev-parse','origin/main']);
  if(current!==EXPECTED_MAIN) fail(`main moved before push: ${current}`,state);
  if(stdout(['rev-parse','HEAD'])!==state.promotion_head) fail('promotion HEAD changed',state);
  state.status='READY_TO_PUSH';save(state);
  console.log('PASS: main unchanged immediately before push');
}

async function pushed(){
  const state=load();
  state.pushed_head=stdout(['rev-parse','HEAD']);
  state.pushed=true;state.status='PUSHED';save(state);
  console.log(`PUSHED: ${state.pushed_head} -> main`);
}

async function verify(){
  const state=load();
  const remote=stdout(['rev-parse','origin/main']);
  if(remote!==state.pushed_head) fail(`remote main mismatch: expected ${state.pushed_head}, found ${remote}`,state);
  state.remote_main_head=remote;state.status='PASS';save(state);
  console.log(`PASS: remote main is ${remote}`);
}

async function live(){
  const state=load();
  const ROOT='https://volttechcomputerco.co.za';
  const results=[];let failures=0;
  const record=(name,ok,detail='')=>{const status=ok?'PASS':'FAIL';results.push({name,status,detail});if(!ok)failures++;console.log(`${status}: ${name}${detail?` — ${detail}`:''}`)};
  const assert=(v,m)=>{if(!v)throw new Error(m)};
  const check=async(name,fn)=>{try{await fn();record(name,true)}catch(e){record(name,false,e?.message||String(e))}};
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));

  async function request(pathname,{redirect='follow',expectBody=true}={}){
    const u=new URL(pathname,ROOT);u.searchParams.set('vt_release_check',state.remote_main_head.slice(0,12));
    const r=await fetch(u,{redirect,headers:{'user-agent':'VoltTech-Release-Verification/10.4-final','cache-control':'no-cache'},signal:AbortSignal.timeout(15000)});
    return{response:r,body:expectBody?await r.text():'',url:u.toString()};
  }
  async function html(p){const x=await request(p);assert(x.response.status===200,`${p}: HTTP ${x.response.status}`);assert(x.body.length>500,`${p}: short body`);return x}
  async function wait404(){
    let last=0;
    for(let i=1;i<=36;i++){
      const x=await request('/__volttech_release_check_missing__.html');
      last=x.response.status;
      if(last===404&&x.body.includes('VOLTTECH / SIGNAL LOST')&&x.body.includes('That page dropped off the map.')) return;
      if(i<36) await sleep(5000);
    }
    throw new Error(`custom 404 not live; last HTTP ${last}`);
  }

  record('Production main is the promoted final SHA',stdout(['rev-parse','origin/main'])===state.remote_main_head);
  await check('HTTPS homepage is reachable',async()=>{const x=await html('/');assert(x.response.url.startsWith(ROOT),'unexpected final URL')});
  await check('HTTP origin redirects to HTTPS',async()=>{const r=await fetch('http://volttechcomputerco.co.za/',{redirect:'manual',headers:{'user-agent':'VoltTech-Release-Verification/10.4-final'},signal:AbortSignal.timeout(15000)});assert([301,302,307,308].includes(r.status),`HTTP ${r.status}`);assert((r.headers.get('location')||'').startsWith(ROOT),'unexpected redirect')});
  await check('Live homepage is clean and production-indexable',async()=>{const {body}=await html('/');assert(body.includes('data-vt-shell="clean"'),'clean shell missing');assert(body.includes('index, follow, max-image-preview:large'),'robots missing');assert(body.includes('https://volttechcomputerco.co.za/'),'canonical missing')});
  await check('PC Repair live surface is clean and indexable',async()=>{const {body}=await html('/pc-repair-pretoria.html');assert(body.includes('data-vt-shell="clean"'),'clean shell missing');assert(body.includes('signal-scan.html'),'handoff missing')});
  await check('Signal Scan live surface is deployed',async()=>{const {body}=await html('/signal-scan.html?source=repair&issue=boot');assert(body.includes('id="panel"'),'panel missing')});
  await check('STATIC editorial hub and RSS discovery are live',async()=>{const {body}=await html('/static.html');assert(body.includes('assets/css/pages/static.css'),'STATIC css missing');assert(body.includes('static-feed.xml'),'RSS missing');assert(body.includes('data-static-lead'),'lead missing')});
  await check('Store remains launch-gated/noindex',async()=>{const {body}=await html('/store.html');assert(body.includes('noindex, follow'),'noindex missing');assert(body.includes('id="store-gate"'),'gate missing')});
  await check('Builder remains launch-gated/noindex',async()=>{const {body}=await html('/builder/index.html');assert(body.includes('noindex, nofollow'),'noindex missing');assert(body.includes('id="builderGate"'),'gate missing')});
  await check('Account remains private/noindex',async()=>{const {body}=await html('/account.html');assert(body.includes('noindex, nofollow'),'noindex missing');assert(body.includes('id="authGate"'),'auth missing');assert(body.includes('id="profileForm"'),'corrected DOM missing')});
  await check('robots.txt advertises .co.za sitemap',async()=>{const {response,body}=await request('/robots.txt');assert(response.status===200,`HTTP ${response.status}`);assert(body.includes('Sitemap: https://volttechcomputerco.co.za/sitemap.xml'),'directive missing')});
  await check('sitemap.xml is live and .co.za-only',async()=>{const {response,body}=await request('/sitemap.xml');assert(response.status===200,`HTTP ${response.status}`);assert(body.includes('<loc>https://volttechcomputerco.co.za/</loc>'),'home missing');assert(!body.includes('github.io'),'old host')});
  await check('STATIC RSS is live and .co.za-only',async()=>{const {response,body}=await request('/static-feed.xml');assert(response.status===200,`HTTP ${response.status}`);assert(body.includes('<rss'),'RSS missing');assert(!body.includes('github.io'),'old host')});
  await check('Core CSS loads',async()=>{const {response,body}=await request('/assets/css/tokens.css');assert(response.status===200,`HTTP ${response.status}`);assert(body.includes('--teal'),'token missing')});
  await check('Core JS loads',async()=>{const {response,body}=await request('/assets/js/site-shell.js');assert(response.status===200,`HTTP ${response.status}`);assert(body.includes('navigation'),'shell marker missing')});
  await check('Hero image loads',async()=>{const {response}=await request('/assets/brand/home-hero.webp',{expectBody:false});assert(response.status===200,`HTTP ${response.status}`);assert((response.headers.get('content-type')||'').includes('image/'),'wrong type')});
  await check('Unknown route serves branded HTTP 404',wait404);

  const summary={step:'10.4-final',status:failures?'FAIL':'PASS',main_sha:state.remote_main_head,total:results.length,passed:results.filter(r=>r.status==='PASS').length,failed:failures,results};
  fs.writeFileSync(path.join(outDir,'live-summary.json'),JSON.stringify(summary,null,2)+'\n');
  console.log(`=== STEP 10.4 FINAL ${summary.status} ===`);
  console.log(`${summary.passed}/${summary.total} live checks passed.`);
  process.exit(failures?1:0);
}

const mode=process.argv[2];
if(mode==='prepare') await prepare();
else if(mode==='certify') await certify();
else if(mode==='prepush') await prepush();
else if(mode==='pushed') await pushed();
else if(mode==='verify') await verify();
else if(mode==='live') await live();
else{console.error('Usage: node /tmp/volttech-final-404.mjs <prepare|certify|prepush|pushed|verify|live>');process.exit(2)}
