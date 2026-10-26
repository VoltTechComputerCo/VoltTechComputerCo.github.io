import assert from 'node:assert/strict';
import {deliveryGroups,deliveryTotal} from '../assets/js/services/billing-delivery.js';
const lines=[{product_id:'syntech-cooler',quantity:1},{product_id:'lunatech-putty',quantity:3}],offers=[{product_id:'syntech-cooler',supplier_id:'syntech',supplier_name:'Syntech',cost_excl:1492},{product_id:'lunatech-putty',supplier_id:'lunatech',supplier_name:'LunaTech IT',cost_excl:600}];
let groups=deliveryGroups(lines,offers);assert.equal(groups.find(g=>g.id==='syntech').free,false,'other suppliers must not qualify Syntech for free delivery');assert.equal(deliveryTotal(groups,{syntech:79.35,lunatech:100},0),179.35);assert.throws(()=>deliveryTotal(groups,{syntech:79.35},0),/Confirm/);
groups=deliveryGroups([{product_id:'syntech-cooler',quantity:2}],offers);assert.equal(groups[0].free,true,'combine quantities within one supplier order');assert.equal(deliveryTotal(groups,{syntech:0},99),99);
assert.equal(deliveryGroups([{product_id:'syntech-cooler',quantity:1}],[{...offers[0],cost_excl:2500}])[0].free,true,'exact threshold');
assert.equal(deliveryGroups([{product_id:'syntech-cooler',quantity:1}],[{...offers[0],cost_excl:2499.99}])[0].free,false);
console.log('PASS: supplier-separated subtotals, inclusive delivery sum, unknown-fee rejection and exact Syntech threshold');
