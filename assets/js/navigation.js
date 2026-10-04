// Progressive disclosure with a true floating mobile system map.
export function enhanceNavigation(root = document) {
  const toggle = root.querySelector('[data-menu-toggle]');
  const nav = root.querySelector('#primary-navigation');
  if (!toggle || !nav) return;

  const mobile = window.matchMedia('(max-width: 56rem)');
  let open = false;
  const backdrop = document.createElement('button');
  backdrop.type = 'button';
  backdrop.className = 'mobile-nav-backdrop';
  backdrop.setAttribute('aria-label', 'Close VoltTech menu');
  backdrop.tabIndex = -1;
  backdrop.hidden = true;
  document.body.append(backdrop);

  const inertTargets = [
    root.querySelector('main'),
    root.querySelector('.site-footer'),
    root.querySelector('.preview-strip'),
    root.querySelector('.header-tools'),
    root.querySelector('.brand'),
    root.querySelector('.brand-promise')
  ].filter(Boolean);

  function setMenuIsolation(active) {
    inertTargets.forEach((element) => { element.inert = active; });
  }

  function normalisePath(pathname) {
    const clean = pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '').replace(/\/+$/, '');
    return clean || '/';
  }

  function markCurrentPage() {
    const current = normalisePath(location.pathname);
    nav.querySelectorAll('a[href]').forEach((link) => {
      link.removeAttribute('aria-current');
      if (link.matches('[data-cart-link]')) return;
      const target = new URL(link.href, location.href);
      if (target.origin !== location.origin || target.hash) return;
      if (normalisePath(target.pathname) === current) link.setAttribute('aria-current', 'page');
    });
  }

  function render() {
    const isMobile = mobile.matches;
    toggle.hidden = !isMobile;
    toggle.setAttribute('aria-expanded', String(isMobile && open));
    toggle.textContent = open ? 'Close' : 'Menu';
    nav.hidden = isMobile && !open;
    nav.classList.toggle('is-floating-open', isMobile && open);
    backdrop.hidden = !(isMobile && open);
    document.body.classList.toggle('mobile-menu-open', isMobile && open);
    setMenuIsolation(isMobile && open);
  }

  function close({ focusToggle = false } = {}) {
    if (!open) return;
    open = false;
    render();
    if (focusToggle && mobile.matches) toggle.focus();
  }

  toggle.addEventListener('click', () => {
    open = !open;
    render();
    if (open) requestAnimationFrame(() => nav.querySelector('a')?.focus({ preventScroll: true }));
  });

  backdrop.addEventListener('click', () => close({ focusToggle: true }));

  root.addEventListener('keydown', event => {
    if (event.key === 'Escape' && mobile.matches && open) {
      close({ focusToggle: true });
    }
  });

  nav.addEventListener('click', event => {
    if (event.target.closest('a') && mobile.matches) close();
  });

  mobile.addEventListener('change', () => {
    const active = root.activeElement;
    open = false;
    render();
    if (mobile.matches && nav.contains(active)) toggle.focus();
    if (!mobile.matches && active === toggle) nav.querySelector('a')?.focus();
  });

  markCurrentPage();
  render();
}