(() => {
  const client = window.supabase.createClient(
    VOLTTECH_SUPABASE.url,
    VOLTTECH_SUPABASE.publishableKey,
    { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
  );

  const q = (s) => document.querySelector(s);
  const status = (message = "", type = "") => {
    const el = q("#authStatus");
    if (!el) return;
    el.textContent = message;
    el.dataset.type = type;
  };

  async function loadProfile(user) {
    const { data, error } = await client
      .from("profiles")
      .select("full_name,phone,suburb")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("VoltTech profile load:", error);
      status("Account is signed in, but the customer profile could not be loaded.", "error");
      return;
    }

    const fallbackName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "";

    q("#profileName").value = data?.full_name || fallbackName;
    q("#profilePhone").value = data?.phone || "";
    q("#profileSuburb").value = data?.suburb || "";
    q("#accountName").textContent = data?.full_name || fallbackName || "VoltTech customer";
  }

  async function refresh() {
    const { data: { session } } = await client.auth.getSession();
    const signedOut = q("#signedOut");
    const signedIn = q("#signedIn");

    if (!session?.user) {
      signedOut.hidden = false;
      signedIn.hidden = true;
      return;
    }

    signedOut.hidden = true;
    signedIn.hidden = false;

    const user = session.user;
    const fallbackName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "VoltTech customer";

    q("#accountName").textContent = fallbackName;
    q("#accountEmail").textContent = user.email || "";

    const avatar = q("#accountAvatar");
    const src = user.user_metadata?.avatar_url || user.user_metadata?.picture;
    if (src) {
      avatar.src = src;
      avatar.hidden = false;
    } else {
      avatar.hidden = true;
    }

    await loadProfile(user);
  }

  async function signInGoogle() {
    status("Opening Google…");
    const { error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/account.html` }
    });
    if (error) status(error.message, "error");
  }

  async function emailAuth(e) {
    e.preventDefault();
    const email = q("#email").value.trim();
    const password = q("#password").value;
    const mode = e.submitter?.value;

    status(mode === "signup" ? "Creating account…" : "Signing in…");

    const result = mode === "signup"
      ? await client.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${location.origin}/account.html` }
        })
      : await client.auth.signInWithPassword({ email, password });

    if (result.error) {
      status(result.error.message, "error");
    } else if (result.data.session) {
      status("Signed in.", "success");
      await refresh();
    } else {
      status("Check your email to confirm your account.", "success");
    }
  }

  async function saveProfile(e) {
    e.preventDefault();
    status("Saving…");

    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError || !user) {
      status("Please sign in again.", "error");
      return;
    }

    const fullName = q("#profileName").value.trim();
    const phone = q("#profilePhone").value.trim();
    const suburb = q("#profileSuburb").value.trim();

    const { error } = await client
      .from("profiles")
      .upsert({
        id: user.id,
        full_name: fullName || null,
        phone: phone || null,
        suburb: suburb || null,
        updated_at: new Date().toISOString()
      }, { onConflict: "id" });

    if (error) {
      console.error("VoltTech profile save:", error);
      status("Could not save your profile. Please try again.", "error");
      return;
    }

    q("#accountName").textContent = fullName || user.email?.split("@")[0] || "VoltTech customer";
    status("Profile saved.", "success");
  }

  async function signOut() {
    const { error } = await client.auth.signOut();
    if (error) {
      status(error.message, "error");
      return;
    }
    status("");
    await refresh();
  }

  document.addEventListener("DOMContentLoaded", () => {
    q("#googleSignIn")?.addEventListener("click", signInGoogle);
    q("#emailAuth")?.addEventListener("submit", emailAuth);
    q("#profileForm")?.addEventListener("submit", saveProfile);
    q("#signOut")?.addEventListener("click", signOut);
    refresh();
  });

  client.auth.onAuthStateChange(() => setTimeout(refresh, 0));
  window.volttechAuth = client;
})();