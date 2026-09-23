import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const model = await import(`${pathToFileURL(path.join(root, 'assets/js/services/signal-scan-model.js')).href}?qa=${Date.now()}`);

const page = read('signal-scan.html');
assert.ok(page.includes('data-vt-shell="clean"'), 'Signal Scan uses the clean shell');
assert.ok(page.includes('assets/css/pages/signal-scan.css'), 'Signal Scan uses clean page CSS');
assert.ok(page.includes('assets/js/pages/signal-scan.js'), 'Signal Scan uses the clean controller');
for (const retired of ['href="signal-scan.css', 'scan-system.css', 'visual-system.css', 'visual-block-fix.css', 'analytics.js?v=', 'fonts.googleapis.com']) {
  assert.ok(!page.includes(retired), `Signal Scan no longer depends on ${retired}`);
}
assert.ok(page.includes('does <strong>not</strong> remotely scan'), 'Remote-scan limitation is visible in first-party content');

assert.deepEqual(model.allowedSources, ['repair','performance','upgrades','security','windows']);
for (const source of model.allowedSources) {
  assert.ok(model.sourceInfo[source]?.page, `${source} has a service destination`);
  assert.ok(model.issueSets[source]?.length >= 6, `${source} has its issue set`);
}

const windows = model.createAnswers();
model.applyContext(windows, 'windows', 'fresh');
assert.equal(model.scanMode(windows, 'windows'), 'windows');
assert.equal(model.resultConfig(windows, 'windows')[2], 'R350–R650', 'Windows estimate matches the Windows service page');
assert.deepEqual(model.scanQuestions(windows, 'windows').map(q => q.key), ['context','backup','age'], 'Windows asks backup and age, not irrelevant gaming questions');

const upgrades = model.createAnswers();
model.applyContext(upgrades, 'upgrades', 'gaming');
assert.equal(model.resultConfig(upgrades, 'upgrades')[2], 'From R299', 'Upgrade estimate matches service page');
assert.deepEqual(model.scanQuestions(upgrades, 'upgrades').map(q => q.key), ['context','age','usage']);

const security = model.createAnswers();
model.applyContext(security, 'security', 'account');
assert.equal(model.resultConfig(security, 'security')[2], 'R350–R550');
assert.ok(model.resultConfig(security, 'security')[1].includes('trusted device'), 'Account-risk result preserves safer credential guidance');

const repair = model.createAnswers();
model.applyContext(repair, 'repair', 'boot');
assert.equal(model.resultConfig(repair, 'repair')[2], 'R350–R650');
assert.ok(model.urgencyScore(repair, 'repair') > .6, 'No-boot path remains a high-priority triage result');

const performance = model.createAnswers();
model.applyContext(performance, 'performance', 'fps');
assert.equal(model.resultConfig(performance, 'performance')[2], 'R350–R550');
assert.equal(model.contextLabel(performance, 'performance'), 'FPS drops');

const controller = read('assets/js/pages/signal-scan.js');
const handoff = read('assets/js/services/signal-scan-handoff.js');
assert.ok(handoff.includes("vt_journey_context"), 'Service-page journey context is preserved');
assert.ok(handoff.includes("vt_last_scan_result"), 'Last result continuity is preserved');
assert.ok(controller.includes("data-scan-route=\"whatsapp\""), 'WhatsApp handoff is generated from the result');
assert.ok(controller.includes('connectProductionServices()'), 'Production analytics/service-worker bootstrap uses the clean shared integration');

console.log('PASS: clean Signal Scan shell, five service routes, pricing consistency, source handoff and answer-based triage contract');
