import { getCommerceCore, withTimeout, validOrderAccess, readLaunchSettings, canPay, paymentDestination, canTransactHere } from '../services/transactions.js';
import { connectCart } from '../services/home-integrations.js';
import { esc } from '../components/catalogue-view.js';
import { money, stageInfo, timeline, orderItems, trackingLink } from '../components/order-view.js?v=20261007-ops';
const params=new URLSearchParams(location.search), access=validOrderAccess(params);
const state=document.getElementById('order-state'), detail=document.getElementById('order-detail'), refresh=document.getElementById('refresh-order'), error=document.getElementById('order-error');
let VT, order, settings, busy=false, paying=false, timer, failures=0, suspended=false;
function showState(title,copy){state.querySelector('h2').textContent=title;state.querySelector('p').textContent=copy;state.hidden=false;detail.hidden=true;}
function showError(message){error.textContent=message;error.hidden=false;}
function schedule(){clearTimeout(timer);if(!suspended&&!document.hidden&&!paying&&access&&VT)timer=setTimeout(load,failures?60000:30000);}
async function init(){
  connectCart();
  if(!access){showState('Open your private order link.','Use the complete link supplied after checkout. A reference number alone cannot open an order.');return;}
  if(!canTransactHere()){showState('Order tracking is unavailable on this page.','Open your original order link, or contact VoltTech with your order reference.');return;}
  try{VT=await getCommerceCore();refresh.hidden=false;refresh.addEventListener('click',()=>load());await load();}
  catch{showState('Order tracking could not connect.','Please reload or contact VoltTech. No payment status has been changed.');}
}
async function load(){
  if(busy||paying||!VT||suspended)return;busy=true;refresh.disabled=true;
  try{
    const [result,flags]=await Promise.all([withTimeout(VT.getOrderStatus(access.ref,access.token)),readLaunchSettings(window.VOLTTECH_SUPABASE)]);
    if(!result||result.request_number!==access.ref)throw new Error('Invalid order response');
    order=result;settings=flags;failures=0;error.hidden=true;state.hidden=true;detail.hidden=false;render();
    document.getElementById('order-updated').textContent=`Last checked ${new Intl.DateTimeFormat('en-ZA',{hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date())}`;
  }catch{
    failures++;
    if(order){showError('The latest update could not be loaded. Details below are from the last successful check. Refresh before making a payment.');document.getElementById('pay-order').hidden=true;}
    else showState('Order details could not be loaded.','The link may be invalid or the connection may be unavailable. Check the original link or contact VoltTech.');
  }finally{busy=false;refresh.disabled=false;schedule();}
}
function render(){
  const stage=stageInfo(order);
  document.getElementById('order-stage-title').textContent=stage.title;
  document.getElementById('order-stage-copy').textContent=stage.copy;
  document.getElementById('order-reference').textContent=order.request_number;
  document.getElementById('order-timeline').innerHTML=timeline(order);
  document.getElementById('order-items').innerHTML=orderItems(order.items);
  document.getElementById('order-subtotal').textContent=money(order.subtotal);
  document.getElementById('order-delivery').textContent=money(order.delivery_fee);
  document.getElementById('order-total').textContent=money(order.total);
  const payment=document.getElementById('order-payment-state');payment.textContent=String(order.payment_status||'Awaiting update').replaceAll('_',' ');
  const returnNote=document.getElementById('payment-return'), flag=params.get('payment');
  returnNote.hidden=order.payment_status==='paid'||!['success','cancelled','failed'].includes(flag);
  returnNote.textContent=flag==='success'?'You have returned from payment. Payment will appear as received once it has been confirmed.':flag==='cancelled'?'You have returned after cancelling payment. Check the recorded status below.':'The payment attempt did not complete. Check the latest order status before trying again.';
  let approval=document.getElementById('order-approval');if(!approval){approval=document.createElement('div');approval.id='order-approval';document.getElementById('order-total').parentElement.after(approval);}
  approval.replaceChildren();
  if(order.checkout_stage==='awaiting_approval'&&order.workflow?.approval==='pending'){
    const note=document.createElement('p');note.textContent='Review the confirmed items, selling prices, delivery and final total before accepting this quote. Payment remains blocked until VoltTech releases it.';approval.append(note);
    for(const [action,label] of [['accepted','Accept confirmed quote'],['declined','Decline quote']]){const b=document.createElement('button');b.className='btn';b.textContent=label;b.onclick=async()=>{b.disabled=true;try{const client=supabase.createClient(VOLTTECH_SUPABASE.url,VOLTTECH_SUPABASE.publishableKey);const result=await client.functions.invoke('store-checkout-status',{body:{...access,action}});if(result.error||result.data?.ok!==true)throw new Error('Could not record your response. Refresh and try again.');await load();}catch(e){showError(e.message);}finally{b.disabled=false;}};approval.append(b);}
  }
  let adjustments=document.getElementById('order-adjustments');if(!adjustments){adjustments=document.createElement('p');adjustments.id='order-adjustments';document.getElementById('order-total').parentElement.after(adjustments);}
  adjustments.textContent='Labour '+money(order.workflow?.quote_details?.labour??0)+' · Discount '+money(order.workflow?.quote_details?.discount??0)+' · No separate VAT charge.';
  let invoice=document.getElementById('order-invoice');if(!invoice){invoice=document.createElement('article');invoice.id='order-invoice';detail.append(invoice);}
  invoice.hidden=!order.workflow?.final_invoice;
  if(order.workflow?.final_invoice){const inv=order.workflow.final_invoice;invoice.replaceChildren();const title=document.createElement('h2');title.textContent='VoltTech final invoice '+inv.invoice_number;invoice.append(title);for(const line of inv.items||[]){const p=document.createElement('p');p.textContent=line.description+' · Qty '+line.quantity+' · '+money(line.line_total);invoice.append(p);}const total=document.createElement('p');total.textContent='Total '+money(inv.total)+' · Payment received ✅';invoice.append(total);const print=document.createElement('button');print.className='btn';print.textContent='Print / Save invoice PDF';print.onclick=()=>window.print();invoice.append(print);}
  const pay=document.getElementById('pay-order');pay.hidden=!canPay(order,settings);pay.disabled=false;pay.onclick=startPayment;
  document.getElementById('payment-availability').textContent=order.payment_status==='paid'?'Payment is recorded as received.':canPay(order,settings)?'Continue to the secure payment portal to complete payment.':'Payment is not available here at the moment. Contact VoltTech if you need help.';
  const tracking=document.getElementById('order-tracking');tracking.hidden=!order.tracking_number&&!trackingLink(order.tracking_url);
  document.getElementById('tracking-courier').textContent=order.courier_name||'Delivery tracking';
  document.getElementById('tracking-number').textContent=order.tracking_number||'Tracking number not supplied';
  const trackingButton=document.getElementById('tracking-link'),url=trackingLink(order.tracking_url);trackingButton.hidden=!url;if(url)trackingButton.href=url;
  const help=document.getElementById('order-help');help.href='https://wa.me/27618435775?text='+encodeURIComponent('Hi VoltTech, I need help with order '+order.request_number+'.');
}
async function startPayment(){
  if(paying||busy||!canTransactHere()||!canPay(order,settings))return;
  paying=true;clearTimeout(timer);const button=document.getElementById('pay-order');button.disabled=true;button.textContent='CHECKING PAYMENT…';
  try{
    const [latest,flags]=await Promise.all([withTimeout(VT.getOrderStatus(access.ref,access.token)),readLaunchSettings(window.VOLTTECH_SUPABASE)]);
    if(latest?.request_number!==access.ref||!canPay(latest,flags))throw new Error('Payment availability changed. Refresh the order to see its latest status.');
    order=latest;settings=flags;button.textContent='OPENING PAYMENT PORTAL…';
    const result=await withTimeout(VT.createStorePayment(access.ref,access.token),20000);
    const destination=paymentDestination(result?.redirect_url);if(!destination)throw new Error('The payment link could not be verified. Contact VoltTech before paying.');
    location.assign(destination);
  }catch(e){showError(e.message||'Payment could not start. Refresh the order before trying again.');button.hidden=true;error.focus();}
  finally{paying=false;button.textContent='OPEN PAYMENT PORTAL →';schedule();}
}
document.addEventListener('visibilitychange',()=>{if(document.hidden)clearTimeout(timer);else schedule();});
window.addEventListener('pagehide',()=>{suspended=true;clearTimeout(timer);});
window.addEventListener('pageshow',()=>{suspended=false;schedule();});
init();
