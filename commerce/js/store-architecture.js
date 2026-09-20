(function(){
'use strict';

const VT=window.VoltTechStore;
if(!VT)return;

function suffix(){return VT.previewMode?.()?'&preview=1':''}

window.addEventListener('DOMContentLoaded',()=>{
  if(!VT.previewMode?.())return;

  const grid=document.getElementById('productGrid');
  if(!grid)return;

  const observer=new MutationObserver(()=>{
    grid.querySelectorAll('.product-card').forEach(card=>{
      const link=card.querySelector('a[href^="product.html?slug="]');
      if(link&&!link.href.includes('preview=1')) link.href+=suffix();

      const detail=card.querySelector('.icon-btn[href^="product.html?slug="]');
      if(detail&&!detail.href.includes('preview=1')) detail.href+=suffix();

      const productId=card.querySelector('[data-add]')?.dataset.add;
      const product=productId&&window.__vtPreviewProductMap?.get?.(productId);

      if(product?.is_demo&&!card.querySelector('.demo-card-badge')){
        const badge=document.createElement('span');
        badge.className='demo-card-badge';
        badge.textContent='DEMO';
        card.querySelector('.product-media')?.appendChild(badge);
      }
    });
  });

  observer.observe(grid,{childList:true,subtree:true});
});
})();