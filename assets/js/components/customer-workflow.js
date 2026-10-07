const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const money=v=>v==null?'To be confirmed':new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR'}).format(Number(v));
export function customerNext(job){
 if(job.delivered)return '✅ Complete — view invoice and history';
 if(['failed','cancelled','refunded','partially_refunded'].includes(job.payment_status))return '⚠ Review payment status';
 if(['declined','expired'].includes(job.stage)||job.approval==='declined')return '⚠ Contact us for a revised quote';
 if(job.transit)return '⏳ Track your delivery';
 if(job.courier)return '⏳ Track your parcel — awaiting collection';
 if(job.payment_status==='paid')return '⏳ Preparing your order';
 if(job.stage==='awaiting_payment'||job.stage==='accepted'&&['issued','unpaid','pending','open','sent'].includes(job.payment_status))return '⚡ Open payment portal';
 if(job.stage==='awaiting_approval'&&job.approval!=='accepted'||['sent','viewed'].includes(job.stage))return '⚡ Review and accept your quote';
 if(job.approval==='accepted'||job.stage==='accepted')return '⏳ Waiting for payment release';
 return job.stock?'⏳ Final quote being prepared':'⏳ Checking and confirming stock';
}
export function workflowCard(job){
 const stages=[['Request',true],['Stock',job.stock],['Quote',job.quote],['Approval',job.approval==='accepted'],['Payment',job.payment_status==='paid'],['Preparation',job.preparing],['Courier',job.courier],['In transit',job.transit],['Delivered',job.delivered]];
 return '<article class="customer-job"><div class="customer-job-head"><div><p class="eyebrow">'+esc(job.reference)+'</p><h3>'+esc(job.title||'Order')+'</h3></div><strong>'+esc(money(job.total))+'</strong></div><p class="customer-job-next">'+esc(customerNext(job))+'</p><ol class="customer-progress">'+stages.map(([label,done])=>'<li class="'+(done?'done':'waiting')+'"><span>'+(done?'✅':'⏳')+'</span> '+label+'</li>').join('')+'</ol>'+(job.latest_update?'<p><small>LATEST UPDATE</small><br>'+esc(job.latest_update)+'</p>':'')+'<a class="button" href="'+esc(job.href)+'">Open order workspace →</a></article>';
}
export async function renderCustomerWorkflow(client,target){
 target.innerHTML='<h2>My orders &amp; quotes</h2><p>Loading your latest requests…</p>';
 const result=await client.rpc('customer_workflow_jobs');
 if(result.error){target.innerHTML='<h2>My orders &amp; quotes</h2><p>Your requests could not be loaded. <button type="button" data-retry>Retry</button></p>';target.querySelector('[data-retry]').onclick=()=>renderCustomerWorkflow(client,target);return;}
 target.innerHTML='<div class="customer-workflow-heading"><div><p class="eyebrow">YOUR CHECKOUT WORKSPACE</p><h2>My orders &amp; quotes</h2><p>Review your latest quote, approve it, pay when released, and follow delivery in one place.</p></div><button type="button" data-refresh>Refresh updates</button></div><div class="customer-job-list">'+(result.data?.length?result.data.map(workflowCard).join(''):'<p>No orders or quotes yet. Your next request will appear here.</p>')+'</div>';
 target.querySelector('[data-refresh]').onclick=()=>renderCustomerWorkflow(client,target);
}
