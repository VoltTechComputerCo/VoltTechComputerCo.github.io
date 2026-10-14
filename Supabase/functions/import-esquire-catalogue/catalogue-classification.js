import { systemKind } from './system-classification.js';

// Product identity comes from the name/category, never parts mentioned in long descriptions.
export function classifyProduct(name, category = '') {
 const n=String(name||'').toLowerCase(), c=String(category||'').toLowerCase();
 if(/food processor|microprocessor control|blender|kettle|toaster|air fryer|coffee maker|vacuum|heater|hair dryer|shaver|hair clipper|pedestal.*fan|alva air|pineware|desk(?:top)? fan|ceiling fan|floor fan|tower fan|tripod fan|fan fly repeller|hand mixer|microwave|air conditioner|water dispenser|braai|camping chair|dustpan|broom|paper towel|candle|sanitizer|sharpener|stapler|chalk board|solar panel|roof mount|solarix.*(?:rail|fuse|hybrid|off grid|off-grid|powerboard)|mellerware|russell hobbs|taurus |feelive|brainware a5|chairbag|iphone|smartphone|mobile phone|scanner|securnix|rack mount.*(?:nas|bracket)|\bdvr\b|vari.focal lens|yankee candle/.test(n)||/small appliances|kitchen|home appliances|stationery|security.*camera|point of sale/.test(c))return null;
 const result=(type,category=type)=>({type,category});
 if(/galaxy tab|\btablet\b/.test(n)&&!/case|stand|sleeve|cover|protector/.test(n))return result('peripheral','tablets');
 if(/(?:laptop|notebook).*(?:memory|ram)|so[- ]?dimm/.test(n))return result('memory');
 if(/(?:laptop|notebook|macbook).*(?:bag|case|sleeve|lock|stand|cooler|desk|trolley)|backpack|blackpack|lock plate|keyed lock/.test(n)||/notebook.*case|laptop.*bag/.test(c))return result('accessory','laptop-accessories');
 if(/^bti\b|travelmate\.mobi/.test(n)||/notebook.*(?:battery|adapter)|laptop.*(?:battery|adapter)/.test(c))return result('accessory','laptop-accessories');
 if(/\bmini[- ]?(?:pc|desktop)\b|\bdesktop\b|gaming pc|creator pc|^giada\s|nucbox/.test(n)&&!/switch|mount|bracket|clamp|processor|\bcpu\b|\bram\b|memory|dimm|fan|monitor|adapter|mouse|keyboard/.test(n))return result('peripheral','desktops');
 const system=systemKind(name,category);
 if(system==='laptop'&&!/\b(?:intel|core|ultra|ryzen|celeron|pentium|mediatek|kompanio|macbook|chromebook)\b/.test(n)&&!/notebook computers|laptops|notebook pc/.test(c))return null;
 if(system)return {type:system==='laptop'?'laptop':'peripheral',category:system==='laptop'?'laptops':'desktops'};
 if(/mousepad|mouse pad|mouse mat|wrist rest|desk mat/.test(n))return result('accessory','desk-accessories');
 if(/thermal.*(?:paste|compound)|heatsink compound/.test(n))return result('accessory','thermal-paste');
 if(/(?:laptop|notebook).*(?:memory|ram)|so[- ]?dimm/.test(n))return result('memory');
 if(/(?:laptop|notebook).*(?:bag|case|sleeve|lock|stand|cooler)|backpack|lock plate/.test(n))return result('accessory','laptop-accessories');
 if(/cable|adapter|adaptor|hub|dock|docking|enclosure|card reader/.test(n))return result('accessory',/adapter|adaptor|hub|dock|enclosure|card reader/.test(n)?'adapters':'cables');
 if(/(?:cpu|liquid|water|air) cooler|all.in.one.*cooler|heatsink|\baio\b|vga.*cooling|accelero|graphics.*cooler/.test(n))return result('cooler');
 if(/case fan|fan (?:single|dual|triple|pack|kit)|pacelight.*f1/.test(n))return result('fan');
 if(/pc case|computer case|chassis|mid[- ]?tower|full[- ]?tower/.test(n)||/computer case|chassis/.test(c))return result('case');
 if(/motherboard|mainboard/.test(n)||/motherboard|mainboard/.test(c))return result('motherboard');
 if(/monitor|display/.test(n)&&!/arm|stand|mount|bracket|cable/.test(n))return result('peripheral','monitors');
 if(/keyboard/.test(n))return result('peripheral','keyboards');
 if(/\bmouse\b|\bmice\b/.test(n))return result('peripheral','mice');
 if(/headset|headphone|earphone|earbud/.test(n))return result('peripheral','headsets');
 if(/microphone|gaming mic|speaker|soundbar|audio interface|pop filter|shock mount|mic.*arm/.test(n))return result('peripheral','audio');
 if(/webcam|web camera|capture card|capture device/.test(n))return result('peripheral','webcams');
 if(/controller|racing.*wheel|steering wheel|pedal|joystick|flight stick|sim racing/.test(n))return result('peripheral','controllers');
 if(/\bups\b|surge|power strip|power bank|power station|inverter/.test(n))return result('accessory','power-protection');
 if(/router|(?:network|ethernet|desktop|gigabit|port|rackmount).*switch|wi.fi|wireless.*(?:pci|adapter)|access point|mesh system|network card/.test(n))return result('accessory','networking');
 if(/geforce|\b(?:rtx|gtx|gt)\s*\d|radeon|\brx\s*\d|\barc\s*[ab]\d/.test(n)||/graphics card|\bgpu\b/.test(c))return result('gpu');
 if(/mini[- ]?pc/.test(n))return result('peripheral','desktops');
 if(/processor|\bcpu\b|ryzen|core (?:i[3579]|ultra)|athlon|pentium|celeron/.test(n)||/processor|\bcpu\b/.test(c))return result('cpu');
 if(/flash drive|usb drive|micro.?sd|memory card/.test(n))return result('storage');
 if(/ddr[2345]|\bdimm\b|memory module/.test(n)||/memory|\bram\b/.test(c))return result('memory');
 if(/nvme|solid state|\bssd\b|hard (?:disk|drive)|\bhdd\b|flash drive|usb drive/.test(n))return result('storage');
 if(/power supply|\bpsu\b/.test(n)||/power supply/.test(c))return result('psu');
 if(/pc case|computer case|chassis|mid[- ]?tower|full[- ]?tower/.test(n)||/computer case|chassis/.test(c))return result('case');
 if(/\bfan\b|fan kit|pacelight.*f1/.test(n))return result('fan');
 if(/cooler|cooling/.test(n)||/cooling/.test(c))return result('cooler');
 if(/\b(?:stand|mount|chair|desk|bracket|lighting)\b|kwg orion/.test(n)&&!/tv|television|projector/.test(n))return result('accessory','desk-accessories');
 return null;
}
