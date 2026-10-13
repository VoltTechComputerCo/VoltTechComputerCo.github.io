import assert from 'node:assert/strict';
const base='https://volttechcomputerco.co.za/';
for(let attempt=0;attempt<9;attempt++){
 try{
  for(const [path,marker] of [['store.html','id="laptops"'],['admin-ad-studio.html','VoltTech Marketing Studio'],['assets/js/components/store-filter-menu.js','laptopPurpose']]){
   const r=await fetch(base+path+'?verify='+Date.now(),{signal:AbortSignal.timeout(15000)});assert.equal(r.status,200,path);assert.ok((await r.text()).includes(marker),'Live '+path+' has latest content');
  }
  const r=await fetch(base+'assets/ads/volttech-launch-pack.zip',{method:'HEAD',signal:AbortSignal.timeout(15000)});assert.equal(r.status,200,'Downloadable pack');
  console.log('PASS: live VoltTech laptop department, filters, Marketing Studio and downloadable advertising pack');process.exit(0);
 }catch(e){console.log('Deployment check '+(attempt+1)+': '+e.message);if(attempt===8)throw e;await new Promise(r=>setTimeout(r,20000));}
}