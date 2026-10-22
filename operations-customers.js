export function customerDirectory(profiles=[],requests=[]){
 const rows=new Map(profiles.map(p=>[p.id,{...p,account_id:p.id}]));
 for(const r of [...requests].sort((a,b)=>new Date(b.submitted_at)-new Date(a.submitted_at))){
  const key=r.user_id||'guest:'+String(r.guest_email||r.id).trim().toLowerCase(),p=rows.get(key)||{id:key,account_id:r.user_id||null};
  for(const [field,value] of Object.entries({full_name:r.guest_name,billing_email:r.guest_email,phone:r.guest_phone,suburb:r.shipping_address?.suburb}))if(!p[field]&&value)p[field]=value;
  rows.set(key,p);
 }
 return [...rows.values()];
}
export function customerJobs(customer,jobs=[]){return jobs.filter(j=>customer.account_id?j.user_id===customer.account_id:!j.user_id&&String(j.email||'').toLowerCase()===String(customer.billing_email||'').toLowerCase());}
