// TOOL_AREA_RETRY_1
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const assert=(v,m)=>{if(!v)throw new Error(m)};

const home=read('index.html');
const css=read('assets/css/pages/home.css');
const header=read('src/templates/header.html');
const footer=read('src/templates/footer.html');
const stream=read('streaming-setup-south-africa.html');
const scan=read('stream-scan.html');
const creator=read('creator-hub-south-africa.html');
const search=read('assets/js/components/search.js');

assert(header.includes('streaming-setup-south-africa.html">Stream Support</a>'),'Global nav must expose Stream Support');
assert(footer.includes('streaming-setup-south-africa.html">Stream Support</a>'),'Footer must expose Stream Support');

assert(home.includes('<title>Gaming PCs, PC Parts &amp; Stream Support | VoltTech Pretoria</title>'),'Homepage SEO positioning missing');
assert(home.includes('CUSTOM PCs. COMPONENTS. STREAM SUPPORT. EXPERT CARE.'),'Homepage business pillars missing');
assert(home.includes('class="stream-support-mini" href="streaming-setup-south-africa.html"'),'Compact Stream Support tool card missing');
assert(home.includes('src="vt-px-streaming-setup.webp"'),'Existing streaming image must be reused');
assert(home.includes('Get your stream dialled in.'),'Stream Support tool-card heading missing');
assert(home.includes('OBS / STREAMLABS / CREATOR TECH'),'Stream Support tool-card label missing');
assert(home.includes('<h3>Stream Support</h3><p>OBS. Audio. Performance.</p>'),'Homepage service card must remain');
assert(!home.includes('class="stream-support-spotlight"'),'Standalone homepage Stream Support spotlight must be removed');
assert(!home.includes('class="stream-support-feature"'),'Old oversized Stream Support feature must remain removed');

const toolIndex=home.indexOf('class="tool-section"');
const miniIndex=home.indexOf('class="stream-support-mini"');
const servicesIndex=home.indexOf('id="services"');
assert(toolIndex >= 0 && miniIndex > toolIndex && miniIndex < servicesIndex,'Stream Support mini card must live inside the tool area before Services');

assert(css.includes('/* Step 11.2B compact Stream Support tool card */'),'Tool-card CSS missing');
assert(css.includes('border:1px solid rgba(194,140,255,.72)'),'Purple border missing');
assert(!css.includes('/* Step 11.2B compact Stream Support spotlight */'),'Old spotlight CSS must be removed');

assert(stream.includes('<h1>Stream Support<span>OBS, Streamlabs, audio and performance—dialled in.</span></h1>'),'Dedicated Stream Support positioning must remain');
assert(scan.includes('<title>OBS &amp; Streamlabs Diagnostic Tool South Africa | Stream Scan | VoltTech</title>'),'Stream Scan positioning must remain');
assert(creator.includes('Get Stream Support') && creator.includes('Run Stream Scan'),'Creator Hub Stream Support routes must remain');
assert(search.includes("['Stream Support', 'OBS, Streamlabs, audio, capture, dropped frames and creator PCs'"),'Search Stream Support entry must remain');

console.log('PASS: Step 11.2B desktop Stream Support tool-card refinement');
