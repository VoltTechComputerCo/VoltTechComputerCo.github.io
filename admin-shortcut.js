(() => {
  const link = document.querySelector("#adminShortcut");
  const client = window.volttechAuth;
  if (!link || !client) return;

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