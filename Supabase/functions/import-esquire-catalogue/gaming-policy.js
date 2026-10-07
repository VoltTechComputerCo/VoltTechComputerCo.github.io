// Feed selection, not a stock reservation or a compatibility guarantee.
export function gamingProductAllowed(type,name,description=''){
 const n=String(name||'').toLowerCase(),text=n+' '+String(description||'').toLowerCase();
 if(/server|poweredge|xeon|enterprise|enterprice|surveillance|skyhawk|ironwolf|\bnas\b|\bn[3]00\b|\bs300\b|western digital purple|cctv|whiteboard|ps\/?2|disney|zakumi|calculator|ipad|professional desktop|cabinet fan|rack/.test(n))return false;
 if(type==='gpu')return /\brtx[ -]*[3-9][0-9]{3}(?:ti|super)?\b|\brx[ -]*[6-9][0-9]{3}(?:xt|xtx)?\b|\barc[ -]*[ab][0-9]{3}\b/.test(n)&&!/quadro|workstation|rtx pro/.test(n);
 if(type==='cpu'){const ryzen=n.match(/ryzen\s+[3579]\s+([0-9]{4,5})/),intel=n.match(/core\s+i[3579][ -]*([0-9]{4,5})/);return !!(ryzen&&Number(ryzen[1])>=5000||intel&&Number(intel[1])>=10000||/core ultra/.test(n));}
 if(type==='motherboard')return /\bam[45]\b|lga[ -]*(1200|1700|1851)|\b[abxh][56789][0-9]{2}/.test(text);
 if(type==='memory')return /\bddr[ -]?[45]\b/.test(text)&&!/so[ -]?dimm|\becc\b|registered/.test(n)&&!(/\b4gb\b/.test(n)&&!/\b(8|16|24|32|48|64|96|128)gb\b/.test(n));
 if(type==='storage')return /ssd|solid state|nvme/.test(text)&&!/external|portable|usb|bracket/.test(n);
 if(type==='psu'){const watts=text.match(/([0-9]{3,4})\s*w(?:att)?/);return !!(watts&&Number(watts[1])>=500&&/80[ -]*(plus|\+)|bronze|silver|gold|platinum|titanium/.test(text));}
 if(type==='case')return /case|chassis/.test(n);
 if(type==='cooler')return !/p4|freezer a30/.test(n)&&/\bam[45]\b|lga[ -]*(1200|1700|1851)|liquid|aio|crater m1|[1234][0-9]0mm/.test(text);
 if(type==='fan')return /120|140|gemini m1|pacelight/.test(text);
 if(type==='accessory')return /thermal.*(paste|compound)|heatsink compound/.test(n);
 if(type==='peripheral')return /gaming|gamer|trust.*gxt|ultragear|odyssey|hyperx|roccat kain|logitech.*(\bg[0-9]|pro x|c92[02]|z[0-9])|mechanical.*keyboard|thronmax|wrist rest|sharkoon.*(mat|purewriter|pacelight)|kwg orion/.test(n)||(/monitor/.test(n)&&/\b(1[2-9][0-9]|[2-9][0-9]{2})\s*hz/.test(text));
 return false;
}
