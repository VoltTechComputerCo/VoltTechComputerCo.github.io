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
  backdrop.hidden = true;
  document.body.append(backdrop);

  function render() {
    const isMobile = mobile.matches;
    toggle.hidden = !isMobile;
    toggle.setAttribute('aria-expanded', String(isMobile && open));
    toggle.textContent = open ? 'Close' : 'Menu';
    nav.hidden = isMobile && !open;
    nav.classList.toggle('is-floating-open', isMobile && open);
    backdrop.hidden = !(isMobile && open);
    document.body.classList.toggle('mobile-menu-open', isMobile && open);
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

  render();
}
