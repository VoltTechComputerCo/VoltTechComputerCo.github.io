(function(){
'use strict';
const CART_KEY='vt_store_quote_cart_v1';
const TYPE_LABELS={cpu:'Processor',gpu:'Graphics Card',motherboard:'Motherboard',memory:'Memory',storage:'Storage',psu:'Power Supply',case:'Case',cooler:'CPU Cooler',fan:'Case Fan'};
const TYPE_VISUALS={
 cpu:'vt-px-repair-cpu-install.webp',gpu:'vt-own-gpu-product.webp',motherboard:'vt-drive-motherboard.webp',memory:'vt-px-pc-components.webp',storage:'vt-px-hardware-detail.webp',psu:'vt-px-pc-hardware.webp',case:'vt-drive-premium-pc.webp',cooler:'vt-drive-rgb-cooling.webp',fan:'vt-drive-rgb-cooling.webp'
};
let sb=null;
if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}),{once:true});}
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function safeUrl(v){try{const u=new URL(String(v||''),location.href);return ['http:','https:'].includes(u.protocol)?u.href:''}catch{return''}}
function getClient(){
 if(sb)return sb;
 if(!window.supabase?.createClient)throw new Error('Supabase library unavailable');
 const cfg=window.VOLTTECH_SUPABASE;
 if(!cfg?.url||!cfg?.publishableKey)throw new Error('VoltTech store configuration unavailable');
 sb=window.supabase.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 return sb;
}
function readCart(){try{const x=JSON.parse(localStorage.getItem(CART_KEY)||'[]');return Array.isArray(x)?x.filter(i=>i&&i.productId&&Number(i.quantity)>0):[]}catch{return[]}}
function saveCart(items){const clean=items.map(i=>({productId:String(i.productId),quantity:Math.max(1,Math.min(25,Number(i.quantity)||1))}));localStorage.setItem(CART_KEY,JSON.stringify(clean));window.dispatchEvent(new CustomEvent('vt-store-cart-change',{detail:clean}));return clean}
function addToCart(productId,quantity=1){const items=readCart();const row=items.find(i=>i.productId===productId);if(row)row.quantity=Math.min(25,row.quantity+quantity);else items.push({productId,quantity:Math.max(1,quantity)});return saveCart(items)}
function setCartQty(productId,quantity){let items=readCart();if(quantity<=0)items=items.filter(i=>i.productId!==productId);else{const row=items.find(i=>i.productId===productId);if(row)row.quantity=Math.min(25,quantity)}return saveCart(items)}
function clearCart(){localStorage.removeItem(CART_KEY);window.dispatchEvent(new CustomEvent('vt-store-cart-change',{detail:[]}))}
function cartCount(){return readCart().reduce((n,i)=>n+i.quantity,0)}
function categoryLabel(type){return TYPE_LABELS[type]||String(type||'PC Part')}
function mediaFor(product){const m=product?.media||{};const actual=safeUrl(m.primaryImage||m.primary_image||'');return{src:actual||TYPE_VISUALS[product?.type]||'vt-px-pc-components.webp',actual:!!actual}}
function formatPrice(value,currency='ZAR'){if(value==null||value==='')return'Current price on quote';try{return new Intl.NumberFormat('en-ZA',{style:'currency',currency:currency||'ZAR',maximumFractionDigits:0}).format(Number(value))}catch{return`R ${Number(value).toLocaleString('en-ZA')}`}}
function formatSpecKey(key){return String(key).replace(/([a-z])([A-Z])/g,'$1 $2').replace(/_/g,' ').replace(/\b\w/g,m=>m.toUpperCase())}
function formatSpecValue(v){if(Array.isArray(v))return v.join(', ');if(v===true)return'Yes';if(v===false)return'No';if(v==null||v==='')return'—';return String(v)}
function toast(message,tone='ok'){const el=document.getElementById('toast');if(!el)return;el.textContent=message;el.classList.toggle('error',tone==='error');el.classList.add('show');clearTimeout(el._vtTimer);el._vtTimer=setTimeout(()=>el.classList.remove('show'),3500)}
function analytics(event,params={}){try{window.gtag?.('event',event,params)}catch{}}
async function loadStore(){const client=getClient();const [settings,categories,products]=await Promise.all([
 client.from('store_settings').select('*').eq('id','store').single(),
 client.from('store_categories').select('*').eq('is_active',true).order('sort_order'),
 client.from('store_products').select('*').eq('status','active').eq('visibility','public').neq('sale_mode','hidden').order('sort_priority',{ascending:false}).order('featured',{ascending:false}).order('name')
]);
 if(settings.error)throw settings.error;if(categories.error)throw categories.error;if(products.error)throw products.error;return{settings:settings.data,categories:categories.data||[],products:products.data||[]}}
async function getProductBySlug(slug){const r=await getClient().from('store_products').select('*').eq('slug',slug).eq('status','active').eq('visibility','public').neq('sale_mode','hidden').maybeSingle();if(r.error)throw r.error;return r.data}
async function getProductsByIds(ids){if(!ids.length)return[];const r=await getClient().from('store_products').select('*').in('id',ids).eq('status','active').eq('visibility','public');if(r.error)throw r.error;return r.data||[]}
async function getProductExtras(productId){const client=getClient();const [docs,rels]=await Promise.all([
 client.from('store_product_documents').select('*').eq('product_id',productId).order('sort_order'),
 client.from('store_product_relations').select('*').eq('product_id',productId).order('weight',{ascending:false})
]);
 if(docs.error)throw docs.error;if(rels.error)throw rels.error;const relatedIds=(rels.data||[]).map(x=>x.related_product_id);const related=await getProductsByIds(relatedIds);const byId=new Map(related.map(p=>[p.id,p]));return{documents:docs.data||[],relations:(rels.data||[]).map(r=>({...r,product:byId.get(r.related_product_id)})).filter(r=>r.product)}}
async function currentUser(){const r=await getClient().auth.getUser();return r.data?.user||null}
async function submitQuote(items,note=''){
 const client=getClient();const user=await currentUser();if(!user){sessionStorage.setItem('vt_store_return','store.html?cart=1');const e=new Error('SIGN_IN_REQUIRED');e.code='SIGN_IN_REQUIRED';throw e}
 const payload={items:items.map(i=>({productId:i.productId,quantity:i.quantity})),customerNote:String(note||'').trim().slice(0,1600)};
 const {data,error}=await client.functions.invoke('submit-store-cart',{body:payload});
 if(error){let msg=error.message||'Could not submit the parts request.';try{const body=await error.context?.json?.();if(body?.error)msg=body.error}catch{}throw new Error(msg)}
 if(data?.error)throw new Error(data.error);return data
}
function builderUrl(product){const id=product?.metadata?.builderId;return id?`builder/?add=${encodeURIComponent(id)}`:'builder/'}
window.VoltTechStore={getClient,esc,safeUrl,readCart,saveCart,addToCart,setCartQty,clearCart,cartCount,categoryLabel,mediaFor,formatPrice,formatSpecKey,formatSpecValue,toast,analytics,loadStore,getProductBySlug,getProductsByIds,getProductExtras,currentUser,submitQuote,builderUrl};
})();
