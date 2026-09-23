const CONTACT = {
  repair:{label:'PC Repair',subject:'PC Repair Enquiry',intro:"I'd like help with a PC repair or diagnostic."},
  performance:{label:'PC Performance',subject:'PC Performance Enquiry',intro:"I'd like help improving my PC's performance."},
  upgrades:{label:'PC Upgrades',subject:'PC Upgrade Enquiry',intro:"I'm interested in upgrading my PC."},
  security:{label:'PC Security',subject:'PC Security Enquiry',intro:'I think my PC may have a security or malware problem.'},
  windows:{label:'Windows Installation',subject:'Windows Help Enquiry',intro:"I'd like help with a Windows installation or Windows-related issue."}
};

export function contactConfig(key){return CONTACT[key]||CONTACT.repair}

export function buildServiceMessage(key, issueLabel=''){
  const cfg=contactConfig(key);
  return ['Hi VoltTech,','',cfg.intro,issueLabel?`Selected issue: ${issueLabel}`:'','','Could you please advise me on the next step?'].filter((line,index,arr)=>line!==''||arr[index-1]!=='').join('\n').trim();
}

export function syncServiceContact(root, issueButton){
  const key=root?.dataset?.serviceKey||'repair';
  const cfg=contactConfig(key);
  const issue=issueButton?.dataset?.issue||'';
  const issueLabel=issueButton?.dataset?.issueLabel||'';
  const message=buildServiceMessage(key,issueLabel);
  const subject=issueLabel?`${cfg.subject} · ${issueLabel}`:cfg.subject;
  root.querySelectorAll('[data-service-whatsapp]').forEach(link=>{link.href=`https://wa.me/27618435775?text=${encodeURIComponent(message)}`});
  root.querySelectorAll('[data-service-email]').forEach(link=>{link.href=`mailto:volttechcomputerco@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`});
  root.querySelectorAll('[data-signal-link]').forEach(link=>{
    const u=new URL(link.getAttribute('href')||'signal-scan.html',location.href);
    u.searchParams.set('source',key);
    if(issue)u.searchParams.set('issue',issue);else u.searchParams.delete('issue');
    link.setAttribute('href',`${u.pathname.split('/').pop()}${u.search}`);
  });
  try{
    sessionStorage.setItem('vt_journey_context',JSON.stringify({key,label:cfg.label,issue:issue||null,issueLabel:issueLabel||null,page:location.pathname.split('/').pop()||'',at:Date.now()}));
  }catch{}
}

export function trackServiceClick(root,event){
  const link=event.target.closest('[data-service-whatsapp],[data-service-email],[data-signal-link]');
  if(!link)return;
  const route=link.matches('[data-service-whatsapp]')?'whatsapp':link.matches('[data-service-email]')?'email':'signal_scan';
  try{
    if(typeof window.gtag==='function')window.gtag('event','vt_service_handoff',{service_context:root?.dataset?.serviceKey||'unknown',route});
  }catch{}
}
