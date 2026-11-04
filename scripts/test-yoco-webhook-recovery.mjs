// Signed Yoco webhook fixtures: no provider requests, database writes or real charges.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {webcrypto} from 'node:crypto';
import vm from 'node:vm';

const source=readFileSync('Supabase/functions/yoco-webhook/index.ts','utf8').replace(/^import[^\n]*;\s*$/gm,'');
const code=stripTypeScriptTypes(source,{mode:'strip'});
const keyBytes=new TextEncoder().encode('fixture-secret-for-webhook-only-not-a-real-key');
const webhookSecret='whsec_'+Buffer.from(keyBytes).toString('base64');
const paymentBase={id:'payment-fixture',request_id:'request-fixture',amount:500,currency:'ZAR',
 status:'pending',provider_checkout_id:'checkout-fixture',paid_at:null};
function fixture({failOrderOnce=false,failNoticeOnce=false}={}){
 const db={
   payment:{...paymentBase},request:{id:'request-fixture',request_number:'VT-TEST-01',
     user_id:'fixture-user',payment_status:'unpaid',checkout_stage:'awaiting_payment'},
   events:new Set(),notifications:new Map(),audit:[],failOrderOnce,failNoticeOnce
 };
 let handler=null;
 function execute(table,q){
   const where=Object.fromEntries(q.filters);
   const op=q.action||'select';
   if(table==='payments'&&op==='select')return{data:null,error:null}; // no invoice payment fixture
   if(table==='store_payments'&&op==='select')
     return{data:where.provider_checkout_id===db.payment.provider_checkout_id?{...db.payment}:null,error:null};
   if(table==='store_payment_events'&&op==='insert'){
     const event=q.value;
     if(db.events.has(event.provider_event_id))return{error:{code:'23505',message:'duplicate event'}};
     db.events.add(event.provider_event_id);return{error:null};
   }
   if(table==='store_payments'&&op==='update'){
     if(q.filters.some(([k,v])=>k==='status'&&v==='succeeded'&&db.payment.status==='succeeded'&&q.neqValue))return{error:null};
     Object.assign(db.payment,q.value);return{error:null};
   }
   if(table==='store_requests'&&op==='select')return{data:{...db.request},error:null};
   if(table==='store_requests'&&op==='update'){
     if(db.failOrderOnce){db.failOrderOnce=false;return{data:null,error:{message:'simulated request update outage'}};}
     if(q.neqValue&&db.request.payment_status==='paid')return{data:null,error:null};
     Object.assign(db.request,q.value);
     return{data:{id:db.request.id},error:null};
   }
   if(table==='store_automation_events'&&op==='insert'){db.audit.push(q.value);return{error:null};}
   if(table==='notifications'&&op==='upsert'){
     if(db.failNoticeOnce){db.failNoticeOnce=false;return{error:{message:'simulated notification error'}};}
     for(const note of q.value)db.notifications.set(note.dedupe_key,note);
     return{error:null};
   }
   throw Error('Unexpected webhook query '+table+'/'+op);
 }
 const admin={
   from(table){
     const q={
       action:null,value:null,filters:[],neqValue:false,
       select(_cols){if(!this.action)this.action='select';return this;},
       eq(key,val){this.filters.push([key,val]);return this;},
       neq(key,val){this.neqValue=true;this.filters.push([key,val]);return this;},
       insert(value){this.action='insert';this.value=value;return this;},
       update(value){this.action='update';this.value=value;return this;},
       upsert(value){this.action='upsert';this.value=value;return this;},
       single(){return Promise.resolve(execute(table,this));},
       maybeSingle(){return Promise.resolve(execute(table,this));},
       then(resolve,reject){return Promise.resolve().then(()=>execute(table,this)).then(resolve,reject);}
     };return q;
   }
 };
 const sandbox={
   Deno:{env:{get:k=>({YOCO_WEBHOOK_SECRET:webhookSecret,SUPABASE_URL:'https://fixture.invalid',SUPABASE_SERVICE_ROLE_KEY:'fixture-service'})[k]},serve:fn=>{handler=fn;}},
   createClient:()=>admin,crypto:webcrypto,Response,Request,Uint8Array,TextEncoder,atob,btoa,Date,
   console:{error(){},warn(){}}
 };
 vm.runInNewContext(code,sandbox,{filename:'yoco-webhook-fixture.ts',timeout:1000});
 assert.equal(typeof handler,'function');
 async function send(event,{badSignature=false}={}){
   const id='webhook-fixture-'+event.id,ts=String(Math.floor(Date.now()/1000));
   const body=JSON.stringify(event),msg=id+'.'+ts+'.'+body;
   const imported=await webcrypto.subtle.importKey('raw',keyBytes,{name:'HMAC',hash:'SHA-256'},false,['sign']);
   const sig=Buffer.from(await webcrypto.subtle.sign('HMAC',imported,new TextEncoder().encode(msg))).toString('base64');
   const req=new Request('https://fixture.invalid/functions/v1/yoco-webhook',{
     method:'POST',headers:{'webhook-id':id,'webhook-timestamp':ts,
       'webhook-signature':'v1,'+(badSignature?'invalid-signature':sig),'content-type':'application/json'},
     body
   });
   const response=await handler(req);
   return{status:response.status,text:await response.text()};
 }
 return{db,send};
}
function paymentEvent(id='event-1',type='payment.succeeded',amount=50000){
 return{id,type,payload:{id:'provider-pay-1',status:type==='payment.succeeded'?'succeeded':'failed',
   amount,currency:'ZAR',metadata:{checkoutId:'checkout-fixture'}}};
}
{
 const {db,send}=fixture();
 const result=await send(paymentEvent());
 assert.equal(result.status,200,result.text);
 assert.equal(db.payment.status,'succeeded');
 assert.equal(db.request.payment_status,'paid');
 assert.equal(db.request.checkout_stage,'payment_received');
 assert.equal(db.events.size,1);
 assert.equal(db.notifications.size,2);
 assert.equal(db.audit.length,1);
 const replay=await send(paymentEvent());
 assert.equal(replay.status,200);
 assert.equal(db.notifications.size,2,'notification dedupe');
 assert.equal(db.audit.length,1,'do not duplicate automated fulfilment event');
 db.request.checkout_stage='fulfillment_booked';
 assert.equal((await send(paymentEvent())).status,200);
 assert.equal(db.request.checkout_stage,'fulfillment_booked','paid order progress must not regress');
 assert.equal((await send(paymentEvent('event-2','payment.failed'))).status,200);
 assert.equal(db.payment.status,'succeeded','out-of-order failed callback must not undo success');
 console.log('PASS signed payment, duplicate events, no fulfilment regression, no failure downgrade');
}
{
 const {db,send}=fixture({failOrderOnce:true});
 assert.equal((await send(paymentEvent())).status,500);
 assert.equal(db.payment.status,'succeeded','payment may succeed before request status update');
 assert.equal(db.request.payment_status,'unpaid');
 const result=await send(paymentEvent());
 assert.equal(result.status,200,'duplicate must resume unpaid order');
 assert.equal(db.payment.status,'succeeded');
 assert.equal(db.request.payment_status,'paid');
 assert.equal(db.events.size,1);
 assert.equal(db.audit.length,1);
 assert.equal(db.notifications.size,2);
 console.log('PASS repeated webhook repairs partially applied payment');
}
{
 const {db,send}=fixture({failNoticeOnce:true});
 assert.equal((await send(paymentEvent())).status,500);
 assert.equal(db.request.payment_status,'paid');
 const result=await send(paymentEvent());
 assert.equal(result.status,200,'duplicate retries failed notifications');
 assert.equal(db.audit.length,1);
 assert.equal(db.notifications.size,2);
 console.log('PASS notification failure recovered without another payment or workflow transition');
}
{
 const {db,send}=fixture();
 assert.equal((await send(paymentEvent('bad-value','payment.succeeded',49999))).status,409);
 assert.equal(db.payment.status,'pending');
 assert.equal(db.request.payment_status,'unpaid');
 assert.equal((await send(paymentEvent('bad-signature'),{badSignature:true})).status,403);
 assert.equal(db.request.payment_status,'unpaid');
 console.log('PASS amount mismatch and invalid signature rejected without confirming payment');
}
