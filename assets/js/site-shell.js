import { connectCart, connectAccount } from './services/home-integrations.js?v=20261107-static1';
import { isProduction, publicCatalogueOnly } from './services/site-config.js?v=20261107-static1';
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

function prepareIndependentQuoteNavigation(){
  // Do not present a dead checkout/cart route while the commerce API is 402.
  if (!publicCatalogueOnly || !isProduction() ||
      !['/', '/index.html', '/store.html', '/product.html'].includes(location.pathname)) return;
  const wa='https://wa.me/27618435775?text='+encodeURIComponent(
    'Hi VoltTech, I would like a quotation for PC components. Please confirm price, stock and delivery.');
  for (const link of document.querySelectorAll('a[data-cart-link]')){
    link.href=wa;
    link.removeAttribute('data-cart-link');
    link.setAttribute('aria-label','Request a VoltTech quotation on WhatsApp');
    const heading=link.querySelector('b');
    if(heading)heading.textContent='Get a quote';
    const caption=link.querySelector('small');
    if(caption)caption.textContent='ENQUIRE';
    const detail=link.querySelector('em');
    if(detail)detail.textContent='Confirm stock and price';
    const badge=link.querySelector('[data-cart-count]');
    if(badge)badge.hidden=true;
  }
  document.querySelectorAll('[data-open-cart]').forEach(button=>{button.hidden=true;});
}

function addServiceNavigation() {
  const tools = document.querySelector('main .vt-tool-switcher');
  if (!tools || document.querySelector('main .service-network')) return;
  const routes = [
    ['Repair', 'pc-repair-pretoria.html'], ['Performance', 'pc-performance-optimisation.html'],
    ['Upgrades', 'pc-upgrades-pretoria.html'], ['Security', 'virus-malware-removal-pretoria.html'],
    ['Windows', 'windows-installation-pretoria.html'], ['Streaming', 'streaming-setup-south-africa.html']
  ];
  const nav = document.createElement('nav');
  nav.className = 'service-network tool-service-network';
  nav.setAttribute('aria-label', 'VoltTech PC services');
  for (const [label, path] of routes) {
    const link = document.createElement('a');
    link.href = new URL('../../' + path, import.meta.url).href;
    link.textContent = label;
    nav.append(link);
  }
  tools.before(nav);
}

addServiceNavigation();

enhanceNavigation();
enhanceDialogs();
enhanceSearch();
prepareIndependentQuoteNavigation();
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
connectAccount(window.VOLTTECH_SUPABASE);
if (['home', 'store'].includes(document.body.dataset.page)) {
  import('./retail-rails.js?v=20261108.1').then(({ mountRetailRails }) => mountRetailRails()).catch(() => {});
}
