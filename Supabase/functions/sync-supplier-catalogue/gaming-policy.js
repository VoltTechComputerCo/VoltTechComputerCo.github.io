// Curated PC store safety filter. Syntech syncing only touches already selected SKUs.
export function gamingProductAllowed(type,name,description=''){
 const n=String(name||'').toLowerCase(),t=n+' '+String(description||'').toLowerCase();
 if(/server|poweredge|enterprise|surveillance|skyhawk|ironwolf|western digital purple|cctv|whiteboard|ps\/?2|disney|zakumi|calculator|ipad|cabinet fan/.test(n))return false;
 if(type==='gpu')return /rtx[ -]*[3-9][0-9]{3}|rx[ -]*[6-9][0-9]{3}|arc[ -]*[ab][0-9]{3}/.test(n)&&!/quadro|rtx pro/.test(n);
 if(type==='cpu'){const m=n.match(/ryzen\s+[3579]\s+(\d{4,5})|core\s+i[3579][ -]*(\d{4,5})/);return /core ultra/.test(n)||!!(m&&Number(m[1]||m[2])>=(m[1]?5000:10000));}
 if(type==='motherboard')return /am[45]|lga[ -]*(1200|1700|1851)|[abxh][56789][0-9]{2}/.test(t);
 if(type==='memory')return /ddr[ -]?[45]/.test(t)&&!/so[ -]?dimm|ecc|registered/.test(n);
 if(type==='storage')return /ssd|solid state|nvme|hard (disk|drive)|hdd/.test(t)&&!/bracket/.test(n);
 if(type==='psu')return /([3-9][0-9]{2}|[1-9][0-9]{3})\s*w/.test(t);
 if(type==='case')return /case|chassis|tower/.test(t);
 if(type==='cooler')return /cooler|cooling|heatsink|liquid|aio/.test(t);
 if(type==='fan')return /fan/.test(t);
 if(type==='accessory')return /thermal|heatsink compound|cable|adapter|adaptor|hub|docking|enclosure|mount|arm|stand|chair|mousepad|mouse pad|mouse mat|wrist|desk|lighting|controller|bracket|keyboard/.test(t);
 if(type==='peripheral')return /keyboard|mouse|mice|monitor|headset|headphone|microphone|gaming mic|speaker|webcam|controller|racing|wheel|pedal|flight|joystick|audio interface|capture/.test(t);
 return false;
}
