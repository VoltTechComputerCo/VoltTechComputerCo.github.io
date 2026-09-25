import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const svc=await import(pathToFileURL(path.join(root,'assets/js/services/creator-feed.js')));
const now=Date.parse('2026-09-23T21:30:00Z');
assert.equal(svc.isFreshTimestamp('2026-09-23T21:20:00Z',now),true);
assert.equal(svc.isFreshTimestamp('2026-09-18T13:10:03Z',now),false);

const staleRequest=async url=>new Response(JSON.stringify([{login:'tester',display_name:'Tester',is_live:true,checked_at:'2026-09-18T13:10:03Z'}]),{status:200,headers:{'content-type':'application/json'}});
const stale=await svc.loadCreatorDirectory(staleRequest,now);
assert.equal(stale.fresh,false);
assert.equal(stale.streamers[0].live,false,'stale live status must be suppressed');

const freshRequest=async url=>new Response(JSON.stringify([{login:'tester',display_name:'Tester',is_live:true,viewer_count:12,checked_at:'2026-09-23T21:20:00Z'}]),{status:200,headers:{'content-type':'application/json'}});
const fresh=await svc.loadCreatorDirectory(freshRequest,now);
assert.equal(fresh.fresh,true);
assert.equal(fresh.streamers[0].live,true);

const html=fs.readFileSync(path.join(root,'creator-hub-south-africa.html'),'utf8');
const pageJs=fs.readFileSync(path.join(root,'assets/js/pages/creator-hub.js'),'utf8');
assert.match(html,/data-vt-shell="clean"/);
assert.match(pageJs,/LIVE STATUS CURRENTLY UNAVAILABLE/);
assert.match(pageJs,/location\.hostname/,'Twitch parent must follow the current hostname');
assert.doesNotMatch(pageJs,/parent=volttechcomputerco\.github\.io/);
assert.doesNotMatch(html,/fonts\.googleapis\.com|analytics\.js|visual-system\.css|creator-system\.css|href=\"creator-hub\.css/);
console.log('PASS: Creator Hub freshness, stale-live suppression and clean-shell contract');
