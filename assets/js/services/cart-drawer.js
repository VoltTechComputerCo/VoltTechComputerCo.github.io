import { checkoutAccess } from './transactions.js?v=20261021.3';
import { connectCatalogueCart } from './catalogue-cart.js?v=20261112-cart-drawer';

const cartKey = 'vt_store_quote_cart_v1';
const root = new URL('../../../', import.meta.url);
const authKey = /^sb-[a-z0-9]+-auth-token$/;
const readCart = () => {
  try {
    const items = JSON.parse(localStorage.getItem(cartKey) || '[]');
    return Array.isArray(items) ? items.filter(item => typeof item?.productId === 'string' && item.quantity > 0) : [];
  } catch { return []; }
};
const signedIn = () => {
  try {
    return Object.keys(localStorage).filter(key => authKey.test(key)).some(key => {
      const session = JSON.parse(localStorage.getItem(key));
      return session?.user?.id && session?.expires_at * 1000 > Date.now();
    });
  } catch { return false; }
};

export function mountCartDrawer() {
  if (!document.querySelector('[data-cart-link]') || document.body.dataset.page?.startsWith('admin')) return;
  let previous = readCart();
  let handle, panel, host, checkout, controller, loading;
  let styled = false;
  function loadStyle() {
    if (styled) return;
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = new URL('../../css/cart-drawer.css?v=20261112', import.meta.url).href;
    document.head.append(style);
    styled = true;
  }
  function renderHandle(items) {
    const count = items.reduce((sum, item) => sum + Number(item.quantity), 0);
    if (!count && !signedIn()) {
      if (handle) handle.hidden = true;
      return;
    }
    if (!handle) {
      loadStyle();
      handle = document.createElement('button');
      handle.type = 'button';
      handle.className = 'vt-cart-handle';
      handle.setAttribute('aria-haspopup', 'dialog');
      handle.setAttribute('aria-controls', 'vt-cart-drawer');
      handle.addEventListener('click', open);
      document.body.append(handle);
    }
    handle.hidden = false;
    handle.textContent = count ? 'Cart · ' + (count > 99 ? '99+' : count) : 'Cart';
    handle.setAttribute('aria-label', count ? 'Open side cart, ' + count + (count === 1 ? ' item' : ' items') : 'Open side cart');
  }
  function createPanel() {
    loadStyle();
    panel = document.createElement('dialog');
    panel.id = 'vt-cart-drawer';
    panel.className = 'vt-cart-drawer';
    panel.setAttribute('aria-labelledby', 'vt-cart-drawer-title');
    panel.innerHTML = '<header><h2 id="vt-cart-drawer-title">Your cart</h2><button type="button" class="vt-cart-close" data-dialog-close aria-label="Close side cart">×</button></header><div data-vt-cart-items></div><footer><a class="vt-cart-checkout" hidden>Continue to checkout →</a></footer>';
    host = panel.querySelector('[data-vt-cart-items]');
    checkout = panel.querySelector('.vt-cart-checkout');
    checkout.href = new URL('checkout.html', root).href;
    panel.querySelector('button').addEventListener('click', () => panel.close());
    panel.addEventListener('click', event => { if (event.target === panel) panel.close(); });
    document.body.append(panel);
  }
  async function open() {
    if (document.getElementById('catalogue-cart')?.open) return;
    if (!panel) createPanel();
    if (controller) { controller.open(); return; }
    if (!panel.open) panel.showModal();
    if (loading) return;
    if (!readCart().length) {
      host.textContent = 'Your cart is empty.';
      return;
    }
    host.textContent = 'Checking your cart…';
    loading = true;
    try {
      const { VT } = await checkoutAccess();
      if (!VT) throw Error('Cart unavailable');
      controller = connectCatalogueCart(VT, [], false, {
        allowEnquiryFallback: false,
        elements: {dialog: panel, host, checkout},
        bindLinks: false
      });
      if (panel.open) await controller.open();
    } catch {
      host.textContent = 'Your cart is saved. Close and reopen the cart to try again.';
    } finally {
      loading = false;
    }
  }

  renderHandle(previous);
  window.addEventListener('vt-store-cart-change', () => {
    const next = readCart();
    const previousQuantities = new Map(previous.map(item => [item.productId, item.quantity]));
    const added = next.some(item => item.quantity > (previousQuantities.get(item.productId) || 0));
    previous = next;
    renderHandle(next);
    if (added && !panel?.open) open();
  });
  window.addEventListener('storage', event => {
    if (!event.key || event.key === cartKey || authKey.test(event.key)) {
      previous = readCart();
      renderHandle(previous);
    }
  });
}
