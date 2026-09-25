import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';

const ROOT='https://volttechcomputerco.co.za';
const EXPECTED_MAIN='3eba58456b4a93477f90b1d1fb9673877e0a3479';
const outDir=path.resolve('qa-results/step-10.4');
fs.mkdirSync(outDir,{recursive:true});

const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const results=[];
let failures=0;

function record(name,ok,detail=''){
  const status=ok?'PASS':'FAIL';
  results.push({name,status,detail});
  if(!ok) failures++;
  console.log(`${status}: ${name}${detail?` — ${detail}`:''}`);
}
function assert(condition,message){
  if(!condition) throw new Error(message);
}
async function check(name,fn){
  try{await fn();record(name,true)}
  catch(error){record(name,false,error?.message||String(error))}
}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

async function request(pathname,{redirect='follow',attempts=12,expectBody=true}={}){
  const url=new URL(pathname,ROOT);
  url.searchParams.set('vt_release_check',EXPECTED_MAIN.slice(0,12));
  let last;
  for(let attempt=1;attempt<=attempts;attempt++){
    try{
      const response=await fetch(url,{
        redirect,
        headers:{
          'user-agent':'VoltTech-Release-Verification/10.4',
          'cache-control':'no-cache'
        },
        signal:AbortSignal.timeout(15000)
      });
      const body=expectBody ? await response.text() : '';
      if(response.status>=200 && response.status<500){
        return {response,body,url:url.toString(),attempt};
      }
      last=new Error(`${url.pathname}: HTTP ${response.status}`);
    }catch(error){last=error}
    if(attempt<attempts) await sleep(5000);
  }
  throw last||new Error(`Request failed: ${url}`);
}

async function liveHtml(pathname){
  const {response,body,attempt}=await request(pathname);
  assert(response.status===200,`${pathname}: HTTP ${response.status}`);
  assert(body.length>500,`${pathname}: response body unexpectedly short`);
  return {response,body,attempt};
}

const mainHead=git('rev-parse','origin/main');
record('Production main is the promoted release SHA',mainHead===EXPECTED_MAIN,
  `expected=${EXPECTED_MAIN} actual=${mainHead}`);

await check('HTTPS homepage is reachable',async()=>{
  const {response}=await liveHtml('/');
  assert(response.url.startsWith(ROOT+'/')||response.url===ROOT+'/',`unexpected final URL ${response.url}`);
});

await check('HTTP origin redirects to HTTPS',async()=>{
  const response=await fetch('http://volttechcomputerco.co.za/',{
    redirect:'manual',
    headers:{'user-agent':'VoltTech-Release-Verification/10.4'},
    signal:AbortSignal.timeout(15000)
  });
  assert([301,302,307,308].includes(response.status),`HTTP status ${response.status} is not a redirect`);
  const location=response.headers.get('location')||'';
  assert(location.startsWith('https://volttechcomputerco.co.za'),`unexpected redirect ${location}`);
});

await check('Live homepage is the clean production-indexable rebuild',async()=>{
  const {body}=await liveHtml('/');
  assert(body.includes('data-vt-shell="clean"'),'clean-shell marker missing');
  assert(body.includes('name="robots" content="index, follow, max-image-preview:large"'),'production robots metadata missing');
  assert(body.includes('<link rel="canonical" href="https://volttechcomputerco.co.za/">'),'.co.za canonical missing');
  assert(body.includes('TUNE YOUR'),'clean homepage hero marker missing');
  assert(!body.includes('https://volttechcomputerco.github.io'),'old GitHub canonical residue found');
});

await check('PC Repair live surface is clean and indexable',async()=>{
  const {body}=await liveHtml('/pc-repair-pretoria.html');
  assert(body.includes('data-vt-shell="clean"'),'clean shell missing');
  assert(body.includes('index, follow, max-image-preview:large'),'indexable robots metadata missing');
  assert(body.includes('https://volttechcomputerco.co.za/pc-repair-pretoria.html'),'canonical missing');
  assert(body.includes('signal-scan.html'),'Signal Scan handoff missing');
});

await check('Signal Scan live surface is deployed',async()=>{
  const {body}=await liveHtml('/signal-scan.html?source=repair&issue=boot');
  assert(body.includes('data-vt-shell="clean"'),'clean shell missing');
  assert(body.includes('id="panel"'),'Signal Scan panel missing');
  assert(body.includes('assets/js/pages/signal-scan.js'),'Signal Scan controller missing');
});

await check('STATIC hub and RSS discovery are live',async()=>{
  const {body}=await liveHtml('/static.html');
  assert(body.includes('data-vt-shell="clean"'),'clean shell missing');
  assert(body.includes('static-feed.xml'),'RSS discovery missing');
  assert(body.includes('data-static-lead'),'lead-story marker missing');
  assert(!body.includes('volttechcomputerco.github.io'),'old host residue found');
});

await check('Store remains live but launch-gated/noindex',async()=>{
  const {body}=await liveHtml('/store.html');
  assert(body.includes('data-vt-shell="clean"'),'clean Store shell missing');
  assert(body.includes('name="robots" content="noindex, follow"'),'Store noindex missing');
  assert(body.includes('id="store-gate"'),'Store launch gate missing');
  assert(body.includes('assets/js/pages/store.js'),'Store controller missing');
});

