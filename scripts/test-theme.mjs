// Run with node scripts/test-theme.mjs. Browser layout QA requires a connected workspace.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync('assets/js/theme.js','utf8');
const cutoff = Date.parse('2026-12-31T22:00:00Z');
function run({ appearance = null, season = null, blocked = false, now = cutoff - 1 } = {}) {
 const listeners = {};
 const root = { dataset: {} };
 let timer;
 const doc = { documentElement: root, readyState: 'loading', querySelector: () => null, querySelectorAll: () => [], addEventListener: (name, fn) => { listeners[name] = fn; } };
 const win = { addEventListener: (name, fn) => { listeners[name] = fn; }, setTimeout: (fn, delay) => { timer = { fn, delay }; } };
 win.self = win.top = win.parent = win;
 const localStorage = { getItem: key => {
  if (blocked) throw Error('blocked');
  return key === 'volttech-season' ? season : appearance;
 } };
 const context = { document: doc, window: win, localStorage, Date: { parse: Date.parse, now: () => now }, location: { origin: 'https://volttechcomputerco.co.za' } };
 vm.runInNewContext(source, context);
 return { dataset: root.dataset, listeners, getTimer: () => timer, setTime: value => { now = value; }, win };
}
assert.equal(run().dataset.theme, 'dark');
assert.equal(run({ appearance: 'light' }).dataset.theme, 'light');
assert.equal(run({ appearance: 'invalid' }).dataset.theme, 'dark');
assert.equal(run({ blocked: true }).dataset.theme, 'dark');
assert.equal(run().dataset.season, 'christmas');
assert.equal(run({ season: 'original' }).dataset.season, 'original');
assert.equal(run({ now: cutoff }).dataset.season, 'original');
assert.equal(run({ now: cutoff, season: 'christmas' }).dataset.season, 'original');
assert.equal(run({ now: cutoff + 1, blocked: true }).dataset.season, 'original');
assert.equal(run({ now: cutoff - 90 * 86400000 }).getTimer().delay, 2_147_483_647);
const openPage = run({ season: 'christmas' });
assert.equal(openPage.getTimer().delay, 1);
openPage.setTime(cutoff);
openPage.getTimer().fn();
assert.equal(openPage.dataset.season, 'original');
openPage.listeners.storage({ key: 'volttech-season' });
openPage.listeners.message({ origin: 'https://volttechcomputerco.co.za', source: openPage.win, data: { type: 'volttech:appearance', theme: 'dark', season: 'christmas' } });
assert.equal(openPage.dataset.season, 'original');
assert.equal(openPage.dataset.theme, 'dark');
const restoredPage = run();
restoredPage.setTime(cutoff);
restoredPage.listeners.pageshow();
assert.equal(restoredPage.dataset.season, 'original');
for(const page of ["404.html","account.html","activity.html","admin-builds.html","admin-customer.html","admin-customers.html","admin-deletions.html","admin-records.html","admin-store.html","admin.html","build-document.html","builds.html","checkout.html","creator-hub-south-africa.html","creator-register.html","delivery-collection.html","design-system.html","documents.html","exposure-scan.html","index.html","invoice.html","legal.html","order-document.html","order-status.html","paia.html","pc-performance-optimisation.html","pc-repair-pretoria.html","pc-upgrades-pretoria.html","personal-data.html","privacy-center.html","privacy-policy.html","privacy.html","product.html","proforma.html","quote-terms.html","quote.html","quotes.html","receipt.html","repair-authorisation.html","returns-warranty.html","service-record.html","signal-scan.html","static-amd-ryzen-5-5500f-7500-budget-cpus.html","static-amd-world-labs-spatial-ai-acquisition.html","static-apple-iphone-duo-first-foldable.html","static-building-a-pc-2026.html","static-comic-con-africa-2026-vs-gaming-masters-aftermath.html","static-dlss-5-nba-2k27-neural-rendering.html","static-driver-crashes.html","static-gears-of-war-e-day-pc-early-access.html","static-gpu-price-history.html","static-lan-culture.html","static-lego-playstation-1911-piece.html","static-ltt-best-pc-2026.html","static-malware-disguises.html","static-metroid-ravenous-switch-2.html","static-modern-warfare-4-pc-specs-90fps-ray-tracing.html","static-nopixel-v-rockstar-gta-rp.html","static-nvidia-hugging-face.html","static-pc-throttling.html","static-physint-xbox-publishing.html","static-pimax-crystal-pro-native-foveated-streaming.html","static-ps5-qssr-ai-upscaling.html","static-ram-myth.html","static-rpcs3-direct-disc-playback.html","static-sa-varsity-esports-pretoria-2026.html","static-scalebound-kamiya.html","static-silent-pc-build.html","static-south-african-counter-strike-vs-gaming-masters-2026.html","static-ssd-vs-hdd-2026.html","static-starcraft-open-world-shooter-2030.html","static-tim-sweeney-hardware-crisis.html","static-valheim-1-0-deep-north-launch.html","static-white-house-tetris.html","static-windows-vs-linux-gaming.html","static-witcher-3-remastered-hotfix-pc.html","static-xbox-cloud-gaming-hour-limits.html","static-xbox-game-pass-september-2026-stacked-lineup.html","static-zelda-40th-anniversary-direct-today.html","static.html","store.html","stream-scan.html","streaming-setup-south-africa-dynamic.html","streaming-setup-south-africa.html","terms.html","virus-malware-removal-pretoria.html","windows-installation-pretoria.html","builder/index.html"]){const html=fs.readFileSync(page,'utf8');assert.ok(html.includes('site-theme.css'),page);assert.ok(html.includes('assets/js/theme.js'),page);assert.ok(html.includes('volttech-appearance'),page);}
console.log('PASS: dark default, saved light mode, unavailable storage fallback, seasonal cutoff and theme coverage');
