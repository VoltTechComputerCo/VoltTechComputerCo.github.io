import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import {stripTypeScriptTypes} from 'node:module';
import {gamingProductAllowed} from '../Supabase/functions/sync-supplier-catalogue/gaming-policy.js';
const source=fs.readFileSync('Supabase/functions/sync-supplier-catalogue/index.ts','utf8').replace(/^import .*;\n/gm,'');
const code=stripTypeScriptTypes(source,{mode:'transform'});
const context={gamingProductAllowed,URL,crypto,TextEncoder,console,Deno:{serve:()=>{}}};vm.createContext(context);vm.runInContext(code,context);
const existing=new Map([['MIC-1',{type:'peripheral',name:'USB Gaming Microphone',brand:'Test',short_description:'Microphones',metadata:{product_url:'https://www.syntech.co.za/product/mic/'}}]]);
const rows=context.normaliseSyntech({syntechstock:{products:[{sku:'MIC-1',price:100,promo_price:false,jhbstock:2,cptstock:3,dbnstock:0}]}},existing);
assert.equal(rows.length,1);assert.equal(rows[0].cost,115);assert.equal(rows[0].qty,5);assert.equal(rows[0].name,'USB Gaming Microphone');assert.equal(rows[0].brand,'Test');
assert.equal(context.num(false),null);assert.equal(context.activePromo({promo_price:0}),null);
assert.equal(context.normaliseSyntech({products:[{sku:'APPLIANCE',price:100}]},existing).length,0);
assert.equal(gamingProductAllowed('gpu','RTX 2060'),false);assert.equal(gamingProductAllowed('gpu','RTX 5070'),true);assert.equal(gamingProductAllowed('accessory','Microphone boom arm'),true);assert.equal(gamingProductAllowed('peripheral','Office keyboard'),true);assert.equal(gamingProductAllowed('storage','Surveillance SSD'),false);
console.log('PASS: TS parsing, update feeds preserve product identity, correct VAT, false promo values and curated scope');

assert.equal(context.laptopProduct('Acer Nitro V 15 Gaming Laptop','Laptops'),true);
for(const name of ['Laptop cable lock','Port Designs Notebook Case','OWC SSD for Macbook','Notebook 3 Leaf Clover Red','Laptop DDR5 Notebook Memory'])assert.equal(context.laptopProduct(name,'Laptops'),false,name);
