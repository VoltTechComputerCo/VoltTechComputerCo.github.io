(()=>{
'use strict';
const params=new URLSearchParams(location.search),id=params.get('add');
if(!id||!/^vt-[a-z0-9-]+$/i.test(id))return;
const type=(()=>{if(id.startsWith('vt-cpu-'))return'cpu';if(id.startsWith('vt-gpu-'))return'gpu';if(id.startsWith('vt-mb-'))return'motherboard';if(id.startsWith('vt-mem-'))return'memory';if(id.startsWith('vt-ssd-'))return'storage';if(id.startsWith('vt-psu-'))return'psu';if(id.startsWith('vt-case-'))return'case';if(id.startsWith('vt-cooler-'))return'cooler';if(id.startsWith('vt-fan-'))return'fans';return''})();
let tries=0;
function attempt(){
 tries++;
 const manual=document.getElementById('hero-advanced')||document.getElementById('choose-advanced');
 const layout=document.getElementById('builder-layout');
 if(layout?.hidden&&manual)manual.click();
 const step=type?document.querySelector(`[data-category="${CSS.escape(type)}"]`):null;
 if(step&&!step.classList.contains('active'))step.click();
 const select=document.querySelector(`[data-select-product="${CSS.escape(id)}"]`);
 if(select&&!select.disabled){select.click();announce();cleanUrl();return}
 if(tries<80)setTimeout(attempt,125);
 else announce(`We opened Signal Build, but couldn't preselect that component automatically. Search for it by name to continue.`,'warn');
}
function announce(message='Component added from the VoltTech PC Parts store.'){
 const note=document.createElement('div');note.textContent=message;note.setAttribute('role','status');Object.assign(note.style,{position:'fixed',left:'50%',bottom:'18px',transform:'translateX(-50%)',zIndex:'9999',maxWidth:'calc(100% - 24px)',padding:'11px 14px',border:'1px solid rgba(47,230,200,.5)',borderRadius:'8px',background:'#081516',color:'#dff8f2',font:'700 10px JetBrains Mono,monospace',boxShadow:'0 12px 30px rgba(0,0,0,.35)'});document.body.append(note);setTimeout(()=>note.remove(),3500)
}
function cleanUrl(){const u=new URL(location.href);u.searchParams.delete('add');history.replaceState(null,'',u.pathname+u.search+u.hash)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(attempt,100),{once:true});else setTimeout(attempt,100);
})();
