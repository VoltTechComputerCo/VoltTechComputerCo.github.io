import assert from 'node:assert/strict';
import {pageWindow,pageSize} from '../assets/js/services/catalogue-pagination.js';
assert.equal(pageSize(25),25);assert.equal(pageSize(99),10);
assert.deepEqual(pageWindow(122,1,25),{page:1,pages:5,start:0,end:25});
assert.deepEqual(pageWindow(122,100,25),{page:5,pages:5,start:100,end:122});
assert.deepEqual(pageWindow(0,3,10),{page:1,pages:1,start:0,end:0});
assert.equal(pageWindow(122,-1,100).page,1);
console.log('PASS: allowed page sizes, bounded pages, final page and empty results');
