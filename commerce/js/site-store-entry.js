(()=>{
'use strict';
if(window.__vtMoneyMakerEntry)return;window.__vtMoneyMakerEntry=true;
const basePath=location.pathname.split('/').pop()||'index.html';
const isStore=['store.html','product.html','admin-store.html'].includes(basePath);
const isPublicStore=['store.html','product.html'].includes(basePath);

function addStorePolish(){
 if(!isPublicStore||document.getElementById('vtMoneyMakerPolishV11'))return;
 const style=document.createElement('style');
 style.id='vtMoneyMakerPolishV11';
 style.textContent=`
/* VoltTech Money Maker v1.1 — mobile merchandising pass */
.product-grid{gap:16px}
.product-card{border-radius:18px;background:linear-gradient(155deg,rgba(47,230,200,.055),transparent 34%),linear-gradient(180deg,#0d1719,#091113);box-shadow:0 12px 34px rgba(0,0,0,.18)}
.product-card:hover,.product-card:focus-within{border-color:#2c5d5d;box-shadow:0 20px 48px rgba(0,0,0,.34)}
.product-media{aspect-ratio:1.22/1;background:radial-gradient(circle at 50% 40%,rgba(47,230,200,.11),transparent 42%),linear-gradient(180deg,#0b1517,#070d0f)}
.product-media img{object-fit:contain;padding:18px;filter:drop-shadow(0 16px 22px rgba(0,0,0,.36));background:transparent}
.product-media:has(.visual-note) img{object-fit:cover;padding:0;filter:none}
.product-badges{top:12px;left:12px}.badge{padding:6px 8px;font-size:7.5px;background:rgba(3,8,9,.9)}
.product-body{padding:18px}.product-brand{font-size:9px;letter-spacing:.115em}
.product-card h3{margin:8px 0 8px;font-size:19px;line-height:1.18;letter-spacing:-.02em}
.product-desc{min-height:0;margin:0;color:#91a9a4;font-size:12.5px;line-height:1.58}
.highlights{gap:6px;margin:14px 0}.highlights span,.spec-chip{padding:6px 8px;border-radius:7px;font-size:8.5px;background:#0b1718}
.price-block{padding-top:14px}.price-block small{font-size:8px;letter-spacing:.08em}.price-block strong{margin-top:5px;font-size:21px;letter-spacing:-.02em}
.stock-line{margin-top:7px;font-size:9px;line-height:1.45}.stock-dot{width:7px;height:7px;flex:0 0 7px}
.card-actions{grid-template-columns:1fr 46px;gap:8px;margin-top:14px}.icon-btn{display:grid!important;place-items:center;width:46px;min-height:46px}.btn.small{min-height:46px}
.results-head h2{font-size:30px}.results-head p{font-size:9px}.category-rail{scroll-snap-type:x proximity}.category-rail .chip{scroll-snap-align:start}
.product-image-large{background:radial-gradient(circle at 50% 42%,rgba(47,230,200,.11),transparent 42%),linear-gradient(180deg,#0b1517,#070d0f)}
.product-image-large img{object-fit:contain;padding:28px;filter:drop-shadow(0 20px 28px rgba(0,0,0,.4));background:transparent}
.product-image-large:has(.visual-note) img{object-fit:cover;padding:0;filter:none}
.product-content h1{letter-spacing:-.045em}.product-content .lead{color:#a4b7b3}.product-price strong{letter-spacing:-.025em}
@media(max-width:700px){
 .wrap{width:min(100% - 22px,1180px)}
 .announcement{padding:6px 10px;font-size:8px;line-height:1.35}
 .nav-in{height:62px}.brand img{height:32px}.nav-links{gap:10px}
 .hero{min-height:470px}.hero-media img{object-position:66% center}.hero-copy{padding:76px 0 46px}.hero h1{font-size:clamp(40px,13vw,58px);line-height:.94}.hero p{font-size:13px;line-height:1.62}.hero-actions{gap:8px;margin-top:22px}.hero-actions .btn{flex:1 1 100%;min-height:48px}
 .trust-strip{overflow:hidden}.trust-in{display:flex;grid-template-columns:none;gap:8px;overflow-x:auto;scroll-snap-type:x mandatory;padding:10px 11px 14px;margin:0 -11px;scrollbar-width:none}.trust-in::-webkit-scrollbar{display:none}.trust-item,.trust-item:nth-child(3){flex:0 0 82%;padding:14px;border:1px solid var(--line)!important;border-radius:12px;background:#081113;scroll-snap-align:start}.trust-item b{font-size:13px}.trust-item span{font-size:11px}
 .store-main{padding:30px 0 100px}.store-toolbar{gap:8px;margin-bottom:10px}.searchbox input,.sort{min-height:52px;border-radius:12px;font-size:16px}.searchbox input{padding-inline:15px 46px}.category-rail{gap:7px;margin-inline:-11px;padding:4px 11px 18px}.chip{min-height:40px;padding:0 15px;font-size:9px}
 .results-head{align-items:flex-end;margin-bottom:14px}.results-head h2{font-size:30px}.results-head p{font-size:9px;white-space:nowrap}
 .product-grid{grid-template-columns:1fr;gap:14px}.product-card{border-radius:17px}.product-media{aspect-ratio:1.28/1}.product-media img{padding:20px}.product-body{padding:18px}.product-brand{font-size:9px}.product-card h3{font-size:20px;line-height:1.18}.product-desc{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;font-size:13px;line-height:1.55}.highlights{margin:12px 0}.highlights span{font-size:8.5px}.highlights span:nth-child(n+3){display:none}.price-block{padding-top:13px}.price-block strong{font-size:21px}.stock-line{font-size:9px}.card-actions{grid-template-columns:1fr 48px}.icon-btn{width:48px;min-height:48px}.btn.small{min-height:48px;font-size:10px}
 .mobile-cart{left:10px;right:10px;min-height:56px;border-radius:13px;padding-inline:16px;box-shadow:0 18px 46px rgba(0,0,0,.5)}
 .product-page{padding:24px 0 94px}.product-shell{gap:18px}.product-image-large{aspect-ratio:1/1;border-radius:18px}.product-image-large img{padding:24px}.product-content{padding-top:2px}.product-content h1{font-size:34px;line-height:1.04}.product-content .lead{font-size:14px;line-height:1.65}.product-price{margin:18px 0 14px;padding:17px 0}.product-price strong{font-size:24px}.product-actions{gap:9px}.product-actions .btn{min-height:50px}.panel{padding:16px;border-radius:12px}.spec-grid{grid-template-columns:1fr 1fr;gap:7px}.spec-row{padding:10px}
}
@media(max-width:430px){
 .product-media{aspect-ratio:1.2/1}.product-media img{padding:18px}.product-card h3{font-size:19px}.product-image-large{aspect-ratio:1/1}.spec-grid{grid-template-columns:1fr}
}
`;
 document.head.appendChild(style);
}

function polishStoreCopy(){
 if(!isPublicStore)return;
 document.querySelectorAll('.price-block strong,.product-price strong').forEach(el=>{
   if(el.textContent.trim()==='Current price on quote')el.textContent='Price confirmed on quote';
 });
 document.querySelectorAll('.price-block small,.product-price small').forEach(el=>{
   if(el.textContent.trim()==='Quote-first pricing')el.textContent='Pricing confirmed';
 });
 document.querySelectorAll('.stock-line').forEach(el=>{
   const t=el.textContent.trim();
   if(t.includes('Live supplier stock confirmed before order')){
     const dot=el.querySelector('.stock-dot');
     el.textContent='';if(dot)el.appendChild(dot);el.append(' Availability checked before quote');
   }
 });
}

function addDesktop(){
 if(isStore)return;
 document.querySelectorAll('.navlinks').forEach(nav=>{
   if(nav.querySelector('a[href*="store.html"]'))return;
   const a=document.createElement('a');a.href=location.pathname.includes('/builder/')?'../store.html':'store.html';a.textContent='PC Parts';a.className='store-link';
   const account=nav.querySelector('.account-link,a[href*="account.html"]');account?nav.insertBefore(a,account):nav.appendChild(a);
 });
 const hero=document.querySelector('.hero-actions');
 if(hero&&!hero.querySelector('a[href*="store.html"]')){const a=document.createElement('a');a.className='btn secondary';a.href='store.html';a.textContent='Shop PC Parts';hero.appendChild(a)}
}
function addMobile(){
 if(isStore)return;
 document.querySelectorAll('.vt-mobile-links').forEach(list=>{
  if(list.querySelector('a[href*="store.html"]'))return;
  const a=document.createElement('a');a.className='vt-mobile-link vt-menu-parts';a.href=location.pathname.includes('/builder/')?'../store.html':'store.html';
  a.innerHTML='<span class="vt-card-image vt-image-parts"></span><div class="vt-card-copy"><small>Store</small><strong>PC Parts</strong><em>Components, compatibility & quotes</em></div>';
  const builder=list.querySelector('.vt-menu-builder');builder?.after(a)||list.prepend(a);
 });
 if(!document.getElementById('vtMoneyMakerStyle')){const style=document.createElement('style');style.id='vtMoneyMakerStyle';style.textContent='.vt-image-parts{background-image:linear-gradient(90deg,rgba(4,10,11,.2),rgba(4,10,11,.7)),url("/vt-drive-motherboard.webp")!important;background-size:cover!important;background-position:center!important}';document.head.appendChild(style)}
}
function addAccountAdmin(){
 if(basePath==='account.html'){const row=document.querySelector('.quick-row');if(row&&!row.querySelector('a[href="store.html"]')){const a=document.createElement('a');a.className='btn secondary';a.href='store.html';a.textContent='Browse PC parts';row.appendChild(a)}}
 if(basePath==='admin.html'){const tools=document.querySelector('.tools');if(tools&&!tools.querySelector('a[href="admin-store.html"]')){const a=document.createElement('a');a.className='tool';a.href='admin-store.html';a.textContent='Parts Desk';tools.insertBefore(a,tools.firstChild)}}
}
function loadBuilderHandoff(){if(!location.pathname.includes('/builder/'))return;const src=new URL('../commerce/js/builder-handoff.js?v=1.0.0',location.href).href;if([...document.scripts].some(s=>s.src.split('?')[0]===src.split('?')[0]))return;const s=document.createElement('script');s.src=src;s.defer=true;document.head.appendChild(s)}
function run(){addStorePolish();addDesktop();addMobile();addAccountAdmin();loadBuilderHandoff();polishStoreCopy()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
const mo=new MutationObserver(()=>{addMobile();addAccountAdmin();polishStoreCopy()});mo.observe(document.documentElement,{childList:true,subtree:true});setTimeout(()=>mo.disconnect(),12000);
})();
