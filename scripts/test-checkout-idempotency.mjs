// All fixtures are in-memory: this test must never access production or Yoco.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {webcrypto} from 'node:crypto';
import vm from 'node:vm';

const source=readFileSync('Supabase/functions/submit-store-checkout/index.ts','utf8')
 .replace(/^import[^\n]*;\s*$/gm,'');
const edgeJavaScript=stripTypeScriptTypes(source,{mode:'strip'});
const browserHelper=readFileSync('assets/js/services/checkout-intent.js','utf8');
const {checkoutIntentToken,clearCheckoutIntent}=await import('data:text/javascript,'+encodeURIComponent(browserHelper));
const memory=()=>{const map=new Map();return{getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)}};
const storage=memory();
const first=checkoutIntentToken('cart-one',storage,1000,webcrypto);
assert.match(first,/^[a-f0-9]{64}$/);
assert.equal(checkoutIntentToken('cart-one',storage,2000,webcrypto),first,'reload keeps token');
assert.notEqual(checkoutIntentToken('cart-two',storage,3000,webcrypto),first,'different cart gets new token');
const second=checkoutIntentToken('cart-two',storage,4000,webcrypto);
clearCheckoutIntent(storage);
assert.notEqual(checkoutIntentToken('cart-two',storage,5000,webcrypto),second,'success clears token');
console.log('PASS browser intent survives reload, changes with cart, clears after success');

