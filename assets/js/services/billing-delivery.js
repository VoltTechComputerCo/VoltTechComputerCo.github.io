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
 return [...groups.values()].map(g=>({...g,costExcl:Math.round(g.costExcl*100)/100,free:g.id==='syntech'&&g.known&&Math.round(g.costExcl*100)>=250000}));
}
export function deliveryTotal(groups,fees,onward=0){
 let cents=Math.round(Number(onward||0)*100);if(!Number.isFinite(cents)||cents<0)throw Error('Enter a valid onward delivery amount.');
 for(const group of groups){const fee=fees[group.id];if(fee==null||fee===''||!Number.isFinite(Number(fee))||Number(fee)<0)throw Error('Confirm the delivery amount for '+group.name+' (enter 0 if collected or waived).');cents+=Math.round(Number(fee)*100);}
 return cents/100;
}
