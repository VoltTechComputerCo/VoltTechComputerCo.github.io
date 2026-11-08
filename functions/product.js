const origin = 'https://volttechcomputerco.co.za';
const slugPattern = /^[a-z0-9]+(?:-+[a-z0-9]+)*$/;
const escape = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

export function renderProductHtml(shell, slug, product) {
  const canonical = origin + '/product?slug=' + encodeURIComponent(slug);
  const title = product.name + ' | VoltTech';
  const details = [
    ['Brand', product.brand], ['Model', product.model], ['Manufacturer part number', product.mpn], ...(product.specs || [])
  ].filter(([, value]) => value);
  const description = product.name + ' at VoltTech South Africa. View product details and ask about compatibility, availability and final pricing.';
  const structured = {'@context': 'https://schema.org', '@graph': [
    {'@type': 'Product', name: product.name, url: canonical, description,
      ...(product.brand && {brand: {'@type': 'Brand', name: product.brand}}),
      ...(product.model && {model: product.model}), ...(product.mpn && {mpn: product.mpn}),
      ...(product.image && {image: product.image}),
      ...(product.specs?.length && {additionalProperty: product.specs.map(([name, value]) => ({'@type': 'PropertyValue', name, value}))})},
    {'@type': 'BreadcrumbList', itemListElement: [
      {'@type': 'ListItem', position: 1, name: 'Home', item: origin + '/'},
      {'@type': 'ListItem', position: 2, name: 'Store', item: origin + '/store'},
      {'@type': 'ListItem', position: 3, name: product.name, item: canonical}
    ]}
  ]};
  const tags = [
    [/<title>[^<]*<\/title>/, '<title>' + escape(title) + '</title>'],
    [/<meta name="description" content="[^"]*">/, '<meta name="description" content="' + escape(description) + '">'],
    [/<meta name="robots" content="noindex, follow">/, '<meta name="robots" content="index, follow, max-image-preview:large">'],
    [/<link rel="canonical" href="[^"]*">/, '<link rel="canonical" href="' + escape(canonical) + '">'],
    [/<meta property="og:title" content="[^"]*">/, '<meta property="og:title" content="' + escape(title) + '">'],
    [/<meta property="og:description" content="[^"]*">/, '<meta property="og:description" content="' + escape(description) + '">'],
    [/<meta property="og:url" content="[^"]*">/, '<meta property="og:url" content="' + escape(canonical) + '">'],
    [/<span aria-current="page">Component details<\/span>/, '<span aria-current="page">' + escape(product.name) + '</span>'],
    [/<h1 id="component-title">PRODUCT DETAILS<\/h1><p>Specifications, pricing and availability\.<\/p>/,
      '<h1 id="component-title">' + escape(product.name) + '</h1><p>' + escape(description) + '</p>' +
      (details.length ? '<dl>' + details.map(([label, value]) => '<dt>' + label + '</dt><dd>' + escape(value) + '</dd>').join('') + '</dl>' : '') +
      (product.image ? '<noscript><img src="' + escape(product.image) + '" alt="' + escape(product.name) + '" width="360"></noscript>' : '')],
    [/<\/head>/, '<script type="application/ld+json">' + JSON.stringify(structured).replace(/</g, '\\u003c') + '</script>\n</head>']
  ];
  if (tags.some(([pattern]) => !pattern.test(shell))) return null;
  return tags.reduce((html, [pattern, value]) => html.replace(pattern, () => value), shell);
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const slug = url.searchParams.get('slug') || '';
  // Keep the original page for previews, legacy bookmarks, and unavailable listings.
  if (url.searchParams.has('preview') || slug.length > 160 || !slugPattern.test(slug)) return context.next();
  let shell;
  try {
    const result = await context.env.ASSETS.fetch(new URL('/assets/data/product-seo/' + (slug.charCodeAt(slug.length - 1) % 16).toString(16) + '.json', url));
    if (!result.ok) return context.next();
    const products = await result.json();
    if (!Object.hasOwn(products, slug)) return context.next();
    // Fetch an unconditional full HTML response before changing its contents.
    shell = await context.env.ASSETS.fetch(new URL('/product', url));
    if (!shell.ok || !shell.headers.get('content-type')?.includes('text/html')) return context.next();
    const body = await shell.clone().text();
    const html = renderProductHtml(body, slug, products[slug]);
    if (!html) return shell;
    const headers = new Headers(shell.headers);
    for (const key of ['content-length', 'content-encoding', 'etag', 'last-modified']) headers.delete(key);
    headers.set('cache-control', 'public, max-age=60');
    return new Response(html, {headers});
  } catch {
    return shell || context.next();
  }
}
