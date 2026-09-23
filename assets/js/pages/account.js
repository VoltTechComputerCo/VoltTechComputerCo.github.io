import {
  isAccountInspection, getAccountClient, safeReturnPath, accountCallbackUrl,
  continueAfterAuth, loadAccountNotifications, accountIsAdmin
} from '../services/account-session.js';
import {
  loadProfile, saveProfile, listAddresses, saveAddress, deleteAddress, loadOverview
} from '../services/account-data.js';

const q = selector => document.querySelector(selector);
const qa = selector => [...document.querySelectorAll(selector)];
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[char]));
let client = null;
let currentUser = null;
let addressRows = [];
let recoveryMode = false;
let hubLoading = false;
const returnPath = safeReturnPath();

function setStatus(target, message = '', type = '') {
  if (!target) return;
  target.textContent = message;
  target.dataset.type = type;
}
const authStatus = (message = '', type = '') => setStatus(q('#authStatus'), message, type);
const hubStatus = (message = '', type = '') => setStatus(q('#hubStatus'), message, type);

function show(id) {
  ['#authGate', '#recoveryGate', '#accountHub'].forEach(selector => {
    const element = q(selector);
    if (element) element.hidden = selector !== id;
  });
}

function setTab(name) {
  qa('[data-account-tab]').forEach(button => button.classList.toggle('active', button.dataset.accountTab === name));
  qa('[data-account-panel]').forEach(panel => {
    const active = panel.dataset.accountPanel === name;
    panel.hidden = !active;
    panel.classList.toggle('active', active);
  });
}

function bindTabs() {
  qa('[data-account-tab]').forEach(button => button.addEventListener('click', () => setTab(button.dataset.accountTab)));
}

function resetAddressForm(profile = {}) {
  q('#addressId').value = '';
  q('#addressLabel').value = 'Delivery address';
  q('#recipientName').value = profile.full_name || q('#profileName')?.value || '';
  q('#addressPhone').value = profile.phone || q('#profilePhone')?.value || '';
  q('#addressLine1').value = '';
  q('#addressLine2').value = '';
  q('#addressSuburb').value = profile.suburb || q('#profileSuburb')?.value || '';
  q('#addressCity').value = 'Pretoria';
  q('#addressProvince').value = 'Gauteng';
  q('#postalCode').value = '';
  q('#addressCountry').value = 'South Africa';
  q('#defaultShipping').checked = false;
  q('#addressFormTitle').textContent = 'Add delivery address';
  q('#cancelAddressEdit').hidden = true;
}

function fillProfile(profile, user) {
  q('#accountName').textContent = profile.full_name || 'VoltTech customer';
  q('#accountEmail').textContent = user.email || '';
  q('#profileName').value = profile.full_name || '';
  q('#companyName').value = profile.company_name || '';
  q('#profilePhone').value = profile.phone || '';
  q('#profileSuburb').value = profile.suburb || '';
  q('#billingEmail').value = profile.billing_email || user.email || '';
  q('#preferredContact').value = profile.preferred_contact || 'whatsapp';
  q('#loginEmail').value = user.email || '';
  const avatar = q('#accountAvatar');
  const src = user.user_metadata?.avatar_url || user.user_metadata?.picture;
  if (src) { avatar.src = src; avatar.hidden = false; } else { avatar.hidden = true; avatar.removeAttribute('src'); }
}

function renderAddresses(rows) {
  addressRows = rows || [];
  const list = q('#addressList');
  if (!addressRows.length) {
    list.innerHTML = '<p class="muted">No saved delivery addresses yet.</p>';
    return;
  }
  list.innerHTML = addressRows.map(row => `
    <article class="account-address-card">
      <div class="account-address-head"><div><p class="eyebrow">${esc(row.label || 'Delivery address')}</p><h3>${esc(row.recipient_name || 'Delivery address')}</h3></div>${row.is_default_shipping ? '<span class="tag tag-success">Default</span>' : ''}</div>
      <p>${esc(row.address_line1)}${row.address_line2 ? `<br>${esc(row.address_line2)}` : ''}<br>${esc([row.suburb,row.city,row.province,row.postal_code].filter(Boolean).join(', '))}<br>${esc(row.country || 'South Africa')}</p>
      <div class="account-address-actions"><button type="button" data-edit-address="${esc(row.id)}">Edit</button><button class="danger" type="button" data-delete-address="${esc(row.id)}">Delete</button></div>
    </article>`).join('');
  list.querySelectorAll('[data-edit-address]').forEach(button => button.addEventListener('click', () => editAddress(button.dataset.editAddress)));
  list.querySelectorAll('[data-delete-address]').forEach(button => button.addEventListener('click', () => removeAddress(button.dataset.deleteAddress)));
}

