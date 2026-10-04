import { connectProductionServices } from '../services/home-integrations.js';

connectProductionServices();

const API='https://qdqhfnvwqvgesfdmocir.supabase.co/functions/v1';
const form=document.getElementById('static-subscribe-form');
const statusEl=document.getElementById('static-mailer-status');
const emailInput=document.getElementById('static-email');

function setStatus(message,tone=''){
  if(!statusEl)return;
  statusEl.textContent=message||'';
  statusEl.dataset.tone=tone;
}

async function call(path,payload){
  const response=await fetch(API+'/'+path,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    credentials:'omit',
    body:JSON.stringify(payload)
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(data?.error||'Something went wrong.');
  return data;
}

form?.addEventListener('submit',async event=>{
  event.preventDefault();
  if(!form.reportValidity())return;
  const submit=form.querySelector('button[type="submit"]');
  submit.disabled=true;
  setStatus('Sending confirmation…','working');
  try{
    const data=await call('static-subscribe',{
      email:emailInput?.value||'',
      website:form.elements.website?.value||''
    });
    setStatus(data?.message||'Check your inbox to confirm.','success');
    form.reset();
  }catch(error){
    setStatus(error instanceof Error?error.message:'Could not subscribe right now.','error');
  }finally{
    submit.disabled=false;
  }
});

async function handleLinkAction(){
  const params=new URLSearchParams(location.search);
  const confirm=params.get('confirm');
  const unsubscribe=params.get('unsubscribe');
  if(!confirm&&!unsubscribe)return;

  document.getElementById('subscribe')?.scrollIntoView({block:'center'});
  setStatus(confirm?'Confirming your subscription…':'Updating your subscription…','working');

  try{
    const data=await call(confirm?'static-confirm':'static-unsubscribe',{token:confirm||unsubscribe});
    setStatus(data?.message||'Done.','success');
  }catch(error){
    setStatus(error instanceof Error?error.message:'That link could not be processed.','error');
  }finally{
    params.delete('confirm');params.delete('unsubscribe');
    const clean=location.pathname+(params.toString()?'?'+params.toString():'')+'#subscribe';
    history.replaceState(null,'',clean);
  }
}

handleLinkAction();
