import { esc, commerceState, imageMarkup, bindImages } from '../components/catalogue-view.js';
import { withTimeout, publicProducts, notify } from './catalogue.js';
export function connectCatalogueCart(VT, products, preview) {
  const dialog = document.getElementById('catalogue-cart'), host = document.getElementById('cart-items'), checkout = document.getElementById('cart-checkout');
  const map = new Map(products.map(p => [p.id,p]));
  let version = 0, allowed = false;
  async function render() {
    const current = ++version, active = document.activeElement;
    const focusKey = active?.dataset.qty, focusLabel = active?.getAttribute('aria-label') || active?.textContent;
    allowed = false; checkout.hidden = true;
    const cart = VT.readCart();
    if (!cart.length) { host.innerHTML = '<p class="empty-state">Your cart is empty. Explore the catalogue to find your next component.</p>'; if (focusKey) dialog.querySelector('[data-dialog-close]').focus(); return; }
    const missing = cart.filter(i => !map.has(i.productId)).map(i => i.productId);
    if (missing.length) { try { publicProducts(await withTimeout(VT.getProductsByIds(missing)),preview).forEach(p => map.set(p.id,p)); } catch { /* Unknown rows remain visible and removable. */ } }
    if (current !== version) return;
    allowed = !preview && cart.every(i => map.has(i.productId) && commerceState(VT,map.get(i.productId),preview).canAdd);
    host.innerHTML = cart.map(i => { const p = map.get(i.productId); return `<article class="catalogue-cart-row">${p ? imageMarkup(p) : ''}<div><h3>${esc(p?.name || 'Component no longer available')}</h3><p>${esc(p ? commerceState(VT,p,preview).stock : 'Remove this item before continuing.')}</p><div class="cart-quantity"><button class="button button-secondary" data-qty="${esc(i.productId)}" data-value="${Number(i.quantity)-1}" aria-label="Decrease ${esc(p?.name || 'item')} quantity" type="button">−</button><span>${Number(i.quantity)}</span><button class="button button-secondary" data-qty="${esc(i.productId)}" data-value="${Number(i.quantity)+1}" aria-label="Increase ${esc(p?.name || 'item')} quantity" type="button" ${i.quantity >= 25 || !p ? 'disabled' : ''}>+</button><button class="button button-secondary" data-qty="${esc(i.productId)}" data-value="0" type="button">Remove</button></div></div></article>`; }).join('');
    if (!allowed) host.insertAdjacentHTML('beforeend','<p class="notice">Checkout is unavailable for preview or unavailable items. Remove unavailable items or ask VoltTech for help.</p>');
    checkout.hidden = !allowed; bindImages(host);
    if (focusKey) {
      const replacement = [...host.querySelectorAll('[data-qty]')].find(b => b.dataset.qty === focusKey && (b.getAttribute('aria-label') || b.textContent) === focusLabel);
      (replacement || dialog.querySelector('[data-dialog-close]')).focus();
    }
    host.querySelectorAll('[data-qty]').forEach(b => b.addEventListener('click', () => { try { VT.setCartQty(b.dataset.qty, Number(b.dataset.value)); } catch { notify('Your browser could not update the cart.'); } }));
  }
  async function open(event) { event?.preventDefault(); if (!dialog.open) dialog.showModal(); await render(); }
  document.querySelectorAll('[data-cart-link], [data-open-cart]').forEach(a => a.addEventListener('click', open));
  window.addEventListener('vt-store-cart-change', () => { if (dialog.open) render(); });
  window.addEventListener('storage', event => { if (dialog.open && (!event.key || event.key === 'vt_store_quote_cart_v1')) render(); });
  checkout.addEventListener('click', event => { if (!allowed) event.preventDefault(); else VT.analytics('begin_checkout', { items:VT.readCart().map(i => ({item_id:i.productId,quantity:i.quantity})) }); });
  if (new URLSearchParams(location.search).get('cart') === '1') open();
}
