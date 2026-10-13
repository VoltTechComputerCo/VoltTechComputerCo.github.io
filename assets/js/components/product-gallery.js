import { esc, safeLink, imageMarkup } from './catalogue-view.js?v=20261013-fast';
export function galleryImages(product){
 if(product.metadata?.media_review_required)return [];
 const media=product.media||{};
 return [...new Set([media.primaryImage,media.primary_image,media.directImage,media.direct_image,...(Array.isArray(media.images)?media.images:[])].map(v=>safeLink(typeof v==='string'?v:v?.src||v?.url)).filter(Boolean))].slice(0,30);
}
export function productGallery(product){
 const images=galleryImages(product);
 if(!images.length)return imageMarkup(product,true);
 return `<section class="product-gallery" aria-label="Product photos"><div class="gallery-stage"><div class="gallery-viewport" tabindex="0" aria-label="Product photos. Swipe or use arrow keys.">${images.map((src,i)=>`<figure class="gallery-slide"><button type="button" class="gallery-image-button" data-gallery-zoom aria-label="Enlarge photo ${i+1}"><img src="${esc(src)}" alt="${esc(product.name)} — photo ${i+1}" width="640" height="640" loading="${i?'lazy':'eager'}" fetchpriority="${i?'low':'high'}" decoding="async" referrerpolicy="no-referrer"></button><figcaption hidden>Photo unavailable</figcaption></figure>`).join('')}</div>${images.length>1?'<button type="button" class="gallery-arrow gallery-prev" data-gallery-prev aria-label="Previous product photo">‹</button><button type="button" class="gallery-arrow gallery-next" data-gallery-next aria-label="Next product photo">›</button>':''}</div><div class="gallery-toolbar"><span data-gallery-count role="status">1 / ${images.length}</span><span>${images.length>1?'Swipe to explore · ':''}Tap an image to enlarge</span></div>${images.length>1?`<div class="gallery-thumbnails" aria-label="Choose product photo">${images.map((src,i)=>`<button type="button" class="gallery-thumb" data-gallery-index="${i}" aria-label="Show product photo ${i+1}" aria-pressed="${!i}"><img src="${esc(src)}" alt="" width="72" height="72" loading="lazy" decoding="async" referrerpolicy="no-referrer"></button>`).join('')}</div>`:''}<dialog class="gallery-lightbox" aria-label="Enlarged product photo"><div class="gallery-lightbox-bar"><span data-gallery-large-count></span><button type="button" data-gallery-close aria-label="Close enlarged photo">×</button></div><img class="gallery-large-image" alt=""><div class="gallery-lightbox-controls">${images.length>1?'<button type="button" data-gallery-prev aria-label="Previous enlarged product photo">← Previous</button><button type="button" data-gallery-next aria-label="Next enlarged product photo">Next →</button>':''}</div></dialog></section>`;
}
export function bindProductGallery(root){
 const gallery=root.querySelector('.product-gallery');if(!gallery)return;
 const viewport=gallery.querySelector('.gallery-viewport'),slides=[...viewport.querySelectorAll('.gallery-slide')],thumbs=[...gallery.querySelectorAll('.gallery-thumb')],dialog=gallery.querySelector('dialog'),large=gallery.querySelector('.gallery-large-image');
 let current=0,frame;
 function update(index,scroll=false){
  current=Math.max(0,Math.min(slides.length-1,index));
  if(scroll)viewport.scrollTo({left:current*viewport.clientWidth,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  gallery.querySelector('[data-gallery-count]').textContent=(current+1)+' / '+slides.length;
  gallery.querySelector('[data-gallery-large-count]').textContent='Photo '+(current+1)+' of '+slides.length;
  gallery.querySelectorAll('[data-gallery-prev]').forEach(b=>b.disabled=current===0);
  gallery.querySelectorAll('[data-gallery-next]').forEach(b=>b.disabled=current===slides.length-1);
  thumbs.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===current)));
  const thumb=thumbs[current],strip=gallery.querySelector('.gallery-thumbnails');
  if(thumb&&strip){if(thumb.offsetLeft<strip.scrollLeft||thumb.offsetLeft+thumb.offsetWidth>strip.scrollLeft+strip.clientWidth)strip.scrollTo({left:Math.max(0,thumb.offsetLeft-strip.clientWidth/2+thumb.offsetWidth/2),behavior:'smooth'});}
  if(dialog.open){const img=slides[current].querySelector('img');large.src=img.src;large.alt=img.alt;}
 }
 gallery.querySelectorAll('[data-gallery-prev]').forEach(b=>b.onclick=()=>update(current-1,true));
 gallery.querySelectorAll('[data-gallery-next]').forEach(b=>b.onclick=()=>update(current+1,true));
 thumbs.forEach(b=>b.onclick=()=>update(Number(b.dataset.galleryIndex),true));
 viewport.addEventListener('scroll',()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>update(Math.round(viewport.scrollLeft/viewport.clientWidth)));},{passive:true});
 viewport.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();update(current+(e.key==='ArrowRight'?1:-1),true);}});
 gallery.querySelectorAll('[data-gallery-zoom]').forEach((b,i)=>b.onclick=()=>{current=i;dialog.showModal();update(i);});
 gallery.querySelector('[data-gallery-close]').onclick=()=>dialog.close();
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
 dialog.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();update(current+(e.key==='ArrowRight'?1:-1),true);}});
 viewport.querySelectorAll('img').forEach(img=>img.addEventListener('error',()=>{img.hidden=true;img.closest('figure').querySelector('figcaption').hidden=false;}));
 update(0);
}
