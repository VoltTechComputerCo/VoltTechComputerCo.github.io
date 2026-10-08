const VT_NOTIFICATION_LOADER='site-notifications-loader.js?v=6.0.0';
const VT_VERSION_REWRITES=[
 ['notifications.js?v=5.2.0','notifications.js?v=5.2.1-read'],
 ['notifications.css?v=5.0.0','notifications.css?v=5.2.0'],
 ['notifications.css?v=5.1.0','notifications.css?v=5.2.0'],
 ['notifications.js?v=5.0.0','notifications.js?v=5.2.1-read'],
 ['notifications.js?v=5.1.0','notifications.js?v=5.2.1-read'],
 ['portal-shell.css?v=5.0.0','portal-shell.css?v=5.2.0'],
 ['portal-shell.css?v=5.1.0','portal-shell.css?v=5.2.0'],
 ['portal-shell.js?v=5.0.0','portal-shell.js?v=5.2.0'],
 ['portal-shell.js?v=5.1.0','portal-shell.js?v=5.2.0'],
 ['site-notifications-loader.js?v=5.0.0','site-notifications-loader.js?v=6.0.0'],
 ['site-notifications-loader.js?v=5.1.0','site-notifications-loader.js?v=6.0.0'],
 ['site-notifications-loader.js?v=5.2.0','site-notifications-loader.js?v=6.0.0'],
 ['site-notifications-loader.js?v=5.3.0','site-notifications-loader.js?v=6.0.0'],
 ['site-notifications-loader.js?v=5.4.0','site-notifications-loader.js?v=6.0.0']
];

self.addEventListener('install',event=>{self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(self.clients.claim());});

self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.mode!=='navigate'){
   event.respondWith(fetch(request));
   return;
 }

 const url=new URL(request.url);
 if(url.origin!==self.location.origin){
   event.respondWith(fetch(request));
   return;
 }

 event.respondWith((async()=>{
  const response=await fetch(request);
  const type=response.headers.get('content-type')||'';
  if(!response.ok||!type.includes('text/html'))return response;

  // Source-generated clean pages own their complete runtime and are never rewritten.
  let html=await response.clone().text();
  if(/<html\b[^>]*\bdata-vt-shell\s*=\s*["']clean["']/i.test(html))return response;

  // Only legacy admin pages still require the compatibility notification/bootstrap layer.
  // Public STATIC articles, Exposure Scan and compatibility redirects stay byte-for-byte.
  const pageName=(url.pathname.split('/').pop()||'').toLowerCase();
  if(!/^admin(?:-[a-z0-9-]+)?(?:\.html)?$/i.test(pageName))return response;

  for(const [from,to] of VT_VERSION_REWRITES){
    if(html.includes(from))html=html.split(from).join(to);
  }

  if(!html.includes('site-notifications-loader.js')){
    const loaderUrl=new URL(VT_NOTIFICATION_LOADER,self.registration.scope).href;
    const tag=`<script src="${loaderUrl}"></script>`;
    html=html.includes('</body>')
      ? html.replace('</body>',`${tag}\n</body>`)
      : `${html}\n${tag}`;
  }

  const headers=new Headers(response.headers);
  headers.delete('content-length');
  headers.delete('content-encoding');
  headers.delete('etag');

  return new Response(html,{
    status:response.status,
    statusText:response.statusText,
    headers
  });
 })().catch(()=>fetch(request)));
});
