(() => {
  const link = document.querySelector("#adminShortcut");
  const client = window.volttechAuth;
  const header = document.querySelector(".profile-head");
  const tabs = document.querySelector(".tabs");
  if (!client) return;

  // Make saved PC builds a first-class customer-account destination.
  if (tabs && !document.querySelector('a[href="builds.html"]')) {
    const buildsLink = document.createElement("a");
    buildsLink.className = "tab";
    buildsLink.href = "builds.html";
    buildsLink.textContent = "PC Builds";
    buildsLink.setAttribute("aria-label", "Open saved PC builds");
    const adminTab = document.querySelector("#adminShortcut");
    tabs.insertBefore(buildsLink, adminTab || null);
  }

  function safeReturnTarget() {
    const raw = new URLSearchParams(location.search).get("returnTo");
    if (!raw) return null;
    try {
      const target = new URL(raw, location.origin);
      if (target.origin !== location.origin) return null;
      const path = `${target.pathname}${target.search}${target.hash}`;
      const current = `${location.pathname}${location.search}${location.hash}`;
      return path !== current ? path : null;
    } catch {
      return null;
    }
  }

  function continueToRequestedPage(session) {
    if (!session?.user) return false;
    const target = safeReturnTarget();
    if (!target) return false;
    location.replace(target);
    return true;
  }

  if (!link) {
    client.auth.getSession().then(({ data }) => continueToRequestedPage(data?.session));
    client.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") setTimeout(() => continueToRequestedPage(session), 0);
    });
    return;
  }

  link.textContent = "Admin Hub";
  link.classList.remove("tab");
  link.classList.add("admin-hub-quick");
  link.setAttribute("aria-label", "Open VoltTech Admin Hub");

  const style = document.createElement("style");
  style.textContent = `
    .profile-head{flex-wrap:wrap}
    .admin-hub-quick{
      margin-left:auto;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      min-height:46px;
      padding:0 17px;
      border:1px solid #ff6868;
      border-radius:6px;
      background:#391416;
      color:#ff9a9a;
      font:700 10px 'JetBrains Mono',monospace;
      letter-spacing:.04em;
      text-transform:uppercase;
      white-space:nowrap;
    }
    .admin-hub-quick:hover,.admin-hub-quick:focus-visible{
      background:#521a1d;
      color:#fff;
      border-color:#ff8585;
      outline:none;
    }
    @media(max-width:520px){
      .admin-hub-quick{margin-left:auto;min-height:44px;padding:0 14px}
    }
  `;
  document.head.append(style);

  if (header) header.append(link);

  async function refreshAdminShortcut(session) {
    link.hidden = true;
    if (!session?.user) return;
    if (continueToRequestedPage(session)) return;
    const { data, error } = await client.rpc("is_volttech_admin");
    if (!error && data === true) link.hidden = false;
  }

  client.auth.getSession().then(({ data }) => refreshAdminShortcut(data?.session));

  client.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") {
      link.hidden = true;
      return;
    }
    if (event === "SIGNED_IN") {
      setTimeout(() => refreshAdminShortcut(session), 0);
    }
  });
})();