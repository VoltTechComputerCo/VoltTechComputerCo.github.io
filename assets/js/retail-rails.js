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
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = variant !== 'brands' && preference.matches;
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
    track.scrollTo({ left: position, behavior: preference.matches ? 'instant' : 'smooth' });
  }
  region.querySelector('[data-prev]').addEventListener('click', () => step(-1));
  region.querySelector('[data-next]').addEventListener('click', () => step(1));
  pause.addEventListener('click', () => { paused = !paused; updatePause(); });
  if (variant !== 'brands') preference.addEventListener('change', event => { paused = event.matches; updatePause(); });
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
