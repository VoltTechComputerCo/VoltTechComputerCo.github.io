import { checkoutAccess, checkoutCart, cartFingerprint, eligibleCart, readLaunchSettings, withTimeout, statusDestination, canTransactHere } from '../services/transactions.js';
import { esc, imageMarkup, bindImages } from '../components/catalogue-view.js';
import { money } from '../components/order-view.js?v=20261007-supplier-flow1';
const form=document.getElementById('checkout-form'), fieldset=document.getElementById('checkout-fields'), state=document.getElementById('checkout-state'), error=document.getElementById('checkout-error'), button=document.getElementById('place-order');
let VT, cart=[], fingerprint='', sending=false, received=false, cartStale=false;
const input=name=>form.elements.namedItem(name);
function showState(title,copy){state.hidden=false;state.querySelector('h2').textContent=title;state.querySelector('p').textContent=copy;form.hidden=true;}
function showError(message){error.textContent=message;error.hidden=false;error.focus();}
function address(){return Object.fromEntries(['address_line1','address_line2','suburb','city','province','postal_code'].map(name=>[name,input(name).value.trim()]));}
function customer(){return {name:input('name').value.trim(),email:input('email').value.trim(),phone:input('phone').value.trim()};}
function resetDeliveryCopy(){
  document.getElementById('delivery-amount').textContent='Confirmed before payment';
  document.getElementById('delivery-detail').textContent='VoltTech books Bob Go manually after stock reservation. Your final courier charge is confirmed before payment.';
}
function markCartChanged(){
  if(!VT||received)return;
  if(cartFingerprint(VT.readCart())===fingerprint)return;
  cartStale=true;resetDeliveryCopy();button.disabled=true;
  showError(sending?'Your cart changed while this request was being sent. New cart contents will be kept.':'Your cart has changed. Review it in the Store, then reload checkout before placing the order.');
}
async function init(){
  try {
    const access=await checkoutAccess();
    if(!access.VT){const messages={closed:['The Store is not accepting orders yet.','You can still contact VoltTech for component advice and upgrade planning.'],origin:['Checkout is unavailable on this page.','Please contact VoltTech to confirm your order. No details have been submitted.'],connection:['Checkout connection unavailable.','We could not check Store availability. Reload this page or contact VoltTech.']};showState(...messages[access.reason]);return;}
    VT=access.VT;cart=checkoutCart(VT.readCart());
    if(!cart){showState('Your cart needs attention.','Review the cart in the Store before continuing.');return;}
    if(!cart.length){showState('Your cart is empty.','Explore the Store and add a component before returning to checkout.');return;}
    fingerprint=cartFingerprint(cart);
    const [products,profileResult]=await Promise.all([withTimeout(VT.getProductsByIds(cart.map(i=>i.productId))),withTimeout(VT.loadCheckoutProfile()).catch(()=>null)]);
    if(!eligibleCart(VT,cart,products)){showState('Some items are unavailable.','Your cart contains a missing, demo or unavailable item, or a quantity that needs checking. Review it in the Store before continuing.');return;}
    const byId=new Map(products.map(p=>[p.id,p]));
    document.getElementById('checkout-items').innerHTML=cart.map(i=>{const p=byId.get(i.productId);return `<article class="checkout-item">${imageMarkup(p)}<div><h3>${esc(p.name)}</h3><p>${esc(p.brand)} · Qty ${i.quantity}</p><span class="micro">Listed: ${p.currency==='ZAR'?money(p.retail_price,'Pricing to be confirmed'):'Pricing to be confirmed'}</span></div></article>`;}).join('');
    bindImages(document.getElementById('checkout-items'));
    const count=cart.reduce((n,i)=>n+i.quantity,0);
    document.getElementById('checkout-item-count').textContent=`${count} ${count===1?'item':'items'} to review`;
    const {user,profile,address:savedAddress}=profileResult||{};
    const values={name:profile?.full_name,email:profile?.billing_email||user?.email,phone:profile?.phone,...(savedAddress||{})};
    for(const [name,value] of Object.entries(values)){const el=input(name);if(el && typeof value==='string')el.value=value;}
    document.getElementById('checkout-account').textContent=user?'Signed-in checkout':profileResult?'Guest checkout · no account required':'Enter your contact details below';
    if(user)document.querySelector('[data-account-label]').textContent='My account';
    state.hidden=true;form.hidden=false;fieldset.disabled=false;
    form.addEventListener('submit',submit);
    for(const name of ['address_line1','address_line2','suburb','city','province','postal_code'])input(name).addEventListener('input',resetDeliveryCopy);
    input('province').addEventListener('change',resetDeliveryCopy);
    window.addEventListener('storage',event=>{if(!event.key||event.key==='vt_store_quote_cart_v1')markCartChanged();});
    window.addEventListener('vt-store-cart-change',markCartChanged);
    markCartChanged();resetDeliveryCopy();
  }catch{showState('Checkout could not load.','Your cart has been kept. Reload or contact VoltTech for help.');}
}
async function submit(event){
  event.preventDefault();if(sending||received||cartStale||!form.reportValidity()||!canTransactHere())return;
  sending=true;button.disabled=true;button.textContent='CHECKING YOUR ORDER…';error.hidden=true;
  let dispatched=false,waitTimer;
  try {
    const settings=await readLaunchSettings(window.VOLTTECH_SUPABASE);
    if(settings?.catalogue_enabled!==true)throw new Error('Orders are not available right now. Your cart has been kept.');
    markCartChanged();if(cartStale)throw new Error('Your cart changed. Review it and reload checkout.');
    const products=await withTimeout(VT.getProductsByIds(cart.map(i=>i.productId)));
    if(!eligibleCart(VT,cart,products))throw new Error('A component or quantity is no longer available. Review your cart.');
    markCartChanged();if(cartStale)throw new Error('Your cart changed. Review it and reload checkout.');
    const payload={items:cart,customer:customer(),delivery:{method:'door',address:address()},customerNote:input('customerNote').value.trim(),shippingSelection:null,website:input('website').value};
    fieldset.disabled=true;button.textContent='SENDING YOUR ORDER…';dispatched=true;
    waitTimer=setTimeout(()=>showError('We are still waiting for confirmation. Please keep this page open and avoid placing the order again.'),20000);
    const result=await VT.submitCheckout(payload);
    clearTimeout(waitTimer);
    if(result?.ok!==true||typeof result.request?.request_number!=='string'||!result.request.request_number||result.request.request_number.length>80){const e=new Error('We could not confirm whether your order was received. Contact VoltTech before trying again.');e.uncertain=true;throw e;}
    received=true;
    if(cartFingerprint(VT.readCart())===fingerprint){try{VT.clearCart();}catch{/* Success must not be lost if browser storage becomes blocked. */}}
    const destination=statusDestination(result);
    const confirmation=document.getElementById('checkout-confirmation');
    confirmation.querySelector('[data-order-reference]').textContent=result.request.request_number;
    const link=confirmation.querySelector('[data-order-link]');link.hidden=!destination;if(destination)link.href=destination;
    form.hidden=true;error.hidden=true;confirmation.hidden=false;confirmation.focus();
  }catch(failure){
    clearTimeout(waitTimer);
    const uncertain=dispatched && failure.uncertain!==false && (!failure.status||failure.status>=500);
    showError(uncertain?'We could not confirm whether your order was received. Your cart is kept. Contact VoltTech before submitting again.':failure.message||'The order could not be submitted. Please check your details.');
    if(!uncertain){sending=false;fieldset.disabled=false;button.disabled=cartStale;button.textContent='PLACE ORDER REQUEST →';}
    else button.textContent='CONFIRMATION NEEDED';
  }
}
init();
