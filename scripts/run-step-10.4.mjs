import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';

const PROD='https://volttechcomputerco.co.za';
const GITHUB='https://volttechcomputerco.github.io';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const EXPECTED_MAIN=git('rev-parse','origin/main');
const outDir=path.resolve('qa-results/step-10.4');
fs.mkdirSync(outDir,{recursive:true});

async function inspect(base, pathname){
  const url=new URL(pathname,base);
  url.searchParams.set('vt_diag',Date.now().toString());
  const response=await fetch(url,{
    redirect:'manual',
    headers:{
      'user-agent':'VoltTech-Routing-Diagnostic/10.4',
      'cache-control':'no-cache'
    },
    signal:AbortSignal.timeout(15000)
  });
  const body=await response.text();
  const headers={};
  for(const key of [
    'server','cf-ray','cf-cache-status','cache-control','content-type',
    'content-length','location','x-github-request-id','etag','age','via'
  ]){
    const value=response.headers.get(key);
    if(value!==null) headers[key]=value;
  }
  return {
    requested:url.toString(),
    status:response.status,
    statusText:response.statusText,
    headers,
    markers:{
      clean_shell:body.includes('data-vt-shell="clean"'),
      homepage_hero:body.includes('TUNE YOUR'),
      custom_404:body.includes('VOLTTECH / SIGNAL LOST'),
      custom_404_heading:body.includes('That page dropped off the map.'),
      github_404:body.includes("There isn't a GitHub Pages site here.")
    },
    title:(body.match(/<title>([^<]*)<\/title>/i)||[])[1]||null,
    body_length:body.length,
    body_prefix:body.slice(0,220).replace(/\s+/g,' ')
  };
}

const paths=['/','/404.html','/__volttech_release_check_missing__.html'];
const report={
  step:'10.4-routing-diagnostic',
  checked_at:new Date().toISOString(),
  expected_main_sha:EXPECTED_MAIN,
  production:{},
  github_pages:{}
};

for(const p of paths){
  report.production[p]=await inspect(PROD,p);
  report.github_pages[p]=await inspect(GITHUB,p);
}

fs.writeFileSync(
  path.join(outDir,'routing-diagnostic.json'),
  JSON.stringify(report,null,2)+'\n',
  'utf8'
);

console.log('=== VOLTTECH ROUTING DIAGNOSTIC ===');
console.log(JSON.stringify(report,null,2));

const prodMissing=report.production['/__volttech_release_check_missing__.html'];
const ghMissing=report.github_pages['/__volttech_release_check_missing__.html'];
const prod404=report.production['/404.html'];

if(prodMissing.status===404 && prodMissing.markers.custom_404){
  console.log('DIAGNOSIS: production custom 404 is now working.');
  process.exit(0);
}

if(ghMissing.status===404 && ghMissing.markers.custom_404 && prodMissing.status===200){
  console.log('DIAGNOSIS: GitHub Pages 404 works, but the .co.za edge converts the missing route to HTTP 200. Investigate Cloudflare routing/rewrite/SPA fallback.');
  process.exit(1);
}

if(prod404.status===200 && prod404.markers.custom_404 && prodMissing.status===200 && prodMissing.markers.homepage_hero){
  console.log('DIAGNOSIS: custom 404 file is deployed, but missing production routes are being rewritten to the homepage with HTTP 200.');
  process.exit(1);
}

if(!prod404.markers.custom_404){
  console.log('DIAGNOSIS: the custom 404 document is not reaching the .co.za origin.');
  process.exit(1);
}

console.log('DIAGNOSIS: routing state is unusual; inspect routing-diagnostic.json.');
process.exit(1);

// Step 10.4 read-only routing diagnostic trigger.
