export const cents=value=>Math.round(Number(value||0)*100);
export function invoiceProfit(doc,lines,financials={}){
 let purchase=0,complete=true;const rows=lines.map((line,index)=>{
  const saved=(financials.items||[]).find(i=>Number(i.position)===Number(line.position??index+1)&&String(i.product_id||'')===String(line.product_id||''));
  const cost=saved?.cost_incl;const known=cost!==null&&cost!==undefined&&cost!==''&&Number.isFinite(Number(cost))&&Number(cost)>=0;
  if(!known)complete=false;else purchase+=Math.round(Number(line.quantity||0)*cents(cost));
  const sale=Number(line.unit_price||0),unit=known?Number(cost):null;
  return {cost:unit,markup:unit>0?(sale/unit-1)*100:null,profit:known?(Math.round(Number(line.quantity||0)*cents(sale))-Math.round(Number(line.quantity||0)*cents(unit)))/100:null};
 });
 const revenue=cents(doc.subtotal)-cents(doc.discount_total),gross=complete?(revenue-purchase)/100:null;
 const shipping=financials.shipping_cost,shippingKnown=shipping!==null&&shipping!==undefined&&shipping!==''&&Number.isFinite(Number(shipping))&&Number(shipping)>=0;
 const fees=cents(financials.payment_fees)+cents(financials.other_costs);
 const net=complete&&shippingKnown?(cents(doc.total)-purchase-cents(shipping)-fees)/100:null;
 return {rows,cost:complete?purchase/100:null,gross,net,markup:complete&&purchase>0?(revenue/purchase-1)*100:null,margin:complete&&revenue>0?(revenue-purchase)/revenue*100:null,complete,shippingKnown};
}
