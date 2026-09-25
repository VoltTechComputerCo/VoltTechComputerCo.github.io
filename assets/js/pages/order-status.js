import { getCommerceCore, withTimeout, validOrderAccess, readLaunchSettings, canPay, paymentDestination, canTransactHere } from '../services/transactions.js';
import { connectCart } from '../services/home-integrations.js';
import { esc } from '../components/catalogue-view.js';
import { money, stageInfo, timeline, orderItems, trackingLink } from '../components/order-view.js';
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
  const pay=document.getElementById('pay-order');pay.hidden=!canPay(order,settings);pay.disabled=false;pay.onclick=startPayment;
  document.getElementById('payment-availability').textContent=order.payment_status==='paid'?'Payment is recorded as received.':canPay(order,settings)?'You will continue to Yoco to complete payment.':'Payment is not available here at the moment. Contact VoltTech if you need help.';
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
    order=latest;settings=flags;button.textContent='OPENING YOCO…';
    const result=await withTimeout(VT.createStorePayment(access.ref,access.token),20000);
    const destination=paymentDestination(result?.redirect_url);if(!destination)throw new Error('The payment link could not be verified. Contact VoltTech before paying.');
    location.assign(destination);
  }catch(e){showError(e.message||'Payment could not start. Refresh the order before trying again.');button.hidden=true;error.focus();}
  finally{paying=false;button.textContent='CONTINUE TO YOCO →';schedule();}
}
document.addEventListener('visibilitychange',()=>{if(document.hidden)clearTimeout(timer);else schedule();});
window.addEventListener('pagehide',()=>{suspended=true;clearTimeout(timer);});
window.addEventListener('pageshow',()=>{suspended=false;schedule();});
init();
