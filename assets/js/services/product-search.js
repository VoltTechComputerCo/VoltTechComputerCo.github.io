export const normalizeSearch=value=>String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const compact=value=>normalizeSearch(value).replaceAll(' ','');
export function editDistance(a,b){
 let row=Array.from({length:b.length+1},(_,i)=>i);
 for(let i=1;i<=a.length;i++){const next=[i];for(let j=1;j<=b.length;j++)next[j]=Math.min(next[j-1]+1,row[j]+1,row[j-1]+(a[i-1]===b[j-1]?0:1));row=next;}
 return row[b.length];
}
const indexCache=new WeakMap();
function index(products){
 if(indexCache.has(products))return indexCache.get(products);
 const rows=products.map(p=>({p,brand:compact(p.brand),name:normalizeSearch(p.name),model:compact(p.model||p.identifiers?.mpn||p.identifiers?.sku),text:normalizeSearch([p.name,p.brand,p.model,JSON.stringify(p.identifiers||{}),p.short_description,JSON.stringify(p.specs||{}),JSON.stringify(p.compatibility||{}),...(p.highlights||[])].join(' '))}));
 const result={rows,brands:[...new Set(rows.map(r=>r.brand).filter(Boolean))]};indexCache.set(products,result);return result;
}
export function localSearch(products,query){
 const q=normalizeSearch(query),words=q.split(' ');if(!q)return new Map(products.map(p=>[p.id,0]));
 const {rows,brands}=index(products);let chosen=null;const candidates=[];
 for(const brand of brands)for(let n=1;n<=Math.min(3,words.length);n++){
  const typed=words.slice(0,n).join('');let score=0;
  if(brand===typed)score=2;
  else if(n===words.length&&typed.length>=2&&brand.startsWith(typed))score=1;
  else if(typed.length>=4&&Math.abs(brand.length-typed.length)<=2){const distance=editDistance(brand,typed);if(distance<=2)score=.7-distance*.08;}
  if(score)candidates.push({brand,n,score});
 }
 candidates.sort((a,b)=>b.score-a.score||b.n-a.n);chosen=candidates[0]||null;if(chosen&&candidates.some(c=>c.brand!==chosen.brand&&c.score>=chosen.score-.07))chosen=null;
 const terms=(chosen?words.slice(chosen.n):words).filter(Boolean),result=new Map();
 for(const row of rows){
  if(chosen&&row.brand!==chosen.brand)continue;
  const match=terms.every(term=>row.text.includes(term)||row.name.split(' ').some(w=>term.length>=4&&Math.abs(w.length-term.length)<=1&&editDistance(w,term)<=1));
  if(!match&&!compact(row.name).includes(terms.join('')))continue;
  const score=(chosen?10:0)+(row.model===compact(q)?20:0)+(row.name.includes(q)?5:0)+(row.p.stock_qty>0?1:0);
  result.set(row.p.id,score);
 }
 return result;
}

const cache=new Map();
export async function searchCatalogue(query,request=fetch){
 const key=normalizeSearch(query);if(key.length<2)return {matches:[],suggestions:[],brand:null};
 const existing=cache.get(key);if(existing&&Date.now()-existing.time<60000)return existing.promise;
 const promise=(async()=>{
  const config=globalThis.window?.VOLTTECH_SUPABASE;if(!config)throw Error('Search connection unavailable');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),4000);
  try{
   const response=await request(`${config.url}/rest/v1/rpc/search_store_products`,{method:'POST',headers:{apikey:config.publishableKey,'Content-Type':'application/json'},body:JSON.stringify({p_query:key.slice(0,120)}),signal:controller.signal});
   if(!response.ok)throw Error('Search temporarily unavailable');
   const data=await response.json();if(!Array.isArray(data?.matches)||!Array.isArray(data?.suggestions))throw Error('Invalid search response');return data;
  }finally{clearTimeout(timer);}
 })();cache.set(key,{time:Date.now(),promise});if(cache.size>60)cache.delete(cache.keys().next().value);
 promise.catch(()=>{if(cache.get(key)?.promise===promise)cache.delete(key);});return promise;
}

let serial=0;
export function attachSearchSuggestions(input){
 if(input.dataset.suggestionsReady)return;input.dataset.suggestionsReady='true';
 // A text combobox avoids native search-field Escape behavior clearing the query.
 input.type='text';input.inputMode='search';
 const host=input.parentElement;host.classList.add('product-search-host');
 const list=document.createElement('div');list.id=`product-search-options-${++serial}`;list.className='product-search-options';list.setAttribute('role','listbox');list.setAttribute('aria-label','Product search suggestions');list.hidden=true;host.append(list);
 input.setAttribute('role','combobox');input.setAttribute('aria-autocomplete','list');input.setAttribute('aria-controls',list.id);input.setAttribute('aria-expanded','false');input.setAttribute('autocomplete','off');
 let timer,version=0,active=-1;
 function close(){list.hidden=true;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');active=-1;}
 function select(i){const options=[...list.querySelectorAll('[role="option"]')];active=i;options.forEach((o,n)=>o.setAttribute('aria-selected',String(n===i)));if(options[i]){input.setAttribute('aria-activedescendant',options[i].id);options[i].scrollIntoView({block:'nearest'});}}
 function option(label,url,detail){
  const a=document.createElement('a');a.id=`${list.id}-${list.children.length}`;a.href=url;a.setAttribute('role','option');a.setAttribute('aria-selected','false');a.tabIndex=-1;
  const name=document.createElement('span');name.textContent=label;a.append(name);if(detail){const small=document.createElement('small');small.textContent=detail;a.append(small);}list.append(a);
 }
 async function suggest(){
  const query=input.value.trim(),token=++version;if(normalizeSearch(query).length<2){close();return;}
  try{
   const data=await searchCatalogue(query);if(token!==version||input.value.trim()!==query||document.activeElement!==input)return;
   list.replaceChildren();active=-1;
   if(data.brand)option(`Shop all ${data.brand}`,`store.html?q=${encodeURIComponent(data.brand)}#catalogue`,'Browse the full brand range');
   for(const p of data.suggestions)option(p.name,`product.html?slug=${encodeURIComponent(p.slug)}`,p.retail_price==null?p.brand:new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR'}).format(p.retail_price));
   option(`View all ${data.matches.length} results`,`store.html?q=${encodeURIComponent(query)}#catalogue`,data.matches.length?'Search the full catalogue':'Try a brand, model or product type');
   list.hidden=false;input.setAttribute('aria-expanded','true');
  }catch{if(token===version)close();}
 }
 input.addEventListener('input',()=>{version++;clearTimeout(timer);close();timer=setTimeout(suggest,180);});
 input.addEventListener('focus',()=>{if(input.value.trim())suggest();});
 input.addEventListener('keydown',event=>{
  if(event.key==='Escape'){event.preventDefault();event.stopPropagation();version++;clearTimeout(timer);close();return;}
  if(list.hidden)return;const options=[...list.querySelectorAll('[role="option"]')];
  if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();select((active+(event.key==='ArrowDown'?1:-1)+options.length)%options.length);}
  if(event.key==='Enter'&&active>=0){event.preventDefault();event.stopPropagation();options[active].click();}
  if(event.key==='Tab')close();
 });
 document.addEventListener('pointerdown',event=>{if(!host.contains(event.target)){version++;close();}});
 host.addEventListener('focusout',()=>{setTimeout(()=>{if(!host.contains(document.activeElement)){version++;close();}},0);});
}
