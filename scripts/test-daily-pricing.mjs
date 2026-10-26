import assert from 'node:assert/strict';
import {hasDailyPricedItems,dailyPriceNotice} from '../assets/js/services/daily-pricing.js';
import {billingDocumentHtml} from '../assets/js/services/billing-document.js';
for(const type of ['gpu','memory','storage'])assert.equal(hasDailyPricedItems([{type,name:'Component'}]),true);
for(const description of ['DDR5 RAM 32GB','2TB NVMe SSD','GeForce RTX 5070','4TB hard drive'])assert.equal(hasDailyPricedItems([{description}]),true);
assert.equal(hasDailyPricedItems([{type:'cooling',name:'RTX GPU waterblock'}]),false);assert.equal(hasDailyPricedItems([{description:'SSD enclosure'}]),false);assert.equal(hasDailyPricedItems([{type:'cpu',name:'AMD Ryzen CPU'}]),false);
for(const kind of ['quote','invoice'])assert.ok(billingDocumentHtml({kind,status:'issued',total:0},[]).includes(dailyPriceNotice));
console.log('PASS: volatile hardware classification, accessory exclusions and quote/invoice pricing disclaimer');
