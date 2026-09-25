import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const model=await import(`${pathToFileURL(path.join(root,'assets/js/services/signal-scan-model.js')).href}?qa=${Date.now()}`);
const contact=await import(`${pathToFileURL(path.join(root,'assets/js/services/service-contact.js')).href}?qa=${Date.now()}`);

const services={
  repair:{page:'pc-repair-pretoria.html',price:'R350–R650'},
  performance:{page:'pc-performance-optimisation.html',price:'R350–R550'},
  upgrades:{page:'pc-upgrades-pretoria.html',price:'From R299'},
  security:{page:'virus-malware-removal-pretoria.html',price:'R350–R550'},
  windows:{page:'windows-installation-pretoria.html',price:'R350–R650'}
};

for(const [key,cfg] of Object.entries(services)){
  const html=read(cfg.page);
  assert.ok(html.includes('data-vt-shell="clean"'),`${cfg.page} stays on clean shell`);
  assert.equal(model.sourceInfo[key].page,cfg.page,`${key} result returns to the correct service page`);
  const pageIssues=[...html.matchAll(/data-issue="([^"]+)"/g)].map(m=>m[1]);
  const scanIssues=model.issueSets[key].map(row=>row[0]);
  assert.deepEqual(pageIssues,scanIssues,`${key} service symptoms and Signal Scan issue keys stay aligned`);
  assert.ok(html.includes(`signal-scan.html?source=${key}`),`${key} starts Signal Scan with the correct source`);
  for(const [issue,label] of model.issueSets[key]){
    const answers=model.createAnswers();
    model.applyContext(answers,key,issue);
    assert.equal(model.scanMode(answers,key),key,`${key}/${issue} keeps its service route`);
    const message=contact.buildServiceMessage(key,label);
    assert.ok(message.includes(`Selected issue: ${label}`),`${key}/${issue} enquiry preserves the selected symptom`);
  }
  const answers=model.createAnswers();
  model.applyContext(answers,key,model.issueSets[key][0][0]);
  assert.equal(model.resultConfig(answers,key)[2],cfg.price,`${key} price guide remains aligned`);
}

const signal=read('signal-scan.html');
const retiredRefs=['href=\"signal-scan.css','href=\"service-pages.css','href=\"service-malware.css'];
for(const retired of retiredRefs){
  assert.ok(!signal.includes(retired),`Signal Scan does not reference retired ${retired}`);
  for(const cfg of Object.values(services)) assert.ok(!read(cfg.page).includes(retired),`${cfg.page} does not reference retired ${retired}`);
}
assert.ok(signal.includes('does <strong>not</strong> remotely scan'), 'Signal Scan keeps the visible remote-scan limitation');
assert.ok(read('pc-upgrades-pretoria.html').includes('VoltTech is not currently selling or sourcing components.'),'Upgrade supply boundary remains explicit');
assert.ok(read('virus-malware-removal-pretoria.html').includes('exposure-scan.html'),'Security keeps Exposure Scan handoff');

console.log('PASS: service → Signal Scan → service/contact round-trip contracts, issue keys, pricing and retained business boundaries');
