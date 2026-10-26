// Open category disclosures when visitors follow an existing department anchor.
function revealDepartment(){
 const id=location.hash.slice(1);if(!id)return;
 const target=document.getElementById(id);if(!target)return;
 const disclosure=target.closest('.retail-departments');
 if(disclosure){disclosure.open=true;requestAnimationFrame(()=>target.scrollIntoView({block:'start'}));}
}
window.addEventListener('hashchange',revealDepartment);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',revealDepartment,{once:true});else revealDepartment();

// Shared product suggestions for the header, homepage and store search fields.
async function connectProductSearch(){
 const inputs=[...document.querySelectorAll('.retail-search input[type="search"],.department-search input[type="search"],#catalogue-search')];
 if(!inputs.length)return;
 const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('../css/product-search.css?v=20261026-search',document.currentScript?.src||new URL('assets/js/retail-experience.js',location.href)).href;document.head.append(style);
 try{const {attachSearchSuggestions}=await import('./services/product-search.js?v=20261026-search');inputs.forEach(attachSearchSuggestions);}catch{}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',connectProductSearch,{once:true});else connectProductSearch();
