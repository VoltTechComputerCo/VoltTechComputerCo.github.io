export const STAGES=['REQUEST','STOCK','QUOTE','APPROVAL','PAYMENT','SUPPLIER','COURIER','DELIVERY','COMPLETE'];
export function nextAction(j){
 const o=j.ops||{},r=j.record||{};
 if(o.archived_at)return {label:'Job complete and archived',tone:'done',stage:8};
 if(r.exception_message)return {label:r.exception_message,tone:'problem',stage:0};
 if(['cancelled','declined','expired'].includes(r.status)||o.approval==='declined')return {label:'Resolve or revise the quotation',action:'revise',tone:'problem',stage:2};
 if(j.kind==='build')return {label:'Review saved build and create quotation',action:'build_quote',stage:1,tone:'action'};
 if(j.kind==='service'||j.kind==='order')return {label:'Create or link the customer quotation',action:'new_quote',stage:1,tone:'action'};
 if(!o.stock_confirmed_at)return {label:'Confirm reservations for every product',action:'reserve',stage:1,tone:'action'};
 if(!o.pricing_confirmed_at)return {label:'Confirm final selling prices and delivery',action:'price',stage:2,tone:'action'};
 const accepted=j.kind==='store'?o.approval==='accepted':r.status==='accepted';
 if(!j.paid&&!o.quote_sent_at&&!['sent','viewed','accepted'].includes(r.status))return {label:'Preview and send the customer quote',action:'send_quote',stage:2,tone:'action'};
 if(!accepted&&!j.paid)return {label:'Waiting for customer approval',stage:3,tone:'waiting'};
 if(!j.paid&&!o.payment_released_at)return {label:'Release payment for the accepted quote',action:'release_payment',stage:4,tone:'action'};
 if(!j.paid)return {label:r.payment_status==='failed'?'Payment failed — follow up with customer':'Waiting for verified customer payment',stage:4,tone:r.payment_status==='failed'?'problem':'waiting'};
 if(j.kind==='quote'&&!j.items.some(i=>['part','product'].includes(i.item_type))){if(!o.delivered_at)return {label:'Payment received. Complete the service job',action:'service_complete',stage:7,tone:'action'};return {label:'Review the completed service and archive',action:'close',stage:8,tone:'action'};}
 if(!o.supplier_order_at)return {label:'Customer paid. Confirm supplier order',action:'supplier_order',stage:5,tone:'action'};
 if(!o.courier_booked_at)return {label:'Book Bob Go manually and record shipment',action:'courier',stage:6,tone:'action'};
 if(!o.waybill_sent_at)return {label:'Email the waybill to the supplier',action:'waybill_sent',stage:6,tone:'action'};
 if(!o.waybill_approved_at)return {label:'Confirm supplier approval of the waybill',action:'waybill_approved',stage:6,tone:'action'};
 if(!o.preparing_at)return {label:'Confirm supplier is preparing the parcel',action:'preparing',stage:7,tone:'action'};
 if(!o.collected_at)return {label:'Awaiting collection — record courier handover',action:'collected',stage:7,tone:'waiting'};
 if(!o.in_transit_at)return {label:'Record parcel in transit',action:'in_transit',stage:7,tone:'action'};
 if(!o.delivered_at)return {label:'Awaiting delivery — record delivery confirmation',action:'delivered',stage:7,tone:'waiting'};
 return {label:'Review final costs and archive completed job',action:'close',stage:8,tone:'action'};
}
export function normalize(data,customers=[]){
 const cmap=new Map(customers.map(c=>[c.id,c])),omap=new Map((data.operations||[]).map(o=>[o.entity_key,o]));
 const qs=data.quotes||[],stores=data.stores||[];
 const jobs=[];
 const add=(kind,r)=>{const key=kind+':'+r.id,c=cmap.get(r.user_id)||{},inv=(data.invoices||[]).find(i=>i.quote_id===r.id||i.quote_id===r.quote_id),paid=r.payment_status==='paid'||inv?.status==='paid';jobs.push({key,kind,record:r,ops:omap.get(key)||{},invoice:inv,paid,customer:r.guest_name||c.full_name||'Customer',email:r.guest_email||c.billing_email||'',phone:r.guest_phone||c.phone||'',user_id:r.user_id,ref:r.request_number||r.quote_number||r.job_number||r.order_number||'VT-'+r.id.slice(0,8),title:r.title||r.name||'Hardware request',items:r.items||[],total:r.final_total??r.total??r.estimated_total,date:r.submitted_at||r.created_at});};
 for(const r of stores)add('store',r);
 for(const q of qs)if(!stores.some(r=>r.quote_id===q.id))add('quote',q);
 for(const b of data.builds||[])if(b.status==='quote_requested'&&!qs.some(q=>q.source_type==='builder'&&q.source_id===b.id)&&!b.quote_id)add('build',b);
 for(const s of data.services||[])if(!qs.some(q=>q.source_type==='service'&&q.source_id===s.id))add('service',s);
 for(const r of data.orders||[])if(!stores.some(s=>s.confirmed_order_id===r.id)&&!qs.some(q=>q.source_type==='order'&&q.source_id===r.id))add('order',r);
 return jobs.sort((a,b)=>new Date(b.date)-new Date(a.date));
}
