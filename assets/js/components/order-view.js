import { esc } from './catalogue-view.js';
export function money(value, fallback='To be confirmed') {
  return value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value)) && Number(value)>=0 ? new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR',minimumFractionDigits:2}).format(Number(value)) : fallback;
}
export function stageInfo(order) {
  if (order.checkout_stage==='cancelled' || order.payment_status==='cancelled') return {title:'Order cancelled',copy:'Contact VoltTech if you need help with this order.',tone:'warning'};
  if (['refunded','partially_refunded'].includes(order.payment_status)) return {title:order.payment_status==='refunded'?'Payment refunded':'Partial refund recorded',copy:'Contact VoltTech for the details of this update.',tone:'warning'};
  if (order.delivery_status==='delivered') return {title:'Delivered',copy:'The order record shows delivery completed.',tone:'success'};
  if (order.delivery_status==='in_transit') return {title:'On the way',copy:'The courier status shows your parcel in transit.',tone:'success'};
  if (order.delivery_status==='booked') return {title:'Courier booked',copy:'A courier booking has been recorded. Check tracking for collection and delivery updates.',tone:'success'};
  if (order.payment_status==='paid') return {title:'Payment received',copy:'Payment is confirmed and your reserved stock is moving to courier fulfilment.',tone:'success'};
  if (order.checkout_stage==='awaiting_approval') return {title:order.workflow?.approval==='accepted'?'Quote accepted — awaiting payment release':'Your confirmed quote is ready',copy:'Review the final items and delivery charge. VoltTech releases payment after your approval.',tone:'normal'};
  if (order.checkout_stage==='quote_ready') return {title:'Stock confirmed — quote being prepared',copy:'Your final quote will be sent for approval before payment.',tone:'normal'};
  if (order.checkout_stage==='awaiting_payment') return {title:'Stock reserved — ready for payment',copy:'Sellable stock, the final order amount and delivery have been confirmed. Payment availability is checked separately.',tone:'normal'};
  if (order.checkout_stage==='pending_stock_confirmation' || order.checkout_stage==='submitted') return {title:'Order received',copy:'VoltTech is reserving supplier stock and confirming final pricing and courier delivery before payment.',tone:'normal'};
  return {title:'Order update',copy:'Your latest recorded order details are below. Contact VoltTech if you need clarification.',tone:'normal'};
}
export function timeline(order) {
  const paymentRecorded=['paid','refunded','partially_refunded'].includes(order.payment_status);
  const stages=[['Order received',!!order.submitted_at],['Stock reserved',!!order.confirmed_at],['Quote confirmed',!!order.workflow?.pricing_confirmed_at],['Quote accepted',order.workflow?.approval==='accepted'],['Payment received',paymentRecorded],['Preparing order',!!order.workflow?.supplier_order_at],['Courier booked',['booked','in_transit','delivered'].includes(order.delivery_status)],['In transit',!!order.workflow?.collected_at||['in_transit','delivered'].includes(order.delivery_status)],['Delivered',order.delivery_status==='delivered']];
  return stages.map(([label,done],i) => `<li class="${done?'is-complete':''}"><span aria-hidden="true">${done?'✓':String(i+1).padStart(2,'0')}</span><div><strong>${label}</strong><small>${done?'Recorded':'Awaiting update'}</small></div></li>`).join('');
}
export function orderItems(items) {
  if (!Array.isArray(items) || !items.length) return '<p class="muted">Item details are not available in this update.</p>';
  return items.map(i => `<div class="order-line"><div><strong>${esc(i.product_name || 'Component')}</strong><span>${esc(i.brand || '')} · ${money(i.displayed_price)} each</span></div><span class="micro">QTY ${esc(i.quantity)}</span></div>`).join('');
}
export function trackingLink(value) {
  try { if(!value)return ''; const u=new URL(value); return u.protocol==='https:' && !u.username && !u.password ? u.href : ''; } catch { return ''; }
}
