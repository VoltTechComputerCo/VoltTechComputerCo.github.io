export async function onRequestGet({env, request}) {
  const source = await env.ASSETS.fetch(new URL('/assets/data/product-seo/sitemap.xml', request.url));
  if (!source.ok) return new Response('Sitemap temporarily unavailable', {status: 503});
  return source;
}
