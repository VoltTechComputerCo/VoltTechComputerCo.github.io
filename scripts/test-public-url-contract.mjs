import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const ORIGIN='https://volttechcomputerco.co.za';
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const assert=(v,m)=>{if(!v)throw new Error(m)};

const htmlFiles=fs.readdirSync(root).filter(n=>n.endsWith('.html')).sort();
let canonicalCount=0;
for(const name of htmlFiles){
  const html=read(name);
  const robots=html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)/i)?.[1]||'';
  const canonical=html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i)?.[1]||'';
  const indexable=!robots.toLowerCase().includes('noindex');
  if(indexable && canonical){
    canonicalCount++;
    assert(canonical.startsWith(ORIGIN+'/'),`${name}: canonical host mismatch`);
    assert(!/\.html(?:$|[?#])/.test(canonical),`${name}: indexable canonical still uses .html`);
  }
  const og=html.match(/<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)/i)?.[1]||'';
  if(og.startsWith(ORIGIN+'/')){
    assert(!/\.html(?:$|[?#])/.test(og),`${name}: og:url still uses .html`);
  }
}
assert(canonicalCount>=10,`Expected indexable canonical coverage, found ${canonicalCount}`);

const sitemap=read('sitemap.xml');
const sitemapUrls=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
assert(sitemapUrls.length>=40,`Expected at least 40 sitemap URLs, found ${sitemapUrls.length}`);
assert(sitemapUrls.includes(`${ORIGIN}/pc-repair-pretoria`),'PC Repair extensionless sitemap URL missing');
assert(sitemapUrls.includes(`${ORIGIN}/signal-scan`),'Signal Scan extensionless sitemap URL missing');
assert(sitemapUrls.includes(`${ORIGIN}/static`),'STATIC extensionless sitemap URL missing');
assert(!sitemapUrls.some(u=>/\.html(?:$|[?#])/.test(u)),'Sitemap still contains .html public URL');

const feed=read('static-feed.xml');
const feedLinks=[...feed.matchAll(/<item>[\s\S]*?<link>(.*?)<\/link>/g)].map(m=>m[1]);
assert(feedLinks.length===20,`Expected 20 STATIC RSS items, found ${feedLinks.length}`);
assert(feed.includes(`<link>${ORIGIN}/static</link>`),'STATIC RSS channel link must be extensionless');
assert(!feedLinks.some(u=>/\.html(?:$|[?#])/.test(u)),'STATIC RSS item URL still uses .html');

for(const name of fs.readdirSync(path.join(root,'src/pages')).filter(n=>n.endsWith('.head.html'))){
  const text=read(`src/pages/${name}`);
  const matches=[...text.matchAll(/https:\/\/volttechcomputerco\.co\.za\/[^"'<>\\s]+\.html(?:[?#][^"'<>\\s]*)?/g)];
  assert(matches.length===0,`${name}: source head contains absolute .html public URL`);
}

const repair=read('pc-repair-pretoria.html');
assert(repair.includes(`<link rel="canonical" href="${ORIGIN}/pc-repair-pretoria">`),'PC Repair canonical not normalized');
const signal=read('signal-scan.html');
assert(signal.includes(`<link rel="canonical" href="${ORIGIN}/signal-scan">`),'Signal Scan canonical not normalized');
const staticHub=read('static.html');
assert(staticHub.includes(`<link rel="canonical" href="${ORIGIN}/static">`),'STATIC canonical not normalized');

const sitemapWorkflow=read('.github/workflows/static-sitemap-autopilot.yml');
assert(sitemapWorkflow.includes('url = BASE + page.stem'),'STATIC sitemap automation must publish extensionless URLs');
assert(!sitemapWorkflow.includes('url = BASE + page.name'),'STATIC sitemap automation still publishes physical filenames');

const feedBuilder=read('scripts/build-static-feed.py');
assert(feedBuilder.includes('BASE+path.stem'),'STATIC RSS fallback must use extensionless article URL');
assert(feedBuilder.includes('BASE+"static"'),'STATIC RSS channel must use extensionless hub URL');

console.log(`PASS: extensionless public URL contract (${canonicalCount} indexable canonicals, ${sitemapUrls.length} sitemap URLs, ${feedLinks.length} RSS items)`);
