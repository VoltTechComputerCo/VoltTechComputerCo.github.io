import { enhanceNavigation } from './navigation.js';
import { enhanceDialogs } from './components/dialog.js';
import { enhanceSearch } from './components/search.js';

const CTA_BRANDS = [
  { selector: '#googleSignIn', asset: 'google-logo.svg', alt: 'Google' },
  { selector: '.button[data-email-auth]', asset: 'gmail-logo.svg', alt: 'Gmail' },
  { selector: 'a.button[href^="mailto:"], a.text-link[href^="mailto:"], [data-service-email], [data-stream-contact="email"], [data-scan-route="email"]', asset: 'gmail-logo.svg', alt: 'Gmail' },
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
    if (root instanceof Element && root.matches(selector)) ensureCtaBrandIcon(root, asset, alt);
    root.querySelectorAll?.(selector).forEach((element) => ensureCtaBrandIcon(element, asset, alt));
  });
}

enhanceNavigation();
enhanceDialogs();
enhanceSearch();
enhanceBrandedCtas();

const ctaObserver = new MutationObserver((records) => {
  records.forEach((record) => {
    if (record.type === 'attributes') {
      enhanceBrandedCtas(record.target);
      return;
    }
    record.addedNodes.forEach((node) => {
      if (node instanceof Element) enhanceBrandedCtas(node);
    });
  });
});
ctaObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['href'] });