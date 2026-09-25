import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const modelPath=path.join(root,'assets/js/services/stream-scan-model.js');
const modelCode=fs.readFileSync(modelPath,'utf8');
const model=await import('data:text/javascript;base64,'+Buffer.from(modelCode).toString('base64'));

const audio=model.createStreamAnswers();audio.symptom='audio';
assert.deepEqual(model.streamQuestions(audio).map(x=>x.key),['symptom','platform','setupType']);
const network=model.createStreamAnswers();network.symptom='network';
assert.deepEqual(model.streamQuestions(network).map(x=>x.key),['symptom','platform','resolution','connection','upload']);
const encoding=model.createStreamAnswers();encoding.symptom='encoding';
assert.deepEqual(model.streamQuestions(encoding).map(x=>x.key),['symptom','platform','resolution','gpu','setupType']);
const setup=model.createStreamAnswers();setup.symptom='setup';setup.setupType='dual';
assert.equal(model.recommendationFor(setup)[2],'Creator System Tune');
assert.equal(model.recommendationFor(setup)[3],'Quoted after assessment');
const normal=model.createStreamAnswers();normal.symptom='setup';normal.setupType='single';
assert.equal(model.recommendationFor(normal)[2],'Stream Setup');
assert.equal(model.recommendationFor(normal)[3],'R649');
const tune=model.createStreamAnswers();tune.symptom='rendering';
assert.equal(model.recommendationFor(tune)[3],'R449');
const check=model.createStreamAnswers();check.symptom='network';
assert.equal(model.recommendationFor(check)[3],'R299–R449');
const urgent=model.createStreamAnswers();urgent.symptom='network';urgent.connection='wireless';urgent.upload='lt5';
assert(model.urgencyScore(urgent)>model.urgencyScore(network));

const support=fs.readFileSync(path.join(root,'streaming-setup-south-africa.html'),'utf8');
const scan=fs.readFileSync(path.join(root,'stream-scan.html'),'utf8');
for(const [name,html] of [['support',support],['scan',scan]]){
  assert.match(html,/data-vt-shell="clean"/,name+' must use clean shell');
  assert.equal((html.match(/<h1\b/g)||[]).length,1,name+' must have one H1');
  assert.equal((html.match(/<header\b/g)||[]).length,1,name+' must have one site header');
  for(const legacy of ['fonts.googleapis.com','analytics.js','visual-system.css','volttech-experience.js']){
    assert(!html.includes(legacy),name+' still references '+legacy);
  }
}
for(const price of ['R299','R449','R649'])assert(support.includes(price),'support missing '+price);
assert(scan.includes('assets/js/pages/stream-scan.js'),'Stream Scan page controller missing');
assert(scan.includes('assets/css/pages/signal-scan.css'),'shared scan system missing');
assert(scan.includes('assets/css/pages/stream-scan.css'),'stream scan theme missing');
assert(support.includes('creator-hub-south-africa.html'),'Creator Hub handoff missing');
assert(support.includes('stream-scan.html'),'Stream Scan handoff missing');
assert(scan.includes('streaming-setup-south-africa.html'),'support handoff missing');
console.log('PASS: clean streaming support + Stream Scan contracts');
