import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const root=process.cwd();
const outDir=path.join(root,'qa-results/step-10.4-final');
fs.mkdirSync(outDir,{recursive:true});
const statePath=path.join(outDir,'state.json');
const EXPECTED_MAIN='b5820ad24725ac92087b3811855c52099758db65';

function run(cmd,args,{allowFail=false}={}){
  const r=spawnSync(cmd,args,{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024});
  if(!allowFail && r.status!==0) throw new Error(`${cmd} ${args.join(' ')} failed\n${r.stdout||''}\n${r.stderr||''}`.trim());
  return r;
}
const git=(args,opts={})=>run('git',args,opts);
const stdout=args=>git(args).stdout.trim();
const load=()=>fs.existsSync(statePath)?JSON.parse(fs.readFileSync(statePath,'utf8')):{};
const save=s=>fs.writeFileSync(statePath,JSON.stringify(s,null,2)+'\n','utf8');
function fail(message,state=load()){save({...state,status:'FAIL',error:message});console.error(`FAIL: ${message}`);process.exit(1)}

async function prepare(){
  const mainHead=stdout(['rev-parse','origin/main']);
  const state={step:'10.4-final',phase:'prepare',previous_main_head:mainHead,pushed:false};

  if(mainHead!==EXPECTED_MAIN) fail(`main moved: expected ${EXPECTED_MAIN}, found ${mainHead}`,state);

  git(['config','user.name','github-actions[bot]']);
  git(['config','user.email','41898282+github-actions[bot]@users.noreply.github.com']);
  git(['checkout','-B','release-final-generated-404','origin/main']);

  if(fs.existsSync(path.join(root,'404.html'))){
    fail('404.html already exists on production main; expected it to be missing before final generation',state);
  }
  if(!fs.existsSync(path.join(root,'src/pages/404.json')) || !fs.existsSync(path.join(root,'src/pages/404.html'))){
    fail('production main is missing 404 source files',state);
  }

  const build=run('python3',['scripts/build-clean-frontend.py']);
  if(build.stdout) process.stdout.write(build.stdout);
  if(build.stderr) process.stderr.write(build.stderr);

  const changed=stdout(['status','--short']).split('\n').filter(Boolean);
  state.working_changes=changed;
  const normalized=changed.map(line=>line.slice(3));
  if(normalized.length!==1 || normalized[0]!=='404.html'){
    fail(`generator changed unexpected files: ${changed.join(' | ')||'none'}`,state);
  }

  const body=fs.readFileSync(path.join(root,'404.html'),'utf8');
  if(!body.includes('VOLTTECH / SIGNAL LOST') ||
     !body.includes('That page dropped off the map.') ||
     !body.includes('name="robots" content="noindex, nofollow"')){
    fail('generated 404.html does not satisfy the custom 404 contract',state);
  }

  git(['add','404.html']);
  git(['commit','-m','release: publish generated custom 404']);
  const changedFromMain=stdout(['diff','--name-only','origin/main..HEAD']).split('\n').filter(Boolean);
  state.changed_files=changedFromMain;
  if(changedFromMain.length!==1 || changedFromMain[0]!=='404.html'){
    fail(`promotion contains unexpected files: ${changedFromMain.join(', ')}`,state);
  }

  state.promotion_head=stdout(['rev-parse','HEAD']);
  state.status='PREPARED';
  save(state);
  console.log('PASS: actual clean generator produced only 404.html');
  console.log(`PASS: prepared promotion ${state.promotion_head}`);
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
  state.status='CERTIFIED';
  state.checks=checks;
  state.full_regression='24/24';
  state.step_9_gates=step9.gates;
  save(state);
  console.log('PASS: generated 404-only promotion certified');
}

async function prepush(){
  const state=load();
  const current=stdout(['rev-parse','origin/main']);
  if(current!==EXPECTED_MAIN) fail(`main moved before push: expected ${EXPECTED_MAIN}, found ${current}`,state);
  if(stdout(['rev-parse','HEAD'])!==state.promotion_head) fail('promotion HEAD changed after certification',state);
  state.status='READY_TO_PUSH';save(state);
  console.log('PASS: main unchanged immediately before push');
}

async function pushed(){
  const state=load();
  if(state.status!=='READY_TO_PUSH') fail('push recorded before READY_TO_PUSH',state);
  state.pushed_head=stdout(['rev-parse','HEAD']);
  state.pushed=true;
  state.status='PUSHED';
  save(state);
  console.log(`PUSHED: ${state.pushed_head} -> main`);
}

async function verify(){
  const state=load();
  const remote=stdout(['rev-parse','origin/main']);
  if(remote!==state.pushed_head) fail(`remote main mismatch: expected ${state.pushed_head}, found ${remote}`,state);
  state.remote_main_head=remote;
  state.status='PASS';
  save(state);
  console.log(`PASS: remote main is ${remote}`);
}

const mode=process.argv[2];
if(mode==='prepare') await prepare();
else if(mode==='certify') await certify();
else if(mode==='prepush') await prepush();
else if(mode==='pushed') await pushed();
else if(mode==='verify') await verify();
else{console.error('Usage: node /tmp/volttech-final-404.mjs <prepare|certify|prepush|pushed|verify>');process.exit(2)}

// Step 10.4 final generator-first 404 publication trigger.
