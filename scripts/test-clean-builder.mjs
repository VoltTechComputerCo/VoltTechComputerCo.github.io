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
assert.ok(controller.includes('applyBuilderHandoff'), 'Store-to-Builder handoff is owned by the clean services layer');
assert.ok(controller.includes("import('../services/builder-account.js')"), 'Live account integration is loaded from the clean services layer');
assert.ok(!controller.includes('commerce/js/builder-handoff.js'), 'Legacy commerce handoff bootstrap is retired');
assert.ok(!controller.includes('builder/js/account-integration.js'), 'Legacy Builder account bootstrap is retired');

const experience = read('assets/js/pages/builder-experience.js');
assert.ok(experience.includes("mode==='office'"), 'Guided flow adapts for Office/Home');
assert.ok(experience.includes("mode==='creator'||mode==='workstation'"), 'Guided flow adapts for creator/workstation use');
assert.ok(experience.includes('PROTOTYPE DATA ONLY.'), 'Inspection labels prototype price/stock data clearly');
assert.ok(experience.includes('igpu-satisfied'), 'Integrated-graphics completion has an explicit UI state');

const account = read('assets/js/services/builder-account.js');
assert.ok(account.includes("getBestOffer"), 'Saved-build provenance uses the Builder offer selector');
assert.ok(account.includes("price_checked_at: offer?.lastChecked || null"), 'Saved builds preserve the actual source timestamp or null');
assert.ok(account.includes("supplier_sku: offer?.supplierSku || ''"), 'Saved builds preserve supplier SKU provenance');
assert.ok(account.includes("offer_freshness: offer?.freshness || 'unknown'"), 'Saved builds preserve offer freshness');
assert.ok(account.includes("rpc('customer_request_build_quote'"), 'Quote request is server-authoritative');
assert.ok(!account.includes("price_checked_at:new Date"), 'Saved build prices never fabricate a current price-check timestamp');
assert.ok(!account.includes('cdn.jsdelivr.net/npm/@supabase/supabase-js@2'), 'Builder account service reuses the shared authenticated client');
assert.ok(!account.includes('document.createElement(\'style\')'), 'Account presentation is not injected at runtime');

const handoff = read('assets/js/services/builder-handoff.js');
assert.ok(handoff.includes('PC Builder'), 'Handoff copy uses the current PC Builder name');
assert.ok(handoff.includes("id.startsWith('vt-storage-')"), 'Current storage IDs are recognised');
assert.ok(!handoff.includes('Object.assign(note.style'), 'Handoff presentation is not injected inline');

const admin = read('admin-builds.js');
assert.ok(admin.includes("rpc('admin_quote_saved_build'"), 'Admin conversion uses one atomic Builder quote RPC');
assert.ok(!admin.includes("rpc('admin_create_quote'"), 'Admin UI no longer assembles Builder quotes client-side');
assert.ok(!admin.includes("rpc('admin_link_quote_source'"), 'Source linking is server-side and atomic');
assert.ok(!admin.includes("from('saved_builds').update"), 'Admin UI no longer directly changes Builder status');
assert.ok(admin.includes('need price refresh'), 'Admin review exposes stale/unknown estimate provenance');

const migration = read('Supabase/migrations/20260923164957_builder_handoff_hardening_v1.sql');
for (const contract of ['vt_guard_saved_build_write','customer_request_build_quote','admin_quote_saved_build']) {
  assert.ok(migration.includes(contract), `Migration contains ${contract}`);
}
assert.ok(migration.includes("nullif(x->>'price_checked_at','')::timestamptz"), 'Quote creation preserves missing source timestamps as null');
assert.ok(migration.includes("status = 'saved'"), 'Customer inserts start in saved state');
assert.ok(migration.includes("raise exception 'This build is locked after a quote request'"), 'Customer builds lock after quote request');

const enginePath = path.join(root, 'builder/js/build-engine.js');
const engine = await import(`${pathToFileURL(enginePath).href}?step33=${Date.now()}`);
const fill = (build, type) => ({ ...build, [type]: type === 'storage' ? [{ id:'storage', type }] : { id:type, type } });
let office = engine.createEmptyBuild();
office = { ...office, cpu: { id:'cpu-igpu', type:'cpu', specs:{ integratedGraphics:true } } };
for (const type of ['motherboard','memory','case','cooler','psu','storage']) office = fill(office, type);
assert.equal(engine.isCategorySatisfied(office, 'gpu'), true, 'Integrated graphics satisfy the GPU category');
assert.equal(engine.getCompletedCategoryCount(office), engine.REQUIRED_CATEGORIES.length, 'Integrated-graphics build is complete');

let gaming = engine.createEmptyBuild();
gaming = { ...gaming, cpu: { id:'cpu-no-igpu', type:'cpu', specs:{ integratedGraphics:false } } };
for (const type of ['motherboard','memory','case','cooler','psu','storage']) gaming = fill(gaming, type);
assert.equal(engine.isCategorySatisfied(gaming, 'gpu'), false, 'CPU without integrated graphics still requires a GPU');
assert.equal(engine.getCompletedCategoryCount(gaming), engine.REQUIRED_CATEGORIES.length - 1, 'Non-iGPU build remains incomplete without a GPU');

const fresh = { price: 1500, stockStatus:'in-stock', freshness:'fresh', eligibleForBestPrice:true };
const staleCheap = { price: 900, stockStatus:'in-stock', freshness:'stale', stale:true, eligibleForBestPrice:false };
assert.equal(engine.getBestOffer({ offers:[staleCheap,fresh] }), fresh, 'Fresh eligible offer wins over a cheaper stale offer');

for (const oldPath of ['builder/js/account-integration.js','commerce/js/builder-handoff.js']) {
  assert.ok(!fs.existsSync(path.join(root, oldPath)), `${oldPath} must be removed after upload`);
}

console.log('PASS: Builder UX, iGPU completion, truthful supplier provenance, server-authoritative quote transitions and clean service ownership');
