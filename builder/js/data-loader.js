import {
  buildProductIdentityIndexes,
  normalizeCatalogueProducts,
  normalizeSupplierFeed,
  resolveOfferProductId
} from '../../commerce/js/catalogue-normalizer.js?v=0.6';

const CATALOGUE_PATH = './data/catalogue.json';
const PRODUCT_MEDIA_PATH = './data/product-media.json';

export async function loadCatalogue() {
  const manifest = await getJson(CATALOGUE_PATH);
  const categoryFiles = await Promise.all((manifest.categoryFiles || []).map(getJson));
  const rawProducts = categoryFiles.flatMap(file => file.products || []);
  let normalizedProducts = normalizeCatalogueProducts(rawProducts);

  const storeOverlay = await loadStoreProductOverlay(normalizedProducts);
  normalizedProducts = storeOverlay.products;

  let mediaById = {};
  try {
    const mediaFile = await getJson(PRODUCT_MEDIA_PATH);
    mediaById = mediaFile.products || {};
  } catch (error) {
    console.warn('Product media map unavailable', error);
  }

  const products = normalizedProducts.map(product => {
    if (product.metadata?.storeCatalogueOverlay && product.media?.primaryImage) return product;
    const mediaEntry = mediaById[product.id];
    if (!mediaEntry) return product;
    return {
      ...product,
      media: {
        ...(product.media || {}),
        primaryImage: product.media?.primaryImage || mediaEntry.primaryImage || null,
        images: product.media?.images?.length ? product.media.images : (mediaEntry.images || []),
        sourcePage: product.media?.sourcePage || mediaEntry.sourcePage || null,
        sourceType: product.media?.sourceType || mediaEntry.sourceType || null,
        matchLevel: product.media?.matchLevel || mediaEntry.matchLevel || null
      }
    };
  });

  const indexes = buildProductIdentityIndexes(products);
  if (indexes.collisions.length) console.warn('Product identifier collisions detected', indexes.collisions);

  const supplierFiles = await Promise.all((manifest.supplierFiles || []).map(async path => {
    try {
      const raw = await getJson(path);
      return normalizeSupplierFeed(raw, { currency: manifest.currency || 'ZAR' });
    } catch (error) {
      console.warn('Supplier feed unavailable', path, error);
      return null;
    }
  }));

  const offersByProduct = new Map();
  const unmatchedOffers = [];
  for (const feed of supplierFiles.filter(Boolean)) {
    for (const offer of feed.offers || []) {
      const productId = resolveOfferProductId(offer, products, indexes);
      if (!productId) {
        unmatchedOffers.push({ supplier: offer.supplier, supplierSku: offer.supplierSku, identifiers: offer.identifiers });
        continue;
      }
      const existing = offersByProduct.get(productId) || [];
      existing.push({ ...offer, productId });
      offersByProduct.set(productId, existing);
    }
  }

  const enrichedProducts = products.map(product => ({ ...product, offers: sortOffers(offersByProduct.get(product.id) || []) }));
  const allOffers = enrichedProducts.flatMap(product => product.offers || []);

  window.__VT_BUILDER_CATALOGUE = enrichedProducts;
  window.__VT_BUILDER_STORE_OVERLAY = { matched: storeOverlay.matched, available: storeOverlay.available, source: storeOverlay.source };
  window.dispatchEvent(new CustomEvent('volttech:catalogue-ready', {
    detail: {
      products: enrichedProducts,
      currency: manifest.currency || 'ZAR',
      storeOverlayMatched: storeOverlay.matched,
      storeOverlayAvailable: storeOverlay.available,
      storeOverlaySource: storeOverlay.source
    }
  }));

  return {
    schemaVersion: manifest.schemaVersion || '0.6.0',
    generatedAt: manifest.generatedAt || null,
    currency: manifest.currency || 'ZAR',
    notice: manifest.notice || '',
    products: enrichedProducts,
    supplierCount: supplierFiles.filter(Boolean).length,
    categoryCount: categoryFiles.length,
    offerCount: allOffers.length,
    unmatchedOfferCount: unmatchedOffers.length,
    unmatchedOffers,
    freshness: summarizeFreshness(allOffers),
    identifierCollisionCount: indexes.collisions.length,
    storeOverlayMatched: storeOverlay.matched,
    storeOverlayAvailable: storeOverlay.available,
    storeOverlaySource: storeOverlay.source
  };
}

