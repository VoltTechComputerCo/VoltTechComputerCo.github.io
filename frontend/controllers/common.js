import {page} from '../ui.js';
import {startAnalytics} from '../adapters/analytics.js';
if(!['customer','documents'].includes(page.family)&&page.data?.kind!=='status'&&page.data?.kind!=='register'&&!/[?&](confirm|unsubscribe)=/.test(location.search)&&!location.hash.includes('access_token='))startAnalytics();
if(page.data?.redirect)location.replace(new URL(page.data.redirect,location.href));
const observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){e.target.classList.add('revealed');observer.unobserve(e.target);}},{threshold:.1});document.querySelectorAll('[data-reveal]').forEach(e=>observer.observe(e));

document.addEventListener('error',e=>{const img=e.target;if(img?.tagName==='IMG'&&img.closest('main')){const replacement=document.createElement('div');replacement.className='image-unavailable';replacement.textContent='Image currently unavailable';img.replaceWith(replacement);}},true);

if(!matchMedia('(prefers-reduced-motion: reduce)').matches){const images=[...document.querySelectorAll('.route-art img')];let queued=false;function animate(){queued=false;for(const img of images){const box=img.parentElement.getBoundingClientRect();if(box.bottom>0&&box.top<innerHeight){const drift=Math.max(-24,Math.min(24,(box.top+box.height/2-innerHeight/2)*.055));img.style.transform=`translateY(${drift}px) scale(1.16)`;}}}if(images.length){addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(animate);}},{passive:true});animate();}}
