// Open category disclosures when visitors follow an existing department anchor.
function revealDepartment(){
 const id=location.hash.slice(1);if(!id)return;
 const target=document.getElementById(id);if(!target)return;
 const disclosure=target.closest('.retail-departments');
 if(disclosure){disclosure.open=true;requestAnimationFrame(()=>target.scrollIntoView({block:'start'}));}
}
window.addEventListener('hashchange',revealDepartment);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',revealDepartment,{once:true});else revealDepartment();
