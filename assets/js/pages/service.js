import { connectCart, connectProductionServices } from '../services/home-integrations.js';
import { syncServiceContact, trackServiceClick } from '../services/service-contact.js';

const root=document.querySelector('[data-service-key]');
const rail=document.getElementById('symptomRail');
const detail=document.getElementById('symptomDetail');

function selectIssue(button){
  if(!root||!button)return;
  rail?.querySelectorAll('[data-issue]').forEach(item=>{
    const active=item===button;
    item.classList.toggle('active',active);
    item.setAttribute('aria-pressed',String(active));
  });
  if(detail){
    const title=detail.querySelector('h3');
    const copy=detail.querySelector('div>p:not(.eyebrow)');
    if(title)title.textContent=button.dataset.detailTitle||button.dataset.issueLabel||'Selected issue';
    if(copy)copy.textContent=button.dataset.detail||'Tell VoltTech what you are seeing and we can work from there.';
  }
  syncServiceContact(root,button);
  try{
    if(typeof window.gtag==='function')window.gtag('event','vt_service_symptom_select',{service_context:root.dataset.serviceKey,issue:button.dataset.issue||'',issue_label:button.dataset.issueLabel||''});
  }catch{}
}

function start(){
  connectProductionServices();
  connectCart();
  if(!root)return;
  const initial=rail?.querySelector('[data-issue].active')||rail?.querySelector('[data-issue]');
  if(initial)selectIssue(initial);
  rail?.addEventListener('click',event=>{
    const button=event.target.closest('[data-issue]');
    if(button)selectIssue(button);
  });
  root.addEventListener('click',event=>trackServiceClick(root,event),{capture:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
