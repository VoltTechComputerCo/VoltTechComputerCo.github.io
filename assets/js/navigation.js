// Progressive disclosure: navigation remains visible if JavaScript is unavailable.
export function enhanceNavigation(root = document) {
  const toggle = root.querySelector('[data-menu-toggle]');
  const nav = root.querySelector('#primary-navigation');
  if (!toggle || !nav) return;
  const mobile = window.matchMedia('(max-width: 56rem)');
  let open = false;

  function render() {
    toggle.hidden = !mobile.matches;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Close' : 'Menu';
    nav.hidden = mobile.matches && !open;
  }

  toggle.addEventListener('click', () => { open = !open; render(); });
  root.addEventListener('keydown', event => {
    if (event.key === 'Escape' && mobile.matches && open) {
      open = false;
      render();
      toggle.focus();
    }
  });
  nav.addEventListener('click', event => {
    if (event.target.closest('a') && mobile.matches) {
      open = false;
      render();
    }
  });
  mobile.addEventListener('change', () => {
    const active = root.activeElement;
    open = false;
    render();
    if (mobile.matches && nav.contains(active)) toggle.focus();
    if (!mobile.matches && active === toggle) nav.querySelector('a')?.focus();
  });
  render();
}
