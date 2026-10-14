// Identify whole computers before looking for components mentioned in their specifications.
export function systemKind(name, category = '') {
 const n=String(name||'').toLowerCase(), c=String(category||'').toLowerCase();
 const accessory=/^(?:.{0,35}\b)?(?:laptop|notebook)\s+(?:bag|case|sleeve|battery|charger|adapter|stand|memory|cable|cooler)\b|\b(?:ssd for|ssd.*macbook|notebook memory|laptop memory|memory module|cable lock|lock plate|privacy filter|3 leaf clover|backpack|briefcase|clamshell)\b/;
 const portable=/\b(?:battery|[0-9]+-cell|[0-9]+\.?[0-9]*whr)\b/.test(n)&&/\b(?:intel|core|ryzen|mediatek|kompanio)\b/.test(n)&&/1[0-9](?:[.,][0-9]+)?[\"″]/.test(n);
 const configured=/windows\s*11|win\s*11|w11\s*p|w11h|thinpro|freedos|chromeos|macos/.test(n)&&/\bssd\b|solid state|emmc|nvme/.test(n);
 if(/^(?:hp\s+(?:prodesk|elitedesk|proone|prostudio)|dell\s+(?:tower|pro tower|pro micro|precision)|lenovo\s+(?:thinkcentre|tc neo))\b/.test(n))return 'desktop';
 if(configured&&/^lenovo\s+m[0-9]+s\b/.test(n))return 'desktop';
 if(configured&&/^(?:hp|dell|lenovo|acer)\b/.test(n)&&/2[0-9](?:\.[0-9]+)?[\"″]/.test(n))return 'desktop';
 if(portable||(configured&&/^dell\s+(?:14|16)\s+premium\b/.test(n)))return 'laptop';
 if(!configured&&(accessory.test(n)||/\b(mouse|keyboard|headset|headphone|monitor|enclosure|hub|dock|docking|bag|sleeve|charger|adapter|adaptor|cable|stand|mount)\b/.test(n)))return '';
 const laptop=/\b(laptop|notebook|macbook|chromebook|vivobook|zenbook|thinkpad|thinkbook|elitebook|probook|latitude|alienware|extensa|travelmate|nitro|aspire|ideapad)\b|\bacer\s+(?:tmp|tmx|exo|al)\d|\bdell pro (?:14|16)\b/.test(n)||/laptop|notebook/.test(c);
 if(laptop && (configured||!/\b(bag|sleeve|battery|charger|adapter|adaptor|docking|stand|replacement|protector|sodimm|power supply)\b/.test(n)))return 'laptop';
 if(configured&&/battery|\b(?:fhd|hd)\/?ir cam|camera shutter/.test(n))return 'laptop';
 if(configured&&/\b(desktop|tower|twr|micro|sff|tiny|thinkcentre|prodesk|elitedesk|proone|prostudio|precision|all-in-one|aio)\b|\blenovo (?:neo|tc)|\bacer vs\d/.test(n))return 'desktop';
 return '';
}
