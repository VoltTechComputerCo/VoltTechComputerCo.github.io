import { openCatalogue, showGate, publicProducts, withTimeout, addItem } from '../services/catalogue.js';
import { productCard, filterProducts, bindImages } from '../components/catalogue-view.js';
import { connectCatalogueCart } from '../services/catalogue-cart.js';
const query = new URLSearchParams(location.search), categories = [...document.querySelectorAll('[data-category-link]')];
const selected = categories.find(a => a.dataset.categoryLink === query.get('category'));
const state = { category:selected?.dataset.categoryLink || 'all', brand:'', search:query.get('q') || '', sort:'featured' };
const search = document.getElementById('catalogue-search'), brand = document.getElementById('catalogue-brand'), sort = document.getElementById('catalogue-sort'), grid = document.getElementById('product-grid'), count = document.getElementById('result-count');
function selectCategory() {
  categories.forEach(a => { if (a.dataset.categoryLink === state.category) a.setAttribute('aria-current','true'); else a.removeAttribute('aria-current'); });
  document.getElementById('category-name').textContent = categories.find(a => a.dataset.categoryLink === state.category)?.dataset.label || 'Every part. One purpose.';
  const contact = document.getElementById('category-enquiry');
  contact.href = `https://wa.me/27618435775?text=${encodeURIComponent('Hi VoltTech, I would like help choosing ' + (categories.find(a => a.dataset.categoryLink === state.category)?.dataset.label.toLowerCase() || 'PC components') + ' for my setup.')}`;
}
selectCategory();
async function init() {
  try {
    const access = await openCatalogue();
    if (!access.open) { showGate(access); return; }
    const { VT, preview } = access;
    const data = await withTimeout(VT.loadStore());
    if (data.settings?.catalogue_enabled !== true && !preview) { showGate({reason:'closed'}); return; }
    const products = publicProducts(data.products, preview);
    document.getElementById('store-gate').hidden = true;
    document.getElementById('catalogue').hidden = false;
    document.getElementById('store-state').textContent = preview ? 'ADMIN PREVIEW / STORE REMAINS LOCKED' : 'COMPONENT CATALOGUE';
    document.getElementById('catalogue-preview').hidden = !preview;
    document.getElementById('store-hero-copy').textContent = 'Explore component details, check compatibility information and discuss the right parts for your setup.';
    search.value = state.search;
    function brands() {
      const values = [...new Set(products.filter(p => state.category === 'all' || p.category_slug === state.category || p.type === state.category).map(p => p.brand).filter(Boolean))].sort();
      brand.replaceChildren(new Option('All brands',''), ...values.map(v => new Option(v,v)));
      if (!values.includes(state.brand)) state.brand = ''; brand.value = state.brand;
    }
    function render() {
      const items = filterProducts(products,state); count.textContent = `${items.length} component${items.length === 1 ? '' : 's'}`;
      grid.innerHTML = items.length ? items.map(p => productCard(VT,p,preview)).join('') : '<div class="empty-state"><h3>No components to show.</h3><p>Try another category or clear the filters. You can also ask VoltTech about the part you need.</p></div>';
      bindImages(grid);
      grid.querySelectorAll('[data-add]').forEach(b => b.addEventListener('click', () => addItem(VT, products.find(p => p.id === b.dataset.add), preview)));
      const url = new URL(location.href); ['category','q'].forEach(k => url.searchParams.delete(k));
      if (state.category !== 'all') url.searchParams.set('category',state.category); if (state.search) url.searchParams.set('q',state.search);
      history.replaceState(null,'',url);
    }
    categories.forEach(a => a.addEventListener('click', event => { event.preventDefault(); state.category = a.dataset.categoryLink; selectCategory(); brands(); render(); document.getElementById('catalogue').scrollIntoView({block:'start'}); }));
    search.addEventListener('input', () => { state.search = search.value.trim(); render(); });
    brand.addEventListener('change', () => { state.brand = brand.value; render(); });
    sort.addEventListener('change', () => { state.sort = sort.value; render(); });
    document.getElementById('reset-filters').addEventListener('click', () => { state.category='all'; state.brand=''; state.search=''; state.sort='featured'; search.value=''; sort.value='featured'; selectCategory(); brands(); render(); search.focus(); });
    brands(); render(); connectCatalogueCart(VT,products,preview);
    VT.analytics('view_item_list',{ item_list_name:'VoltTech PC Parts', items:products.slice(0,20).map(p => ({item_id:p.id,item_name:p.name})) });
  } catch { showGate({reason:'connection'}); }
}
init();
