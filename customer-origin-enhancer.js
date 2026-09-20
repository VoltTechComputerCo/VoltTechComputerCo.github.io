(function(){
'use strict';
if(window.__vtCustomerOriginEnhancerV2)return;
window.__vtCustomerOriginEnhancerV2=true;

const page=(location.pathname.split('/').pop()||'').toLowerCase();
const id=new URLSearchParams(location.search).get('id');

async function getOrigin(){
  if(!id||typeof supabase==='undefined'||typeof VOLTTECH_SUPABASE==='undefined')return null;
  const table=page==='quote.html'?'quotes':page==='invoice.html'?'invoices':null;
  if(!table)return null;

  const client=supabase.createClient(
    VOLTTECH_SUPABASE.url,
    VOLTTECH_SUPABASE.publishableKey
  );

  const {data,error}=await client
    .from(table)
    .select('source_type,source_id,source_metadata')
    .eq('id',id)
    .maybeSingle();

  if(error||!data?.source_type)return null;
  return data;
}

function inject(data){
  const sheet=document.querySelector('#document .sheet');
  if(!sheet||sheet.querySelector('.vt-doc-origin[data-vt-origin]'))return false;

  const label=data.source_type==='builder'
    ?'Builder configuration'
    :data.source_type==='store'
      ?'Store order'
      :'VoltTech source';

  const box=document.createElement('div');
  box.className='vt-doc-origin';
  box.dataset.vtOrigin='1';
  box.innerHTML=`<b>${label}</b><span>This ${page==='quote.html'?'quotation':'invoice'} remains linked to its original ${data.source_type==='builder'?'saved build':'commerce'} record.</span>`;

  if(data.source_type==='builder'&&data.source_id){
    const a=document.createElement('a');
    a.className='vt-origin-link';
    a.href=`build-document.html?id=${encodeURIComponent(data.source_id)}`;
    a.textContent='View source build →';
    box.appendChild(a);
  }

  const grid=sheet.querySelector('.grid');
  if(grid)grid.insertAdjacentElement('afterend',box);
  else sheet.prepend(box);
  return true;
}

async function init(){
  const data=await getOrigin();
  if(!data)return;

  if(inject(data))return;

  const host=document.querySelector('#document');
  if(!host)return;

  const observer=new MutationObserver(()=>{
    if(inject(data))observer.disconnect();
  });

  observer.observe(host,{childList:true,subtree:true});

  setTimeout(()=>observer.disconnect(),12000);
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',init,{once:true});
}else{
  init();
}
})();