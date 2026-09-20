(function(){
'use strict';
if(window.__vtCustomerOriginEnhancer)return;
window.__vtCustomerOriginEnhancer=true;

async function init(){
  if(typeof supabase==='undefined'||typeof VOLTTECH_SUPABASE==='undefined')return;
  const client=supabase.createClient(VOLTTECH_SUPABASE.url,VOLTTECH_SUPABASE.publishableKey);
  const page=(location.pathname.split('/').pop()||'').toLowerCase();
  const id=new URLSearchParams(location.search).get('id');
  if(!id)return;

  const table=page==='quote.html'?'quotes':page==='invoice.html'?'invoices':null;
  if(!table)return;

  const {data,error}=await client.from(table).select('source_type,source_id,source_metadata').eq('id',id).maybeSingle();
  if(error||!data?.source_type)return;

  const sheet=document.querySelector('#document .sheet');
  if(!sheet)return;

  const label=data.source_type==='builder'?'Builder configuration':data.source_type==='store'?'Store order':'VoltTech source';
  const box=document.createElement('div');
  box.className='vt-doc-origin';
  box.innerHTML=`<b>${label}</b><span>This ${page==='quote.html'?'quotation':'invoice'} remains linked to its original ${data.source_type==='builder'?'saved build':'commerce'} record.</span>`;

  const grid=sheet.querySelector('.grid');
  if(grid)grid.insertAdjacentElement('afterend',box);
  else sheet.prepend(box);

  if(data.source_type==='builder'&&data.source_id){
    const a=document.createElement('a');
    a.className='vt-origin-link';
    a.href=`build-document.html?id=${encodeURIComponent(data.source_id)}`;
    a.textContent='View source build →';
    box.appendChild(a);
  }
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,80),{once:true});
else setTimeout(init,80);
})();