function editAddress(id) {
  const row = addressRows.find(item => item.id === id);
  if (!row) return;
  q('#addressId').value = row.id;
  q('#addressLabel').value = row.label || 'Delivery address';
  q('#recipientName').value = row.recipient_name || '';
  q('#addressPhone').value = row.phone || '';
  q('#addressLine1').value = row.address_line1 || '';
  q('#addressLine2').value = row.address_line2 || '';
  q('#addressSuburb').value = row.suburb || '';
  q('#addressCity').value = row.city || '';
  q('#addressProvince').value = row.province || '';
  q('#postalCode').value = row.postal_code || '';
  q('#addressCountry').value = row.country || 'South Africa';
  q('#defaultShipping').checked = row.is_default_shipping === true;
  q('#addressFormTitle').textContent = 'Edit delivery address';
  q('#cancelAddressEdit').hidden = false;
  q('#addressForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function refreshAddresses() {
  const { data, error } = await listAddresses(client);
  if (error) { q('#addressList').innerHTML = '<p class="muted">Saved addresses could not be loaded.</p>'; return; }
  renderAddresses(data || []);
}

async function handleAddressSave(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (form.dataset.saving === '1') return;
  form.dataset.saving = '1';
  const submit = form.querySelector('button[type="submit"]');
  if (submit) { submit.disabled = true; submit.textContent = 'Saving…'; }
  hubStatus('Saving delivery address…');
  const payload = {
    id: q('#addressId').value || null,
    label: q('#addressLabel').value.trim(), recipient_name: q('#recipientName').value.trim(), phone: q('#addressPhone').value.trim(),
    address_line1: q('#addressLine1').value.trim(), address_line2: q('#addressLine2').value.trim(), suburb: q('#addressSuburb').value.trim(),
    city: q('#addressCity').value.trim(), province: q('#addressProvince').value.trim(), postal_code: q('#postalCode').value.trim(),
    country: q('#addressCountry').value.trim(), is_default_shipping: q('#defaultShipping').checked
  };
  try {
    const { error } = await saveAddress(client, payload);
    if (error) { hubStatus(`Could not save address: ${error.message}`, 'error'); return; }
    resetAddressForm();
    await refreshAddresses();
    hubStatus('Delivery address saved.', 'success');
  } finally {
    delete form.dataset.saving;
    if (submit) { submit.disabled = false; submit.textContent = 'Save address'; }
  }
}

async function removeAddress(id) {
  if (!confirm('Delete this saved delivery address?')) return;
  const { error } = await deleteAddress(client, id);
  if (error) { hubStatus(`Could not delete address: ${error.message}`, 'error'); return; }
  await refreshAddresses();
  hubStatus('Delivery address deleted.', 'success');
}

function renderOverview(overview) {
  const ids = { builds:'#countBuilds', quotes:'#countQuotes', invoices:'#countInvoices', orders:'#countOrders', jobs:'#countJobs' };
  Object.entries(ids).forEach(([key, selector]) => { q(selector).textContent = overview.counts[key] == null ? '—' : String(overview.counts[key]); });
  const action = q('#overviewAction');
  action.dataset.state = overview.action.tone;
  action.innerHTML = `<small>${esc(overview.action.kicker)}</small><strong>${esc(overview.action.title)}</strong><span>${esc(overview.action.body)}</span>${overview.action.href ? `<a class="button" href="${esc(overview.action.href)}">${esc(overview.action.label)}</a>` : ''}`;
  const notice = q('#deletionNotice');
  if (overview.deletion) {
    notice.hidden = false;
    const until = new Intl.DateTimeFormat('en-ZA', { dateStyle: 'long' }).format(new Date(overview.deletion.recovery_until));
    notice.innerHTML = `<strong>Account deletion requested.</strong><br>You can cancel the request in Privacy & Data until ${esc(until)}.`;
  } else notice.hidden = true;
}

async function handleProfileSave(event) {
  event.preventDefault();
  hubStatus('Saving profile…');
  const profile = {
    full_name: q('#profileName').value.trim(), company_name: q('#companyName').value.trim(), phone: q('#profilePhone').value.trim(),
    suburb: q('#profileSuburb').value.trim(), billing_email: q('#billingEmail').value.trim(), preferred_contact: q('#preferredContact').value
  };
  const { error } = await saveProfile(client, currentUser.id, profile);
  if (error) { hubStatus(`Could not save profile: ${error.message}`, 'error'); return; }
  q('#accountName').textContent = profile.full_name || currentUser.email?.split('@')[0] || 'VoltTech customer';
  hubStatus('Profile saved.', 'success');
}

async function handleEmailChange(event) {
  event.preventDefault();
  const email = q('#loginEmail').value.trim();
  if (!email || email === currentUser?.email) { hubStatus('Enter a different email address first.', 'error'); return; }
  hubStatus('Sending email-change confirmation…');
  const { error } = await client.auth.updateUser({ email });
  hubStatus(error ? `Could not change email: ${error.message}` : 'Email change requested. Check your inbox for the confirmation link.', error ? 'error' : 'success');
}

async function sendPasswordReset() {
  if (!currentUser?.email) return;
  hubStatus('Sending password reset email…');
  const { error } = await client.auth.resetPasswordForEmail(currentUser.email, { redirectTo: `${location.origin}/account.html` });
  hubStatus(error ? `Could not send reset email: ${error.message}` : 'Password reset email sent.', error ? 'error' : 'success');
}

function bindHubActions() {
  q('#profileForm').addEventListener('submit', handleProfileSave);
  q('#addressForm').addEventListener('submit', handleAddressSave);
  q('#cancelAddressEdit').addEventListener('click', () => resetAddressForm());
  q('#emailForm').addEventListener('submit', handleEmailChange);
  q('#passwordReset').addEventListener('click', sendPasswordReset);
  q('#signOut').addEventListener('click', async () => {
    await client.auth.signOut(); currentUser = null; show('#authGate'); authStatus('Signed out.', 'success');
  });
}

async function openHub(user) {
  if (hubLoading) return;
  hubLoading = true;
  currentUser = user;
  show('#accountHub');
  try {
    const [profile, addresses, overview, admin] = await Promise.all([
      loadProfile(client, user), listAddresses(client), loadOverview(client, user.id), accountIsAdmin(client)
    ]);
    fillProfile(profile, user);
    renderAddresses(addresses.error ? [] : (addresses.data || []));
    renderOverview(overview);
    resetAddressForm(profile);
    q('#adminShortcut').hidden = !admin;
    await loadAccountNotifications(client);
    if (new URLSearchParams(location.search).get('tour') === '1') openTour();
  } catch (error) {
    console.error(error);
    hubStatus('Some account information could not be loaded.', 'error');
  } finally { hubLoading = false; }
}

async function signInEmail(event) {
  event.preventDefault(); authStatus('Signing in…');
  const { data, error } = await client.auth.signInWithPassword({ email:q('#authEmail').value.trim(), password:q('#authPassword').value });
  if (error) { authStatus(error.message, 'error'); return; }
  if (data?.user) { authStatus(''); if (!continueAfterAuth(returnPath)) await openHub(data.user); }
}

async function createAccount() {
  const email = q('#authEmail').value.trim(), password = q('#authPassword').value;
  if (!email || password.length < 8) { authStatus('Enter an email and a password of at least 8 characters.', 'error'); return; }
  authStatus('Creating account…');
  const { data, error } = await client.auth.signUp({ email, password, options:{ emailRedirectTo:accountCallbackUrl(returnPath) } });
  if (error) { authStatus(error.message, 'error'); return; }
  if (data?.session?.user) { if (!continueAfterAuth(returnPath)) await openHub(data.session.user); }
  else authStatus('Account created. Check your email and confirm your address, then sign in.', 'success');
}

async function googleSignIn() {
  authStatus('Opening Google sign-in…');
  const { error } = await client.auth.signInWithOAuth({ provider:'google', options:{ redirectTo:accountCallbackUrl(returnPath) } });
  if (error) authStatus(error.message, 'error');
}

async function forgotPassword() {
  const email = q('#authEmail').value.trim();
  if (!email) { authStatus('Enter your email address first.', 'error'); return; }
  authStatus('Sending password reset email…');
  const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo:`${location.origin}/account.html` });
  authStatus(error ? `Could not send reset email: ${error.message}` : 'Password reset email sent. Check your inbox.', error ? 'error' : 'success');
}

