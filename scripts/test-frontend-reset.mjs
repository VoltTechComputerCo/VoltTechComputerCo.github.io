import fs from 'node:fs';
import assert from 'node:assert/strict';
import { catalogueState } from '../frontend/adapters/public-catalogue.js';
const config={url:'https://example.invalid',publishableKey:'public-test'};
const request=(settings,products=[])=>async url=>({ok:true,json:async()=>url.includes('store_settings')?settings:products});
assert.equal((await catalogueState(config,request([{catalogue_enabled:true,builder_enabled:true}],[]))).kind,'empty');
assert.equal((await catalogueState(config,request([{catalogue_enabled:true}],[{id:'real-product'}]))).kind,'available');
assert.equal((await catalogueState(config,request([{catalogue_enabled:false}]))).kind,'closed');
assert.equal((await catalogueState(config,async()=>{throw Error('offline')})).kind,'unavailable');
assert.equal((await catalogueState(config,request([]))).kind,'unavailable');
assert.equal((await catalogueState(config,async()=>({ok:false}))).kind,'unavailable');
let query='';await catalogueState(config,async url=>{if(url.includes('store_products'))query=url;return {ok:true,json:async()=>url.includes('store_settings')?[{catalogue_enabled:true}]:[]};});
for(const clause of ['is_demo=eq.false','status=eq.active','visibility=eq.public','sale_mode=neq.hidden'])assert.ok(query.includes(clause));
for(const page of ['index.html','design-system.html']){
 const html=fs.readFileSync(page,'utf8');
 const dependencies=[...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(x=>x[1]);
 assert.ok(!dependencies.some(p=>/assets\/css|assets\/js\/pages|glass-system|portal-shell|v4-nav/.test(p)),'Legacy frontend dependency');
 for(const p of dependencies.filter(p=>!p.startsWith('#')&&!/^(https?:|mailto:)/.test(p))){const path=p.split('?')[0];assert.ok(fs.existsSync(path),`${page}: missing ${path}`);}
 assert.equal((html.match(/<main\b/g)||[]).length,1);assert.equal((html.match(/<h1\b/g)||[]).length,1);
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);assert.equal(ids.length,new Set(ids).size,'Duplicate IDs');
}
console.log('PASS: catalogue states, product eligibility, new dependencies, route links, semantic landmarks and unique IDs');
