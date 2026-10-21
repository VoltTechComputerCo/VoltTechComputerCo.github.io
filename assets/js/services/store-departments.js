import { productImageUrl } from './product-images.js?v=20261021.2';
const preferences={gpu:/9070\s*xt|5070|5080|5090/i,cpu:/9950x3d|9800x3d/i,monitors:/rog.*oled|gaming.*oled/i,cooler:/rog.*360|titan.*360/i,storage:/gen5.*ssd|ssd.*gen5/i,audio:/cast ultra/i,adapters:/ugreen.*14-in-1/i,cables:/usb4/i};
export function departmentPicks(products){
 const result=new Map();
 for(const p of products){
  const category=p.category_slug||p.type,image=p.media?.primaryImage||p.media?.directImage;
  if(p.is_demo||p.visibility!=='public'||p.status!=='active'||p.sale_mode==='hidden'||!(Number(p.stock_qty)>0)||!/^https:\/\//.test(image||''))continue;
  const keys=[category];if(category==='laptops')keys.push(p.specs?.laptopPurpose==='Gaming'?'gaming-laptops':'work-laptops');
  const score=(p.featured?2e9:0)+Number(p.sort_priority||0)*1e6+(preferences[category]?.test(p.name)?1e9:0)+Number(p.retail_price||0);
  for(const key of keys)if(!result.has(key)||score>result.get(key).score)result.set(key,{product:p,image,score});
 }
 return result;
}
export function updateDepartmentImages(products){
 const picks=departmentPicks(products);
 document.querySelectorAll('[data-department-image]').forEach(img=>{
  const pick=picks.get(img.dataset.departmentImage);
  if(!pick||img.alt===pick.product.name||/assets\/categories\/store-.*\.webp/.test(img.getAttribute('src')||''))return;
  const fallback=img.getAttribute('src');img.onerror=()=>{img.onerror=null;img.src=fallback;};img.src=productImageUrl(pick.image,480);img.alt=pick.product.name;
 });
}
export async function refreshHomeDepartments(config){
 if(!config?.url||!config?.publishableKey)return;
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);
 try{
  const products=[];
  for(let offset=0;;offset+=500){
   const url=new URL(config.url+'/rest/v1/store_products');
   Object.entries({select:'specs,name,type,category_slug,primary_image:media->>primaryImage,stock_qty,retail_price,status,visibility,sale_mode,is_demo',status:'eq.active',visibility:'eq.public',sale_mode:'neq.hidden',stock_qty:'gt.0',order:'id',limit:'500',offset:String(offset)}).forEach(([k,v])=>url.searchParams.set(k,v));
   const r=await fetch(url,{headers:{apikey:config.publishableKey},signal:controller.signal});if(!r.ok)return;const rows=await r.json();products.push(...rows.map(p=>({...p,media:{primaryImage:p.primary_image}})));if(rows.length<500)break;
  }
  updateDepartmentImages(products);
 }catch{/* Local supplier images keep category navigation usable. */}finally{clearTimeout(timeout);}
}
