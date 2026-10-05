// VoltTech V3 navigation shell.
export function enhanceNavigation(root = document) {
  const toggle = root.querySelector('[data-menu-toggle]');
  const nav = root.querySelector('#primary-navigation');
  const header = root.querySelector('[data-vt-header]');
  if (!toggle || !nav) return;

  const mobile = window.matchMedia('(max-width: 56rem)');
  let open = false;
  let raf = 0;

  const backdrop = document.createElement('button');
  backdrop.type = 'button';
  backdrop.className = 'mobile-nav-backdrop';
  backdrop.setAttribute('aria-label', 'Close navigation');
  backdrop.hidden = true;
  document.body.append(backdrop);

  const normalise = pathname => {
    const clean = pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '').replace(/\/+$/, '');
    return clean || '/';
  };

  function markCurrentRoutes() {
    const current = normalise(location.pathname);
    root.querySelectorAll('.primary-nav a[href], .vt-mobile-dock a[href]').forEach(link => {
      link.removeAttribute('aria-current');
      const target = new URL(link.href, location.href);
      if (target.origin !== location.origin || target.hash) return;
      if (normalise(target.pathname) === current) link.setAttribute('aria-current', 'page');
    });
  }

  function updateHeader() {
    raf = 0;
    if (header) header.dataset.scrolled = String(window.scrollY > 12);
  }

  function onScroll() {
    if (!raf) raf = requestAnimationFrame(updateHeader);
  }

  function render() {
    const isMobile = mobile.matches;
    toggle.hidden = !isMobile;
    toggle.setAttribute('aria-expanded', String(isMobile && open));
    toggle.textContent = open ? 'Close' : 'Menu';
    nav.hidden = isMobile && !open;
    backdrop.hidden = !(isMobile && open);
    document.body.classList.toggle('mobile-menu-open', isMobile && open);
    nav.classList.toggle('is-open', isMobile && open);
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
    if (event.key === 'Escape' && mobile.matches && open) close({ focusToggle: true });
  });

  nav.addEventListener('click', event => {
    if (event.target.closest('a') && mobile.matches) close();
  });

  mobile.addEventListener('change', () => {
    open = false;
    render();
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  markCurrentRoutes();
  updateHeader();
  render();
}