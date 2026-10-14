import { systemKind } from './system-classification.js';
// Broad PC catalogue, including previous generations and laptop upgrades.
export function gamingProductAllowed(type,name,description=''){
 const n=String(name||'').toLowerCase(),t=n+' '+String(description||'').toLowerCase();
 if(type==='laptop')return systemKind(name,description)==='laptop';
 if(systemKind(name,description)==='desktop'||/mini[- ]?pc|mini desktop|desktop\s+pc|professional desktop|^giada\s|gaming pc|creator pc/.test(n))return type==='peripheral'&&!/server|poweredge/.test(n);
 if(/server|poweredge|enterprise|enterprice|surveillance|skyhawk|western digital purple|cctv|whiteboard|ps\/?2|disney|zakumi|calculator|ipad|cabinet fan|food processor|microprocessor control|blender|kettle|toaster|air fryer|coffee maker|vacuum|heater|hair dryer|shaver|hair clipper|pedestal fan|desk fan|ceiling fan|mellerware|russell hobbs|taurus |feelive/.test(n))return false;
 if(type==='gpu')return /geforce|\b(?:rtx|gtx|gt)[ -]*\d{3,4}|radeon|\brx[ -]*\d{3,4}|arc[ -]*[ab]\d{3}/.test(n)&&!/quadro|rtx pro|tesla/.test(n);
 if(type==='cpu')return /ryzen|core\s+(?:i[3579]|ultra)|athlon|pentium|celeron|processor/.test(n);
 if(type==='motherboard')return /motherboard|mainboard|am[345]|lga[ -]*\d{3,4}|[abxh][1-9][0-9]{2}/.test(t);
 if(type==='memory')return /ddr[ -]?[2345]\b|memory module/.test(t)&&!/ecc|registered/.test(n);
 if(type==='storage')return /ssd|solid state|nvme|hard (disk|drive)|hdd/.test(t)&&!/bracket/.test(n);
 if(type==='psu')return /([3-9][0-9]{2}|[1-9][0-9]{3})\s*w/.test(t);
 if(type==='case')return /case|chassis|tower/.test(t);
 if(type==='cooler')return /cooler|cooling|heatsink|liquid|aio/.test(t);
 if(type==='fan')return /fan/.test(t);
 if(type==='accessory')return /thermal|heatsink compound|cable|adapter|adaptor|hub|docking|enclosure|mount|arm|stand|chair|mousepad|mouse pad|mouse mat|wrist|desk|lighting|controller|bracket|keyboard|bag|sleeve|backpack|lock|charger|router|network|wi.fi|access point|\bups\b|surge|power strip|power bank|power station|inverter|card reader/.test(t);
 if(type==='peripheral')return /galaxy tab|tablet|keyboard|mouse|mice|monitor|headset|headphone|earphone|earbud|microphone|gaming mic|speaker|soundbar|pop filter|shock mount|webcam|controller|racing|wheel|pedal|flight|joystick|audio interface|capture/.test(t);
 return false;
}
