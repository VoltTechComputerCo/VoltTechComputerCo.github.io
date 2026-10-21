import assert from 'node:assert/strict';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {buildLiveCatalogue,isGamingPart,toBuilderProduct} from '../builder/js/live-catalogue.js';
import {getCompatibility,estimatePower} from '../builder/js/compatibility-engine.js';
import {buildGuidedRecommendation} from '../builder/js/guided-engine.js';
import {psuPlanningTarget} from '../builder/js/psu-planning.js';
const rows=JSON.parse(gunzipSync(fs.readFileSync('assets/data/catalogue.json.gz'))).products;
const live=buildLiveCatalogue(rows);
assert.ok(live.products.length>100);
for(const p of live.products){assert.equal(p.offers[0].price,rows.find(r=>r.id===p.id).retail_price);assert.ok(p.offers.every(o=>o.source==='live-store'));}
const fixture={id:'fixture',name:'Desktop DDR5 memory',type:'memory',status:'active',visibility:'public',is_demo:false,sale_mode:'checkout',currency:'ZAR',retail_price:123.45,stock_qty:2,specs:{}};
for(const changes of [{name:'DDR5 SODIMM Laptop RAM'},{name:'DDR5 ECC RDIMM'},{stock_qty:0},{is_demo:true},{visibility:'private'},{retail_price:0},{type:'storage',name:'External USB SSD'},{type:'fan',name:'Standing air circulation fan'},{type:'gpu',name:'GeForce RTX 2060'},{type:'gpu',name:'GeForce GT 710'}])assert.equal(isGamingPart({...fixture,...changes}),false);
const am4=toBuilderProduct({...fixture,type:'cpu',name:'AMD Ryzen 5 5600 AM4 CPU'});
const am5=toBuilderProduct({...fixture,type:'motherboard',name:'B650 AM5 DDR5 M-ATX Motherboard'});
assert.ok(getCompatibility(am5,{cpu:am4}).issues.some(x=>x.code==='cpu-board-socket'));
const ddr4=toBuilderProduct({...fixture,name:'DDR4 16GB Desktop Memory'});
assert.ok(getCompatibility(ddr4,{motherboard:am5}).issues.some(x=>x.code==='memory-board-type'));
assert.equal(estimatePower({cpu:am4}).estimated,0);
assert.ok(estimatePower({cpu:am4}).missingPower.includes('cpu'));
for(const budget of [15000,25000,40000]){
 const r=buildGuidedRecommendation({budget,useCase:'gaming',target:'1080p',priority:'balanced',storageNeed:1000},live.products);
 assert.equal(r.ok,true);assert.equal(r.report.issues.length,0);assert.ok(r.build.psu.specs.wattage>=psuPlanningTarget(r.build));
 assert.ok(r.report.unknowns.length>0,'Incomplete supplier specs remain unconfirmed');
 assert.ok(r.total<=budget,`Budget ${budget}`);
}
console.log(`PASS: ${live.products.length} current parts, retail prices, exclusions, socket/DDR conflicts, honest missing power and three guided budgets`);
