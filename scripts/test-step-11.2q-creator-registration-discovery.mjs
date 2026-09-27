import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};

const creator=read('creator-register.html');
const creatorJs=read('assets/js/pages/creator-register.js');
const hub=read('creator-hub-south-africa.html');
const account=read('account.html');
const accountJs=read('assets/js/pages/account.js');
const privacy=read('privacy.html');
const sitemap=read('sitemap.xml');
const regFn=read('Supabase/functions/creator-register/index.ts');
const discoverFn=read('Supabase/functions/discover-sa-streamers/index.ts');
const migration=read('Supabase/migrations/20260927132000_creator_self_registration_and_discovery_v1.sql');

const checks=[
 ['creator page built',creator.includes('Add your Twitch channel.')&&creator.includes('Connect Twitch')],
 ['Creator Hub CTA',hub.includes('href="creator-register.html">Add your Twitch channel</a>')],
 ['Account Creator tab',account.includes('data-account-tab="creator"')&&account.includes('data-account-panel="creator"')],
 ['Account creator RPC',accountJs.includes("client.rpc('my_creator_profile')")],
 ['OAuth state protection',creatorJs.includes('vt_twitch_oauth_state')&&creatorJs.includes("url.searchParams.set('state',state)")],
 ['token removed from URL',creatorJs.includes("history.replaceState(null, '', location.pathname)")],
 ['token not persisted',!/localStorage.*access_token|sessionStorage.*access_token/.test(creatorJs)],
 ['Twitch validation endpoint',regFn.includes('https://id.twitch.tv/oauth2/validate')],
 ['tag discovery signals',['southafrica','southafrican','mzansi','afrikaans','rsa','za'].every(x=>discoverFn.includes(`"${x}"`))],
 ['returned tags inspected',discoverFn.includes('stream.tags')],
 ['RLS creator link policy',migration.includes('Creator can read own linked registration')],
 ['privacy Twitch disclosure',privacy.includes('Twitch ownership verification')&&privacy.includes('does not store that token')],
 ['sitemap creator route',sitemap.includes('https://volttechcomputerco.co.za/creator-register</loc>')]
];
for(const [name,ok] of checks){assert(ok,`FAIL: ${name}`);console.log(`PASS: ${name}`)}
console.log('PASS: Step 11.2Q creator registration + discovery contract');
