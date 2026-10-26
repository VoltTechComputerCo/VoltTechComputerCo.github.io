import assert from 'node:assert/strict';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {localSearch,searchCatalogue,normalizeSearch} from '../assets/js/services/product-search.js';
import {filterProducts} from '../assets/js/components/catalogue-view.js';
const products=JSON.parse(gunzipSync(fs.readFileSync('assets/data/catalogue.json.gz'))).products;
const deepcool=products.filter(p=>normalizeSearch(p.brand)==='deepcool');
for(const query of ['DeepCool','deepcol','depecool','deep cool']){
 const result=filterProducts(products,{category:'all',filters:{},search:query,sort:'featured'});
 assert.deepEqual(new Set(result.map(p=>p.id)),new Set(deepcool.map(p=>p.id)),query+' must return the full brand range');
}
assert.equal(localSearch(products,'thermal grizly').size,100);
assert.equal(localSearch(products,'ACFRE00123A').size,1);
assert.equal(localSearch(products,'zzzxxyq').size,0);
assert.equal(localSearch(products,'deepcool ak620').size,2);
const priced=filterProducts(products,{category:'all',filters:{},search:'deepcol',sort:'price-low'});
assert.ok(priced.every((p,i)=>!i||p.retail_price>=priced[i-1].retail_price),'explicit price sorting survives search');
globalThis.window={VOLTTECH_SUPABASE:{url:'https://example.invalid',publishableKey:'public-test'}};
let calls=0;
const request=async(url,options)=>{calls++;assert.match(url,/rpc\/search_store_products$/);assert.equal(options.headers.apikey,'public-test');return {ok:true,json:async()=>({matches:[{id:'p',score:1}],suggestions:[],brand:null})};};
await Promise.all([searchCatalogue('cache-test',request),searchCatalogue('cache-test',request)]);
assert.equal(calls,1,'identical concurrent suggestion/result searches share one request');
let failures=0;const failure=async()=>{failures++;throw Error('offline');};
await assert.rejects(searchCatalogue('retry-test',failure));
await assert.rejects(searchCatalogue('retry-test',failure));
assert.equal(failures,2,'failed requests must not poison the cache');
assert.equal(localSearch(products,'deepcol').size,deepcool.length,'offline search remains usable');
console.log('PASS: complete brand typo coverage, multiword brands, model search, no matches, sorting, concurrent cache and retry recovery');
