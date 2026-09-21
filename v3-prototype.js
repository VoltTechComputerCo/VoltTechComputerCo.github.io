(() => {
  const btn = document.querySelector('[data-v3-menu]');
  const drawer = document.querySelector('.v3-mobile-drawer');
  if (btn && drawer) {
    btn.addEventListener('click', () => {
      const open = drawer.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
    drawer.addEventListener('click', e => {
      if (e.target.closest('a')) {
        drawer.classList.remove('open');
        btn.setAttribute('aria-expanded','false');
      }
    });
  }

  const year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  const newsletter = document.querySelector('[data-newsletter]');
  if (newsletter) {
    newsletter.addEventListener('submit', e => {
      e.preventDefault();
      const email = newsletter.querySelector('input[type="email"]')?.value.trim();
      if (!email) return;
      window.location.href = `mailto:volttechcomputerco@gmail.com?subject=${encodeURIComponent('VoltTech updates')}&body=${encodeURIComponent('Please add ' + email + ' to the VoltTech updates list.')}`;
    });
  }
})();
