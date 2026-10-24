const clean = value => String(value ?? '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, 300);
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function supplierStockEmail(payload) {
  const lines = payload?.lines;
  if (!Array.isArray(lines) || !lines.length || lines.length > 40) throw new Error('Invalid supplier enquiry lines');
  const items = lines.map(line => {
    const qty = Number(line.quantity), sku = clean(line.sku), name = clean(line.name);
    if (!Number.isInteger(qty) || qty < 1 || qty > 1000 || !sku || !name) throw new Error('Incomplete supplier enquiry line');
    return `• ${sku} | ${name} | Quantity: ${qty}`;
  });
  const reference = clean(payload.request_number);
  if (!/^VT-SR-[A-Z0-9-]+$/.test(reference)) throw new Error('Invalid parts request reference');
  const text = [
    `Hello ${clean(payload.supplier_name)} team,`,
    `Please confirm stock for VoltTech Computer Co.${payload.account_reference ? ' (account ' + clean(payload.account_reference) + ')' : ''}.`,
    `Our reference: ${reference}`,
    items.join('\n'),
    'Please confirm the available quantities, current VAT-inclusive unit prices, and collection/dispatch lead time. If possible, please place a temporary hold and reply with the reservation reference and expiry time.',
    'This is a stock enquiry and request for a temporary hold only. It is not a purchase order or authorisation to invoice or dispatch goods.',
    `Please keep ${reference} in the reply subject.`,
    'Thank you,\nVoltTech Computer Co.\ninfo@volttechcomputerco.co.za'
  ].join('\n\n');
  return {subject:`VoltTech stock confirmation / hold request — ${reference}`, text, body:esc(text).replaceAll('\n','<br>')};
}
