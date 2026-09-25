import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const root=process.cwd();
const outDir=path.join(root,'qa-results/step-10.2');
fs.mkdirSync(outDir,{recursive:true});
const statePath=path.join(outDir,'merge-rehearsal.json');

const REVIEWED_MAIN_HEAD='12079c9d873cc1601581354829193a322f81d874';
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
  const run=spawnSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024});
  if(!allowFail && run.status!==0){
    throw new Error(`git ${args.join(' ')} failed\n${run.stdout||''}\n${run.stderr||''}`.trim());
  }
  return run;
}
const stdout=(args)=>git(args).stdout.trim();
const existsAt=(ref,file)=>git(['cat-file','-e',`${ref}:${file}`],{allowFail:true}).status===0;

function writeState(state){
  fs.writeFileSync(statePath,JSON.stringify(state,null,2)+'\n','utf8');
}
function fail(message,state={}){
  writeState({...state,status:'FAIL',error:message});
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

async function prepare(){
  const cleanHead=stdout(['rev-parse','HEAD']);
  const mainHead=stdout(['rev-parse','origin/main']);
  const mergeBase=stdout(['merge-base',cleanHead,'origin/main']);

  const state={
    step:'10.2',
    phase:'prepare',
    clean_head:cleanHead,
    main_head:mainHead,
    merge_base:mergeBase,
    reviewed_main_head:REVIEWED_MAIN_HEAD,
    reviewed_main_only_paths:REVIEWED_MAIN_ONLY,
    conflicts:[],
    resolved_conflicts:[],
    tree_identical_to_clean:false
  };

  if(mainHead!==REVIEWED_MAIN_HEAD){
    fail(`main moved since Step 10.1 review: expected ${REVIEWED_MAIN_HEAD}, found ${mainHead}`,state);
  }

  const mainOnly=stdout(['diff','--name-only',`${mergeBase}..origin/main`]).split('\n').filter(Boolean).sort();
  const unexpected=mainOnly.filter(p=>!REVIEWED_MAIN_ONLY.includes(p));
  const missing=REVIEWED_MAIN_ONLY.filter(p=>!mainOnly.includes(p));
  state.main_only_paths=mainOnly;
  if(unexpected.length||missing.length){
    fail(`main divergence changed: unexpected=${unexpected.join(',')||'none'} missing=${missing.join(',')||'none'}`,state);
  }

  git(['config','user.name','volttech-release-rehearsal']);
  git(['config','user.email','actions@users.noreply.github.com']);
  git(['checkout','-B','rc-promotion-rehearsal','origin/main']);

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

  for(const file of conflicts){
    if(existsAt(cleanHead,file)){
      git(['checkout',cleanHead,'--',file]);
      git(['add','--',file]);
    }else{
      git(['rm','-f','--ignore-unmatch','--',file]);
    }
    state.resolved_conflicts.push(file);
  }

  const unresolved=stdout(['diff','--name-only','--diff-filter=U']).split('\n').filter(Boolean);
  if(unresolved.length) fail(`unresolved conflicts remain: ${unresolved.join(', ')}`,state);

  // If git had no conflicts it may still be in a pending merge. If it did have
  // conflicts, all resolutions above deliberately choose the certified clean tree
  // for reviewed legacy paths.
  const mergeHeadExists=fs.existsSync(path.join(root,'.git','MERGE_HEAD'));
  if(mergeHeadExists){
    git(['commit','-m','release: promote clean rebuild RC (rehearsal only)']);
  }

  const rehearsalHead=stdout(['rev-parse','HEAD']);
  const cleanTree=stdout(['rev-parse',`${cleanHead}^{tree}`]);
  const rehearsalTree=stdout(['rev-parse','HEAD^{tree}']);
  state.rehearsal_head=rehearsalHead;
  state.clean_tree=cleanTree;
  state.rehearsal_tree=rehearsalTree;
  state.tree_identical_to_clean=cleanTree===rehearsalTree;

  if(!state.tree_identical_to_clean){
    const diff=stdout(['diff','--name-status',cleanHead,'HEAD']);
    fail(`merged tree differs from certified clean-rebuild tree:\n${diff}`,state);
  }

  state.status='PASS';
  writeState(state);
  console.log(`PASS: local promotion merge built from main ${mainHead}`);
  console.log(`PASS: reviewed conflicts only (${conflicts.length})`);
  console.log(`PASS: rehearsal tree is identical to clean-rebuild ${cleanHead}`);
}

async function finalize(){
  if(!fs.existsSync(statePath)) fail('merge rehearsal state is missing');
  const state=JSON.parse(fs.readFileSync(statePath,'utf8'));
  const fullPath=path.join(root,'qa-results/step-9.1-summary.json');
  const step9Path=path.join(root,'qa-results/step-9.3/step-9.3-summary.json');
  if(!fs.existsSync(fullPath)||!fs.existsSync(step9Path)) fail('required QA summaries are missing',state);

  const full=JSON.parse(fs.readFileSync(fullPath,'utf8'));
  const step9=JSON.parse(fs.readFileSync(step9Path,'utf8'));

  const checks=[
    ['Promotion tree equals certified clean tree',state.tree_identical_to_clean===true],
    ['Full regression is 24/24',full.status==='PASS'&&full.passed===24&&full.total===24],
    ['Step 9.3 certification is green',step9.status==='PASS'],
    ['Device/role is 9/9',step9.gates?.device_role==='9/9'],
    ['Release source is 15/15',step9.gates?.release_source==='15/15'],
    ['Release browser is 11/11',step9.gates?.release_browser==='11/11'],
    ['Commerce remains non-launch',step9.commerce_launch_ready===false]
  ];
  const failedChecks=checks.filter(([,ok])=>!ok);
  const summary={
    step:'10.2',
    title:'Controlled main promotion rehearsal',
    status:failedChecks.length?'FAIL':'PASS',
    clean_head:state.clean_head,
    main_head:state.main_head,
    merge_base:state.merge_base,
    rehearsal_head:state.rehearsal_head,
    conflicts:state.conflicts,
    resolved_conflicts:state.resolved_conflicts,
    tree_identical_to_clean:state.tree_identical_to_clean,
    full_regression:`${full.passed}/${full.total}`,
    step_9_gates:step9.gates,
    commerce_launch_ready:false,
    pushed_to_main:false,
    checks:checks.map(([name,ok])=>({name,status:ok?'PASS':'FAIL'}))
  };
  fs.writeFileSync(path.join(outDir,'step-10.2-summary.json'),JSON.stringify(summary,null,2)+'\n','utf8');
  fs.writeFileSync(path.join(outDir,'step-10.2-summary.md'),[
    '# VoltTech Step 10.2 — Promotion rehearsal',
    '',
    `Overall: **${summary.status}**`,
    '',
    `Main head tested: \`${summary.main_head}\``,
    `Clean RC tested: \`${summary.clean_head}\``,
    `Local rehearsal merge: \`${summary.rehearsal_head}\``,
    '',
    `Reviewed conflicts resolved: ${summary.resolved_conflicts.length}`,
    `Merged tree identical to clean RC: ${summary.tree_identical_to_clean ? 'YES' : 'NO'}`,
    `Full regression: ${summary.full_regression}`,
    `Device/role: ${summary.step_9_gates?.device_role||'missing'}`,
    `Release source: ${summary.step_9_gates?.release_source||'missing'}`,
    `Release browser: ${summary.step_9_gates?.release_browser||'missing'}`,
    '',
    '**Pushed to main: NO**',
    '**Commerce launch ready: NO**',
    '',
    '| Rehearsal gate | Result |',
    '| --- | --- |',
    ...summary.checks.map(c=>`| ${c.name.replaceAll('|','\\|')} | ${c.status} |`),
    ''
  ].join('\n'),'utf8');

  if(failedChecks.length){
    console.error(`STEP 10.2 FAIL: ${failedChecks.map(([n])=>n).join('; ')}`);
    process.exit(1);
  }
  console.log('=== STEP 10.2 PASS ===');
  console.log('Promotion rehearsal passed. Nothing was pushed to main.');
}

const mode=process.argv[2];
if(mode==='prepare') await prepare();
else if(mode==='finalize') await finalize();
else {
  console.error('Usage: node scripts/run-step-10.2.mjs <prepare|finalize>');
  process.exit(2);
}

// Step 10.2 promotion rehearsal trigger. Upload this file last.
