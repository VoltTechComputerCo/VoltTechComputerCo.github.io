import { systemKind } from './system-classification.js';

// Product identity wins over components and compatible devices listed in specifications.
export function classifyProduct(name, category = '') {
 const n=String(name||'').toLowerCase().replace(/[®™]/g,''),c=String(category||'').toLowerCase().replace(/&amp;/g,'&');
 const h=n.split(/\b(?:features:|specifications:|warranty:|provides full protection|durable backpack|dome protection)\b/)[0].slice(0,105),r=(type,category=type)=>({type,category});
 if(/^winx connect ultra 14.in.1/.test(h))return r('accessory','adapters');
 if(/^gizzu.*\bups\b/.test(h))return r('accessory','power-protection');
 if(/^logitech.*(?:full hd 1080p video|c270 hd)/.test(h))return r('peripheral','webcams');
 if(/^logitech full.size kbm combo/.test(h))return r('peripheral','keyboards');
 if(/^hp.*(?:laser wired mouse|omen 27q)/.test(h))return r('peripheral',/mouse/.test(h)?'mice':'monitors');
 if(/optical sensor.*scroll wheel/.test(n.slice(0,180)))return r('peripheral','mice');
 if(/clear audio.*mic boom/.test(n.slice(0,180)))return r('peripheral','headsets');
 if(/targus.*triple video/.test(h))return r('accessory','adapters');
 if(/headset.*stand|(?:mouse|keyboard) adapters?|cable manager|(?:gpu|graphics).*holder|(?:gpu|graphics).*support/.test(h))return r('accessory','desk-accessories');
 if(/food processor|microprocessor control|blender|electric kettle|toaster|air fryer|coffee maker|vacuum|heater|hair dryer|shaver|hair clipper|pedestal.*fan|alva air|pineware|desk(?:top)? fan|ceiling fan|floor fan|tower fan|tripod fan|fan fly repeller|hand mixer|microwave|air conditioner|water dispenser|braai|camping chair|dustpan|broom|paper towel|candle|sanitizer|sharpener|stapler|chalk board|solar panel|roof mount|solarix.*(?:rail|fuse|hybrid|off.grid|powerboard)|mellerware|russell hobbs|taurus |feelive|brainware a5|chairbag|yankee candle|standard resin|3d printer/.test(h)||/small appliances|kitchen|home appliances|stationery|point of sale/.test(c))return null;
 if(/laserjet|lexmark|ink cartridge|flatbed scanner|digital sender|\bprinter\b|\bscanner\b|\btoner\b/.test(h)&&!/cable|cable mapper/.test(h))return null;
 if(/^apple iphone|^samsung galaxy s|^smartphone |^mobile phone |samsung (?:galaxy )?[as][0-9]{2}\b|\bdvr\b|vari.focal lens|securnix|security camera|network security camera/.test(h))return null;
 if(/^(?:hp|canon)\b.*(?:\bprint\b|officejet|smart tank|megatank|laser|inkjet)|\b3 leaf clover\b|\b5 year.*support.*notebooks/.test(h)||/ip camera|cctv|wi.fi cameras|home security|3d printing|projectors|tv brackets/.test(c))return null;
 if(/^(?:samsung (?:galaxy )?(?:[as]\d{2}|z flip|z fold))\b/.test(h))return null;
 if(/^samsung.*(?:display|odyssey)/.test(h))return r('peripheral','monitors');
 if(/computers?\s*>\s*(?:mini pc|desktop)|desktop systems/.test(c))return r('peripheral','desktops');
 if(/handheld.*(?:gaming|console)|gaming.*handheld|\b(?:rog xbox ally|steam deck|legion go|rog ally)\b/.test(h))return r('peripheral','handhelds');
 const mainSystem=systemKind(name,category);if(mainSystem)return r(mainSystem==='laptop'?'laptop':'peripheral',mainSystem==='laptop'?'laptops':'desktops');
 if(/^blackview.tab/.test(h))return r('peripheral','tablets');
 if(/backpack|blackpack|briefcase|dashpack|clamshell|folio|privacy filter|screen protector|luggage|cable lock|lock plate|keyed lock|^bti\b|travelmate\.mobi|notebook cooler|laptop cooler|laptop desk|laptop trolley|charging station|cart conversion kit/.test(h)||/(?:laptop|notebook|tablet|macbook).*(?:bag|case|sleeve|stand|cover|stylus)/.test(h)||/notebook.*(?:case|battery|adapter)|laptop.*(?:bag|battery|adapter)|tablet covers|screen protectors|styluses/.test(c))return r('accessory','laptop-accessories');
 if(/galaxy tab|samsung tab|\btablet\b/.test(h)&&!/keyboard/.test(h))return r('peripheral','tablets');
 if(/^blackview.tab|^samsung (?:galaxy )?tab/.test(h))return r('peripheral','tablets');
 const system=systemKind(name,category);if(system)return r(system==='laptop'?'laptop':'peripheral',system==='laptop'?'laptops':'desktops');


 if(/mousepad|mouse pad|mouse mat|wrist rest|palm rest|wrist\s?pad|kwg orion/.test(h))return r('accessory','desk-accessories');
 if(/gpu.*(?:holder|support|bracket)|graphics.*support bracket|ssd.*(?:heatsink|cooler)|mounting bracket|bracket with screws|cable manager/.test(h))return r('accessory','desk-accessories');
 if(/(?:nas|asustor).*enclosure/.test(h))return r('storage');
 if(/enclosure|hard drive docking|hard drive box/.test(h))return r('accessory','adapters');
 if(/keyboard/.test(h)&&/mouse|combo/.test(h))return r('peripheral','keyboards');
 if(/earbuds?|earphones?|heatset/.test(h))return r('peripheral','headsets');
 if(/(?:headphone|headset).*adapter|mouse adapter|keyboard.*adapter/.test(h))return r('accessory','adapters');
 if(/\b(?:power strip|surge|powerbank|ups)\b/.test(h)&&!/\bcable\b/.test(h))return r('accessory','power-protection');
 if(/\b(?:adapter|adaptor)\b/.test(h)&&!/speakerphone|headset|network|ethernet|wi.fi|bluetooth|mouse.*optical/.test(h))return r('accessory','adapters');
 // Prefer precise supplier categories over secondary features in titles.
 const hints=[['motherboard',/motherboards?|mainboards?/],['gpu',/graphics cards?/],['cpu',/processors?/],['memory',/desktop memory|notebook memory|memory modules|memory \(desktop\)/],['storage',/solid state drives|hard disk|network attached storage/],['psu',/power suppl/],['case',/computer cases?|chassis/],['cooler',/cpu cool|liquid cool/],['fan',/case fans/],['monitors',/monitors/],['keyboards',/keyboards|keyboard switches/],['mice',/gaming mice|computer mice/],['headsets',/headsets|headphones/],['webcams',/webcams/],['audio',/microphones|speakers|audio interfaces/]];
 if(/upgrade kits?|core upgrade/.test(h+' '+c))return r('accessory','upgrade-kits');
 for(const [cat,pattern] of hints)if(c.includes(' > ')&&pattern.test(c))return r(['monitors','keyboards','mice','headsets','webcams','audio'].includes(cat)?'peripheral':cat,cat);
 if(/monitor.*(?:desk mount|mount bracket)|full motion.*monitor/.test(h))return r('accessory','desk-accessories');
 if(/monitor (?:cable|desk mount|signal)|svga monitor cable/.test(h))return r('accessory',/cable/.test(h)?'cables':/signal/.test(h)?'adapters':'desk-accessories');
 if(/\bmonitor\b/.test(h)&&!/(?:monitor|display)\s+(?:arm|stand|mount|bracket)|monitor signal|monitor cable|monitor desk mount|dual monitor displayport/.test(h)&&!/(?:cable|adapter|converter|bracket|mount|dock).*monitor/.test(h))return r('peripheral','monitors');
 if(/\b(?:hub|docking station|dock)\b/.test(h)&&!/\bmonitor\b/.test(h))return r('accessory','adapters');
 if(/\bheadset\b|\bheadphone/.test(h))return r('peripheral','headsets');
 if(/(?:headset|headphone).*stand/.test(h))return r('accessory','desk-accessories');
 if(/\bmouse\b/.test(h)&&!/mouse adapter/.test(h))return r('peripheral','mice');
 if(/\bkeyboard\b/.test(h)&&!/keyboard device|keyboard.*adapter/.test(h))return r('peripheral','keyboards');
 if(/\b(?:case fan|cpu cooler|liquid cooler|gaming case)\b/.test(h))return r(/case fan/.test(h)?'fan':/gaming case/.test(h)?'case':'cooler');
 if(/\b(?:cable|patch lead|fly lead)\b/.test(h)&&!/lock|bracket|holder/.test(h))return r('accessory','cables');
 if(/\b(?:hub|docking station|dock|adapter|adaptor)\b/.test(h)&&!/speakerphone|network|ethernet|wi.fi|bluetooth/.test(h))return r('accessory','adapters');
 if(/^hp\s+\d+gb.*ddr/.test(h))return r('memory');
 if(/noise suppression.*technology|open office certified/.test(h))return r('peripheral','headsets');
 if(/motherboard|mainboard/.test(h)||/motherboards?\b|mainboards?\b/.test(c)||/\b[abxh][3-9]\d{2}[a-z0-9-]*\b/.test(h)&&/\bam[345]\b|lga\s*\d/.test(h))return r('motherboard');

 if(/(?:notebook|laptop).*(?:key.*lock|combination.*lock|\block\b)|charging trolley|laptops.*trolley/.test(h)||/notebook accessories|charging trolleys/.test(c))return r('accessory','laptop-accessories');
 if(/wireless.*charger|desktop charger|gan.*charger/.test(h))return r('accessory','power-protection');
 if(/bluetooth.*(?:receiver|transmitter)/.test(h))return r('peripheral','audio');
 if(/lte cat.*module/.test(h))return r('accessory','networking');
 if(/led strip|^keychron.*palm rest|^redragon.*wrist\s?pad|gaming pad/.test(h)||/mousepads/.test(c))return r('accessory','desk-accessories');
 if(/keychron.*switch(?!.*mouse)|gaming.*combo|kwg.*combo/.test(h))return r('peripheral','keyboards');
 if(/\btws\b|^poly (?:savi|voyager|vf2)/.test(h))return r('peripheral','headsets');
 if(/powerbank/.test(h))return r('accessory','power-protection');
 if(/slc ii.*360mm/.test(h))return r('cooler');
 if(/(?:\b(?:fhd|qhd|wqhd|wuxga)\b|\d{3,4}\s*x\s*\d{3,4}|odyssey).*\b(?:nits|ips|va|hz|hdmi|dp)\b/.test(h)&&!/projector/.test(h))return r('peripheral','monitors');
 if(/\bconverter\b|m\.2nvm|\busb.*\b[cm]\s*(?:to|m\/m)|\btype-c to\b/.test(h)||/adapters/.test(c))return r('accessory','adapters');

 if(/optical sensor.*scroll wheel|logitech g pro x superlight/.test(h))return r('peripheral','mice');
 if(/clear audio.*mic boom|voice call quality.*mic mute/.test(h))return r('peripheral','headsets');
 if(/^body glove.*(?:ows|tws)/.test(h))return r('peripheral','headsets');
 if(/^p34hc.*3440x1440/.test(h))return r('peripheral','monitors');
 if(/mousepad|mouse pad|mouse mat|wrist rest|desk mat/.test(h))return r('accessory','desk-accessories');
 if(/thermal.*(?:paste|compound)|heatsink compound/.test(h)||/thermal paste/.test(c))return r('accessory','thermal-paste');
 if(/gpu.*(?:holder|support|bracket)|graphics.*(?:holder|support bracket)|screws? for ssd|monitor.*(?:arm|stand|mount)|(?:arm|stand|mount).*monitor/.test(h))return r('accessory','desk-accessories');
 if(/microphone|gaming mic|speaker|soundbar|audio interface|pop filter|shock mount|mic.*arm|mdrill|audio receiver|audio.*transmitter|stream audio wirelessly/.test(h)||/microphones|speakers|audio interfaces/.test(c))return r('peripheral','audio');
 if(/webcam|web camera|capture card|capture device|conference camera/.test(h)||/webcams/.test(c))return r('peripheral','webcams');
 if(/headset|heatset|headphone|earphone|earbud|ear cub replacement/.test(h)||/headsets|headphones/.test(c))return r('peripheral','headsets');
 if(/keyboard|num\s?pad|keycaps?|mechanical switch|gateron.*switch/.test(h)||/keyboards|keyboard switches/.test(c))return r('peripheral','keyboards');
 if(/\bmouse\b|\bmice\b/.test(h)||/gaming mice|computer mice/.test(c))return r('peripheral','mice');
 if(/controller|racing.*(?:wheel|rig|gear)|steering wheel|pedal|joystick|flight stick|sim racing|simulator racing|gear shifter|^pxn.*control box/.test(h))return r('peripheral','controllers');
 if(/\bups\b|surge|power strip|power bank|power station|inverter/.test(h))return r('accessory','power-protection');
 if((/wi.fi.*(?:module|mesh|extender)|mesh wi.fi|(?:hdmi.*(?:miracast|dongle)|miracast.*hdmi)|router|(?:network|ethernet|desktop|gigabit|port|rackmount).*switch|access point|mesh system|network card|(?:wi.fi|wireless|ethernet|bluetooth).*adapter|(?:wi.fi|wireless).*pci/.test(h)&&!/hub|dock|docking/.test(h))||/networking|routers|network adapters|network switches/.test(c))return r('accessory','networking');
 if(/cable|fly lead|patch lead|audio splitter|splitter poly|adapter|adaptor|hub|dock|docking|enclosure|card reader|expansion card|hard drive box|hdmi splitter|displayport splitter/.test(h)||/cables|enclosures|expansion.*adapters/.test(c))return r('accessory',/adapter|adaptor|hub|dock|enclosure|card reader|expansion card|hard drive box|splitter/.test(h)||/enclosures|expansion.*adapters/.test(c)?'adapters':'cables');
 if(/\bmonitor\b/.test(h)&&!/monitor (?:cable|desk mount|signal)/.test(h)&&!/(?:cable|adapter|converter|bracket|mount|dock).*monitor/.test(h)||/monitors/.test(c))return r('peripheral','monitors');
 if(/(?:cpu|liquid|water|air) cooler|all.in.one.*cooler|heatsink|\baio\b|vga.*cooling|accelero|graphics.*cooler/.test(h)||/cpu cool|liquid cool/.test(c))return r('cooler');
 if(/case fan|fan (?:single|dual|triple|pack|kit)|pacelight.*f1|kwg gemini/.test(h)||/case fans/.test(c))return r('fan');
 if(/pc case|computer case|chassis|mid[- ]?tower|full[- ]?tower|gaming case/.test(h)||/computer case|chassis/.test(c))return r('case');
 if(/geforce|\b(?:rtx|gtx|gt)\s*\d|radeon|\brx\s*\d|\barc\s*[ab]\d/.test(h)||/graphics cards?/.test(c))return r('gpu');
 if(/processor|\bcpu\b|ryzen|core (?:i[3579]|ultra)|athlon|pentium|celeron/.test(h)||/processors/.test(c))return r('cpu');
 if(/flash drive|usb drive|micro.?sd|memory card|smart backup solution/.test(h))return r('storage');
 if(/ddr[2345]|\bdimm\b|so[- ]?dimm|memory module|(?:notebook|laptop) memory/.test(h)||/desktop memory|notebook memory|memory modules|memory \(desktop\)/.test(c))return r('memory');
 if(/nvme|solid state|\bssd\b|hard (?:disk|drive)|\bhdd\b|network attached storage/.test(h)||/solid state drives|hard disk|network attached storage/.test(c))return r('storage');
 if(/power supply|\bpsu\b|\b80\s*plus\b|\b\d{3,4}w\b.*fully modular/.test(h)||/power suppl/.test(c))return r('psu');
 if(/\bfan\b|fan kit/.test(h))return r('fan');
 if(/cooler|cooling/.test(h)||/cooling/.test(c))return r('cooler');
 if(/\b(?:stand|mount|chair|desk|bracket|lighting)\b|kwg orion/.test(h)&&!/tv|television|projector/.test(h))return r('accessory','desk-accessories');
 if(/\b2\.1 system\b.*subwoofer/.test(h))return r('peripheral','audio');
 return null;
}