await check('PC Builder remains live but launch-gated/noindex',async()=>{
  const {body}=await liveHtml('/builder/index.html');
  assert(body.includes('data-vt-shell="clean"'),'clean Builder shell missing');
  assert(body.includes('name="robots" content="noindex, nofollow"'),'Builder noindex missing');
  assert(body.includes('id="builderGate"'),'Builder launch gate missing');
  assert(body.includes('assets/js/pages/builder.js'),'Builder controller missing');
});

await check('Customer Account remains private/noindex with corrected DOM',async()=>{
  const {body}=await liveHtml('/account.html');
  assert(body.includes('name="robots" content="noindex, nofollow"'),'Account noindex missing');
  assert(body.includes('id="authGate"'),'auth gate missing');
  assert(body.includes('id="accountHub"'),'account hub missing');
  assert(body.includes('id="profileForm"'),'corrected Account DOM missing');
});

await check('robots.txt advertises the .co.za sitemap',async()=>{
  const {response,body}=await request('/robots.txt');
  assert(response.status===200,`robots HTTP ${response.status}`);
  assert(body.includes('User-agent: *'),'User-agent rule missing');
  assert(body.includes('Allow: /'),'Allow rule missing');
  assert(body.includes('Sitemap: https://volttechcomputerco.co.za/sitemap.xml'),'.co.za sitemap directive missing');
  assert(!body.includes('volttechcomputerco.github.io'),'old sitemap host found');
});

await check('sitemap.xml is live and .co.za-only',async()=>{
  const {response,body}=await request('/sitemap.xml');
  assert(response.status===200,`sitemap HTTP ${response.status}`);
  for(const url of [
    'https://volttechcomputerco.co.za/',
    'https://volttechcomputerco.co.za/pc-repair-pretoria.html',
    'https://volttechcomputerco.co.za/signal-scan.html',
    'https://volttechcomputerco.co.za/static.html'
  ]) assert(body.includes(`<loc>${url}</loc>`),`missing ${url}`);
  assert(!body.includes('volttechcomputerco.github.io'),'old host found in sitemap');
});

await check('STATIC RSS feed is live and .co.za-only',async()=>{
  const {response,body}=await request('/static-feed.xml');
  assert(response.status===200,`RSS HTTP ${response.status}`);
  assert(body.includes('<rss'),'RSS root missing');
  assert(body.includes('https://volttechcomputerco.co.za/'),'canonical domain missing');
  assert(!body.includes('volttechcomputerco.github.io'),'old host found in RSS');
});

await check('Core CSS asset loads from production',async()=>{
  const {response,body}=await request('/assets/css/tokens.css');
  assert(response.status===200,`CSS HTTP ${response.status}`);
  assert(body.includes('--teal'),'VoltTech token marker missing');
});

await check('Core JavaScript shell loads from production',async()=>{
  const {response,body}=await request('/assets/js/site-shell.js');
  assert(response.status===200,`JS HTTP ${response.status}`);
  assert(body.includes('navigation'),'site shell module marker missing');
});

await check('Homepage hero asset loads from production',async()=>{
  const {response}=await request('/assets/brand/home-hero.webp',{expectBody:false});
  assert(response.status===200,`hero HTTP ${response.status}`);
  const type=(response.headers.get('content-type')||'').toLowerCase();
  assert(type.includes('image/'),`unexpected hero content-type ${type}`);
});

await check('Unknown live route returns a real 404',async()=>{
  const {response}=await request('/__volttech_release_check_missing__.html',{attempts:2,expectBody:false});
  assert(response.status===404,`missing route returned HTTP ${response.status}`);
});

const summary={
  step:'10.4',
  title:'Live .co.za verification',
  checked_at:new Date().toISOString(),
  production_origin:ROOT,
  expected_main_sha:EXPECTED_MAIN,
  actual_main_sha:mainHead,
  total:results.length,
  passed:results.filter(r=>r.status==='PASS').length,
  failed:failures,
  status:failures?'FAIL':'PASS',
  commerce_launch_ready:false,
  release_mode:'non-commerce',
  results
};
fs.writeFileSync(path.join(outDir,'step-10.4-summary.json'),JSON.stringify(summary,null,2)+'\n','utf8');
fs.writeFileSync(path.join(outDir,'step-10.4-summary.md'),[
  '# VoltTech Step 10.4 — Live verification',
  '',
  `Overall: **${summary.status}**`,
  '',
  `Production origin: ${ROOT}`,
  `Main SHA: \`${mainHead}\``,
  `Passed: ${summary.passed}/${summary.total}`,
  `Failed: ${summary.failed}/${summary.total}`,
  '',
  'Release mode: **non-commerce**',
  'Commerce launch ready: **NO**',
  '',
  '| Live check | Result |',
  '| --- | --- |',
  ...results.map(r=>`| ${r.name.replaceAll('|','\\|')} | ${r.status} |`),
  ''
].join('\n'),'utf8');

console.log(`\n=== STEP 10.4 ${summary.status} ===`);
console.log(`${summary.passed}/${summary.total} live checks passed.`);
process.exit(failures?1:0);

// Step 10.4 live .co.za verification trigger. Upload this file last.
