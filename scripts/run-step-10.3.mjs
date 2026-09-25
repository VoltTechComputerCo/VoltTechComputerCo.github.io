import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const root=process.cwd();
const outDir=path.join(root,'qa-results/step-10.3');
fs.mkdirSync(outDir,{recursive:true});
const statePath=path.join(outDir,'promotion-state.json');

const EXPECTED_MAIN_HEAD='12079c9d873cc1601581354829193a322f81d874';
const REVIEWED_MAIN_ONLY=[
  '.github/workflows/static-sitemap-autopilot.yml',
  '.github/workflows/update-sa-streamers.yml',
  'creator-hub-south-africa.html',
  'index.html',
  'sa-streamers-live.json',
  'sitemap.xml',
  'store.html',
  'streamer-feed.js'
].sort();

function git(args,{allowFail=false}={}){
  const run=spawnSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024});
  if(!allowFail && run.status!==0){
    throw new Error(`git ${args.join(' ')} failed\n${run.stdout||''}\n${run.stderr||''}`.trim());
  }
  return run;
}
const stdout=args=>git(args).stdout.trim();
const existsAt=(ref,file)=>git(['cat-file','-e',`${ref}:${file}`],{allowFail:true}).status===0;
const load=()=>fs.existsSync(statePath)?JSON.parse(fs.readFileSync(statePath,'utf8')):{};
const save=state=>fs.writeFileSync(statePath,JSON.stringify(state,null,2)+'\n','utf8');
function fail(message,state=load()){
  save({...state,status:'FAIL',error:message});
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function verifyMainHead(expected,state){
  const current=stdout(['rev-parse','origin/main']);
  if(current!==expected) fail(`main moved: expected ${expected}, found ${current}`,state);
  return current;
}

async function prepare(){
  const cleanHead=stdout(['rev-parse','HEAD']);
  const mainHead=verifyMainHead(EXPECTED_MAIN_HEAD,{});
  const mergeBase=stdout(['merge-base',cleanHead,'origin/main']);

  const state={
    step:'10.3',
    phase:'prepare',
    clean_head:cleanHead,
    expected_main_head:EXPECTED_MAIN_HEAD,
    main_head:mainHead,
    merge_base:mergeBase,
    reviewed_main_only_paths:REVIEWED_MAIN_ONLY,
    conflicts:[],
    resolved_conflicts:[],
    normalized_reviewed_paths:[],
    tree_identical_to_clean:false,
    pushed_to_main:false
  };

  const mainOnly=stdout(['diff','--name-only',`${mergeBase}..origin/main`]).split('\n').filter(Boolean).sort();
  const unexpected=mainOnly.filter(p=>!REVIEWED_MAIN_ONLY.includes(p));
  const missing=REVIEWED_MAIN_ONLY.filter(p=>!mainOnly.includes(p));
  state.main_only_paths=mainOnly;
  if(unexpected.length||missing.length){
    fail(`main divergence changed: unexpected=${unexpected.join(',')||'none'} missing=${missing.join(',')||'none'}`,state);
  }

  git(['config','user.name','github-actions[bot]']);
  git(['config','user.email','41898282+github-actions[bot]@users.noreply.github.com']);
  git(['checkout','-B','release-main-promotion','origin/main']);

  const merge=git(['merge','--no-ff','--no-commit',cleanHead],{allowFail:true});
  const conflicts=stdout(['diff','--name-only','--diff-filter=U']).split('\n').filter(Boolean).sort();
  state.conflicts=conflicts;

  if(merge.status!==0 && conflicts.length===0){
    fail(`merge failed without file conflicts: ${(merge.stderr||merge.stdout||'unknown merge failure').trim()}`,state);
  }

  const unexpectedConflicts=conflicts.filter(p=>!REVIEWED_MAIN_ONLY.includes(p));
  if(unexpectedConflicts.length){
    git(['merge','--abort'],{allowFail:true});
    fail(`unreviewed merge conflict(s): ${unexpectedConflicts.join(', ')}`,state);
  }

  // Every reviewed main-only path is deliberately normalized to the current
  // certified clean branch, including files Git may auto-merge without conflict.
  for(const file of REVIEWED_MAIN_ONLY){
    if(existsAt(cleanHead,file)){
      git(['checkout',cleanHead,'--',file]);
      git(['add','--',file]);
    }else{
      git(['rm','-f','--ignore-unmatch','--',file]);
    }
    state.normalized_reviewed_paths.push(file);
    if(conflicts.includes(file)) state.resolved_conflicts.push(file);
  }

  const unresolved=stdout(['diff','--name-only','--diff-filter=U']).split('\n').filter(Boolean);
  if(unresolved.length) fail(`unresolved conflicts remain: ${unresolved.join(', ')}`,state);

  if(fs.existsSync(path.join(root,'.git','MERGE_HEAD'))){
    git(['commit','-m','release: promote certified clean rebuild']);
  }

  const promotionHead=stdout(['rev-parse','HEAD']);
  const cleanTree=stdout(['rev-parse',`${cleanHead}^{tree}`]);
  const promotionTree=stdout(['rev-parse','HEAD^{tree}']);
  state.promotion_head=promotionHead;
  state.clean_tree=cleanTree;
  state.promotion_tree=promotionTree;
  state.tree_identical_to_clean=cleanTree===promotionTree;

  if(!state.tree_identical_to_clean){
    const diff=stdout(['diff','--name-status',cleanHead,'HEAD']);
    fail(`promotion tree differs from current clean branch:\n${diff}`,state);
  }

  state.status='PREPARED';
  save(state);
  console.log(`PASS: exact promotion merge prepared from main ${mainHead}`);
  console.log(`PASS: normalized all ${REVIEWED_MAIN_ONLY.length} reviewed main-only paths`);
  console.log(`PASS: promotion tree matches clean-rebuild ${cleanHead}`);
}

async function certify(){
  const state=load();
  if(!state.promotion_head) fail('promotion state is missing',state);

  const fullPath=path.join(root,'qa-results/step-9.1-summary.json');
  const step9Path=path.join(root,'qa-results/step-9.3/step-9.3-summary.json');
  if(!fs.existsSync(fullPath)||!fs.existsSync(step9Path)) fail('QA summaries are missing',state);

  const full=JSON.parse(fs.readFileSync(fullPath,'utf8'));
  const step9=JSON.parse(fs.readFileSync(step9Path,'utf8'));
  const checks={
    tree_identical_to_clean:state.tree_identical_to_clean===true,
    all_reviewed_paths_normalized:state.normalized_reviewed_paths?.length===REVIEWED_MAIN_ONLY.length,
    full_regression:full.status==='PASS'&&full.passed===24&&full.total===24,
    step_9_3:step9.status==='PASS',
    device_role:step9.gates?.device_role==='9/9',
    release_source:step9.gates?.release_source==='15/15',
    release_browser:step9.gates?.release_browser==='11/11',
    commerce_disabled:step9.commerce_launch_ready===false
  };
  const bad=Object.entries(checks).filter(([,ok])=>!ok).map(([name])=>name);
  if(bad.length) fail(`pre-push certification failed: ${bad.join(', ')}`,{...state,checks});

  state.phase='certified';
  state.checks=checks;
  state.full_regression='24/24';
  state.step_9_gates=step9.gates;
  state.commerce_launch_ready=false;
  state.status='CERTIFIED';
  save(state);
  console.log('PASS: final pre-push certification is green');
}

async function prepush(){
  const state=load();
  if(state.status!=='CERTIFIED') fail('promotion is not certified',state);
  const current=verifyMainHead(state.expected_main_head,state);
  const head=stdout(['rev-parse','HEAD']);
  if(head!==state.promotion_head) fail(`working promotion head changed: ${head}`,state);
  const cleanTree=state.clean_tree;
  const headTree=stdout(['rev-parse','HEAD^{tree}']);
  if(headTree!==cleanTree) fail('promotion tree changed after certification',state);
  state.phase='prepush';
  state.prepush_main_head=current;
  state.status='READY_TO_PUSH';
  save(state);
  console.log('PASS: main is unchanged and certified promotion is ready to push');
}

async function recordPush(){
  const state=load();
  if(state.status!=='READY_TO_PUSH') fail('push occurred without READY_TO_PUSH state',state);
  state.phase='pushed';
  state.pushed_to_main=true;
  state.pushed_head=stdout(['rev-parse','HEAD']);
  state.status='PUSHED';
  save(state);
  console.log(`PUSHED: ${state.pushed_head} -> main`);
}

async function verifyRemote(){
  const state=load();
  if(state.status!=='PUSHED') fail('remote verification requested before push',state);
  const remoteMain=stdout(['rev-parse','origin/main']);
  if(remoteMain!==state.pushed_head) fail(`remote main mismatch: expected ${state.pushed_head}, found ${remoteMain}`,state);

  const summary={
    step:'10.3',
    title:'Main promotion',
    status:'PASS',
    previous_main_head:state.expected_main_head,
    promoted_main_head:remoteMain,
    clean_head:state.clean_head,
    tree_identical_to_clean:state.tree_identical_to_clean,
    normalized_reviewed_paths:state.normalized_reviewed_paths,
    full_regression:state.full_regression,
    step_9_gates:state.step_9_gates,
    commerce_launch_ready:false,
    pushed_to_main:true
  };
  fs.writeFileSync(path.join(outDir,'step-10.3-summary.json'),JSON.stringify(summary,null,2)+'\n','utf8');
  fs.writeFileSync(path.join(outDir,'step-10.3-summary.md'),[
    '# VoltTech Step 10.3 — Main promotion',
    '',
    'Overall: **PASS**',
    '',
    `Previous main: \`${summary.previous_main_head}\``,
    `Promoted main: \`${summary.promoted_main_head}\``,
    `Clean source head: \`${summary.clean_head}\``,
    '',
    `Promotion tree identical to clean branch: ${summary.tree_identical_to_clean?'YES':'NO'}`,
    `Full regression: ${summary.full_regression}`,
    `Device/role: ${summary.step_9_gates?.device_role||'missing'}`,
    `Release source: ${summary.step_9_gates?.release_source||'missing'}`,
    `Release browser: ${summary.step_9_gates?.release_browser||'missing'}`,
    '',
    '**Pushed to main: YES**',
    '**Commerce launch ready: NO**',
    '',
    'Next: Step 10.4 live .co.za verification.',
    ''
  ].join('\n'),'utf8');

  state.phase='verified';
  state.remote_main_head=remoteMain;
  state.status='PASS';
  save(state);
  console.log(`=== STEP 10.3 PASS ===`);
  console.log(`Remote main is now ${remoteMain}`);
}

const mode=process.argv[2];
if(mode==='prepare') await prepare();
else if(mode==='certify') await certify();
else if(mode==='prepush') await prepush();
else if(mode==='record-push') await recordPush();
else if(mode==='verify-remote') await verifyRemote();
else{
  console.error('Usage: node scripts/run-step-10.3.mjs <prepare|certify|prepush|record-push|verify-remote>');
  process.exit(2);
}

// Step 10.3 live promotion trigger. Upload this file LAST only when ready to promote main.
