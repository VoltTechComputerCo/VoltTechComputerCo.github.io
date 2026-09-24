import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const assert = (value, message) => { if (!value) throw new Error(message); };

const hub = read('static.html');
assert(!/<style\b/i.test(hub), 'STATIC hub must not contain an inline style block');
assert(!/\sstyle=/i.test(hub), 'STATIC hub must not use inline style attributes');
assert(!/fonts\.googleapis\.com|fonts\.gstatic\.com/i.test(hub), 'STATIC hub must use local fonts');
assert(hub.includes('assets/css/pages/static.css'), 'STATIC hub must load the clean hub stylesheet');
assert(hub.includes('static-feed.xml'), 'STATIC hub must expose RSS discovery');
assert(hub.includes('Editorial coverage is global'), 'STATIC hub must preserve the global-editorial / SA-services boundary');

const feed = read('static-feed.xml');
const links = [...feed.matchAll(/<item>[\s\S]*?<link>(.*?)<\/link>[\s\S]*?<description>(.*?)<\/description>[\s\S]*?<\/item>/g)].map(m => ({ link:m[1], description:m[2].replace(/&apos;/g,"'").replace(/&amp;/g,'&') }));
assert(links.length === 20, `STATIC feed must contain 20 items, found ${links.length}`);
for (const item of links) assert(item.description.length >= 60, `RSS description is too short: ${item.link}`);
const lead = hub.match(/data-static-lead[^>]*href="([^"]+)"/i)?.[1];
assert(lead, 'STATIC hub must mark the lead story');
assert(links[0].link.endsWith('/' + lead), 'STATIC lead must match the newest RSS item');

const builder = read('scripts/build-static-feed.py');
assert(builder.includes('HTMLParser'), 'Feed builder must use HTMLParser');
assert(builder.includes('class HeadParser(HTMLParser)'), 'Feed builder metadata parser missing');
assert(builder.includes('self.meta') && builder.includes('self.canonical'), 'Feed builder head metadata fields missing');
assert(!builder.includes('META_RE ='), 'Legacy quote-fragile meta regex must not return');

const validator = read('scripts/validate-static.py');
assert(validator.includes('LEGACY_ARTICLES'), 'Validator must explicitly grandfather historical article presentation');
assert(validator.includes('static-article.css'), 'Validator must enforce the clean future-article stylesheet');
assert(validator.includes('article:published_time'), 'Validator must require machine-readable publish dates');
assert(!validator.includes('len(articles)!=30') && !validator.includes('len(articles) != 30'), 'Validator must allow future STATIC articles beyond the historical 30');

for (const workflow of ['static-feed-autopilot.yml','static-publishing-guard.yml','static-sitemap-autopilot.yml']) {
  const text = read(`.github/workflows/${workflow}`);
  assert(text.includes('clean-rebuild'), `${workflow} must watch clean-rebuild`);
}
const discord = read('.github/workflows/static-discord-publisher.yml');
assert(/branches:\s*\[main\]/.test(discord), 'Discord publisher must remain main-only');
assert(discord.includes('HEAD^:static-feed.xml'), 'Discord publisher must compare the previous feed');
assert(discord.includes('urlparse'), 'Discord publisher must normalise article URLs before dedupe');
assert(discord.includes('old_key') && discord.includes('current_key') && discord.includes('old_key==current_key'), 'Discord publisher path dedupe missing');

const sitemap = read('sitemap.xml');
assert((sitemap.match(/static(?:-|\.html)/g) || []).length >= 31, 'Sitemap must retain STATIC hub plus historical articles');

const contract = read('docs/clean-rebuild/STATIC-PUBLISHING.md');
assert(contract.includes('New articles use `assets/css/pages/static-article.css`.'), 'STATIC publishing contract missing clean future-article stylesheet');
assert(contract.includes('RSS, sitemap, publishing guard and Discord automation all use `.co.za`.'), 'Publishing contract must document canonical automation boundary');

console.log('PASS: STATIC hub, feed, migrated-history boundary, future publishing and workflow contracts');
