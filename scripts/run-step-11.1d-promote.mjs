import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const root=process.cwd();
const outDir=path.join(root,'qa-results/step-11.1d');
fs.mkdirSync(outDir,{recursive:true});
const statePath=path.join(outDir,'promotion-state.json');

const EXPECTED_MAIN='6a7d28afb9f3c73ed10c95c167a5ac8ca13537ae';
const NORMALIZATION='42e0438329afebfcff8ec4bdfacf2e4fc64f1b81';
const ORIGIN='https://volttechcomputerco.co.za';

function git(args,{allowFail=false}={}){
  const run=spawnSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024});
  if(!allowFail && run.status!==0){
    throw new Error(`git ${args.join(' ')} failed\n${run.stdout||''}\n${run.stderr||''}`.trim());
  }
  return run;
}
const stdout=args=>git(args).stdout.trim();
const load=()=>fs.existsSync(statePath)?JSON.parse(fs.readFileSync(statePath,'utf8')):{};
const save=s=>fs.writeFileSync(statePath,JSON.stringify(s,null,2)+'\n','utf8');
function fail(message,state=load()){
  save({...state,status:'FAIL',error:message});
  console.error(`FAIL: ${message}`);
  process.exit(1);
}
const list=s=>s.split('\n').filter(Boolean).sort();

function currentMain(state={}){
  const current=stdout(['rev-parse','origin/main']);
  if(current!==EXPECTED_MAIN) fail(`main moved: expected ${EXPECTED_MAIN}, found ${current}`,state);
  return current;
}

function read(rel){return fs.readFileSync(path.join(root,rel),'utf8')}
function assert(value,message){if(!value)throw new Error(message)}