async function updateRecoveredPassword(event) {
  event.preventDefault();
  const password = q('#newPassword').value;
  if (password.length < 8) { setStatus(q('#recoveryStatus'), 'Use at least 8 characters.', 'error'); return; }
  setStatus(q('#recoveryStatus'), 'Updating password…');
  const { error } = await client.auth.updateUser({ password });
  if (error) { setStatus(q('#recoveryStatus'), error.message, 'error'); return; }
  recoveryMode = false; setStatus(q('#recoveryStatus'), 'Password updated.', 'success');
  const { data:{ user } } = await client.auth.getUser(); if (user) await openHub(user);
}

const tourSteps = [
  ['MY VOLTTECH / 01','Your account is your control centre.','Overview puts anything that needs your attention first, then gives you direct routes to quotes, documents, builds and activity.'],
  ['ACTIVITY / 02','Follow the whole customer journey.','Activity combines your builds, quotations, invoices, orders and service work when you want one chronological view.'],
  ['QUOTES / 03','Approve formal work from your account.','Builder prices remain estimates until VoltTech reviews current stock, compatibility and pricing and issues a formal quotation.'],
  ['DOCUMENTS / 04','Keep the paperwork together.','Documents is the quickest route to formal quotes, invoices, receipts and service records.'],
  ['NOTIFICATIONS / 05','Important changes come to you.','While signed in on the live site, the notification bell can surface customer actions and updates with a direct link to the relevant record.'],
  ['PRIVACY / 06','You stay in control.','Profile, addresses, password recovery and Privacy & Data controls remain available from your account.']
];
let tourIndex = 0;
function renderTour() {
  const step = tourSteps[tourIndex];
  q('#accountTourKicker').textContent = step[0]; q('#accountTourTitle').textContent = step[1]; q('#accountTourBody').textContent = step[2];
  q('#accountTourProgress').innerHTML = tourSteps.map((_,index)=>`<i class="${index <= tourIndex ? 'on' : ''}"></i>`).join('');
  q('#tourBack').disabled = tourIndex === 0; q('#tourNext').textContent = tourIndex === tourSteps.length - 1 ? 'Done' : 'Next';
}
function openTour() { tourIndex = 0; renderTour(); q('#accountTour').showModal(); }
function bindTour() {
  q('#openTour').addEventListener('click', openTour);
  q('#tourBack').addEventListener('click', ()=>{ if (tourIndex > 0) { tourIndex--; renderTour(); } });
  q('#tourNext').addEventListener('click', ()=>{ if (tourIndex === tourSteps.length - 1) q('#accountTour').close(); else { tourIndex++; renderTour(); } });
}

