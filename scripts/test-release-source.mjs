import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const snapshot = JSON.parse(read('docs/clean-rebuild/step-9.3-backend-snapshot.json'));
const outDir = path.join(root, 'qa-results/step-9.3');
fs.mkdirSync(outDir, { recursive:true });

const results = [];
let failed = 0;
const check = (name, condition, detail='') => {
  const status = condition ? 'PASS' : 'FAIL';
  results.push({name,status,detail});
  if (!condition) failed += 1;
  console.log(`${status}: ${name}${detail ? ` — ${detail}` : ''}`);
};

const siteConfig = read('assets/js/services/site-config.js');
const integrations = read('assets/js/services/home-integrations.js');
const catalogue = read('assets/js/services/catalogue.js');
const builder = read('assets/js/services/builder-access.js');
const transactions = read('assets/js/services/transactions.js');
const checkout = read('assets/js/pages/checkout.js');
const order = read('assets/js/pages/order-status.js');
const launch = read('admin-launch-controls.js');
const config = read('supabase-config.js');
const paia = read('paia.html');
const legal = read('legal.html');
const creator = read('assets/js/services/creator-feed.js');
const creatorRefresh = read('Supabase/functions/refresh-sa-streamers/index.ts');
const blockers = read('docs/clean-rebuild/RELEASE-BLOCKERS.md');

check('Canonical transaction origin is .co.za',
  siteConfig.includes("canonicalOrigin = 'https://volttechcomputerco.co.za'") &&
  siteConfig.includes('transactionOrigin = canonicalOrigin'));

check('Store requires explicit catalogue flag',
  catalogue.includes('if (!settings.catalogue_enabled && !preview)') &&
  integrations.includes('row?.catalogue_enabled === true'));

check('Builder requires explicit launch flag or verified admin preview',
  builder.includes('settings.builder_enabled === true') &&
  builder.includes("admin.data === true") &&
  builder.includes("!productionOrigins.has(origin) && new URLSearchParams(search).get('inspect') === '1'"));

check('Direct payment requires explicit payment flag and payable order',
  transactions.includes('settings?.direct_payment_enabled === true') &&
  transactions.includes("order?.can_pay === true") &&
  transactions.includes("order.checkout_stage==='awaiting_payment'"));

check('Payment redirect is restricted to Yoco HTTPS',
  transactions.includes("url.protocol==='https:'") &&
  transactions.includes("url.hostname==='c.yoco.com'"));

check('Checkout ambiguous failure prevents duplicate retry',
  checkout.includes('We could not confirm whether your order was received') &&
  checkout.includes("button.textContent='CONFIRMATION NEEDED'") &&
  checkout.includes('if(!uncertain){sending=false'));

check('Checkout protects cart changes during submission',
  checkout.includes('Your cart changed while this request was being sent') &&
  checkout.includes('button.disabled=true'));

check('Order tracking hides payment after refresh failure',
  order.includes("document.getElementById('pay-order').hidden=true") &&
  order.includes('Refresh before making a payment'));

check('Admin launch controls enforce readiness and confirmation',
  launch.includes("!readiness?.store_ready") &&
  launch.includes("!readiness?.builder_ready") &&
  launch.includes('Make the selected customer-facing feature live?'));

check('Public Supabase config exposes publishable key only',
  /publishableKey:"sb_publishable_/.test(config) &&
  !/service[_-]?role|secret[_-]?key/i.test(config));

check('PAIA and ecommerce release boundaries remain explicit',
  paia.includes('Release blocker:') &&
  paia.includes('Information Officer') &&
  legal.includes('Production ecommerce remains launch-gated'));

check('Creator live status fails stale/closed',
  creator.includes('CREATOR_FRESH_MS') &&
  creator.includes("source === 'unavailable'") &&
  creatorRefresh.includes('Twitch credentials are not configured'));

check('Backend snapshot is a non-commerce certification',
  snapshot.release_mode === 'non-commerce' &&
  snapshot.store_settings.catalogue_enabled === false &&
  snapshot.store_settings.builder_enabled === false &&
  snapshot.store_settings.direct_payment_enabled === false);

check('No active Store transaction backlog at certification',
  snapshot.commerce_activity.store_request_count === 0 &&
  snapshot.commerce_activity.pending_store_payments === 0 &&
  snapshot.commerce_activity.confirmed_store_orders === 0);

check('Commerce blockers are documented, not hidden',
  snapshot.edge_origin_alignment.aligned === false &&
  snapshot.inventory.real_public_products === 0 &&
  snapshot.compliance.paia_manual_complete === false &&
  blockers.includes('Deployed Edge Function origin mismatch') &&
  blockers.includes('Payment readiness contract is not aligned') &&
  blockers.toLowerCase().includes('leaked-password protection'));

const summary = {
  step:'9.3-source',
  total:results.length,
  passed:results.length-failed,
  failed,
  status:failed ? 'FAIL' : 'PASS',
  results
};
fs.writeFileSync(path.join(outDir,'source-summary.json'), JSON.stringify(summary,null,2)+'\n');
console.log(`\nStep 9.3 source certification: ${summary.passed}/${summary.total}`);
process.exit(failed ? 1 : 0);
