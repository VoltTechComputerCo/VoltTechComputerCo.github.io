import { getCommerceCore, withTimeout, publicProducts } from './catalogue.js';
import { readLaunchSettings, connectCart } from './home-integrations.js';
import { canTransactHere } from './site-config.js';
export { getCommerceCore, withTimeout, readLaunchSettings, canTransactHere };
export function checkoutCart(raw) {
  if (!Array.isArray(raw) || raw.length > 30) return null;
  const ids = new Set();
  if (raw.some(i => !i || typeof i.productId !== 'string' || !i.productId.trim() || i.productId.length > 120 || !Number.isInteger(i.quantity) || i.quantity < 1 || i.quantity > 25 || ids.has(i.productId) || !ids.add(i.productId))) return null;
  return raw.map(i => ({productId:i.productId,quantity:i.quantity}));
}
export function cartFingerprint(items) { return JSON.stringify([...(items || [])].map(i => [i.productId,i.quantity]).sort((a,b) => a[0].localeCompare(b[0]))); }
export function eligibleCart(VT, cart, products) {
  if (!cart?.length) return false;
  const map = new Map(publicProducts(products).map(p => [p.id,p]));
  return cart.every(i => { const p = map.get(i.productId); return p && VT.canAdd(p) && (p.stock_qty == null || Number(p.stock_qty) >= i.quantity); });
}
export async function checkoutAccess() {
  connectCart();
  const settings = await readLaunchSettings(window.VOLTTECH_SUPABASE);
  if (!settings) return {reason:'connection'};
  if (settings.catalogue_enabled !== true) return {reason:'closed'};
  if (!canTransactHere()) return {reason:'origin'};
  return {VT:await getCommerceCore(),settings};
}
export function validOrderAccess(params) {
  const ref=params.get('ref') || '', token=params.get('token') || '';
  return ref.length > 0 && ref.length <= 80 && /^[a-f0-9]{64}$/i.test(token) ? {ref,token} : null;
}
export function statusDestination(result) {
  try {
    const raw = result?.status_url || (result?.request?.request_number && result?.access_token ? `order-status.html?ref=${encodeURIComponent(result.request.request_number)}&token=${encodeURIComponent(result.access_token)}` : '');
    if (!raw) return '';
    const url=new URL(raw,location.href);
    return url.origin===location.origin && url.pathname==='/order-status.html' && !url.username && !url.password && validOrderAccess(url.searchParams) ? url.href : '';
  } catch { return ''; }
}
export function paymentDestination(raw) {
  try { const url=new URL(raw); return url.protocol==='https:' && url.hostname==='c.yoco.com' && !url.username && !url.password && (!url.port || url.port==='443') ? url.href : ''; } catch { return ''; }
}
export function shippingRate(result) {
  // Sandbox rates are never presented to customers as live delivery pricing.
  if (result?.configured !== true || result?.ready !== true || result?.environment !== 'production' || !Array.isArray(result.rates)) return null;
  return result.rates.filter(r => r && r.currency==='ZAR' && r.amount !== null && r.amount !== '' && Number.isFinite(Number(r.amount)) && Number(r.amount)>=0).sort((a,b) => Number(a.amount)-Number(b.amount))[0] || null;
}
export function canPay(order, settings) {
  return settings?.direct_payment_enabled === true && order?.can_pay === true && order.checkout_stage==='awaiting_payment' && !['paid','refunded','partially_refunded','cancelled'].includes(order.payment_status) && Number.isFinite(Number(order.total)) && Number(order.total)>0;
}
