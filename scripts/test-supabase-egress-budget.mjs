import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Static cost guard: never silently go back to fetching the full public
// catalogue from Supabase every 15 minutes. The actual egress report is
// only available from Supabase billing, not from this source-level test.
const workflow=readFileSync('.github/workflows/public-catalogue.yml','utf8');
const reader=readFileSync('assets/js/services/public-catalogue.js','utf8');
const exporter=readFileSync('scripts/build-public-catalogue.mjs','utf8');
const checkout=readFileSync('Supabase/functions/submit-store-checkout/index.ts','utf8');

assert.match(workflow,/cron:\s*['"]22 \*\/2 \* \* \*['"]/,
 'publish the public catalogue only once per two hours at :22 UTC');
assert.doesNotMatch(workflow,/7,22,37,52 \* \* \* \*/,
 'do not recreate the old 96-fetches-per-day schedule');
assert.match(workflow,/workflow_dispatch:/,'retain manual refresh for urgent stock corrections');
assert.match(workflow,/node scripts\/build-public-catalogue\.mjs/,
 'keep the public snapshot publisher active');
assert.match(reader,/Date\.now\(\)-Date\.parse\(payload\.generatedAt\)<10\*60\*60\*1000/,
 'retain the 10-hour fallback for a delayed GitHub scheduled job');
assert.match(reader,/Math\.floor\(Date\.now\(\)\/900000\)/,
 'let CDN clients detect delayed publication within 15 minutes');
assert.match(exporter,/publishableKey/,'the public exporter uses an anonymous key');
assert.doesNotMatch(exporter,/SERVICE_ROLE_KEY/,'the export must not depend on private service credentials');
assert.match(checkout,/pending_stock_confirmation/,
 'new orders still require stock confirmation before payment');

console.log('PASS: 12 publication runs/day; manual refresh, CDN freshness and stock confirmation retained');
