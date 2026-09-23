import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

const page = read('builder/index.html');
assert.ok(page.includes('data-vt-shell="clean"'), 'Builder uses the clean shell marker');
assert.ok(page.includes('../assets/js/pages/builder.js'), 'Builder uses the clean page controller');
assert.ok(page.includes('../builder/styles.css'), 'Step 3.1 explicitly retains only the inner Builder presentation stylesheet');
for (const retired of ['builder-access.js', 'builder-gate.css', 'phase6-unification.css', 'fonts.googleapis.com', 'site-notifications-loader.js']) {
  assert.ok(!page.includes(retired), `Generated Builder must not depend on ${retired}`);
}
assert.ok(page.includes('content="noindex, nofollow"'), 'Builder remains noindex/nofollow');

const access = read('assets/js/services/builder-access.js');
assert.ok(access.includes("!productionOrigins.has(origin) && new URLSearchParams(search).get('inspect') === '1'"), 'Inspection cannot bypass production origins');
assert.ok(access.includes("settings.builder_enabled === true"), 'Production Builder still requires its launch flag');
assert.ok(access.includes("admin.data === true"), 'Production preview still requires verified admin access');
assert.ok(access.includes('sdkUrl'), 'Builder uses the pinned shared SDK URL');

const controller = read('assets/js/pages/builder.js');
assert.ok(controller.includes('window.__VT_BUILDER_INSPECT = Boolean(access.inspect)'), 'Inspection state is explicit');
assert.ok(controller.includes("if (access.live)"), 'Account integration loads only for a live Builder');
assert.ok(controller.includes('account-integration.js?v=2.2.0'), 'Existing live account contract remains available');

const loader = read('builder/js/data-loader.js');
assert.ok(!loader.includes("import \"./account-integration.js"), 'Catalogue loading no longer implicitly starts account services');
assert.ok(loader.includes("window.__VT_BUILDER_INSPECT === true"), 'Inspection mode keeps Store overlay offline');
assert.ok(loader.includes('const client = window.volttechAuth'), 'Store overlay reuses the shared client');

for (const oldPath of ['builder/builder-access.js', 'builder/builder-gate.css', 'builder/phase6-unification.css']) {
  assert.ok(!fs.existsSync(path.join(root, oldPath)), `${oldPath} must be removed after upload`);
}

console.log('PASS: clean Builder shell, fail-closed launch gate, production-only admin preview, isolated read-only inspection and shared Store-overlay client contract');
