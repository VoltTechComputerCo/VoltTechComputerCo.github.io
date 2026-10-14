const groups=['Performance & memory','Connections','Power & dimensions','General'];
const sourceLabels=['GPU Model','Architecture','Compute Units','Stream Processors','API Support','Interface','Max Digital Resolution','Game Clock','Boost Clock','Memory Type','Memory Interface','Memory Clock','Ports','Multi-View','HDCP Support','Connector','Recommended PSU','Dimensions','Weight'];
export function plainDescription(product){return String(product.short_description||'').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/&#39;|&apos;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();}
export function groupedSpecifications(product){
 const rows=new Map(),text=plainDescription(product),start=text.search(/SPECIFICATIONS\s*:/i),end=text.search(/WHAT['’]S IN THE BOX\s*:/i);
 const source=start>=0?text.slice(start,end>start?end:undefined):'';
 const regex=new RegExp('('+sourceLabels.join('|')+')\\s*:','gi'),matches=[...source.matchAll(regex)];
 matches.forEach((m,i)=>{let value=source.slice(m.index+m[0].length,matches[i+1]?.index).replace(/(?:GPU & Architecture|Clock Speeds & Memory|Display Output|Power Requirements)\s*$/i,'').trim();if(value&&value.length<=180)rows.set(m[1].toLowerCase().replace(/\W/g,''),[m[1],value]);});
 Object.entries(product.specs||{}).forEach(([key,value])=>{if(value===null||value===''||['brand','ean','warranty','useCase','productKind'].includes(key))return;const name=key.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());rows.set(name.toLowerCase().replace(/\W/g,''),[name,value]);});
 const result=Object.fromEntries(groups.map(g=>[g,[]]));
 for(const row of rows.values()){
  const key=row[0].toLowerCase();
  const group=/memory/.test(key)?groups[0]:/connector|ports|hdcp|multi.view|connection|bluetooth|usb|hdmi|displayport|wireless|interface(?!.*memory)/.test(key)?groups[1]:/power|psu|watt|tdp|dimension|weight|form.factor|size|length|socket|radiator/.test(key)?groups[2]:/gpu|architecture|compute|stream|memory|clock|capacity|speed|cores|threads|vram|chipset|refresh|resolution|sensor|dpi|polling|api/.test(key)?groups[0]:groups[3];
  result[group].push(row);
 }
 return result;
}
export function productKeyFacts(product){
 const grouped=groupedSpecifications(product),rows=Object.values(grouped).flat();
 const priority=['memorytype','vramgb','capacitygb','boostclock','refreshratehz','resolution','socket','cores','speedmts','wattage','interface','connection','recommendedpsu','sensor'];
 rows.sort((a,b)=>{const rank=r=>{const index=priority.indexOf(r[0].toLowerCase().replace(/\W/g,''));return index<0?999:index;};return rank(a)-rank(b);});
 const useful=rows.filter(r=>!/ean|brand|colour|color|use.case|product.kind|gpu.model/i.test(r[0])).slice(0,4);
 if(!useful.length){if(product.specs?.productKind)useful.push(['Type',product.specs.productKind]);if(product.warranty_months!=null)useful.push(['Warranty',product.warranty_months+' months']);else if(product.specs?.warranty)useful.push(['Warranty',product.specs.warranty]);}
 return useful;
}
export function briefDescription(product){
 const intro=plainDescription(product).split(/(?:FEATURES|SPECIFICATIONS|WHAT['’]S IN THE BOX)\s*:/i)[0];
 const sentence=intro.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim()||intro;
 if(sentence.length<=180)return sentence;const head=sentence.slice(0,177),breakAt=head.lastIndexOf(' ');return head.slice(0,breakAt>100?breakAt:177)+'…';
}
