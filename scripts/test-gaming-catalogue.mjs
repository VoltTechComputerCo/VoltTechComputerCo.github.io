import assert from 'node:assert/strict';
import { gamingProductAllowed as allowed } from '../Supabase/functions/import-esquire-catalogue/gaming-policy.js';
const cases = [
 ['gpu','MSI GeForce RTX 3060 Ti GAMING X',true],
 ['gpu','GeForce RTX 2060 Gaming',false],
 ['gpu','GeForce GT 710',false],
 ['gpu','AMD Radeon RX 7600 XT',true],
 ['memory','Kingston 16GB DDR4 Desktop Memory',true],
 ['memory','Kingston DDR400 512MB',false],
 ['memory','Kingston 16GB DDR4 SODIMM',false],
 ['storage','Toshiba N300 NAS drive',false],
 ['peripheral','World Cup Zakumi Flag',false],
 ['peripheral','Trust GXT 350 Gaming Headset',true],
 ['peripheral','Basic office mouse',false],
 ['cpu','AMD Ryzen 5 5600',true],
 ['cpu','Intel Core i7-8700',false],
 ['psu','Aerocool 650W 80 Plus Bronze',true],
 ['psu','Generic 300W PSU',false],
];
for(const [type,name,expected] of cases) assert.equal(allowed(type,name),expected,name);
console.log('PASS: gaming feed filters, GPU generations, desktop memory and unrelated products');