function fixture({failJobsOnce=false,stock=3}={}){
 const db={requests:new Map(),items:new Map(),jobs:new Map(),notifications:new Map(),outbox:new Map(),events:[],failJobsOnce,productStock:stock};
 let seq=0;
 function run(table,query){
   const filter=Object.fromEntries(query.filters);
   const action=query.action||'select';
   if(table==='store_settings'&&action==='select')return {data:{catalogue_enabled:true,currency:'ZAR'},error:null};
   if(table==='store_products'&&action==='select')return{data:[{
     id:'gpu-fixture',slug:'gpu-fixture',type:'gpu',brand:'Fixture',name:'Fixture RTX 5070',
     status:'active',visibility:'public',sale_mode:'quote',retail_price:8999,currency:'ZAR',
     stock_status:db.productStock===0?'out_of_stock':'in_stock',stock_qty:db.productStock,
     price_checked_at:'2026-11-04T08:00:00Z',media:{primaryImage:'/fixture.webp'},specs:{},compatibility:{}
   }],error:null};
   if(table==='store_requests'){
     if(action==='select'){
       const data=[...db.requests.values()].find(row=>row.public_token_hash===filter.public_token_hash)||null;
       return{data,error:null};
     }
     if(action==='insert'){
       const row=query.value;
       if([...db.requests.values()].some(old=>old.public_token_hash===row.public_token_hash))
         return{data:null,error:{code:'23505',message:'duplicate token hash'}};
       const id='fixture-order-'+(++seq);
       const stored={...row,id,request_number:'VT-QA-'+seq,submitted_at:'2026-11-04T08:00:00Z'};
       db.requests.set(id,stored);return{data:stored,error:null};
     }
     if(action==='delete'){db.requests.delete(filter.id);return{error:null};}
   }
   if(table==='store_request_items'){
     if(action==='insert'){
       const rows=query.value;db.items.set(rows[0].request_id,rows);
       return{error:null};
     }
     if(action==='select')return{count:(db.items.get(filter.request_id)||[]).length,error:null};
   }
   if(table==='operations_jobs'&&action==='upsert'){
     if(db.failJobsOnce){db.failJobsOnce=false;return{error:{message:'simulated transient failure'}};}
     db.jobs.set(query.value.entity_key,query.value);return{error:null};
   }
   if(table==='email_outbox'&&action==='update'){
     db.outbox.set(filter.dedupe_key,query.value.payload);return{error:null};
   }
   if(table==='notifications'&&action==='upsert'){
     for(const entry of query.value)db.notifications.set(entry.dedupe_key,entry);
     return{error:null};
   }
   if(table==='store_automation_events'&&action==='insert'){
     db.events.push(query.value);return{error:null};
   }
   throw Error('Unexpected mock table/query '+table+'/'+action);
 }
 const admin={
   rpc:async(name)=>{assert.equal(name,'consume_store_edge_rate_limit');return{data:true,error:null};},
   from(table){
     const q={action:null,value:null,filters:[],opts:null,
       select(_cols,options){if(!this.action)this.action='select';this.opts=options||{};return this;},
       insert(v){this.action='insert';this.value=v;return this;},
       upsert(v){this.action='upsert';this.value=v;return this;},
       update(v){this.action='update';this.value=v;return this;},
       delete(){this.action='delete';return this;},
       eq(k,v){this.filters.push([k,v]);return this;},
       in(k,v){this.filters.push([k,v]);return this;},
       single(){return Promise.resolve(run(table,this));},
       maybeSingle(){return Promise.resolve(run(table,this));},
       then(resolve,reject){return Promise.resolve().then(()=>run(table,this)).then(resolve,reject);}
     };
     return q;
   }
 };
 let handler;
 const sandbox={
   Deno:{env:{get:name=>({SUPABASE_URL:'https://fixture.supabase.co',
     SUPABASE_ANON_KEY:'test-public',SUPABASE_SERVICE_ROLE_KEY:'test-service'})[name]},serve:fn=>{handler=fn;}},
   createClient:(_url,key)=>key==='test-service'?admin:{auth:{getUser:async()=>({data:{user:{id:'fixture-user'}},error:null})}},
   crypto:webcrypto,Request,Response,TextEncoder,Uint8Array,Map,Set,URL,console:{error(){},warn(){}},
 };
 vm.runInNewContext(edgeJavaScript,sandbox,{filename:'submit-store-checkout-fixture.ts',timeout:1000});
 assert.equal(typeof handler,'function');
 async function submit(body,{signedIn=false}={}){
   const req=new Request('https://fixture.supabase.co/functions/v1/submit-store-checkout',{
     method:'POST',headers:{Origin:'https://volttechcomputerco.co.za','content-type':'application/json',
       ...(signedIn?{Authorization:'Bearer mock-token'}:{})},
     body:JSON.stringify(body)
   });
   const response=await handler(req);return{status:response.status,body:await response.json()};
 }
 return {db,submit};
}
const payload=token=>({
 checkout_token:token,customer:{name:'Test Customer',email:'qa@example.invalid',phone:'0712345678'},
 items:[{productId:'gpu-fixture',quantity:1}],
 delivery:{method:'door',address:{address_line1:'Mock Road',city:'Pretoria',province:'Gauteng',postal_code:'0001'}},
 customerNote:'fixture only',website:''
});
const tok='a'.repeat(64);
{
 const {db,submit}=fixture();
 const first=await submit(payload(tok));
 assert.equal(first.status,200,JSON.stringify(first.body));
 assert.equal(first.body.request.request_number,'VT-QA-1');
 assert.equal(db.requests.size,1);
 assert.equal(db.items.get('fixture-order-1').length,1);
 assert.equal(db.jobs.size,1);
 assert.equal(db.notifications.size,1);
 assert.equal(db.events.length,1);
 assert.match(db.requests.get('fixture-order-1').metadata.checkout_payload_hash,/^[a-f0-9]{64}$/);
 assert.equal(db.requests.get('fixture-order-1').public_token_hash.length,64);
 assert.equal(db.requests.get('fixture-order-1').public_token_hash!==tok,true);
 const replay=await submit(payload(tok));
 assert.equal(replay.status,200,JSON.stringify(replay.body));
 assert.equal(replay.body.replayed,true);
 assert.equal(replay.body.request.request_number,first.body.request.request_number);
 assert.equal(replay.body.status_url,first.body.status_url);
 assert.equal(db.requests.size,1);
 assert.equal(db.events.length,1,'replay never emits another event');
 assert.equal(db.notifications.size,1,'replay never creates duplicate admin notification');
 const changed=payload(tok);changed.items[0].quantity=2;
 const conflict=await submit(changed);
 assert.equal(conflict.status,409);
 assert.equal(db.requests.size,1);
 console.log('PASS guest request, same-token replay, changed-cart rejection, deduplicated notification');
}
{
 const {db,submit}=fixture({failJobsOnce:true});
 const first=await submit(payload('b'.repeat(64)));
 assert.equal(first.status,500,'failed Operations job must not be reported as a success');
 assert.equal(db.requests.size,1,'DB already inserted request before job failed');
 assert.equal(db.items.size,1);
 const retry=await submit(payload('b'.repeat(64)));
 assert.equal(retry.status,200,JSON.stringify(retry.body));
 assert.equal(retry.body.replayed,true);
 assert.equal(db.requests.size,1,'retry cannot add another order');
 assert.equal(db.jobs.size,1,'retry repairs the missing Operations job');
 assert.equal(db.notifications.size,1);
 console.log('PASS transient downstream failure safely recovers its original request');
}
{
 const {db,submit}=fixture({stock:0});
 assert.equal((await submit(payload('c'.repeat(64)))).status,409);
 assert.equal(db.requests.size,0,'out-of-stock cannot create request');
 console.log('PASS server-side out-of-stock guard');
}
{
 const {db,submit}=fixture({stock:1});
 const two=payload('d'.repeat(64));two.items[0].quantity=2;
 assert.equal((await submit(two)).status,409);
 assert.equal(db.requests.size,0,'insufficient stock cannot create request');
 console.log('PASS server-side quantity guard');
}
{
 const {db,submit}=fixture();
 const invalid=payload('short-token');
 assert.equal((await submit(invalid)).status,400);
 assert.equal(db.requests.size,0);
 const legacy=payload('0'.repeat(64));delete legacy.checkout_token;
 const result=await submit(legacy,{signedIn:true});
 assert.equal(result.status,200);
 assert.equal(result.body.account_attached,true);
 assert.match(result.body.access_token,/^[a-f0-9]{64}$/);
 assert.equal(db.requests.size,1);
 console.log('PASS malformed-token rejection and backwards-compatible signed-in checkout');
}
