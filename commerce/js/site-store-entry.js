(()=>{
'use strict';
if(window.__vtMoneyMakerEntry)return;window.__vtMoneyMakerEntry=true;
const basePath=location.pathname.split('/').pop()||'index.html';
const isStore=['store.html','product.html','admin-store.html'].includes(basePath);
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
function run(){addDesktop();addMobile();addAccountAdmin();loadBuilderHandoff()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
const mo=new MutationObserver(()=>{addMobile();addAccountAdmin()});mo.observe(document.documentElement,{childList:true,subtree:true});setTimeout(()=>mo.disconnect(),6000);
})();
