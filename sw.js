const VT_NOTIFICATION_LOADER='site-notifications-loader.js?v=4.1.0';
const VT_PRINT_DOCUMENTS=/(?:^|\/)(?:quote|invoice|receipt|build-document|order-document|service-record|proforma|personal-data)\.html$/i;

self.addEventListener('install',event=>{
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.mode!=='navigate'){
    event.respondWith(fetch(request));
    return;
  }

  const url=new URL(request.url);
  if(url.origin!==self.location.origin||VT_PRINT_DOCUMENTS.test(url.pathname)){
    event.respondWith(fetch(request));
    return;
  }

  event.respondWith((async()=>{
    const response=await fetch(request);
    const type=response.headers.get('content-type')||'';
    if(!response.ok||!type.includes('text/html'))return response;

    let html=await response.text();
    if(!html.includes('site-notifications-loader.js')){
      const loaderUrl=new URL(VT_NOTIFICATION_LOADER,self.registration.scope).href;
      const tag=`<script src="${loaderUrl}"></script>`;
      html=html.includes('</body>')?html.replace('</body>',`${tag}\n</body>`):`${html}\n${tag}`;
    }

    const headers=new Headers(response.headers);
    headers.delete('content-length');
    headers.delete('content-encoding');
    headers.delete('etag');
    return new Response(html,{status:response.status,statusText:response.statusText,headers});
  })().catch(()=>fetch(request)));
});
