export function enhanceNavigation(root = document) {
  const toggle = root.querySelector('[data-menu-toggle]');
  const nav = root.querySelector('#primary-navigation');
  if (!toggle || !nav) return;

  const mobile = window.matchMedia('(max-width: 55.99rem)');
  let open = false;

  const markCurrent = () => {
    const clean = value => value.replace(/\/index\.html$/, '/').replace(/\.html$/, '').replace(/\/+$/, '') || '/';
    const current = clean(location.pathname);
    nav.querySelectorAll('a[href]').forEach(link => {
      link.removeAttribute('aria-current');
      const target = new URL(link.href, location.href);
      if (target.origin === location.origin && !target.hash && clean(target.pathname) === current) {
        link.setAttribute('aria-current', 'page');
      }
    });
  };

  const render = () => {
    const isMobile = mobile.matches;
    toggle.hidden = !isMobile;
    toggle.setAttribute('aria-expanded', String(isMobile && open));
    toggle.textContent = open ? 'Close' : 'Menu';
    nav.hidden = isMobile && !open;
    document.body.classList.toggle('mobile-menu-open', isMobile && open);
  };

  const close = ({ focusToggle = false } = {}) => {
    if (!open) return;
    open = false;
    render();
    if (focusToggle && mobile.matches) toggle.focus();
  };

  toggle.addEventListener('click', () => {
    open = !open;
    render();
    if (open) requestAnimationFrame(() => nav.querySelector('a')?.focus({ preventScroll: true }));
  });

  root.addEventListener('keydown', event => {
    if (event.key === 'Escape' && open && mobile.matches) close({ focusToggle: true });
  });

  nav.addEventListener('click', event => {
    if (mobile.matches && event.target.closest('a')) close();
  });

  mobile.addEventListener('change', () => {
    const active = root.activeElement;
    open = false;
    render();
    if (mobile.matches && nav.contains(active)) toggle.focus();
    if (!mobile.matches && active === toggle) nav.querySelector('a')?.focus();
  });

  markCurrent();
  render();
}