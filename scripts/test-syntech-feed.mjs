import {classifyProduct} from '../Supabase/functions/sync-supplier-catalogue/catalogue-classification.js';
import {systemKind} from '../Supabase/functions/sync-supplier-catalogue/system-classification.js';
import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import {stripTypeScriptTypes} from 'node:module';
import {gamingProductAllowed} from '../Supabase/functions/sync-supplier-catalogue/gaming-policy.js';
const source=fs.readFileSync('Supabase/functions/sync-supplier-catalogue/index.ts','utf8').replace(/^import .*;\n/gm,'');
const code=stripTypeScriptTypes(source,{mode:'transform'});
const context={classifyProduct,systemKind,gamingProductAllowed,URL,crypto,TextEncoder,console,Deno:{serve:()=>{}}};vm.createContext(context);vm.runInContext(code,context);
const existing=new Map([['MIC-1',{type:'peripheral',name:'USB Gaming Microphone',brand:'Test',short_description:'Microphones',metadata:{product_url:'https://www.syntech.co.za/product/mic/'}}]]);
const rows=context.normaliseSyntech({syntechstock:{products:[{sku:'MIC-1',price:100,promo_price:false,jhbstock:2,cptstock:3,dbnstock:0}]}},existing);
assert.equal(rows.length,1);assert.equal(rows[0].cost,115);assert.equal(rows[0].qty,5);assert.equal(rows[0].name,'USB Gaming Microphone');assert.equal(rows[0].brand,'Test');
assert.equal(context.num(false),null);assert.equal(context.activePromo({promo_price:0}),null);
assert.equal(context.normaliseSyntech({products:[{sku:'APPLIANCE',price:100}]},existing).length,0);
assert.equal(gamingProductAllowed('gpu','RTX 2060'),true);assert.equal(gamingProductAllowed('gpu','RTX 5070'),true);assert.equal(gamingProductAllowed('accessory','Microphone boom arm'),true);assert.equal(gamingProductAllowed('peripheral','Office keyboard'),true);assert.equal(gamingProductAllowed('storage','Surveillance SSD'),false);
console.log('PASS: TS parsing, update feeds preserve product identity, correct VAT, false promo values and curated scope');

assert.equal(context.laptopProduct('Acer Nitro V 15 Gaming Laptop','Laptops'),true);
for(const name of ['Laptop cable lock','Port Designs Notebook Case','OWC SSD for Macbook','Notebook 3 Leaf Clover Red','Laptop DDR5 Notebook Memory'])assert.equal(context.laptopProduct(name,'Laptops'),false,name);

// Full specification strings must not turn systems into the parts inside them.
const notebook='Dell Latitude 5350 Intel Core Ultra 7, 16GB DDR5, 512GB SSD, 13.3" FHD, Battery 3 Cell, 65W PSU, Windows 11 Pro';
const desktop='Dell Tower ECT1250 Intel Core i5-14400, 16GB DDR5, 512GB SSD, Windows 11 Pro';
assert.equal(context.typeOf(notebook,'',''),'laptop');
assert.equal(context.typeOf(desktop,'',''),'peripheral');
assert.equal(context.categoryOf('peripheral',desktop,''),'desktops');
assert.equal(context.typeOf('ASUS CPU Cooler LGA1700','',''),'cooler');
assert.equal(gamingProductAllowed('laptop',notebook),true);
for(const name of ['Lenovo ThinkPad Bluetooth Silent Mouse','Acer Nitro VG240 Gaming Monitor','Dell AlienWare Wireless Gaming Headset','UGREEN enclosure for Macbook','Laptop cable lock'])assert.equal(systemKind(name),'',name);
console.log('PASS: full computer specifications, cooler priority and accessory exclusions');

for(const [name,type,category] of [
 ['PCBuilder Ryzen 5 7600 Windows 11 Gaming PC','peripheral','desktops'],
 ['AMD Ryzen 5 5500 AM4 Socket Desktop Processor','cpu','cpu'],
 ['Dato 8GB DDR4 3200MHz Desktop RAM','memory','memory'],
 ['Asus TUF Gaming GT502 ATX Gaming Chassis','case','case'],
 ['Corsair RX120 120mm Case Fan Triple Pack','fan','fan'],
 ['GeIL 16GB DDR5 Notebook Memory','memory','memory'],
 ['Kensington Keyed Laptop Lock','accessory','laptop-accessories'],
 ['ASUS GeForce GT 1030 2GB Graphics Card','gpu','gpu'],
 ['Mercusys 5 Port Gigabit Desktop Switch','accessory','networking'],
 ['Samsung Galaxy Tab S10 FE Wi-Fi Tablet','peripheral','tablets']
])assert.deepEqual(classifyProduct(name),{type,category},name);
for(const name of ['Russell Hobbs Food Processor','Marlin Stand Up Sharpener','Alva Air 40cm Pedestal Fan','Casey Standing Dustpan','Unitherm Inverter Air Conditioner','Brainware A5 Notebook'])assert.equal(classifyProduct(name),null,name);
console.log('PASS: expanded generations, systems, desktop RAM, notebook upgrades, category collisions and unrelated household products');

for(const row of JSON.parse(fs.readFileSync('scripts/supplier-imports/system-classification-regressions.json','utf8')))assert.deepEqual(classifyProduct(row.name),{type:row.type,category:row.category},row.name);
for(const name of ['Samsung A57 5G 256GB Octa-Core Processor 8GB RAM','HP LaserJet Pro 3003dw Printer Processor speed 800 MHz','Lexmark Laser Printer 1GB DDR4 memory'])assert.equal(classifyProduct(name),null,name);
console.log('PASS: supplier notebook specifications and non-PC device exclusions');

for(const row of JSON.parse(fs.readFileSync('scripts/supplier-imports/category-identity-regressions.json','utf8')))assert.equal(classifyProduct(row.name,row.supplier_category)?.category,row.category,row.name);
console.log('PASS: handhelds, prebuilt PCs, monitor hubs, cable accessories and peripheral identity');
