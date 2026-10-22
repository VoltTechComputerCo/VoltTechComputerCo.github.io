// Bank details verified against Capitec Account Confirmation Letter, 1 October 2026.
export const CARD_PAYMENTS_AVAILABLE = false;
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function eftEligible(order) {
  return order?.checkout_stage === 'awaiting_payment' && order.workflow?.approval === 'accepted' && order.can_pay === true && !['paid','refunded','partially_refunded','cancelled'].includes(order.payment_status) && Number.isFinite(Number(order.total)) && Number(order.total)>0;
}
export function eftText(reference,total) {
  return ['VOLTTECH EFT PAYMENT DETAILS','Account holder: VOLTTECH COMPUTER CO (PTY)LTD','Bank: Capitec Business','Account type: Capitec Business Account','Account number: 1055896791','Branch code: 450105','Amount: '+new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR'}).format(Number(total)),'Payment reference: '+reference,'Proof of payment: info@volttechcomputerco.co.za'].join('\n');
}
export function mountEft(container, reference, total) {
  container.replaceChildren();
  const section=document.createElement('section');section.className='transaction-panel';section.id='eft-payment';
  section.innerHTML='<p class="eyebrow">BANK TRANSFER / EFT</p><h2>Pay by EFT</h2><p>Card payments are temporarily unavailable while approval is pending. Pay the full confirmed total by EFT. No additional discount applies.</p><pre style="white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;line-height:1.7">'+escape(eftText(reference,total))+'</pre><button class="button button-secondary" type="button">Copy bank details</button><p><a class="text-link" href="mailto:info@volttechcomputerco.co.za?subject='+encodeURIComponent('Proof of payment — '+reference)+'">Email proof of payment →</a></p><p class="micro">Use your order or invoice reference exactly as shown. Payment remains awaiting confirmation until VoltTech verifies receipt in our bank account. Sending proof of payment does not mark the order as paid.</p><p role="status"></p>';
  section.querySelector('button').onclick=async()=>{try{await navigator.clipboard.writeText(eftText(reference,total));section.querySelector('[role=status]').textContent='Bank details copied.';}catch{section.querySelector('[role=status]').textContent='Please select and copy the bank details above.';}};
  container.append(section);
}
