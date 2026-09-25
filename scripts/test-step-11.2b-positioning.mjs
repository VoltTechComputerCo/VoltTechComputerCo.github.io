import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const assert=(v,m)=>{if(!v)throw new Error(m)};

const header=read('src/templates/header.html');
assert(header.includes('streaming-setup-south-africa.html">Stream Support</a>'),'Global nav must expose Stream Support');

const footer=read('src/templates/footer.html');
assert(footer.includes('streaming-setup-south-africa.html">Stream Support</a>'),'Footer must expose Stream Support');
assert(footer.includes('stream-scan.html">Stream Scan</a>'),'Footer must expose Stream Scan');

const home=read('index.html');
assert(home.includes('<title>Gaming PCs, PC Parts &amp; Stream Support | VoltTech Pretoria</title>'),'Homepage title not repositioned');
assert(home.includes('CUSTOM PCs. COMPONENTS. STREAM SUPPORT. EXPERT CARE.'),'Homepage hero pillars missing');
assert(home.includes('CUSTOM GAMING<br>PC BUILDS'),'Custom PC hero fact missing');
assert(home.includes('COMPONENTS<br>&amp; PERIPHERALS'),'Components/peripherals hero fact missing');
assert(home.includes('STREAM SUPPORT<br>ACROSS SA'),'Stream Support hero fact missing');
assert(home.includes('class="stream-support-spotlight"'),'Compact Stream Support spotlight missing');
assert(home.includes('class="stream-support-card" href="streaming-setup-south-africa.html"'),'Whole Stream Support card must be clickable');
assert(home.includes('src="vt-px-streaming-setup.webp"'),'Existing streaming visual must be reused');
assert(home.includes('OBS / STREAMLABS / CREATOR TECH'),'Compact Stream Support label missing');
assert(home.includes('Get your stream dialled in.'),'Compact Stream Support heading missing');
assert(home.includes('<h3>Stream Support</h3><p>OBS. Audio. Performance.</p>'),'Homepage service card not elevated');
assert(!home.includes('class="stream-support-feature"'),'Oversized Stream Support feature must be removed');
assert(!home.includes('stream-support-points'),'Oversized four-point panel must be removed');

const css=read('assets/css/pages/home.css');
assert(css.includes('/* Step 11.2B compact Stream Support spotlight */'),'Compact Stream Support CSS missing');
assert(css.includes('#c28cff'),'Purple Stream Support accent missing');
assert(!css.includes('/* Step 11.2B Stream Support feature */'),'Old oversized feature CSS must be removed');

const stream=read('streaming-setup-south-africa.html');
assert(stream.includes('<title>OBS &amp; Stream Support South Africa | Streamlabs Help | VoltTech</title>'),'Streaming Support SEO title missing');
assert(stream.includes('<h1>Stream Support<span>OBS, Streamlabs, audio and performance—dialled in.</span></h1>'),'Streaming Support hero not updated');

const scan=read('stream-scan.html');
assert(scan.includes('<title>OBS &amp; Streamlabs Diagnostic Tool South Africa | Stream Scan | VoltTech</title>'),'Stream Scan SEO title missing');

const creator=read('creator-hub-south-africa.html');
assert(creator.includes('Get Stream Support'),'Creator Hub must route to Stream Support');
assert(creator.includes('Run Stream Scan'),'Creator Hub must route to Stream Scan');

const search=read('assets/js/components/search.js');
assert(search.includes("['Stream Support', 'OBS, Streamlabs, audio, capture, dropped frames and creator PCs'"),'Search Stream Support entry missing');
assert(search.includes("['Stream Scan', 'Guided OBS and Streamlabs diagnostic and estimate'"),'Search Stream Scan entry missing');

console.log('PASS: Step 11.2B compact Stream Support positioning contract');
