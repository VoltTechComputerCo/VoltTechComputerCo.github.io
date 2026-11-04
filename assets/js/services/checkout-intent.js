// An order request uses one cryptographically random secret per cart intent.
// Retain it across a page reload so a lost HTTP response cannot make a second order.
// This is a bearer secret: sessionStorage avoids persisting it across browser sessions.
export const CHECKOUT_INTENT_KEY='vt_checkout_intent_v1';
const INTENT_MAX_AGE_MS=48*60*60*1000;
const tokenPattern=/^[a-f0-9]{64}$/;
export function checkoutIntentToken(cartFingerprint,storage=globalThis.sessionStorage,now=Date.now(),random=globalThis.crypto){
 if(typeof cartFingerprint!=='string'||!cartFingerprint)throw new Error('A valid cart is required to submit an order.');
 let existing=null;
 try{existing=JSON.parse(storage?.getItem(CHECKOUT_INTENT_KEY)||'null');}catch{/* Storage may be unavailable */}
 if(existing?.cartFingerprint===cartFingerprint&&tokenPattern.test(existing?.token||'')&&
    Number.isFinite(existing.createdAt)&&now>=existing.createdAt&&now-existing.createdAt<INTENT_MAX_AGE_MS)
  return existing.token;
 if(typeof random?.getRandomValues!=='function')throw new Error('Secure checkout is not supported by this browser.');
 const bytes=new Uint8Array(32);random.getRandomValues(bytes);
 const token=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
 try{storage?.setItem(CHECKOUT_INTENT_KEY,JSON.stringify({cartFingerprint,token,createdAt:now}));}catch{/* In-memory duplicate guard remains in checkout page */}
 return token;
}
export function clearCheckoutIntent(storage=globalThis.sessionStorage){
 try{storage?.removeItem(CHECKOUT_INTENT_KEY);}catch{/* Browser storage is optional */}
}
