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
assert(home.includes('class="stream-support-feature"'),'Dedicated homepage Stream Support feature missing');
assert(home.includes('OBS / STREAMLABS'),'Homepage OBS/Streamlabs proof point missing');
assert(home.includes('href="stream-scan.html">RUN STREAM SCAN'),'Homepage Stream Scan route missing');
assert(home.includes('<h3>Stream Support</h3><p>OBS. Audio. Performance.</p>'),'Homepage service card not elevated');

const stream=read('streaming-setup-south-africa.html');
assert(stream.includes('<title>OBS &amp; Stream Support South Africa | Streamlabs Help | VoltTech</title>'),'Streaming Support SEO title missing');
assert(stream.includes('<h1>Stream Support<span>OBS, Streamlabs, audio and performance—dialled in.</span></h1>'),'Streaming Support hero not updated');
for(const term of ['OBS &amp; Streamlabs','Encoder &amp; output tuning','Dropped frames &amp; network','Audio &amp; routing','Capture cards &amp; dual-PC']){
  assert(stream.includes(term),`Streaming Support capability missing: ${term}`);
}
assert(stream.includes('https://volttechcomputerco.co.za/#organisation'),'Streaming Support schema provider id must match site organisation');

const scan=read('stream-scan.html');
assert(scan.includes('<title>OBS &amp; Streamlabs Diagnostic Tool South Africa | Stream Scan | VoltTech</title>'),'Stream Scan SEO title missing');
assert(scan.includes('OBS and Streamlabs diagnostics'),'Stream Scan OG positioning missing');
assert(scan.includes('https://volttechcomputerco.co.za/#organisation'),'Stream Scan schema provider id must match site organisation');

const creator=read('creator-hub-south-africa.html');
assert(creator.includes('Get Stream Support'),'Creator Hub must route to Stream Support from hero');
assert(creator.includes('Run Stream Scan'),'Creator Hub must route to Stream Scan from hero');
assert(creator.includes('OBS, Streamlabs and creator-tech problems'),'Creator Hub creator-tech positioning missing');

const search=read('assets/js/components/search.js');
assert(search.includes("['Stream Support', 'OBS, Streamlabs, audio, capture, dropped frames and creator PCs'"),'Search Stream Support entry missing');
assert(search.includes("['Stream Scan', 'Guided OBS and Streamlabs diagnostic and estimate'"),'Search Stream Scan entry missing');

const forbidden=['best stream support','best streaming support','ultimate streaming support','number one stream support','#1 stream support'];
const combined=[home,stream,scan,creator].join('\n').toLowerCase();
for(const claim of forbidden)assert(!combined.includes(claim),`Unsubstantiated superlative claim present: ${claim}`);

console.log('PASS: Step 11.2B one-stop-shop + Stream Support positioning contract');
