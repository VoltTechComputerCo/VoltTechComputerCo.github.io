import assert from 'node:assert/strict';
import {productImageUrl} from '../assets/js/services/product-images.js';
const original='https://www.syntech.co.za/wp-content/uploads/photo.jpg';
const thumbnail=new URL(productImageUrl(original));
assert.equal(thumbnail.hostname,'wsrv.nl');assert.equal(thumbnail.searchParams.get('url'),original);assert.equal(thumbnail.searchParams.get('w'),'480');assert.equal(thumbnail.searchParams.get('output'),'webp');
assert.equal(new URL(productImageUrl(original,144)).searchParams.get('w'),'144');
for(const value of ['/assets/photo.webp','https://private.example/photo.jpg','https://www.syntech.co.za/photo.jpg?token=secret','https://user:password@www.syntech.co.za/photo.jpg'])assert.equal(productImageUrl(value),value);
console.log('PASS: correctly sized public supplier images; local, private and signed URLs stay on origin');
