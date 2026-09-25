import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root=process.cwd();
const outDir=path.join(root,'qa-results/step-9.3');
fs.mkdirSync(outDir,{recursive:true});

const readJson=rel=>{try{return JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'))}catch{return null}};
const full=readJson('qa-results/step-9.1-summary.json');

const groups=[{
  name:'Step 9.1 full regression',
  status:full?.status==='PASS'?'PASS':'FAIL',
  exit_code:null
}];
let failed=groups[0].status==='FAIL'?1:0;

const tasks=[
  ['Step 9.3 source/release contracts','node',['scripts/test-release-source.mjs']],
  ['Step 9.2 device + role regression','node',['scripts/test-device-role-qa.mjs']],
  ['Step 9.3 browser failure states','node',['scripts/test-release-browser.mjs']]
];

for(const [name,cmd,args] of tasks){
  console.log(`\n=== ${name} ===`);
  const run=spawnSync(cmd,args,{cwd:root,encoding:'utf8',env:process.env,maxBuffer:32*1024*1024});
  if(run.stdout)process.stdout.write(run.stdout);
  if(run.stderr)process.stderr.write(run.stderr);
  const status=run.status===0?'PASS':'FAIL';
  if(status==='FAIL')failed++;
  groups.push({name,status,exit_code:run.status});
}

const device=readJson('qa-results/step-9.2/step-9.2-summary.json');
const source=readJson('qa-results/step-9.3/source-summary.json');
const browser=readJson('qa-results/step-9.3/browser-summary.json');
const snapshot=JSON.parse(fs.readFileSync(path.join(root,'docs/clean-rebuild/step-9.3-backend-snapshot.json'),'utf8'));

const summary={
  step:'9.3',
  title:'Failure, retry and release-blocker certification',
  branch:'clean-rebuild',
  certification_mode:'non-commerce',
  status:failed?'FAIL':'PASS',
  groups,
  gates:{
    full_regression:full?`${full.passed}/${full.total}`:null,
    device_role:device?`${device.passed}/${device.total}`:null,
    release_source:source?`${source.passed}/${source.total}`:null,
    release_browser:browser?`${browser.passed}/${browser.total}`:null
  },
  backend_snapshot_checked_at_utc:snapshot.checked_at_utc,
  commerce_launch_ready:false,
  meaning:'PASS means safe to proceed to a release candidate only while Store, Builder and direct payments remain disabled.'
};

fs.writeFileSync(path.join(outDir,'step-9.3-summary.json'),JSON.stringify(summary,null,2)+'\n');
fs.writeFileSync(path.join(outDir,'step-9.3-summary.md'),[
  '# VoltTech Step 9.3 — Release certification',
  '',
  `Overall: **${summary.status}**`,
  '',
  `Certification mode: **${summary.certification_mode}**`,
  '',
  `Full regression: ${summary.gates.full_regression || 'missing'}`,
  `Device + role QA: ${summary.gates.device_role || 'missing'}`,
  `Release source contracts: ${summary.gates.release_source || 'missing'}`,
  `Release browser failure states: ${summary.gates.release_browser || 'missing'}`,
  '',
  '**Commerce launch ready: NO**',
  '',
  summary.meaning,
  '',
  'See `docs/clean-rebuild/RELEASE-BLOCKERS.md` for carried blockers.',
  ''
].join('\n'),'utf8');

console.log(`\n=== STEP 9.3 ${summary.status} ===`);
console.log(summary.meaning);
process.exit(failed?1:0);

// Step 9.3 final Creator contract assertion correction — 2026-09-25.
