import { readPublicCatalogue } from './services/public-catalogue.js?v=20261102-gpu3';
import { bindImages, esc, imageMarkup, productUrl } from './components/catalogue-view.js?v=20261103-slugs1';

const supplierArt = 'https://www.syntech.co.za/wp-content/uploads/';
const brands = [
  ['ASUS', '2025/06/Asus_500x500px-01.jpg'],
  ['Gigabyte', 'https://api.esquire.co.za/Resources/Images/PageImage/gigabyte-logo.png'],
  ['Thermal Grizzly', 'https://www.thermal-grizzly.com/media/81/7a/d0/1700224744/ThermalGrizzly_Logo_Orange_EN.png'],
  ['Redragon', '2017/04/2021-Logo_Redragon_wr.png'],
  ['MSI', '2020/01/MSI-logo-01.png'],
  ['ARCTIC', 'https://lunatechit.co.za/wp-content/uploads/2019/10/arctic_logo-scaled.png'],
  ['AMD', '2020/08/2021-Logo_AMD_wr.png'],
  ['Intel', '2020/04/Intel-Logo-01.jpg'],
  ['ASRock', '2021/11/Asrock_Logo.png'],
  ['Corsair', '2026/10/CORSAIR_BRAND_LAUNCH_Brand_Logo_800x800.png'],
  ['Antec', '2017/04/2021-Logo_Antec_wr.png'],
  ['DeepCool', '2025/12/DeepCool-logo-01.jpg'],
  ['FSP', '2017/04/2021-Logo_FSP_wr.png'],
  ['Patriot', '2017/04/2021-Logo_Patriot_wr.png'],
  ['Crucial', '2020/05/Crucial_Updated_Logo-400x400.jpg'],
  ['GeIL', '2022/12/GeIL_LOGO_500.png'],
  ['Hiksemi', '2024/10/HIKSEMI-01.jpg'],
  ['Micron', '2020/05/Micron_Logo_Updated.jpg'],
  ['Keychron', '2021/02/Keychron_Brand-Update-01-400x400.jpg'],
  ['PCBuilder', '2022/06/PCB_logo_500x500-400x400.png'],
  ['PXN', '2025/05/PXN_500x500px.jpg'],
  ['Logitech', 'https://api.esquire.co.za/Resources/Images/PageImage/logitech-v2.png'],
  ['Seagate', 'https://api.esquire.co.za/Resources/Images/PageImage/seagate-v1.png'],
  ['Samsung', 'https://api.esquire.co.za/Resources/Images/PageImage/samsung-v1.png'],
  ['ViewSonic', 'https://api.esquire.co.za/Resources/Images/PageImage/viewsonic-v1.png'],
  ['Western Digital', 'https://api.esquire.co.za/Resources/Images/PageImage/western-digital-v1.png'],
  ['Toshiba', 'https://api.esquire.co.za/Resources/Images/PageImage/toshiba-v1.png'],
  ['Dato', 'https://api.esquire.co.za/Resources/Images/PageImage/dato-logo-e1.png'],
  ['Acer', 'https://api.esquire.co.za/Resources/Images/PageImage/acer-v1.png'],
  ['ASUSTOR', 'https://api.esquire.co.za/Resources/Images/PageImage/Asustor-v1.png'],
  ['Trust', 'https://api.esquire.co.za/Resources/Images/PageImage/Trust-v2.png'],
  ['Kingston', 'https://www.tarsus.co.za/wp-content/uploads/Kingston-Logo-640x131.webp'],
  ['Apacer', 'https://api.esquire.co.za/Resources/Images/PageImage/apacer-v1.png'],
  ['Kioxia', 'https://europe.kioxia.com/content/dam/kioxia/en-europe/about/news/2019/img/KIOXIA-branding.png']
];
const themes = [
  ['Graphics cards', 'gpu', 'Give your games more room to run.'],
  ['Processors', 'cpu', 'Find the next chip for your build.'],
  ['Storage', 'storage', 'Make room for games, projects and everything else.'],
  ['Cooling', 'cooler', 'Keep your build cool under load.'],
  ['Memory', 'memory', 'More room for games and multitasking.'],
  ['Keyboards', 'keyboards', 'Find a board that feels right at your desk.'],
  ['Motherboards', 'motherboard', 'Start with the right platform for your next PC.'],
  ['Power supplies', 'psu', 'Build around dependable power.']
];
const featuredCategories = new Set(themes.map(([, category]) => category).concat('fans', 'mice', 'headsets', 'thermal-paste', 'case', 'monitors'));
const normalize = value => String(value || '').trim().toLowerCase();
const siteUrl = path => new URL('../../' + path, import.meta.url);
const logoUrl = path => path.startsWith('https:') ? path : supplierArt + path;
const storeLink = (key, value) => {
  const url = siteUrl('store.html#catalogue');
  url.searchParams.set(key, value);
  return url.href;
};

