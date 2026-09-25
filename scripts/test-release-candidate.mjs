import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';

const root=process.cwd();
const outDir=path.join(root,'qa-results/step-10.1');
fs.mkdirSync(outDir,{recursive:true});
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const exists=rel=>fs.existsSync(path.join(root,rel));
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();

const results=[];let failed=0;
function check(name,condition,detail=''){
  const status=condition?'PASS':'FAIL';
  results.push({name,status,detail});
  if(!condition)failed++;
  console.log(`${status}: ${name}${detail?` — ${detail}`:''}`);
}

const step9=JSON.parse(read('qa-results/step-9.3/step-9.3-summary.json'));
check('Step 9.3 certification is green',
  step9.status==='PASS' &&
  step9.gates?.full_regression==='24/24' &&
  step9.gates?.device_role==='9/9' &&
  step9.gates?.release_source==='15/15' &&
  step9.gates?.release_browser==='11/11');

const homeConfig=JSON.parse(read('src/pages/home.json'));
const home=read('index.html');
const storeConfig=JSON.parse(read('src/pages/store.json'));
const builderConfig=JSON.parse(read('src/pages/builder.json'));
check('Homepage source is production-indexable',
  homeConfig.robots==='index, follow, max-image-preview:large');
check('Generated homepage is production-indexable',
  /name="robots" content="index, follow, max-image-preview:large"/.test(home));
check('Commerce pages remain non-index release gates',
  storeConfig.robots.includes('noindex') && builderConfig.robots.includes('noindex'));

const robots=read('robots.txt'), sitemap=read('sitemap.xml');
check('Robots and sitemap point to .co.za',
  robots.includes('Allow: /') &&
  robots.includes('https://volttechcomputerco.co.za/sitemap.xml') &&
  sitemap.includes('<loc>https://volttechcomputerco.co.za/</loc>') &&
  !sitemap.includes('volttechcomputerco.github.io'));

const sitemapWorkflow=read('.github/workflows/static-sitemap-autopilot.yml');
check('STATIC sitemap automation is the clean .co.za workflow',
  sitemapWorkflow.includes('clean-rebuild') &&
  sitemapWorkflow.includes('https://volttechcomputerco.co.za/'));

check('Old GitHub streamer-refresh workflow remains retired',
  !exists('.github/workflows/update-sa-streamers.yml'));

const creator=read('creator-hub-south-africa.html');
const store=read('store.html');
const adapter=read('streamer-feed.js');
check('Reviewed live-branch surfaces are superseded by clean implementations',
  creator.includes('data-vt-shell="clean"') &&
  store.includes('data-vt-shell="clean"') &&
  store.includes('id="store-gate"') &&
  adapter.includes('V2 adapter'));

check('Release blockers remain carried',
  exists('docs/clean-rebuild/RELEASE-BLOCKERS.md') &&
  read('docs/clean-rebuild/RELEASE-BLOCKERS.md').includes('Store, Builder and direct payments remain disabled'));

const tracked=git('ls-files').split('\n').filter(Boolean);
check('No dependency or QA build debris is tracked',
  !tracked.some(p=>p.startsWith('node_modules/')||p.startsWith('qa-results/')));
check('No root correction manifest is tracked',
  !tracked.includes('correction-manifest.json'));

let conflictText='';
try{conflictText=git('grep','-n','-e','<<<<<<< ','-e','>>>>>>> ','--','.')}catch(error){
  if(error.status!==1)throw error;
}
check('No merge-conflict markers remain',!conflictText,conflictText.slice(0,500));

const rcHead=git('rev-parse','HEAD');
const mainHead=git('rev-parse','origin/main');
const mergeBase=git('merge-base','HEAD','origin/main');
const ahead=Number(git('rev-list','--count','origin/main..HEAD'));
const behind=Number(git('rev-list','--count','HEAD..origin/main'));
const mainOnly=git('diff','--name-only',`${mergeBase}..origin/main`).split('\n').filter(Boolean).sort();
const expectedMainOnly=[
  '.github/workflows/static-sitemap-autopilot.yml',
  '.github/workflows/update-sa-streamers.yml',
  'creator-hub-south-africa.html',
  'index.html',
  'sa-streamers-live.json',
  'sitemap.xml',
  'store.html',
  'streamer-feed.js'
].sort();
const unexpected=mainOnly.filter(p=>!expectedMainOnly.includes(p));
const missing=expectedMainOnly.filter(p=>!mainOnly.includes(p));
check('Main divergence contains no unreviewed live paths',
  unexpected.length===0 && missing.length===0,
  `unexpected=${unexpected.join(',')||'none'} missing=${missing.join(',')||'none'}`);

const summary={
  step:'10.1',
  title:'Release Candidate lock',
  status:failed?'FAIL':'PASS',
  certification_mode:'non-commerce',
  rc_head:rcHead,
  main_head:mainHead,
  merge_base:mergeBase,
  ahead_by:ahead,
  behind_by:behind,
  main_only_paths:mainOnly,
  step_9_gates:step9.gates,
  commerce_launch_ready:false,
  results
};
fs.writeFileSync(path.join(outDir,'step-10.1-summary.json'),JSON.stringify(summary,null,2)+'\n');
fs.writeFileSync(path.join(outDir,'step-10.1-summary.md'),[
  '# VoltTech Step 10.1 — Release Candidate',
  '',
  `Overall: **${summary.status}**`,
  '',
  `RC head: \`${rcHead}\``,
  `Main head: \`${mainHead}\``,
  `Merge base: \`${mergeBase}\``,
  `Ahead of main: ${ahead}`,
  `Main-only commits: ${behind}`,
  '',
  'Certification mode: **non-commerce**',
  '',
  'Commerce launch ready: **NO**',
  '',
  '| RC gate | Result |',
  '| --- | --- |',
  ...results.map(r=>`| ${r.name.replaceAll('|','\\|')} | ${r.status} |`),
  ''
].join('\n'),'utf8');

console.log(`\n=== STEP 10.1 ${summary.status} ===`);
console.log(`RC ${rcHead} · main ${mainHead} · ahead ${ahead} · main-only ${behind}`);
process.exit(failed?1:0);
