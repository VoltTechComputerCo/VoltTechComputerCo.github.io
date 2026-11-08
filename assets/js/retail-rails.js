import { readPublicCatalogue } from './services/public-catalogue.js?v=20261102-gpu3';
import { bindImages, esc, imageMarkup, productUrl } from './components/catalogue-view.js?v=20261103-slugs1';

const supplierArt = 'https://www.syntech.co.za/wp-content/uploads/';
const brands = [
  ['ASUS', '2025/06/Asus_500x500px-01.jpg'],
  ['Gigabyte', 'https://api.esquire.co.za/Resources/Images/PageImage/gigabyte-logo.png'],
  ['Thermal Grizzly', '../brand/partners/thermal-grizzly.webp'],
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
  ['Trust', 'https://api.esquire.co.za/Resources/Images/PageImage/Trust-v2.png']
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
const logoUrl = path => path.startsWith('https:') ? path : path.startsWith('../') ? new URL(path, import.meta.url).href : supplierArt + path;
const storeLink = (key, value) => {
  const url = siteUrl('store.html#catalogue');
  url.searchParams.set(key, value);
  return url.href;
};

function rail(title, kicker, cards, variant) {
  const region = document.createElement('section');
  region.className = 'retail-rail retail-rail-' + variant;
  region.setAttribute('aria-label', title);
  region.innerHTML = `<div class="rail-heading"><div><p class="eyebrow">${esc(kicker)}</p><h2>${esc(title)}</h2></div><div class="rail-controls"><button type="button" data-prev aria-label="Previous ${esc(title)}">←</button><button type="button" data-next aria-label="Next ${esc(title)}">→</button><button type="button" data-pause aria-label="Pause ${esc(title)}">Pause</button></div></div><div class="rail-track">${cards.join('')}</div>`;
  const track = region.querySelector('.rail-track');
  const pause = region.querySelector('[data-pause]');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = preference.matches;
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
  preference.addEventListener('change', event => { paused = event.matches; updatePause(); });
  updatePause();
  const observer = new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; });
  observer.observe(region);
  window.setInterval(() => {
    if (onScreen && !document.hidden && !paused && !region.matches(':hover, :focus-within')) step(1);
  }, variant === 'brands' ? 2600 : 4600);
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
    const selection = rail('Hardware spotlight', 'A NEW LINEUP EVERY TWO DAYS', picks, 'products');
    shelf.append(selection);
    bindImages(selection);
  }
  const campaigns = themes.map((_, index) => themes[(rotation + index) % themes.length]);
  const offers = campaigns.slice(0, 4).map(([label, category, text]) =>
    `<a class="rail-campaign" href="${esc(storeLink('category', category))}"><strong>${esc(label)} ↗</strong><span>${esc(text)}</span></a>`);
  if (document.getElementById('season-title')) offers.splice(1, 0, '<a class="rail-campaign rail-season" href="#season-title"><strong>Christmas bundles ↗</strong><span>Three setups available by quote.</span></a>');
  const now = Date.now();
  const snapshotAge = now - Date.parse(generatedAt || '');
  const special = snapshotAge >= 0 && snapshotAge < 10 * 3600000 && products.find(p => {
    const priceAge = now - Date.parse(p.price_checked_at || '');
    return p.compare_at_verified === true && p.stock_qty > 0 && p.retail_price > 0 &&
      Number(p.compare_at_price) > Number(p.retail_price) && priceAge >= 0 && priceAge < 24 * 3600000 &&
      (!p.deal_ends_at || Date.parse(p.deal_ends_at) > now);
  });
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