function glideBrands(track, canAdvance) {
  const originals = [...track.children];
  for (const anchor of originals) {
    const copy = anchor.cloneNode(true);
    copy.tabIndex = -1;
    copy.setAttribute('aria-hidden', 'true');
    track.append(copy);
  }
  let lap = 0;
  const measure = () => {
    const copy = track.querySelector('[aria-hidden="true"]');
    const first = track.firstElementChild;
    lap = copy && first ? copy.offsetLeft - first.offsetLeft : 0;
  };
  new ResizeObserver(measure).observe(track);
  new MutationObserver(measure).observe(track, { childList:true });
  let pointer;
  let suppressClick = false;
  let resumeAt = 0;
  let previous = 0;
  let position = 0;
  function frame(now) {
    const delta = Math.min(now - previous, 50);
    previous = now;
    if (canAdvance() && !pointer && now >= resumeAt && lap > track.clientWidth) {
      if (Math.abs(position - track.scrollLeft) > 2) position = track.scrollLeft;
      position = (position + delta * .036) % lap;
      track.scrollLeft = position;
    } else position = track.scrollLeft;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  track.addEventListener('wheel', event => {
    if (event.ctrlKey || track.scrollWidth <= track.clientWidth) return;
    event.preventDefault();
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    const pixels = delta * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? track.clientWidth : 1);
    const next = track.scrollLeft + pixels;
    track.scrollLeft = lap > track.clientWidth ? ((next % lap) + lap) % lap : next;
    resumeAt = performance.now() + 700;
  }, { passive:false });
  track.addEventListener('dragstart', event => event.preventDefault());
  track.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    suppressClick = false;
    pointer = { id:event.pointerId, type:event.pointerType, x:event.clientX, start:track.scrollLeft, dragging:false };
  });
  track.addEventListener('pointermove', event => {
    if (!pointer || pointer.id !== event.pointerId || pointer.type !== 'mouse') return;
    const delta = event.clientX - pointer.x;
    if (!pointer.dragging && Math.abs(delta) < 5) return;
    if (!pointer.dragging) {
      pointer.dragging = true;
      track.setPointerCapture(event.pointerId);
      track.classList.add('is-dragging');
    }
    track.scrollLeft = pointer.start - delta;
  });
  function finish(event) {
    if (pointer?.id !== event.pointerId) return;
    suppressClick = pointer.dragging;
    pointer = null;
    resumeAt = performance.now() + 1000;
    track.classList.remove('is-dragging');
  }
  window.addEventListener('pointerup', finish);
  track.addEventListener('pointercancel', finish);
  track.addEventListener('click', event => {
    if (!suppressClick || event.detail === 0) return;
    suppressClick = false;
    event.preventDefault();
    event.stopPropagation();
  }, true);
}

