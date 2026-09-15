window.dataLayer=window.dataLayer||[];
function gtag(){window.dataLayer.push(arguments)}
gtag('js',new Date());
gtag('config','G-QQ3CC70MBE');
(function(){
  const safe=(v,max=80)=>String(v||'').replace(/[\r\n]/g,' ').slice(0,max);
  window.vtTrack=function(name,params={}){try{const clean={};for(const [k,v] of Object.entries(params)){if(v==null)continue;if(/name|email|phone|message|body|text/i.test(k))continue;clean[k]=typeof v==='string'?safe(v):v}gtag('event',name,clean)}catch(e){}};
  document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('a');if(!a)return;const href=a.getAttribute('href')||'',ctx=a.dataset.vtContext||'general';if(href.startsWith('https://wa.me/'))window.vtTrack('contact_click',{channel:'whatsapp',page_path:location.pathname,context:ctx});else if(href.startsWith('mailto:'))window.vtTrack('contact_click',{channel:'email',page_path:location.pathname,context:ctx})});
})();
