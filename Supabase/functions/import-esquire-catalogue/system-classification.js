// Identify whole computers before looking for components mentioned in their specifications.
export function systemKind(name, category = '') {
 const n=String(name||'').toLowerCase().replace(/[®™]/g,''), c=String(category||'').toLowerCase();
 // Accessory identity must win over model names and hardware listed as compatibility.
 if(/handheld|gaming console|galaxy tab|\btablet\b/.test(n))return '';
 if(/^bti\b|travelmate\.mobi|backpack|blackpack|briefcase|dashpack|clamshell|folio|privacy filter|screen protector|luggage|cable lock|lock plate|charging station|charging trolley|conversion kit|laptop desk|notebook desk|foldable laptop|hardware support|onsite hw support|ssd for|ssd.*macbook|(?:laptop|notebook)\s+(?:bag|case|sleeve|battery|charger|adapter|stand|memory|cable|cooler)/.test(n.split("|")[0].slice(0,90)))return '';
 const systemHardware=/\b\d+\s*gb\b/.test(n)&&/\b(?:ssd|nvme|emmc)\b|\b\d+\s*tb\b|\b(?:256|512)\s*gb\b/.test(n);
 const systemOS=/windows?\s*11|win\s*11|w11[ph]|thinpro|freedos|chromeos|macos/.test(n);
 const systemOEM=/^(?:hp|lenovo|dell|acer|acerlite|asus|microsoft|pcbuilder|giada)\b/.test(n);
 if(systemOEM&&systemHardware&&/^lenovo\s+(?:tb\s|v1[45]|ideapad)/.test(n))return 'laptop';

 if(/^(?:asus\s+nuc|giada\s|dell\s+pro\s+slim)/.test(n)||(/\b(?:desktop|gaming|creator)\s+pc\b|\bmini\s+desktop\s+pc\b/.test(n)&&!/charger|power supply|adapter|memory|cpu|processor/.test(n)))return 'desktop';
 if(systemHardware&&systemOEM&&(/\b(?:home|gaming|desktop)\s+pc\b|\brog\s+g\d{3}\b/.test(n)||/computers?\s*>\s*desktop/.test(c)))return 'desktop';
 if(systemOEM&&/^hp\s+(?:250r\w*|255r\w*|15s)\b/.test(n))return 'laptop';
 if(systemOEM&&/^acer(?:lite|\s+(?:go|spin|swift|lite|etbook))\b/.test(n)&&systemOS)return 'laptop';
 if(systemOEM&&/^dell\s+(?:pro\s+)?(?:13|14|15|16|intel)\b/.test(n)&&systemHardware&&systemOS)return 'laptop';
 if(systemOEM&&systemHardware&&systemOS&&/\b(?:1[0-9](?:\.\d+)?\s*(?:inch|in\b|["″])|laptop|notebook)\b/.test(n))return 'laptop';
 // A named notebook with installed memory and storage is a system, even when
 // the supplier abbreviates CPU/OS names or includes SO-DIMM in its full spec.
 const notebookModel=/^(?:hp\s+(?:omen|victus|elitebook|probook|zbook|200|255r)|lenovo\s+(?:thinkpad|ideapad|thinkbook)|microsoft\s+surface\s+laptop)\b/.test(n);
 const installedHardware=/\b\d+\s*gb\b/.test(n)&&/\b\d+\s*tb\b|\b(?:ssd|nvme|pcie)\b/.test(n);
 const oem=/^(?:hp|lenovo|dell|acer|asus|microsoft)\b/.test(n);
 if(oem&&installedHardware&&/\b1[0-9](?:\.\d+)?\s*(?:inch|in\b|["″])/.test(n)&&/\b(?:intel|ryzen|core|ultra|celeron)\b/.test(n))return 'laptop';
 if(installedHardware&&/^hp\s+(?:250r\w*|255r\w*)\b/.test(n))return 'laptop';
 if(installedHardware&&/^lenovo\s+[xte][0-9]+\b/.test(n))return 'laptop';
 if(oem&&/\b(?:thin ?client|eliteboard|elite t[0-9]|ids elite t[0-9])/.test(n))return 'desktop';
 if(oem&&installedHardware&&/vesa mount/.test(n))return 'desktop';
 if(notebookModel&&installedHardware&&!/^(?:.*\b)?(?:replacement|upgrade kit|memory for|battery for)\b/.test(n))return 'laptop';
 if(/^(?:hp\s+(?:zbook|250r)|acer\s+(?:lite|etbook)|lenovo\s+[xte][0-9])\b/.test(n)&&!/bag|sleeve|charger|adapter|battery replacement/.test(n))return 'laptop';
 if(/^dell pro precision/.test(n)&&/\b(?:14|16)\b/.test(n))return 'laptop';
 const accessory=/^(?:.{0,35}\b)?(?:laptop|notebook)\s+(?:bag|case|sleeve|battery|charger|adapter|stand|memory|cable|cooler)\b|\b(?:ssd for|ssd.*macbook|notebook memory|laptop memory|memory module|cable lock|lock plate|privacy filter|3 leaf clover|backpack|briefcase|clamshell)\b/;
 const portable=/\b(?:battery|[0-9]+-cell|[0-9]+\.?[0-9]*whr)\b/.test(n)&&/\b(?:intel|core|ryzen|mediatek|kompanio)\b/.test(n)&&/1[0-9](?:[.,][0-9]+)?[\"″]/.test(n);
 const configured=/windows\s*11|win\s*11|w11\s*p|w11h|thinpro|freedos|chromeos|macos/.test(n)&&/\bssd\b|solid state|emmc|nvme/.test(n);
 if(/^(?:hp\s+(?:prodesk|elitedesk|proone|prostudio)|dell\s+(?:tower|pro tower|pro micro|precision)|lenovo\s+(?:thinkcentre|tc neo))\b/.test(n))return 'desktop';
 if(configured&&/^lenovo\s+m[0-9]+s\b/.test(n))return 'desktop';
 if(configured&&/^(?:hp|dell|lenovo|acer)\b/.test(n)&&/2[0-9](?:\.[0-9]+)?[\"″]/.test(n))return 'desktop';
 if(configured&&/\b(?:omen|victus|elitebook|probook)\b|\bnb\s*1[0-9](?:in|\b)/.test(n)&&!/desktop|tower/.test(n))return 'laptop';
 if(/mini[- ]?pc|gaming pc|creator pc|prebuilt/.test(n)&&!/mount|bracket|stand/.test(n))return 'desktop';
 if(portable||(configured&&/^dell\s+(?:14|16)\s+premium\b/.test(n)))return 'laptop';
 if(!configured&&(accessory.test(n)||/\b(mouse|keyboard|headset|headphone|monitor|enclosure|hub|dock|docking|lock|bag|sleeve|charger|adapter|adaptor|cable|stand|mount)\b/.test(n)))return '';
 const laptop=/\b(laptop|notebook|macbook|chromebook|vivobook|zenbook|thinkpad|thinkbook|elitebook|probook|latitude|alienware|extensa|travelmate|nitro|aspire|ideapad)\b|\bacer\s+(?:tmp|tmx|exo|al)\d|\bdell pro (?:14|16)\b/.test(n)||/laptop|notebook/.test(c);
 if(laptop && (configured||!/\b(bag|sleeve|battery|charger|adapter|adaptor|docking|stand|replacement|protector|sodimm|power supply)\b/.test(n)))return 'laptop';
 if(configured&&/battery|\b(?:fhd|hd)\/?ir cam|camera shutter/.test(n))return 'laptop';
 if(configured&&/\b(desktop|tower|twr|micro|sff|tiny|thinkcentre|prodesk|elitedesk|proone|prostudio|precision|all-in-one|aio)\b|\blenovo (?:neo|tc)|\bacer vs\d/.test(n))return 'desktop';
 if(/^(?:minisforum|giada)\b.*barebone/.test(n))return 'desktop';
 if(/^lenovo\s+(?:intel core|amd ryzen)/.test(n)&&systemHardware)return /battery|\b1[0-9](?:\.\d+)?[\"″]/.test(n)?'laptop':'desktop';
 return '';
}

