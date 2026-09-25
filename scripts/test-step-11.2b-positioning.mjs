import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const assert=(v,m)=>{if(!v)throw new Error(m)};

const home=read('index.html');
const css=read('assets/css/pages/home.css');
const stream=read('streaming-setup-south-africa.html');
const creator=read('creator-hub-south-africa.html');
const search=read('assets/js/components/search.js');

assert(home.includes('class="builder-panel"'),'PC Builder panel missing');
assert(home.includes('class="scan-panel"'),'Signal Scan panel missing');
assert(home.includes('class="stream-support-panel"'),'Stream Support panel missing');

const builder=home.indexOf('class="builder-panel"');
const scan=home.indexOf('class="scan-panel"');
const streamPanel=home.indexOf('class="stream-support-panel"');
assert(builder >= 0 && builder < scan && scan < streamPanel,'Tool order must be PC Builder → Signal Scan → Stream Support');

assert(home.includes('src="vt-stock-modern-build.webp"'),'PC Builder image missing');
assert(home.includes('src="vt-px-streaming-setup.webp"'),'Existing Stream Support image missing');
assert(home.includes('Get the whole stream path dialled in.') || home.includes('whole stream path dialled in.'),'Stream Support copy missing');
assert(!home.includes('class="stream-support-mini"'),'Old detached mini card must be removed');
assert(!home.includes('class="stream-support-spotlight"'),'Old standalone spotlight must remain removed');
assert(!home.includes('class="stream-support-feature"'),'Old oversized feature must remain removed');

assert(css.includes('/* Step 11.2B three connected tool panels */'),'Three-panel layout CSS missing');
assert(css.includes('grid-template-columns:repeat(3,minmax(0,1fr))'),'Desktop three-column layout missing');
assert(css.includes('height:205px'),'Desktop panel imagery should be substantial');
assert(css.includes('border:1px solid rgba(194,140,255,.72)'),'Stream Support purple image border missing');
assert(!css.includes('/* Step 11.2B compact Stream Support tool card */'),'Old tool-card CSS must be removed');

assert(stream.includes('<h1>Stream Support<span>OBS, Streamlabs, audio and performance—dialled in.</span></h1>'),'Dedicated Stream Support positioning must remain');
assert(creator.includes('Get Stream Support') && creator.includes('Run Stream Scan'),'Creator Hub routes must remain');
assert(search.includes("['Stream Support', 'OBS, Streamlabs, audio, capture, dropped frames and creator PCs'"),'Search Stream Support entry must remain');

console.log('PASS: Step 11.2B three connected tool panels');
