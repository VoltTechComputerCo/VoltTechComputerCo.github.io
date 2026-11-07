import { STATIC_ENQUIRY_MODE } from './services/storefront-mode.js?v=20261107-independent1';
import { connectCart, connectAccount } from './services/home-integrations.js?v=20261021.3';
import { enhanceNavigation } from './navigation.js?v=20261021.3';
import { enhanceDialogs } from './components/dialog.js?v=20261021.3';
import { enhanceSearch } from './components/search.js?v=20261021.3';

const CTA_BRANDS = [
  { selector: '#googleSignIn', asset: 'google-logo.svg', alt: 'Google' },
  { selector: '.button[data-email-auth]', asset: 'email-icon.svg', alt: 'Email' },
  { selector: 'a.button[href^="mailto:"], a.text-link[href^="mailto:"], [data-service-email], [data-stream-contact="email"], [data-scan-route="email"]', asset: 'email-icon.svg', alt: 'Email' },
  { selector: 'a.button[href*="wa.me/"], a.text-link[href*="wa.me/"], [data-service-whatsapp], [data-stream-contact="whatsapp"], [data-scan-route="whatsapp"]', asset: 'whatsapp-logo.svg', alt: 'WhatsApp' }
];

function ensureCtaBrandIcon(element, asset, alt) {
  if (!element || element.querySelector(':scope > .cta-brand-icon')) return;
  const icon = document.createElement('img');
  icon.className = 'cta-brand-icon';
  icon.src = new URL('../../' + asset, import.meta.url).href;
  icon.alt = '';
  icon.setAttribute('aria-hidden', 'true');
  icon.width = 20;
  icon.height = 20;
  element.prepend(icon);
  if (!element.getAttribute('aria-label') && element.textContent.trim()) {
    element.setAttribute('aria-label', element.textContent.trim() + ' (' + alt + ')');
  }
}

function enhanceBrandedCtas(root = document) {
  CTA_BRANDS.forEach(({ selector, asset, alt }) => {
    root.querySelectorAll(selector).forEach((element) => ensureCtaBrandIcon(element, asset, alt));
  });
}

enhanceNavigation();
enhanceDialogs();
enhanceSearch();
enhanceBrandedCtas();

const ctaObserver = new MutationObserver((records) => {
  for (const record of records) {
    if (record.type === 'attributes' || record.addedNodes.length) {
      enhanceBrandedCtas();
      break;
    }
  }
});
ctaObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['href'] });

connectCart();
// Login cannot work on restricted Supabase. Avoid even refreshing an old auth
// session during public browsing; account/admin pages retain their own flow.
const publicPage=new Set(['','index.html','store.html','product.html']).has(location.pathname.split('/').pop());
if(STATIC_ENQUIRY_MODE&&publicPage){
  // An existing cart cannot be checked out while the transactional backend is
  // restricted. Keep its local data intact but avoid a misleading active cart.
  document.querySelectorAll('[data-cart-link]').forEach(link=>{link.hidden=true;});
}else connectAccount(window.VOLTTECH_SUPABASE);