function checkPublicUrlContract(){
  const htmlFiles=fs.readdirSync(root).filter(n=>n.endsWith('.html')).sort();
  let canonicalCount=0;
  for(const name of htmlFiles){
    const html=read(name);
    const robots=html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)/i)?.[1]||'';
    const canonical=html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i)?.[1]||'';
    const indexable=!robots.toLowerCase().includes('noindex');
    if(indexable && canonical){
      canonicalCount++;
      assert(canonical.startsWith(ORIGIN+'/'),`${name}: canonical host mismatch`);
      assert(!/\.html(?:$|[?#])/.test(canonical),`${name}: canonical still uses .html`);
    }
    const og=html.match(/<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)/i)?.[1]||'';
    if(og.startsWith(ORIGIN+'/')) assert(!/\.html(?:$|[?#])/.test(og),`${name}: og:url still uses .html`);
  }
  assert(canonicalCount===42,`Expected 42 indexable canonicals, found ${canonicalCount}`);

  const sitemap=read('sitemap.xml');
  const sitemapUrls=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
  assert(sitemapUrls.length===42,`Expected 42 sitemap URLs, found ${sitemapUrls.length}`);
  assert(sitemapUrls.includes(`${ORIGIN}/pc-repair-pretoria`),'PC Repair sitemap URL missing');
  assert(sitemapUrls.includes(`${ORIGIN}/signal-scan`),'Signal Scan sitemap URL missing');
  assert(sitemapUrls.includes(`${ORIGIN}/static`),'STATIC sitemap URL missing');
  assert(!sitemapUrls.some(u=>/\.html(?:$|[?#])/.test(u)),'Sitemap still contains .html public URL');

  const feed=read('static-feed.xml');
  const feedLinks=[...feed.matchAll(/<item>[\s\S]*?<link>(.*?)<\/link>/g)].map(m=>m[1]);
  assert(feedLinks.length===20,`Expected 20 RSS items, found ${feedLinks.length}`);
  assert(feed.includes(`<link>${ORIGIN}/static</link>`),'RSS channel link is not extensionless');
  assert(!feedLinks.some(u=>/\.html(?:$|[?#])/.test(u)),'RSS item URL still uses .html');

  for(const name of fs.readdirSync(path.join(root,'src/pages')).filter(n=>n.endsWith('.head.html'))){
    const text=read(`src/pages/${name}`);
    const matches=[...text.matchAll(/https:\/\/volttechcomputerco\.co\.za\/[^"'<>\\s]+\.html(?:[?#][^"'<>\\s]*)?/g)];
    assert(matches.length===0,`${name}: source head contains absolute .html public URL`);
  }

  assert(read('pc-repair-pretoria.html').includes(`<link rel="canonical" href="${ORIGIN}/pc-repair-pretoria">`),'PC Repair canonical mismatch');
  assert(read('signal-scan.html').includes(`<link rel="canonical" href="${ORIGIN}/signal-scan">`),'Signal Scan canonical mismatch');
  assert(read('static.html').includes(`<link rel="canonical" href="${ORIGIN}/static">`),'STATIC canonical mismatch');

  const sitemapWorkflow=read('.github/workflows/static-sitemap-autopilot.yml');
  assert(sitemapWorkflow.includes('url = BASE + page.stem'),'production STATIC sitemap workflow is not extensionless');

  return {canonicalCount,sitemapCount:sitemapUrls.length,rssCount:feedLinks.length};
}

async function prepare(){
  const main=currentMain({});
  const state={
    step:'11.1D',
    phase:'prepare',
    previous_main_head:main,
    normalization_commit:NORMALIZATION,
    pushed:false
  };

  const exists=git(['cat-file','-e',`${NORMALIZATION}^{commit}`],{allowFail:true});
  if(exists.status!==0) fail(`certified normalization commit ${NORMALIZATION} is unavailable`,state);

  const expected=list(stdout(['diff-tree','--no-commit-id','--name-only','-r',NORMALIZATION]));
  if(!expected.length) fail('certified normalization commit has no file changes',state);
  if(expected.some(p=>p.startsWith('.github/workflows/'))){
    fail(`certified normalization unexpectedly contains workflow files: ${expected.filter(p=>p.startsWith('.github/workflows/')).join(', ')}`,state);
  }

  git(['config','user.name','github-actions[bot]']);
  git(['config','user.email','41898282+github-actions[bot]@users.noreply.github.com']);
  git(['checkout','-B','release-step-11.1d','origin/main']);

  const cp=git(['cherry-pick',NORMALIZATION],{allowFail:true});
  if(cp.status!==0){
    git(['cherry-pick','--abort'],{allowFail:true});
    fail(`cherry-pick failed: ${(cp.stderr||cp.stdout||'unknown failure').trim()}`,state);
  }

  const actual=list(stdout(['diff','--name-only',EXPECTED_MAIN,'HEAD']));
  const unexpected=actual.filter(p=>!expected.includes(p));
  if(unexpected.length){
    fail(`promotion contains unexpected files:\n${unexpected.join('\n')}`,state);
  }

  // Correct promotion contract:
  // every certified target file must end up byte-for-byte identical to the
  // certified staging commit. A file does not have to appear in the final diff
  // if production already had the exact certified blob before promotion.
  const mismatches=[];
  const alreadyEqual=[];
  for(const rel of expected){
    const certified=stdout(['rev-parse',`${NORMALIZATION}:${rel}`]);
    const promoted=stdout(['rev-parse',`HEAD:${rel}`]);
    if(certified!==promoted){
      mismatches.push(`${rel}: certified=${certified} promoted=${promoted}`);
    }else if(!actual.includes(rel)){
      alreadyEqual.push(rel);
    }
  }
  if(mismatches.length){
    fail(`promotion does not match certified staging blobs:\n${mismatches.join('\n')}`,state);
  }

  state.expected_files=expected;
  state.changed_files=actual;
  state.already_equal_files=alreadyEqual;
  state.promotion_head=stdout(['rev-parse','HEAD']);
  state.status='PREPARED';
  save(state);
  console.log(`PASS: prepared Step 11.1D promotion — ${actual.length} changed file(s), ${alreadyEqual.length} already-identical certified file(s)`);
  if(alreadyEqual.length) console.log(`PASS: already identical before promotion: ${alreadyEqual.join(', ')}`);
}

async function certify(){
  const state=load();
  if(state.status!=='PREPARED') fail('promotion state is not PREPARED',state);

  let contract;
  try{contract=checkPublicUrlContract()}
  catch(error){fail(`public URL contract failed: ${error.message}`,state)}

  const fullPath=path.join(root,'qa-results/step-9.1-summary.json');
  const releasePath=path.join(root,'qa-results/step-9.3/step-9.3-summary.json');
  if(!fs.existsSync(fullPath)||!fs.existsSync(releasePath)) fail('release QA summaries are missing',state);

  const full=JSON.parse(fs.readFileSync(fullPath,'utf8'));
  const release=JSON.parse(fs.readFileSync(releasePath,'utf8'));

  const checks={
    full_regression:full.status==='PASS'&&full.passed===24&&full.total===24,
    release_certification:release.status==='PASS',
    release_source:release.gates?.release_source==='15/15',
    device_role:release.gates?.device_role==='9/9',
    release_browser:release.gates?.release_browser==='11/11',
    commerce_disabled:release.commerce_launch_ready===false,
    no_workflow_leak:!state.expected_files.some(p=>p.startsWith('.github/workflows/'))
  };
  const bad=Object.entries(checks).filter(([,ok])=>!ok).map(([name])=>name);
  if(bad.length) fail(`production certification failed: ${bad.join(', ')}`,{...state,checks,contract});

  state.contract=contract;
  state.checks=checks;
  state.full_regression='24/24';
  state.release_gates=release.gates;
  state.status='CERTIFIED';
  state.phase='certified';
  save(state);
  console.log(`PASS: Step 11.1D certified — ${contract.canonicalCount} canonicals, ${contract.sitemapCount} sitemap URLs, ${contract.rssCount} RSS items`);
}

async function prepush(){
  const state=load();
  if(state.status!=='CERTIFIED') fail('promotion is not certified',state);
  currentMain(state);
  if(stdout(['rev-parse','HEAD'])!==state.promotion_head) fail('promotion HEAD changed after certification',state);
  state.status='READY_TO_PUSH';
  state.phase='prepush';
  save(state);
  console.log('PASS: main unchanged immediately before production push');
}

async function pushed(){
  const state=load();
  if(state.status!=='READY_TO_PUSH') fail('push recorded before READY_TO_PUSH',state);
  state.pushed_head=stdout(['rev-parse','HEAD']);
  state.pushed=true;
  state.status='PUSHED';
  state.phase='pushed';
  save(state);
  console.log(`PUSHED: ${state.pushed_head} -> main`);
}

async function verify(){
  const state=load();
  const remote=stdout(['rev-parse','origin/main']);
  if(remote!==state.pushed_head) fail(`remote main mismatch: expected ${state.pushed_head}, found ${remote}`,state);
  state.remote_main_head=remote;
  state.status='REMOTE_VERIFIED';
  state.phase='remote-verified';
  save(state);
  console.log(`PASS: remote main is ${remote}`);
}

const sleep=ms=>new Promise(r=>setTimeout(r,ms));

async function fetchText(pathname,{redirect='follow'}={}){
  const state=load();
  const u=new URL(pathname,ORIGIN);
  u.searchParams.set('vt_step_11_1d',state.remote_main_head.slice(0,12));
  const response=await fetch(u,{
    redirect,
    headers:{'user-agent':'VoltTech-Step-11.1D-Live-QA','cache-control':'no-cache'},
    signal:AbortSignal.timeout(15000)
  });
  const body=await response.text();
  return {response,body};
}

async function live(){
  const state=load();
  if(state.status!=='REMOTE_VERIFIED') fail('live verification requested before remote verification',state);

  let lastError='not started';
  for(let attempt=1;attempt<=48;attempt++){
    try{
      const [repair,signal,staticHub,sitemap,feed,oldRepair]=await Promise.all([
        fetchText('/pc-repair-pretoria'),
        fetchText('/signal-scan'),
        fetchText('/static'),
        fetchText('/sitemap.xml'),
        fetchText('/static-feed.xml'),
        fetchText('/pc-repair-pretoria.html',{redirect:'manual'})
      ]);

      assert(repair.response.status===200,`repair HTTP ${repair.response.status}`);
      assert(signal.response.status===200,`signal HTTP ${signal.response.status}`);
      assert(staticHub.response.status===200,`STATIC HTTP ${staticHub.response.status}`);
      assert(repair.body.includes(`<link rel="canonical" href="${ORIGIN}/pc-repair-pretoria">`),'repair canonical is stale');
      assert(signal.body.includes(`<link rel="canonical" href="${ORIGIN}/signal-scan">`),'signal canonical is stale');
      assert(staticHub.body.includes(`<link rel="canonical" href="${ORIGIN}/static">`),'STATIC canonical is stale');

      assert(sitemap.response.status===200,`sitemap HTTP ${sitemap.response.status}`);
      const locs=[...sitemap.body.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
      assert(locs.length===42,`live sitemap expected 42 URLs, found ${locs.length}`);
      assert(locs.includes(`${ORIGIN}/pc-repair-pretoria`),'live sitemap missing repair');
      assert(locs.includes(`${ORIGIN}/signal-scan`),'live sitemap missing signal');
      assert(locs.includes(`${ORIGIN}/static`),'live sitemap missing STATIC');
      assert(!locs.some(u=>/\.html(?:$|[?#])/.test(u)),'live sitemap still contains .html');

      assert(feed.response.status===200,`RSS HTTP ${feed.response.status}`);
      const itemLinks=[...feed.body.matchAll(/<item>[\s\S]*?<link>(.*?)<\/link>/g)].map(m=>m[1]);
      assert(itemLinks.length===20,`live RSS expected 20 items, found ${itemLinks.length}`);
      assert(feed.body.includes(`<link>${ORIGIN}/static</link>`),'live RSS channel link is stale');
      assert(!itemLinks.some(u=>/\.html(?:$|[?#])/.test(u)),'live RSS still contains .html item URL');

      assert([301,302,307,308].includes(oldRepair.response.status),`.html repair path expected redirect, got ${oldRepair.response.status}`);
      const location=oldRepair.response.headers.get('location')||'';
      assert(location.includes('/pc-repair-pretoria'),`.html redirect target unexpected: ${location}`);

      const summary={
        step:'11.1D',
        status:'PASS',
        checked_at:new Date().toISOString(),
        production_main:state.remote_main_head,
        canonical_count:state.contract.canonicalCount,
        sitemap_urls:locs.length,
        rss_items:itemLinks.length,
        html_redirect_status:oldRepair.response.status,
        commerce_launch_ready:false
      };
      fs.writeFileSync(path.join(outDir,'live-summary.json'),JSON.stringify(summary,null,2)+'\n','utf8');
      state.status='PASS';
      state.phase='live-verified';
      state.live=summary;
      save(state);
      console.log('=== STEP 11.1D PRODUCTION PASS ===');
      console.log(`PASS: live extensionless contract — ${locs.length} sitemap URLs, ${itemLinks.length} RSS items`);
      return;
    }catch(error){
      lastError=error.message;
      console.log(`Live attempt ${attempt}/48 not ready: ${lastError}`);
      if(attempt<48) await sleep(5000);
    }
  }
  fail(`live .co.za extensionless contract did not converge: ${lastError}`,state);
}

const mode=process.argv[2];
if(mode==='prepare') await prepare();
else if(mode==='certify') await certify();
else if(mode==='prepush') await prepush();
else if(mode==='pushed') await pushed();
else if(mode==='verify') await verify();
else if(mode==='live') await live();
else{
  console.error('Usage: node /tmp/volttech-step-11.1d-promote.mjs <prepare|certify|prepush|pushed|verify|live>');
  process.exit(2);
}

// Step 11.1D production promotion guard correction trigger.