function rail(title, kicker, cards, variant) {
  const region = document.createElement('section');
  region.className = 'retail-rail retail-rail-' + variant;
  region.setAttribute('aria-label', title);
  region.innerHTML = `<div class="rail-heading"><div><p class="eyebrow">${esc(kicker)}</p><h2>${esc(title)}</h2></div><div class="rail-controls"><button type="button" data-prev aria-label="Previous ${esc(title)}">←</button><button type="button" data-next aria-label="Next ${esc(title)}">→</button><button type="button" data-pause aria-label="Pause ${esc(title)}">Pause</button></div></div><div class="rail-track">${cards.join('')}</div>`;
  const track = region.querySelector('.rail-track');
  const pause = region.querySelector('[data-pause]');
  let paused = false;
  let onScreen = false;
  function updatePause() {
    const label = paused ? 'Play' : 'Pause';
    pause.textContent = label;
    pause.setAttribute('aria-label', label + ' ' + title);
  }
  function step(direction) {
    const first = track.firstElementChild;
    if (!first || track.scrollWidth <= track.clientWidth + 2) return;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const end = track.scrollWidth - track.clientWidth;
    const position = direction > 0 && track.scrollLeft >= end - 2 ? 0
      : direction < 0 && track.scrollLeft <= 2 ? end
      : track.scrollLeft + direction * (first.getBoundingClientRect().width + gap);
    track.scrollTo({ left: position, behavior: 'smooth' });
  }
  region.querySelector('[data-prev]').addEventListener('click', () => step(-1));
  region.querySelector('[data-next]').addEventListener('click', () => step(1));
  pause.addEventListener('click', () => { paused = !paused; updatePause(); });
  updatePause();
  const observer = new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; });
  observer.observe(region);
  const canAdvance = () => onScreen && !document.hidden && !paused && !region.matches(':hover, :focus-within');
  if (variant === 'brands') {
    region.querySelector('[data-prev]').hidden = true;
    region.querySelector('[data-next]').hidden = true;
    glideBrands(track, canAdvance);
  } else {
    window.setInterval(() => { if (canAdvance()) step(1); }, 4600);
  }
  return region;
}

function showBrands(header, products) {
  const stocked = new Set(products.map(product => normalize(product.brand)));
  const cards = brands.filter(([name]) => stocked.has(normalize(name))).map(([name, src]) =>
    `<a class="rail-brand" href="${esc(storeLink('brand', name))}" title="Shop ${esc(name)}"><img src="${esc(logoUrl(src))}" alt="${esc(name)}" width="148" height="62" decoding="async" referrerpolicy="no-referrer"></a>`);
  if (!cards.length) return;
  const region = rail('Shop by brand', 'PC HARDWARE & GEAR', cards, 'brands');
  region.classList.add('container');
  for (const logo of region.querySelectorAll('img')) logo.addEventListener('error', () => logo.closest('a').remove(), { once: true });
  header.after(region);
}

function productPicks(products, rotation) {
  const order = (a, b) => String(a.id).localeCompare(String(b.id), 'en');
  const eligible = products.filter(p => p.stock_qty > 0 && !p.media_review_required && (p.primary_image || p.direct_image) && featuredCategories.has(p.category_slug || p.type));
  return themes.map(([, category], index) => {
    const group = eligible.filter(p => (p.category_slug || p.type) === category).sort(order);
    return group.length ? group[(rotation + index * 7) % group.length] : null;
  }).filter(Boolean);
}


const christmasKits = [
  ['Desk Refresh', 'A mechanical keyboard, wireless gaming mouse and extra-large desk mat.', ['syntech-00b4b8251587347e', 'syntech-64a68bf1a9adf4aa', 'syntech-448febf6bd4459e2']],
  ['Stream Starter', 'A USB microphone and Full HD webcam for your first stream.', ['syntech-b1990d0606ff693f', 'syntech-db2d5bd00fe74e5b']],
  ['Cooling Refresh', 'Three 120 mm ARGB case fans and thermal paste for a cooler refresh. Check your case and headers for fit.', ['syntech-3fa91f64815d00b9', 'lunatech-actcp00002b']]
];

