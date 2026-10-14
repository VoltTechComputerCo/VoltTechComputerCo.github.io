import assert from 'node:assert/strict';
import fs from 'node:fs';
const {departmentPicks}=await import('../assets/js/services/store-departments.js');
const base={visibility:'public',status:'active',sale_mode:'quote',stock_qty:3,category_slug:'gpu',media:{primaryImage:'https://www.syntech.co.za/test.jpg'}};
const picks=departmentPicks([{...base,name:'RTX 3070 Ti',retail_price:99999},{...base,name:'RTX 5070',retail_price:18000},{...base,name:'RTX 5090',retail_price:50000,stock_qty:0},{...base,name:'Radeon RX9070 XT',retail_price:25000,visibility:'private'}]);
assert.equal(picks.get('gpu').product.name,'RTX 5070');
const home=fs.readFileSync('index.html','utf8'),store=fs.readFileSync('store.html','utf8');
assert.equal((home.match(/data-department-image=/g)||[]).length,8);
assert.equal((store.match(/data-department-image=/g)||[]).length,26);
for(const category of Object.keys(JSON.parse(fs.readFileSync('assets/categories/store-departments.json'))))assert.ok(fs.existsSync(`assets/categories/store-${category}.webp`));
assert.ok(home.includes('name="q"')&&home.includes('Shop all products →'));
console.log('PASS: available public products selected, newer gaming GPU preferred, all 20 local category images and direct home search');

const facets=await import('../assets/js/components/store-filter-menu.js');
assert.ok(facets.FILTER_KEYS.includes('laptopPurpose'));
assert.ok(facets.facetDefinitions('laptops').some(f=>f.key==='ramGB'));
assert.equal(facets.matchesFacetFilters({specs:{laptopPurpose:'Gaming',ramGB:16}},{laptopPurpose:'Work & everyday'}),false);
assert.equal(facets.matchesFacetFilters({specs:{laptopPurpose:'Gaming',ramGB:16}},{laptopPurpose:'Gaming',ramGB:'16'}),true);
