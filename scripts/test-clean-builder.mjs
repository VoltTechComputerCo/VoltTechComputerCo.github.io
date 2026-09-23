import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

const page = read('builder/index.html');
assert.ok(page.includes('data-vt-shell="clean"'), 'Builder uses the clean shell marker');
assert.ok(page.includes('../assets/js/pages/builder.js'), 'Builder uses the clean page controller');
assert.ok(page.includes('../assets/css/pages/builder.css'), 'Builder presentation is owned by clean page CSS');
for (const retired of ['../builder/styles.css', 'builder-access.js', 'builder-gate.css', 'phase6-unification.css', 'fonts.googleapis.com', 'site-notifications-loader.js']) {
  assert.ok(!page.includes(retired), `Generated Builder must not depend on ${retired}`);
}
assert.ok(page.includes('content="noindex, nofollow"'), 'Builder remains noindex/nofollow');

const access = read('assets/js/services/builder-access.js');
assert.ok(access.includes("!productionOrigins.has(origin) && new URLSearchParams(search).get('inspect') === '1'"), 'Inspection cannot bypass production origins');
assert.ok(access.includes('settings.builder_enabled === true'), 'Production Builder still requires its launch flag');
assert.ok(access.includes('admin.data === true'), 'Production preview still requires verified admin access');

const controller = read('assets/js/pages/builder.js');
assert.ok(controller.includes('enhanceBuilderExperience'), 'Clean Builder experience enhancement is explicitly initialised');
assert.ok(controller.includes('window.__VT_BUILDER_INSPECT = Boolean(access.inspect)'), 'Inspection state remains explicit');
assert.ok(controller.includes('if (access.live)'), 'Account integration still loads only for a live Builder');

const experience = read('assets/js/pages/builder-experience.js');
assert.ok(experience.includes("mode==='office'"), 'Guided flow adapts for Office/Home');
assert.ok(experience.includes("mode==='creator'||mode==='workstation'"), 'Guided flow adapts for creator/workstation use');
assert.ok(experience.includes('PROTOTYPE DATA ONLY.'), 'Inspection labels prototype price/stock data clearly');
assert.ok(experience.includes('igpu-satisfied'), 'Integrated-graphics completion has an explicit UI state');

const enginePath = path.join(root, 'builder/js/build-engine.js');
const engine = await import(`${pathToFileURL(enginePath).href}?step32=${Date.now()}`);
const fill = (build, type) => ({ ...build, [type]: type === 'storage' ? [{ id:'storage', type }] : { id:type, type } });
let office = engine.createEmptyBuild();
office = { ...office, cpu: { id:'cpu-igpu', type:'cpu', specs:{ integratedGraphics:true } } };
for (const type of ['motherboard','memory','case','cooler','psu','storage']) office = fill(office, type);
assert.equal(engine.getSelections(office, 'gpu').length, 0, 'Office fixture has no discrete GPU');
assert.equal(engine.isCategorySatisfied(office, 'gpu'), true, 'Integrated graphics satisfy the GPU category');
assert.equal(engine.getCompletedCategoryCount(office), engine.REQUIRED_CATEGORIES.length, 'Integrated-graphics build is complete');
assert.notEqual(engine.getNextCategory('cpu', office), 'gpu', 'Automatic next-category flow does not force a discrete GPU');

let gaming = engine.createEmptyBuild();
gaming = { ...gaming, cpu: { id:'cpu-no-igpu', type:'cpu', specs:{ integratedGraphics:false } } };
for (const type of ['motherboard','memory','case','cooler','psu','storage']) gaming = fill(gaming, type);
assert.equal(engine.isCategorySatisfied(gaming, 'gpu'), false, 'CPU without integrated graphics still requires a GPU');
assert.equal(engine.getCompletedCategoryCount(gaming), engine.REQUIRED_CATEGORIES.length - 1, 'Non-iGPU build remains incomplete without a GPU');

const checker = read('scripts/check-clean-frontend.py');
assert.ok(checker.includes("'builder/index.html': {'supabase-config.js'}"), 'Clean checker no longer allowlists legacy Builder presentation');
assert.ok(!checker.includes("'builder/index.html': {'supabase-config.js', 'builder/styles.css'}"), 'Transitional Builder stylesheet allowlist is removed');

console.log('PASS: clean Builder presentation, adaptive Guided flow, truthful prototype labelling and integrated-graphics completion contract');