function showChristmasKits(shelf, products) {
  const byId = new Map(products.map(product => [product.id, product]));
  const kits = christmasKits.map(([name, description, ids]) => ({name, description, ids, items:ids.map(id => byId.get(id))}))
    .filter(kit => kit.items.every(product => product && (product.primary_image || product.direct_image)));
  if (!kits.length) return;
  const section = document.createElement('section');
  section.className = 'container christmas-kits';
  section.setAttribute('aria-labelledby', 'season-title');
  section.innerHTML = '<div class="rail-heading"><div><p class="eyebrow">CHRISTMAS AT VOLTTECH</p><h2 id="season-title">Christmas hardware bundles</h2></div></div>' +
    '<p>Pick a kit and add every item to your cart together. We confirm stock and delivery before payment.</p>' +
    '<div class="christmas-kit-grid">' + kits.map(({name, description, items}, index) =>
      '<article class="christmas-kit"><div class="christmas-kit-images">' + items.map(product =>
        '<a href="' + esc(productUrl(product, false)) + '" title="' + esc(product.name) + '">' + imageMarkup(product) + '</a>').join('') +
      '</div><div class="christmas-kit-copy"><h3>' + esc(name) + '</h3><p>' + esc(description) + '</p><ul>' +
      items.map(product => '<li>' + esc(product.name) + '</li>').join('') +
      '</ul><button class="button" type="button" data-add-kit="' + index + '" aria-label="Add ' + esc(name) + ' bundle to cart">Add bundle to cart</button></div></article>').join('') +
    '</div><p class="christmas-kit-status" role="status"></p><div class="actions" data-kit-cart hidden><a class="button button-secondary" href="' +
    siteUrl('store.html?cart=1') + '">View cart</a><a class="button" href="' + siteUrl('checkout.html') + '">Go to checkout →</a></div>';
  const status = section.querySelector('[role="status"]');
  const actions = section.querySelector('[data-kit-cart]');
  const buttons = [...section.querySelectorAll('[data-add-kit]')];
  const key = 'vt_store_quote_cart_v1';
  const updateCartLinks = () => {
    try { actions.hidden = !JSON.parse(localStorage.getItem(key) || '[]').length; }
    catch { actions.hidden = true; }
  };
  updateCartLinks();
  window.addEventListener('vt-store-cart-change', updateCartLinks);
  window.addEventListener('storage', updateCartLinks);
  for (const button of buttons) button.addEventListener('click', async () => {
    const kit = kits[Number(button.dataset.addKit)];
    buttons.forEach(item => { item.disabled = true; });
    status.textContent = 'Checking ' + kit.name + '…';
    try {
      // Explicit cart actions can use live checkout while catalogue browsing stays static.
      const { checkoutAccess, checkoutCart, eligibleCart, withTimeout } = await import('./services/transactions.js?v=20261021.3');
      const { VT } = await checkoutAccess();
      if (!VT) { status.textContent = 'Online checkout is currently unavailable. Please try again later.'; return; }
      const fresh = await withTimeout(VT.getProductsByIds(kit.ids), 5000);
      // Read the cart after the network request and commit the complete bundle in one write.
      const cart = checkoutCart(VT.readCart());
      const quantities = new Map((cart || []).map(item => [item.productId, item.quantity]));
      for (const id of kit.ids) quantities.set(id, (quantities.get(id) || 0) + 1);
      const next = [...quantities].map(([productId, quantity]) => ({productId, quantity}));
      if (!cart || !checkoutCart(next)) { status.textContent = 'Your cart is at its limit. Review the items in your cart before adding this bundle.'; return; }
      const bundleQuantities = next.filter(item => kit.ids.includes(item.productId));
      const staleSupplierStock = bundleQuantities.some(({productId, quantity}) => {
        if (!productId.startsWith('lunatech-')) return false;
        const product = byId.get(productId);
        const age = Date.now() - Date.parse(product.supplier_stock_checked_at || '');
        return !(age >= 0 && age < 10 * 3600000 && product.stock_qty >= quantity);
      });
      if (staleSupplierStock || !eligibleCart(VT, bundleQuantities, fresh) || fresh.some(product => product.stock_qty == null || !(Number(product.retail_price) > 0) || product.currency !== 'ZAR')) {
        status.textContent = 'This bundle is currently unavailable in the requested quantity.';
        return;
      }
      VT.saveCart(next);
      status.textContent = kit.name + ' added to your cart.';
    } catch {
      status.textContent = 'We couldn’t check the bundle right now. Please try again.';
    } finally {
      buttons.forEach(item => { item.disabled = false; });
    }
  });
  shelf.after(section);
  bindImages(section);
}

