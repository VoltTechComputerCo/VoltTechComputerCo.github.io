// Customer-facing permalinks are derived from product names, not supplier IDs.
// The database-generated public_slug is authoritative. This fallback uses the
// same deterministic expression for cached catalogue snapshots and search RPCs.
export function publicProductSlug(product) {
  const explicit = String(product?.public_slug || '').trim();
  if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(explicit)) return explicit;
  const name = String(product?.name || '').trim()
    .replace(/^(?:syntech|tarsus|esquire|lunatech)(?:[^a-z0-9]+|$)/i, '');
  const label = name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 72)
    .replace(/^-+|-+$/g, '') || 'product';
  const suffix = String(product?.id || '').slice(-12).toLowerCase();
  return label + '-' + suffix;
}

export function productCanonicalUrl(product) {
  return 'https://volttechcomputerco.co.za/product?slug=' +
    encodeURIComponent(publicProductSlug(product));
}

// An old supplier-prefixed bookmark must still load. Once resolved, its address
// bar and sharing metadata become the new customer-safe canonical permalink.
export function normalizeProductAddress(product) {
  if (!product || typeof location === 'undefined') return;
  const next = new URL(location.href);
  next.searchParams.set('slug', publicProductSlug(product));
  if (/^(?:www\.)?volttechcomputerco\.co\.za$/i.test(next.hostname)) {
    next.pathname = '/product';
  }
  if (next.href !== location.href && typeof history !== 'undefined' && history.replaceState) {
    history.replaceState(history.state, '', next.pathname + next.search + next.hash);
  }
  const canonical = productCanonicalUrl(product);
  const link = document.querySelector('link[rel="canonical"]');
  const og = document.querySelector('meta[property="og:url"]');
  if (link) link.href = canonical;
  if (og) og.content = canonical;
}
