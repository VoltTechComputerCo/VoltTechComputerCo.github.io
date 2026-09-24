import fs from 'node:fs';
const fail=m=>{throw new Error(m)};
const OLD='https://volttechcomputerco.github.io', NEW='https://volttechcomputerco.co.za';

const headFiles=["src/pages/account.head.html", "src/pages/activity.head.html", "src/pages/builder.head.html", "src/pages/builds.head.html", "src/pages/creator-hub-south-africa.head.html", "src/pages/delivery.head.html", "src/pages/documents.head.html", "src/pages/home.head.html", "src/pages/legal.head.html", "src/pages/paia.head.html", "src/pages/privacy-center.head.html", "src/pages/privacy.head.html", "src/pages/product.head.html", "src/pages/quote-terms.head.html", "src/pages/quotes.head.html", "src/pages/repair.head.html", "src/pages/returns.head.html", "src/pages/service-performance.head.html", "src/pages/service-repair.head.html", "src/pages/service-security.head.html", "src/pages/service-upgrades.head.html", "src/pages/service-windows.head.html", "src/pages/signal-scan.head.html", "src/pages/store.head.html", "src/pages/stream-scan.head.html", "src/pages/streaming-support.head.html", "src/pages/terms.head.html"];
for(const p of headFiles){
  const s=fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
  if(s.includes(OLD))fail(`${p}: old canonical host remains`);
  if(!s.includes(NEW))fail(`${p}: .co.za host missing`);
}
const config=fs.readFileSync(new URL('../assets/js/services/site-config.js',import.meta.url),'utf8');
if(!config.includes("canonicalOrigin = 'https://volttechcomputerco.co.za'"))fail('canonicalOrigin mismatch');
if(config.includes("productionOrigins = new Set(['https://volttechcomputerco.github.io"))fail('github.io still marked production');
const robots=fs.readFileSync(new URL('../robots.txt',import.meta.url),'utf8');
if(!robots.includes(`${NEW}/sitemap.xml`))fail('robots sitemap host mismatch');
const sitemap=fs.readFileSync(new URL('../sitemap.xml',import.meta.url),'utf8');
if(sitemap.includes(OLD))fail('sitemap contains old host');
const feed=fs.readFileSync(new URL('../static-feed.xml',import.meta.url),'utf8');
if(feed.includes(OLD))fail('RSS contains old host');
const hub=fs.readFileSync(new URL('../static.html',import.meta.url),'utf8');
if(hub.includes(OLD))fail('STATIC hub contains old host');
const template=fs.readFileSync(new URL('../docs/clean-rebuild/STATIC-ARTICLE-TEMPLATE.html',import.meta.url),'utf8');
if(template.includes(OLD)||!template.includes(NEW))fail('STATIC article template domain mismatch');
const builder=fs.readFileSync(new URL('../scripts/build-static-feed.py',import.meta.url),'utf8');
if(builder.includes(OLD))fail('feed builder still references github.io after Step 8.3 migration');
if(!/BASE\s*=\s*["']https:\/\/volttechcomputerco\.co\.za\/["']/.test(builder))fail('feed canonical base mismatch');
const validator=fs.readFileSync(new URL('../scripts/validate-static.py',import.meta.url),'utf8');
if(!validator.includes('LEGACY_ARTICLES'))fail('STATIC historical/new article boundary missing');
if(!validator.includes('github.io remains'))fail('STATIC validator no longer rejects old host residue');
if(validator.includes('historical github.io canonical remains until Step 8.3 migration'))fail('obsolete pre-8.3 canonical allowance returned');
const product=fs.readFileSync(new URL('../assets/js/pages/product.js',import.meta.url),'utf8');
if(product.includes(OLD))fail('product runtime canonical still uses github.io');
const discord=fs.readFileSync(new URL('../.github/workflows/static-discord-publisher.yml',import.meta.url),'utf8');
if(!discord.includes('urlparse')||!discord.includes('article path is unchanged'))fail('Discord host-independent dedupe missing');
console.log('PASS: Step 8.3 canonical source, product runtime and STATIC domain contracts');
