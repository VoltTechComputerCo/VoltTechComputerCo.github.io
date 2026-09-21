(() => {
  const menu = document.querySelector('[data-v3-menu]');
  const drawer = document.querySelector('[data-v3-drawer]');
  if (menu && drawer) {
    const setOpen = (open) => {
      drawer.classList.toggle('open', open);
      menu.setAttribute('aria-expanded', String(open));
      menu.textContent = open ? '×' : '☰';
    };
    menu.addEventListener('click', () => setOpen(!drawer.classList.contains('open')));
    drawer.addEventListener('click', (e) => {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('click', (e) => {
      if (drawer.classList.contains('open') && !drawer.contains(e.target) && !menu.contains(e.target)) setOpen(false);
    });
  }

  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });

  const newsletter = document.querySelector('[data-newsletter]');
  if (newsletter) {
    newsletter.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = newsletter.querySelector('input[type="email"]')?.value.trim();
      if (!email) return;
      window.location.href =
        'mailto:volttechcomputerco@gmail.com?subject=' +
        encodeURIComponent('VoltTech updates') +
        '&body=' +
        encodeURIComponent('Please add ' + email + ' to the VoltTech updates list.');
    });
  }
})();