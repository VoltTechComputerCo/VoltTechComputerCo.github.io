const triggers = document.querySelectorAll('[data-open]');
for (const trigger of triggers) {
  const dialog = document.getElementById(trigger.dataset.open);
  let opener;
  trigger.addEventListener('click', () => { opener = trigger; dialog.showModal(); trigger.setAttribute('aria-expanded', 'true'); document.documentElement.style.overflow = 'hidden'; });
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => { if (e.target === dialog) { const b = dialog.getBoundingClientRect(); if (e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom) dialog.close(); } });
  dialog.addEventListener('close', () => { trigger.setAttribute('aria-expanded', 'false'); document.documentElement.style.overflow = ''; opener?.focus(); });
  dialog.addEventListener('keydown', e => { if(e.key !== 'Tab') return; const items = [...dialog.querySelectorAll('a[href],button,input,select,textarea,[tabindex="0"]')].filter(x => !x.disabled && x.getClientRects().length); const first = items[0], last = items.at(-1); if(e.shiftKey && document.activeElement === first){e.preventDefault();last?.focus();} else if(!e.shiftKey && document.activeElement === last){e.preventDefault();first?.focus();} });
}
function cartCount(){let count=0;try{const rows=JSON.parse(localStorage.getItem('vt_store_quote_cart_v1') || '[]');if(Array.isArray(rows))count=rows.reduce((n,r)=>n+(typeof r?.productId==='string'&&Number.isInteger(r.quantity)&&r.quantity>0&&r.quantity<=25?r.quantity:0),0);}catch{}for(const link of document.querySelectorAll('[data-cart-link]')){link.setAttribute('aria-label',count?`Open cart, ${count} items`:'Open cart');const badge=link.querySelector('[data-cart-count]');badge.textContent=count>99?'99+':String(count);badge.hidden=!count;}}
cartCount();window.addEventListener('vt-store-cart-change',cartCount);window.addEventListener('storage',e=>{if(!e.key||e.key==='vt_store_quote_cart_v1')cartCount();});