function renderInspection() {
  const preview = q('#accountPreview');
  preview.hidden = false;
  preview.innerHTML = '<strong>Read-only UI inspection.</strong> No Supabase session or customer data is loaded on this preview host.';
  show('#accountHub'); q('#accountHub').dataset.inspection = '1';
  q('#accountName').textContent = 'Account layout preview'; q('#accountEmail').textContent = 'No customer session loaded';
  ['#countQuotes','#countInvoices','#countBuilds','#countOrders','#countJobs'].forEach(selector => q(selector).textContent = '—');
  const action = q('#overviewAction'); action.dataset.state = 'clear'; action.innerHTML = '<small>Inspection mode</small><strong>No customer data loaded.</strong><span>This preview exists only to inspect the responsive account interface.</span>';
  q('#addressList').innerHTML = '<p class="muted">Saved addresses are intentionally not loaded in inspection mode.</p>';
  qa('#accountHub form input,#accountHub form select,#accountHub form button').forEach(element => element.disabled = true);
}

async function initProduction() {
  try { client = await getAccountClient(); }
  catch (error) { q('#accountPreview').hidden = false; q('#accountPreview').textContent = error.message; show('#authGate'); qa('#authGate button,#authGate input').forEach(el=>el.disabled=true); return; }
  q('#authForm').addEventListener('submit', signInEmail); q('#createAccount').addEventListener('click', createAccount); q('#googleSignIn').addEventListener('click', googleSignIn); q('#forgotPassword').addEventListener('click', forgotPassword); q('#recoveryForm').addEventListener('submit', updateRecoveredPassword);
  client.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') { recoveryMode = true; show('#recoveryGate'); return; }
    if (!recoveryMode && event === 'SIGNED_IN' && session?.user) { if (returnPath) setTimeout(()=>continueAfterAuth(returnPath),0); else setTimeout(()=>openHub(session.user),0); }
    if (event === 'SIGNED_OUT') show('#authGate');
  });
  const { data:{ session } } = await client.auth.getSession();
  if (session?.user && !recoveryMode) { if (!continueAfterAuth(returnPath)) await openHub(session.user); }
  else if (!recoveryMode) show('#authGate');
}

function init() {
  bindTabs(); bindHubActions(); bindTour(); resetAddressForm();
  if (isAccountInspection()) { renderInspection(); return; }
  initProduction();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true }); else init();
