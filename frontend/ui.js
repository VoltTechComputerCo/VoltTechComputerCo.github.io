export const root=new URL('../',import.meta.url);
export const page=JSON.parse(document.getElementById('route-data')?.textContent||'{}');
export const q=s=>document.querySelector(s);
export const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const href=path=>new URL(path,root).href;
export const money=v=>v===null||v===undefined||v===''||!Number.isFinite(Number(v))?'Pricing to be confirmed':new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR'}).format(Number(v));
export const safeURL=raw=>{if(typeof raw!=='string'||!raw.trim())return '';try{const u=new URL(raw,root);return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password?u.href:'';}catch{return '';}};
export function status(selector,message){const el=q(selector);if(el)el.textContent=message;}
export function empty(title,copy,link='pc-upgrades-pretoria.html',label='Talk about my setup'){return `<div class="empty-stage"><p class="eyebrow">YOUR NEXT / STILL OPEN</p><h2>${esc(title)}</h2><p class="muted">${esc(copy)}</p><a class="button secondary" href="${href(link)}">${esc(label)} ↗</a></div>`;}
export const image=(url,alt='')=>{const src=safeURL(url);return src?`<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy">`:'<div class="image-unavailable">Image not available</div>';};
export function download(name,data,type='application/json'){const blob=new Blob([typeof data==='string'?data:JSON.stringify(data,null,2)],{type});const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
export async function action(button,fn,statusSelector){button.disabled=true;try{await fn();}catch(e){status(statusSelector,e.message||'This action could not be completed.');}finally{button.disabled=false;}}
export function check(result){if(result.error)throw Error(result.error.message);return result.data;}
export function dialog(title,body){const el=document.createElement('dialog');el.setAttribute('aria-label',title);el.innerHTML=`<div class="sheet"><div class="sheet-head"><h2>${esc(title)}</h2><button class="icon-button" aria-label="Close dialog">×</button></div>${body}</div>`;document.body.append(el);const opener=document.activeElement;el.querySelector('button').onclick=()=>el.close();el.addEventListener('close',()=>{document.documentElement.style.overflow='';opener?.focus();el.remove();});el.showModal();document.documentElement.style.overflow='hidden';return el;}
