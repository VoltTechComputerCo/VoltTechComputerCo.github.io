(() => {
  const link = document.querySelector("#adminShortcut");
  const client = window.volttechAuth;
  const header = document.querySelector(".profile-head");
  if (!link || !client) return;

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
    const { data, error } = await client.rpc("is_volttech_admin");
    if (!error && data === true) link.hidden = false;
  }

  client.auth.getSession().then(({ data }) => refreshAdminShortcut(data?.session));

  client.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") {
      link.hidden = true;
      return;
    }
    setTimeout(() => refreshAdminShortcut(session), 0);
  });
})();