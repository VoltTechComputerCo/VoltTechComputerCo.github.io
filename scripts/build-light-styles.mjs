// Regenerate colour-only light variants after editing source CSS. Layout and dark styles stay original.
import fs from 'node:fs';
function rgbToHsl(r,g,b){r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b),l=(max+min)/2,d=max-min;let h=0,s=0;if(d){s=l>.5?d/(2-max-min):d/(max+min);h=max===r?(g-b)/d+(g<b?6:0):max===g?(b-r)/d+2:(r-g)/d+4;h/=6;}return[h,s,l];}
function hslToRgb(h,s,l){if(!s)return[1,1,1].map(()=>Math.round(l*255));const hue=(p,q,t)=>{if(t<0)t++;if(t>1)t--;return t<1/6?p+(q-p)*6*t:t<.5?q:t<2/3?p+(q-p)*(2/3-t)*6:p;};const q=l<.5?l*(1+s):l+s-l*s,p=2*l-q;return[h+1/3,h,h-1/3].map(t=>Math.round(hue(p,q,t)*255));}
function recolor(value,kind){
return value.replace(/#[\da-f]{3,8}\b|rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+(?:\s*,\s*[\d.]+)?\s*\)/gi,token=>{
let rgb,alpha=null;if(token[0]==='#'){let x=token.slice(1);if(x.length===3||x.length===4)x=x.split('').map(c=>c+c).join('');if(x.length!==6&&x.length!==8)return token;rgb=[0,2,4].map(i=>parseInt(x.slice(i,i+2),16));if(x.length===8)alpha=parseInt(x.slice(6),16)/255;}else{const nums=token.match(/[\d.]+/g).map(Number);rgb=nums.slice(0,3);alpha=nums[3]??null;}
let[h,s,l]=rgbToHsl(...rgb);let out;
if(kind==='background'){out=hslToRgb(h,Math.min(s,.28),l<.52?.98:(s>.3?.94:.98));}
else if(kind==='border'){out=hslToRgb(h,Math.min(s,.55),s>.3?.46:.75);if(alpha!==null)alpha=Math.max(.25,alpha);}
else {out=hslToRgb(h,Math.min(s,.85),s>.3?Math.min(.3,l):l>.6?.2:Math.min(.28,l));}
return alpha===null?'#'+out.map(n=>n.toString(16).padStart(2,'0')).join(''):`rgba(${out.join(',')},${alpha})`;
});
}
function lightStyles(source,recolor){
source=source.replace(/\/\*[\s\S]*?\*\//g,'');
const scope=sel=>sel.trim().replace(/^(:root|html)(?=[\s.#:[>+~]|$)/,'html:not([data-theme="dark"])');
const qualify=sel=>/^(?:html|:root)(?=[\s.#:[>+~]|$)/.test(sel.trim())?scope(sel):'html:not([data-theme="dark"]) '+sel.trim();
function splitTop(value,sep){const out=[];let start=0,q='',depth=0;for(let i=0;i<value.length;i++){const c=value[i];if(q){if(c==='\\')i++;else if(c===q)q='';continue;}if(c==='"'||c==="'"){q=c;continue;}if(c==='('||c==='[')depth++;if(c===')'||c===']')depth--;if(c===sep&&!depth){out.push(value.slice(start,i));start=i+1;}}out.push(value.slice(start));return out;}
function walk(css){let out='',i=0;
while(i<css.length){let start=i,q='',paren=0,open=-1;
for(;i<css.length;i++){const c=css[i];if(q){if(c==='\\')i++;else if(c===q)q='';continue;}if(c==='"'||c==="'"){q=c;continue;}if(c==='(')paren++;if(c===')')paren--;if(c===';'&&!paren){start=i+1;}if(c==='{'&&!paren){open=i;break;}}
if(open<0)break;const prelude=css.slice(start,open).trim();let depth=1;q='';i=open+1;const contentStart=i;
for(;i<css.length;i++){const c=css[i];if(q){if(c==='\\')i++;else if(c===q)q='';continue;}if(c==='"'||c==="'"){q=c;continue;}if(c==='{')depth++;if(c==='}'){depth--;if(!depth)break;}}
if(depth)throw new Error('Unbalanced CSS: '+prelude);
const body=css.slice(contentStart,i);i++;
if(prelude.startsWith('@')){if(/^@(media|supports|container|layer)\b/i.test(prelude)&&!/\bprint\b/i.test(prelude)){const nested=walk(body);if(nested)out+=prelude+'{'+nested+'}\n';}continue;}
const decls=[];
for(const decl of splitTop(body,';')){const m=decl.trim().match(/^([\w-]+)\s*:\s*([\s\S]+)$/);if(!m)continue;const [,prop,raw]=m;
if(!/^(?:--|color$|background(?:-color|-image)?$|border(?:-(?:top|bottom|left|right))?(?:-color)?$|outline(?:-color)?$|fill$|stroke$|text-shadow$|box-shadow$|color-scheme$)/.test(prop))continue;
if(prop==='color-scheme'){decls.push('color-scheme:light');continue;}
if(/shadow$/.test(prop)){decls.push(prop+':'+(prop==='text-shadow'?'none':'0 4px 18px rgba(18,56,51,.055)'));continue;}
let kind=/border|outline|^--.*(?:line|border)$|^--l$/.test(prop)?'border':/background|^--.*(?:bg|black|panel|surface|paper|fill)|^--(?:b|p)$/.test(prop)?'background':'text';
const value=recolor(raw,kind);if(value!==raw)decls.push(prop+':'+value);}
if(decls.length)out+=splitTop(prelude,',').map(qualify).join(',')+'{'+decls.join(';')+'}\n';
}return out;}
return '/* Light-mode colour adaptation; original layout and dark theme remain in the source stylesheet. */\n'+walk(source);
}
const sources=[
  "assets/css/tokens.css",
  "assets/css/navigation.css",
  "assets/css/components.css",
  "assets/css/responsive.css",
  "assets/css/pages/home.css",
  "assets/css/pages/error.css",
  "assets/css/glass-system.css",
  "assets/css/persistent-header.css",
  "assets/css/notifications.css",
  "assets/css/pages/account.css",
  "assets/css/components/customer-workflow.css",
  "assets/css/pages/customer-records.css",
  "admin-builds.css",
  "phase6-provenance.css",
  "commerce-ui.css",
  "notifications.css",
  "portal-shell.css",
  "customer-shell.css",
  "v4-nav.css",
  "commerce/store.css",
  "admin-store.css",
  "admin-catalogue-qa.css",
  "admin-catalogue-qa-refinement.css",
  "admin-catalogue-media-resilience.css",
  "admin-catalogue-contracts.css",
  "admin-hub.css",
  "operations-hub.css",
  "assets/css/pages/document.css",
  "assets/css/pages/commerce.css",
  "assets/css/pages/transactions.css",
  "assets/css/pages/creator-hub.css",
  "assets/css/pages/creator-register.css",
  "assets/css/pages/legal.css",
  "exposure-scan.css",
  "assets/css/store-filters.css",
  "assets/css/pages/services.css",
  "assets/css/pages/privacy-center.css",
  "assets/css/pages/signal-scan.css",
  "assets/css/static-legacy/static-amd-ryzen-5-5500f-7500-budget-cpus.css",
  "assets/css/pages/static-article.css",
  "assets/css/static-legacy/static-apple-iphone-duo-first-foldable.css",
  "assets/css/static-legacy/static-building-a-pc-2026.css",
  "assets/css/static-legacy/static-dlss-5-nba-2k27-neural-rendering.css",
  "assets/css/static-legacy/static-driver-crashes.css",
  "assets/css/static-legacy/static-gpu-price-history.css",
  "assets/css/static-legacy/static-lan-culture.css",
  "assets/css/static-legacy/static-lego-playstation-1911-piece.css",
  "assets/css/static-legacy/static-ltt-best-pc-2026.css",
  "assets/css/static-legacy/static-malware-disguises.css",
  "assets/css/static-legacy/static-metroid-ravenous-switch-2.css",
  "assets/css/static-legacy/static-nopixel-v-rockstar-gta-rp.css",
  "assets/css/static-legacy/static-nvidia-hugging-face.css",
  "assets/css/static-legacy/static-pc-throttling.css",
  "assets/css/static-legacy/static-physint-xbox-publishing.css",
  "assets/css/static-legacy/static-ram-myth.css",
  "assets/css/static-legacy/static-rpcs3-direct-disc-playback.css",
  "assets/css/static-legacy/static-sa-varsity-esports-pretoria-2026.css",
  "assets/css/static-legacy/static-scalebound-kamiya.css",
  "assets/css/static-legacy/static-silent-pc-build.css",
  "assets/css/static-legacy/static-south-african-counter-strike-vs-gaming-masters-2026.css",
  "assets/css/static-legacy/static-ssd-vs-hdd-2026.css",
  "assets/css/static-legacy/static-starcraft-open-world-shooter-2030.css",
  "assets/css/static-legacy/static-tim-sweeney-hardware-crisis.css",
  "assets/css/static-legacy/static-valheim-1-0-deep-north-launch.css",
  "assets/css/static-legacy/static-white-house-tetris.css",
  "assets/css/static-legacy/static-windows-vs-linux-gaming.css",
  "assets/css/static-legacy/static-xbox-cloud-gaming-hour-limits.css",
  "assets/css/static-legacy/static-xbox-game-pass-september-2026-stacked-lineup.css",
  "assets/css/static-legacy/static-zelda-40th-anniversary-direct-today.css",
  "assets/css/pages/static.css",
  "assets/css/pages/stream-scan.css",
  "assets/css/pages/streaming-support.css",
  "assets/css/pages/builder.css",
  "assets/css/pages/builder-foundation.css"
];
for(const path of sources)fs.writeFileSync(path.replace(/\.css$/,'.light.css'),lightStyles(fs.readFileSync(path,'utf8'),recolor));
