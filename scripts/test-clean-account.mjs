import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const page = read('account.html');
const source = read('src/pages/account.html');
const config = JSON.parse(read('src/pages/account.json'));
const controller = read('assets/js/pages/account.js');
const session = read('assets/js/services/account-session.js');
const data = read('assets/js/services/account-data.js');
const migration = read('Supabase/migrations/20260923210205_customer_address_atomic_v1.sql');

assert.equal(config.output, 'account.html');
assert.match(page, /data-vt-shell="clean"/);
assert.match(page, /content="noindex, nofollow"/);
assert.equal((page.match(/<h1\b/g)||[]).length, 1);
assert.equal((page.match(/<main\b/g)||[]).length, 1);
assert.equal((page.match(/<header\b/g)||[]).length, 1);
assert.equal((page.match(/<footer\b/g)||[]).length, 1);
assert.doesNotMatch(page, /fonts\.googleapis|account-v3\.css|account-phase4\.css|portal-shell\.js|account-dashboard\.js|account-v4-nav\.js|account-filters\.js|admin-shortcut\.js/);
assert.doesNotMatch(page, /\sstyle=|\son[a-z]+=/i);
assert.match(page, /assets\/css\/pages\/account\.css/);
assert.match(page, /assets\/js\/pages\/account\.js/);

const requiredIds = [
  'accountPreview','authGate','authForm','authEmail','authPassword','createAccount','forgotPassword',
  'authStatus','recoveryGate','recoveryForm','newPassword','recoveryStatus','accountHub','accountAvatar',
  'accountName','accountEmail','adminShortcut','openTour','overviewAction','countQuotes','countInvoices',
  'countBuilds','countOrders','countJobs','deletionNotice','profileForm','profileName','companyName',
  'profilePhone','profileSuburb','billingEmail','preferredContact','addressList','addressFormTitle',
  'addressForm','addressId','addressLabel','recipientName','addressPhone','addressLine1','addressLine2',
  'addressSuburb','addressCity','addressProvince','postalCode','addressCountry','defaultShipping',
  'cancelAddressEdit','emailForm','loginEmail','passwordReset','signOut','hubStatus','accountTour',
  'accountTourKicker','accountTourTitle','accountTourBody','accountTourProgress','tourBack','tourNext'
];
for (const id of requiredIds) {
  assert.match(page, new RegExp(`id=["']${id}["']`), `generated Account page missing controller target #${id}`);
  assert.match(source, new RegExp(`id=["']${id}["']`), `Account source missing controller target #${id}`);
}
for (const stale of ['authPanel','emailAuthForm','authFeedback','accountDashboard','accountState']) {
  assert.doesNotMatch(page, new RegExp(`id=["']${stale}["']`), `stale Account DOM target returned: #${stale}`);
}
assert.match(page, /data-account-tab="overview"/);
assert.match(page, /data-account-panel="overview"/);
assert.match(controller, /isAccountInspection/);
assert.match(controller, /No customer data loaded/);
assert.match(session, /2\.116\.0|sdkUrl/);
assert.match(session, /url\.origin !== location\.origin/);
assert.match(data, /customer_save_address_v1/);
assert.match(migration, /security invoker/i);
assert.match(migration, /customer_addresses_one_default_shipping_per_user|is_default_shipping = false|is_default_shipping=false/);
assert.doesNotMatch(migration, /drop table|disable row level security/i);
console.log('PASS: clean account shell, DOM/controller contract, preview isolation, auth boundary and atomic address contract');
