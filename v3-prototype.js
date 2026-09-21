(() => {
  const btn = document.querySelector('[data-menu]');
  const drawer = document.querySelector('[data-drawer]');
  if (btn && drawer) {
    const setOpen = open => {
      drawer.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
      btn.textContent = open ? '×' : '☰';
    };
    btn.addEventListener('click', () => setOpen(!drawer.classList.contains('open')));
    drawer.addEventListener('click', e => {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('click', e => {
      if (drawer.classList.contains('open') && !drawer.contains(e.target) && !btn.contains(e.target)) setOpen(false);
    });
  }
  document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
  const form = document.querySelector('[data-newsletter]');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const email = form.querySelector('input[type=email]')?.value.trim();
      if (!email) return;
      location.href = 'mailto:volttechcomputerco@gmail.com?subject=' + encodeURIComponent('VoltTech updates') + '&body=' + encodeURIComponent('Please add ' + email + ' to the VoltTech updates list.');
    });
  }
})();