function showShowcase(hero, products, generatedAt) {
  // South African shoppers see the same selection for each two-day window.
  const rotation = Math.floor((Date.now() + 2 * 3600000) / (2 * 86400000));
  const shelf = document.createElement('div');
  shelf.className = 'container home-retail-shelves';
  shelf.id = 'volttech-picks';
  const picks = productPicks(products, rotation).map(p =>
    `<a class="rail-product" href="${esc(productUrl(p, false))}">${imageMarkup(p)}<span class="rail-product-copy"><small>${esc(p.brand)}</small><strong>${esc(p.name)}</strong><span>View product ↗</span></span></a>`);
  if (picks.length) {
    const selection = document.createElement('section');
    selection.className = 'retail-rail retail-rail-products';
    selection.setAttribute('aria-labelledby', 'hardware-spotlight');
    selection.innerHTML = `<div class="rail-heading"><div><p class="eyebrow">VOLTTECH PICKS</p><h2 id="hardware-spotlight">Hardware spotlight</h2></div><a class="spotlight-shop" href="${siteUrl('store.html#catalogue')}">Shop all gear ↗</a></div><div class="spotlight-grid">${picks.join('')}</div>`;
    shelf.append(selection);
    bindImages(selection);
  }
  const campaigns = themes.map((_, index) => themes[(rotation + index) % themes.length]);
  const offers = campaigns.slice(0, 4).map(([label, category, text]) =>
    `<a class="rail-campaign" href="${esc(storeLink('category', category))}"><strong>${esc(label)} ↗</strong><span>${esc(text)}</span></a>`);
  const now = Date.now();
  const snapshotAge = now - Date.parse(generatedAt || '');
  const specials = snapshotAge >= 0 && snapshotAge < 10 * 3600000 ? products.filter(p => {
    const priceAge = now - Date.parse(p.price_checked_at || '');
    return p.compare_at_verified === true && p.stock_qty > 0 && p.retail_price > 0 &&
      Number(p.compare_at_price) > Number(p.retail_price) && priceAge >= 0 && priceAge < 24 * 3600000 &&
      (!p.deal_ends_at || Date.parse(p.deal_ends_at) > now);
  }) : [];
  const special = specials.length ? specials[rotation % specials.length] : null;
  if (special) offers.unshift(`<a class="rail-campaign rail-season" href="${esc(productUrl(special, false))}"><strong>Current special ↗</strong><span>${esc(special.name)} · Enquire for a quote</span></a>`);
  const side = document.createElement('div');
  side.className = 'retail-side';
  side.append(rail('Upgrade ideas', 'FIND YOUR NEXT UPGRADE', offers, 'campaigns'));
  side.insertAdjacentHTML('beforeend', `<div class="retail-shortcuts"><a href="${siteUrl('creator-hub-south-africa.html')}"><strong>Creator Hub ↗</strong><small>Discover South African streamers</small></a><a href="${siteUrl('streaming-setup-south-africa.html')}"><strong>Stream Support ↗</strong><small>Get your setup running smoothly</small></a></div>`);
  shelf.append(side);
  hero.after(shelf);
  showChristmasKits(shelf, products);
}

export async function mountRetailRails() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const catalogue = await readPublicCatalogue(fetch, true);
  const products = (catalogue?.products || []).filter(p => p.status === 'active' && p.visibility === 'public' && p.sale_mode !== 'hidden' && p.is_demo === false);
  showBrands(header, products);
  const hero = document.querySelector('main .home-hero');
  if (hero) showShowcase(hero, products, catalogue?.generatedAt);
}
