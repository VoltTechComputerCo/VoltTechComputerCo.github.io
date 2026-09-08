(() => {
  const client = window.supabase.createClient(
    VOLTTECH_SUPABASE.url,
    VOLTTECH_SUPABASE.publishableKey,
    { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
  );

  const q = s => document.querySelector(s);
  const qa = s => [...document.querySelectorAll(s)];
  let currentUser = null;
  let hubBound = false;
  let recoveryMode = false;
  let hubLoading = false;

  const money = value =>
    new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" })
      .format(Number(value || 0));

  const date = value =>
    value ? new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium" }).format(new Date(value)) : "—";

  function setStatus(el, message = "", type = "") {
    if (!el) return;
    el.textContent = message;
    el.dataset.type = type;
  }

  const status = (message = "", type = "") => setStatus(q("#hubStatus"), message, type);
  const authStatus = (message = "", type = "") => setStatus(q("#authStatus"), message, type);

  function show(view) {
    ["#authGate", "#recoveryGate", "#accountHub"].forEach(id => {
      const el = q(id);
      if (el) el.hidden = id !== view;
    });
  }

  function setTab(name) {
    qa("[data-tab]").forEach(btn => btn.classList.toggle("active", btn.dataset.tab === name));
    qa("[data-panel]").forEach(panel => panel.hidden = panel.dataset.panel !== name);
  }

  function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    })[c]);
  }

  async function loadProfile(user) {
    const { data, error } = await client
      .from("profiles")
      .select("full_name,phone,suburb,billing_email,preferred_contact,company_name")
      .eq("id", user.id)
      .maybeSingle();
    if (error) throw error;

    const fallbackName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] || "";

    q("#accountName").textContent = data?.full_name || fallbackName || "VoltTech customer";
    q("#accountEmail").textContent = user.email || "";
    q("#profileName").value = data?.full_name || fallbackName;
    q("#profilePhone").value = data?.phone || "";
    q("#profileSuburb").value = data?.suburb || "";
    q("#billingEmail").value = data?.billing_email || user.email || "";
    q("#companyName").value = data?.company_name || "";
    q("#preferredContact").value = data?.preferred_contact || "whatsapp";
    q("#loginEmail").value = user.email || "";
  }

  async function loadAddresses() {
    const list = q("#addressList");
    list.innerHTML = '<p class="empty">Loading saved locations…</p>';
    const { data, error } = await client
      .from("customer_addresses").select("*")
      .order("is_default_shipping", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) { list.innerHTML = '<p class="empty error">Could not load saved locations.</p>'; return; }
    if (!data?.length) { list.innerHTML = '<p class="empty">No saved delivery locations yet.</p>'; return; }

    list.innerHTML = data.map(a => `
      <article class="history-card address-card">
        <div class="history-head"><div><span class="mini">${escapeHtml(a.label || "Address")}</span>
        <h3>${escapeHtml(a.recipient_name || "Delivery location")}</h3></div>
        ${a.is_default_shipping ? '<span class="pill good">Default delivery</span>' : ""}</div>
        <p>${escapeHtml(a.address_line1)}${a.address_line2 ? "<br>"+escapeHtml(a.address_line2) : ""}<br>
        ${escapeHtml([a.suburb,a.city,a.province,a.postal_code].filter(Boolean).join(", "))}<br>
        ${escapeHtml(a.country || "South Africa")}</p>
        <div class="small-actions"><button class="text-btn" data-edit-address="${a.id}">Edit</button>
        <button class="text-btn danger" data-delete-address="${a.id}">Delete</button></div>
      </article>`).join("");

    qa("[data-edit-address]").forEach(btn => btn.onclick = () => editAddress(btn.dataset.editAddress, data));
    qa("[data-delete-address]").forEach(btn => btn.onclick = () => deleteAddress(btn.dataset.deleteAddress));
  }

  function resetAddressForm() {
    q("#addressId").value = "";
    q("#addressLabel").value = "Delivery address";
    q("#recipientName").value = q("#profileName").value || "";
    q("#addressPhone").value = q("#profilePhone").value || "";
    q("#addressLine1").value = "";
    q("#addressLine2").value = "";
    q("#addressSuburb").value = q("#profileSuburb").value || "";
    q("#addressCity").value = "Pretoria";
    q("#addressProvince").value = "Gauteng";
    q("#postalCode").value = "";
    q("#addressCountry").value = "South Africa";
    q("#defaultShipping").checked = false;
    q("#addressFormTitle").textContent = "Add delivery location";
    q("#cancelAddressEdit").hidden = true;
  }

  function editAddress(id, rows) {
    const a = rows.find(x => x.id === id);
    if (!a) return;
    q("#addressId").value = a.id;
    q("#addressLabel").value = a.label || "Delivery address";
    q("#recipientName").value = a.recipient_name || "";
    q("#addressPhone").value = a.phone || "";
    q("#addressLine1").value = a.address_line1 || "";
    q("#addressLine2").value = a.address_line2 || "";
    q("#addressSuburb").value = a.suburb || "";
    q("#addressCity").value = a.city || "";
    q("#addressProvince").value = a.province || "";
    q("#postalCode").value = a.postal_code || "";
    q("#addressCountry").value = a.country || "South Africa";
    q("#defaultShipping").checked = !!a.is_default_shipping;
    q("#addressFormTitle").textContent = "Edit delivery location";
    q("#cancelAddressEdit").hidden = false;
    q("#addressForm").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function saveAddress(e) {
    e.preventDefault();
    const id = q("#addressId").value;
    const makeDefault = q("#defaultShipping").checked;
    status("Saving delivery location…");

    if (makeDefault) {
      await client.from("customer_addresses").update({ is_default_shipping: false }).eq("user_id", currentUser.id);
    }

    const payload = {
      user_id: currentUser.id,
      label: q("#addressLabel").value.trim() || "Delivery address",
      recipient_name: q("#recipientName").value.trim() || null,
      phone: q("#addressPhone").value.trim() || null,
      address_line1: q("#addressLine1").value.trim(),
      address_line2: q("#addressLine2").value.trim() || null,
      suburb: q("#addressSuburb").value.trim() || null,
      city: q("#addressCity").value.trim(),
      province: q("#addressProvince").value.trim() || null,
      postal_code: q("#postalCode").value.trim() || null,
      country: q("#addressCountry").value.trim() || "South Africa",
      is_default_shipping: makeDefault,
      updated_at: new Date().toISOString()
    };

    const result = id
      ? await client.from("customer_addresses").update(payload).eq("id", id)
      : await client.from("customer_addresses").insert(payload);

    if (result.error) { status(`Could not save location: ${result.error.message}`, "error"); return; }
    resetAddressForm();
    await loadAddresses();
    status("Delivery location saved.", "success");
  }

  async function deleteAddress(id) {
    if (!confirm("Delete this saved delivery location?")) return;
    const { error } = await client.from("customer_addresses").delete().eq("id", id);
    if (error) status(`Could not delete location: ${error.message}`, "error");
    else { await loadAddresses(); status("Delivery location deleted.", "success"); }
  }

  async function loadOrders() {
    const target = q("#ordersList");
    target.innerHTML = '<p class="empty">Loading purchase history…</p>';
    const { data, error } = await client.from("orders")
      .select("id,order_number,status,total,payment_status,placed_at,created_at,order_items(product_name,quantity,line_total)")
      .order("created_at", { ascending: false });

    if (error) { target.innerHTML = '<p class="empty error">Could not load purchase history.</p>'; return; }
    if (!data?.length) { target.innerHTML = '<p class="empty">No purchases recorded on this account yet.</p>'; return; }

    target.innerHTML = data.map(o => `
      <article class="history-card"><div class="history-head"><div><span class="mini">${escapeHtml(o.order_number)}</span>
      <h3>${date(o.placed_at || o.created_at)}</h3></div><span class="pill">${escapeHtml(o.status)}</span></div>
      <div class="history-lines">${(o.order_items || []).map(i => `<div><span>${i.quantity} × ${escapeHtml(i.product_name)}</span><b>${money(i.line_total)}</b></div>`).join("")}</div>
      <div class="history-total"><span>${escapeHtml(o.payment_status)}</span><b>${money(o.total)}</b></div></article>`).join("");
  }

  async function loadJobs() {
    const target = q("#jobsList");
    target.innerHTML = '<p class="empty">Loading service history…</p>';
    const { data, error } = await client.from("service_jobs")
      .select("id,job_number,service_type,title,device_name,status,amount_quoted,amount_paid,payment_status,opened_at,completed_at,customer_note,service_job_updates(status,title,note,created_at)")
      .order("opened_at", { ascending: false });

    if (error) { target.innerHTML = '<p class="empty error">Could not load service history.</p>'; return; }
    if (!data?.length) { target.innerHTML = '<p class="empty">No repair or optimisation jobs recorded on this account yet.</p>'; return; }

    target.innerHTML = data.map(j => `
      <article class="history-card"><div class="history-head"><div><span class="mini">${escapeHtml(j.job_number)} · ${escapeHtml(labelService(j.service_type))}</span>
      <h3>${escapeHtml(j.title)}</h3></div><span class="pill">${escapeHtml(j.status)}</span></div>
      ${j.device_name ? `<p class="muted-line">${escapeHtml(j.device_name)}</p>` : ""}
      <div class="job-money"><span>Quoted <b>${j.amount_quoted == null ? "—" : money(j.amount_quoted)}</b></span>
      <span>Paid <b>${money(j.amount_paid)}</b></span><span>${escapeHtml(j.payment_status)}</span></div>
      ${(j.service_job_updates || []).length ? `<div class="timeline">${[...j.service_job_updates]
        .sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))
        .map(u => `<div class="timeline-item"><i></i><div><b>${escapeHtml(u.title)}</b><small>${date(u.created_at)}${u.note ? " · "+escapeHtml(u.note) : ""}</small></div></div>`).join("")}</div>` : ""}
      </article>`).join("");
  }

  function labelService(type) {
    const labels = { repair:"Repair", stream_optimisation:"Stream optimisation", performance:"Performance",
      upgrade:"Upgrade", malware:"Security / malware", windows:"Windows", diagnostic:"Diagnostic", other:"Service" };
    return labels[type] || "Service";
  }

  async function saveProfile(e) {
    e.preventDefault();
    status("Saving profile…");
    const fullName = q("#profileName").value.trim();
    const { error } = await client.from("profiles").upsert({
      id: currentUser.id,
      full_name: fullName || null,
      phone: q("#profilePhone").value.trim() || null,
      suburb: q("#profileSuburb").value.trim() || null,
      billing_email: q("#billingEmail").value.trim() || null,
      company_name: q("#companyName").value.trim() || null,
      preferred_contact: q("#preferredContact").value,
      updated_at: new Date().toISOString()
    }, { onConflict: "id" });

    if (error) { status(`Could not save profile: ${error.message}`, "error"); return; }
    q("#accountName").textContent = fullName || currentUser.email?.split("@")[0] || "VoltTech customer";
    status("Profile saved.", "success");
  }

  async function changeEmail(e) {
    e.preventDefault();
    const email = q("#loginEmail").value.trim();
    if (!email || email === currentUser.email) { status("Enter a different email address first.", "error"); return; }
    status("Sending email-change confirmation…");
    const { error } = await client.auth.updateUser({ email });
    if (error) status(`Could not change email: ${error.message}`, "error");
    else status("Email change requested. Check your email for the confirmation link.", "success");
  }

  async function sendPasswordReset() {
    if (!currentUser?.email) return;
    status("Sending password reset email…");
    const { error } = await client.auth.resetPasswordForEmail(currentUser.email, {
      redirectTo: `${location.origin}/account.html`
    });
    if (error) status(`Could not send reset email: ${error.message}`, "error");
    else status("Password reset email sent.", "success");
  }

  function bindHub() {
    if (hubBound) return;
    hubBound = true;
    qa("[data-tab]").forEach(btn => btn.onclick = () => setTab(btn.dataset.tab));
    q("#profileForm").onsubmit = saveProfile;
    q("#addressForm").onsubmit = saveAddress;
    q("#cancelAddressEdit").onclick = resetAddressForm;
    q("#emailForm").onsubmit = changeEmail;
    q("#passwordReset").onclick = sendPasswordReset;
    q("#signOut").onclick = async () => {
      await client.auth.signOut();
      currentUser = null;
      show("#authGate");
      authStatus("Signed out.", "success");
    };
  }

  async function openHub(user) {
    if (hubLoading) return;
    hubLoading = true;
    currentUser = user;
    show("#accountHub");
    bindHub();
    resetAddressForm();

    const avatar = q("#accountAvatar");
    const src = user.user_metadata?.avatar_url || user.user_metadata?.picture;
    if (src) { avatar.src = src; avatar.hidden = false; }
    else avatar.hidden = true;

    try {
      await Promise.all([loadProfile(user), loadAddresses(), loadOrders(), loadJobs()]);
    } catch (error) {
      console.error(error);
      status("Some account information could not be loaded.", "error");
    } finally {
      hubLoading = false;
    }
  }

  async function signInEmail(e) {
    e.preventDefault();
    authStatus("Signing in…");
    const email = q("#authEmail").value.trim();
    const password = q("#authPassword").value;
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) { authStatus(error.message, "error"); return; }
    if (data?.user) { authStatus(""); await openHub(data.user); }
  }

  async function createAccount() {
    const email = q("#authEmail").value.trim();
    const password = q("#authPassword").value;
    if (!email || password.length < 8) { authStatus("Enter an email and a password of at least 8 characters.", "error"); return; }
    authStatus("Creating account…");
    const { data, error } = await client.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${location.origin}/account.html` }
    });
    if (error) { authStatus(error.message, "error"); return; }
    if (data?.session?.user) await openHub(data.session.user);
    else authStatus("Account created. Check your email and confirm your address, then sign in.", "success");
  }

  async function googleSignIn() {
    authStatus("Opening Google sign-in…");
    const { error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/account.html` }
    });
    if (error) authStatus(error.message, "error");
  }

  async function forgotPassword() {
    const email = q("#authEmail").value.trim();
    if (!email) { authStatus("Enter your email address first.", "error"); return; }
    authStatus("Sending password reset email…");
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/account.html`
    });
    if (error) authStatus(error.message, "error");
    else authStatus("Password reset email sent. Check your inbox.", "success");
  }

  async function updateRecoveredPassword(e) {
    e.preventDefault();
    const password = q("#newPassword").value;
    if (password.length < 8) { setStatus(q("#recoveryStatus"), "Use at least 8 characters.", "error"); return; }
    setStatus(q("#recoveryStatus"), "Updating password…");
    const { error } = await client.auth.updateUser({ password });
    if (error) { setStatus(q("#recoveryStatus"), error.message, "error"); return; }
    recoveryMode = false;
    setStatus(q("#recoveryStatus"), "Password updated.", "success");
    const { data: { user } } = await client.auth.getUser();
    if (user) await openHub(user);
  }

  async function initial() {
    q("#authForm").onsubmit = signInEmail;
    q("#createAccount").onclick = createAccount;
    q("#googleSignIn").onclick = googleSignIn;
    q("#forgotPassword").onclick = forgotPassword;
    q("#recoveryForm").onsubmit = updateRecoveredPassword;

    client.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        recoveryMode = true;
        show("#recoveryGate");
        return;
      }
      if (!recoveryMode && event === "SIGNED_IN" && session?.user) {
        setTimeout(() => openHub(session.user), 0);
      }
      if (event === "SIGNED_OUT") show("#authGate");
    });

    const { data: { session } } = await client.auth.getSession();
    if (session?.user && !recoveryMode) await openHub(session.user);
    else if (!recoveryMode) show("#authGate");
  }

  document.addEventListener("DOMContentLoaded", initial);
  window.volttechAuth = client;
})();