async function loadStoreProductOverlay(builderProducts) {
  if (window.__VT_BUILDER_INSPECT === true) {
    return { products: builderProducts, matched: 0, available: 0, source: 'local-inspection' };
  }
  try {
    const client = window.volttechAuth;
    if (!client) return { products: builderProducts, matched: 0, available: 0, source: 'local-only' };

    const { data, error } = await client
      .from('store_products')
      .select('id,slug,name,type,brand,manufacturer,model,identifiers,specs,compatibility,media,metadata,is_demo,status,visibility')
      .eq('status', 'active')
      .eq('visibility', 'public');
    if (error) throw error;

    const storeProducts = Array.isArray(data) ? data : [];
    if (!storeProducts.length) return { products: builderProducts, matched: 0, available: 0, source: 'store-products-empty' };

    const byId = new Map(storeProducts.map(product => [String(product.id || '').trim(), product]));
    const byIdentity = new Map();
    for (const product of storeProducts) {
      for (const key of identityKeys(product)) if (key && !byIdentity.has(key)) byIdentity.set(key, product);
    }

    let matched = 0;
    const products = builderProducts.map(local => {
      const exact = byId.get(local.id);
      const identity = identityKeys(local).map(key => byIdentity.get(key)).find(Boolean);
      const store = exact || identity;
      if (!store || String(store.type || '').toLowerCase() !== String(local.type || '').toLowerCase()) return local;
      matched++;
      return {
        ...local,
        brand: store.brand || local.brand,
        manufacturer: store.manufacturer || store.brand || local.manufacturer,
        name: store.name || local.name,
        model: store.model || local.model,
        identifiers: { ...(local.identifiers || {}), ...(store.identifiers || {}) },
        specs: { ...(local.specs || {}), ...(store.specs || {}) },
        compatibility: { ...(local.compatibility || {}), ...(store.compatibility || {}) },
        media: mergeStoreMedia(local.media, store.media),
        metadata: {
          ...(local.metadata || {}), ...(store.metadata || {}),
          storeCatalogueOverlay: true,
          storeProductId: store.id,
          storeSlug: store.slug || null,
          storeDemoFixture: store.is_demo === true,
          storeMatch: exact ? 'id' : 'identity'
        }
      };
    });
    return { products, matched, available: storeProducts.length, source: 'supabase-store-products' };
  } catch (error) {
    console.warn('Store catalogue overlay unavailable; Builder is using its local preview catalogue.', error);
    return { products: builderProducts, matched: 0, available: 0, source: 'local-fallback' };
  }
}

function mergeStoreMedia(local = {}, store = {}) {
  const images = Array.from(new Set([...(store?.images || []), ...(local?.images || [])].filter(Boolean)));
  return { ...local, ...store, primaryImage: store?.primaryImage || store?.primary_image || local?.primaryImage || null, images };
}

function identityKeys(product) {
  const type = clean(product?.type), brand = clean(product?.brand), model = clean(product?.model), name = clean(product?.name);
  const mpn = clean(product?.identifiers?.mpn || product?.mpn);
  return [mpn ? `${type}|mpn|${mpn}` : '', brand && model ? `${type}|model|${brand}|${model}` : '', brand && name ? `${type}|name|${brand}|${name}` : ''].filter(Boolean);
}

function clean(value) {
  return String(value || '').trim().toLowerCase().replace(/[®™]/g, '').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function sortOffers(offers) {
  const freshnessRank = { fresh: 0, aging: 1, unknown: 2, stale: 3 };
  return [...offers].sort((a, b) => (freshnessRank[a.freshness] ?? 9) - (freshnessRank[b.freshness] ?? 9) || Number(a.price || Infinity) - Number(b.price || Infinity));
}

function summarizeFreshness(offers) {
  return offers.reduce((summary, offer) => { const key = offer.freshness || 'unknown'; summary[key] = (summary[key] || 0) + 1; return summary; }, { fresh: 0, aging: 0, stale: 0, unknown: 0 });
}

async function getJson(path) {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Failed to load ${path}: ${response.status}`);
  return response.json();
}
