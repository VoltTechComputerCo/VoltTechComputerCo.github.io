// Internal only: this module is used by the administrator billing workspace.
export function deliveryGroups(lines,offers,selections={}){
 const groups=new Map();
 for(const line of lines){
  if(!line.product_id)continue;
  const available=offers.filter(o=>o.product_id===line.product_id);
  const preferred=line.product_id.startsWith('syntech-')?'syntech':line.product_id.startsWith('lunatech-')?'lunatech':null;
  const offer=available.find(o=>o.supplier_id===selections[line.product_id])||available.find(o=>o.supplier_id===preferred)||available.toSorted((a,b)=>Number(b.stock_qty>0)-Number(a.stock_qty>0)||(['syntech','tarsus','esquire'].indexOf(a.supplier_id)+1||99)-(['syntech','tarsus','esquire'].indexOf(b.supplier_id)+1||99))[0];
  const id=offer?.supplier_id||'unassigned';
  if(!groups.has(id))groups.set(id,{id,name:offer?.supplier_name||'Unassigned supplier',costExcl:0,known:true,items:[]});
  const group=groups.get(id);if(offer?.cost_excl==null)group.known=false;else group.costExcl+=Number(offer.cost_excl)*Number(line.quantity||0);
  group.items.push({line,offer,available});
 }
 return [...groups.values()].map(g=>({...g,costExcl:Math.round(g.costExcl*100)/100,free:g.known&&((g.id==='syntech'&&Math.round(g.costExcl*100)>=250000)||(g.id==='lunatech'&&Math.round(g.costExcl*100)>=300000))}));
}
export function deliveryTotal(groups,fees,onward=0){
 let cents=Math.round(Number(onward||0)*100);if(!Number.isFinite(cents)||cents<0)throw Error('Enter a valid onward delivery amount.');
 for(const group of groups){const fee=fees[group.id];if(fee==null||fee===''||!Number.isFinite(Number(fee))||Number(fee)<0)throw Error('Confirm the delivery amount for '+group.name+' (enter 0 if collected or waived).');cents+=Math.round(Number(fee)*100);}
 return cents/100;
}

// Source: Mohamed, LunaTech IT, WhatsApp confirmation 25 October 2026.
// Purchase thresholds are private trade terms; do not use them as storefront free-delivery thresholds.
export function lunatechDeliveryQuote({subtotalExcl,known=true,service='',billableKg=null}){
 if(service==='collection')return {amount:0,note:'Collection arranged with LunaTech.'};
 if(!['local','major','same-day','regional'].includes(service))return {amount:null,note:'Select the delivery area and service.'};
 if(service!=='same-day'&&known&&Math.round(Number(subtotalExcl)*100)>=300000)return {amount:0,note:'Qualifies for standard free delivery from R3,000 excl. VAT. Confirm any unusual parcel requirements with LunaTech.'};
 const kg=Number(billableKg);
 if(service==='regional')return {amount:null,note:'Regional / outlying delivery is quoted per order.'};
 if(billableKg==null||billableKg===''||!Number.isFinite(kg)||kg<=0)return {amount:null,note:'Confirm billable weight (the greater of actual and volumetric weight).'};
 if(kg>3)return {amount:null,note:'Larger parcels need a size-based quote from LunaTech.'};
 if(service==='same-day')return {amount:115,note:'R100 excl. VAT, up to 3 kg, main JHB/PTA areas. Must be booked before 09:00; confirm availability. Not covered by the standard free-delivery rate.'};
 if(service==='major')return {amount:138,note:'R120 excl. VAT, major cities outside Gauteng, up to 3 kg billable weight.'};
 return {amount:109.25,note:'R95 excl. VAT, main Johannesburg / Pretoria areas. Confirm larger parcels separately.'};
}
