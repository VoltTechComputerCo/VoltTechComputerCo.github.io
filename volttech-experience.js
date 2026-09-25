/* VoltTech Experience System v1
   Progressive enhancement only. No business logic lives here. */
(() => {
  const d = document;
  const root = d.documentElement;
  const body = d.body;
  if (!body) return;

  const forceMotion = new URLSearchParams(location.search).get('vtmotion') === 'full';
  const reducedMotion = !forceMotion && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer:fine)').matches;

  body.classList.add('vt-experience-ready');
  if (forceMotion) body.classList.add('vt-force-motion');
  body.dataset.vtMotion = reducedMotion ? 'reduced' : 'full';

  // Decorative ambient layers are explicit elements so they never overwrite
  // existing page ::before/::after artwork.
  const ambientGrid = d.createElement('div');
  ambientGrid.className = 'vt-ambient-grid';
  ambientGrid.setAttribute('aria-hidden', 'true');
  body.prepend(ambientGrid);

  const pointerGlow = d.createElement('div');
  pointerGlow.className = 'vt-pointer-glow';
  pointerGlow.setAttribute('aria-hidden', 'true');
  body.prepend(pointerGlow);

  // Global scroll progress.
  const progress = d.createElement('div');
  progress.className = 'vt-scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  body.appendChild(progress);

  let scrollRaf = 0;
  const updateScroll = () => {
    scrollRaf = 0;
    const max = Math.max(1, d.documentElement.scrollHeight - innerHeight);
    const p = Math.min(1, Math.max(0, scrollY / max));
    root.style.setProperty('--vt-progress', `${(p * 100).toFixed(2)}%`);
    root.style.setProperty('--vt-scroll', p.toFixed(4));
  };
  addEventListener('scroll', () => {
    if (!scrollRaf) scrollRaf = requestAnimationFrame(updateScroll);
  }, { passive: true });
  updateScroll();

  // Hero signal is an injected child to preserve any existing hero pseudo-elements.
  const hero = d.querySelector('main .hero, main > .wrap > header, header.hero');
  if (hero) {
    const signal = d.createElement('span');
    signal.className = 'vt-hero-signal';
    signal.setAttribute('aria-hidden', 'true');
    hero.appendChild(signal);
  }

  // Decorative sheen is also a real child, avoiding collisions with existing card artwork.
  const sheenTargets = d.querySelectorAll(
    '.service,.hub-card,.panel,.support-card,.package,.community-card'
  );
  sheenTargets.forEach(el => {
    el.classList.add('vt-sheen-host');
    const sheen = d.createElement('span');
    sheen.className = 'vt-sheen';
    sheen.setAttribute('aria-hidden', 'true');
    el.appendChild(sheen);
  });

  // Reveal choreography. Choose structural surfaces, never form options/results
  // that are dynamically inserted by diagnostic tools.
  const selectors = [
    'main header',
    'main section',
    '.service-network',
    '.creator-network',
    '.service',
    '.trust',
    '.hub-card',
    '.directory',
    '.community-card',
    '.support-card',
    '.package',
    '.step'
  ];
  const targets = [...new Set(d.querySelectorAll(selectors.join(',')))];

  targets.forEach((el, i) => {
    el.classList.add('vt-reveal');
    el.style.setProperty('--vt-delay', `${Math.min((i % 5) * 55, 220)}ms`);
  });

  if (reducedMotion || !('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('vt-in'));
  } else {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('vt-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    targets.forEach(el => io.observe(el));
  }

  // Fine-pointer card tilt only. Mobile gets clean reveal/hover states instead.
  if (finePointer && !reducedMotion) {
    const tiltSelectors = [
      '.service','.trust',
      '.creator-card','.support-card','.package','.community-card'
    ];
    const tiltItems = [...d.querySelectorAll(tiltSelectors.join(','))];

    tiltItems.forEach(el => {
      el.dataset.vtTilt = '';
      let raf = 0;

      const reset = () => {
        el.style.setProperty('--vt-tilt-x', '0deg');
        el.style.setProperty('--vt-tilt-y', '0deg');
      };

      el.addEventListener('pointermove', e => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          const r = el.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - .5;
          const y = (e.clientY - r.top) / r.height - .5;
          el.style.setProperty('--vt-tilt-y', `${(x * 4.2).toFixed(2)}deg`);
          el.style.setProperty('--vt-tilt-x', `${(-y * 3.4).toFixed(2)}deg`);
        });
      }, { passive: true });
      el.addEventListener('pointerleave', reset, { passive: true });
      el.addEventListener('blur', reset, true);
    });

    // Pointer glow: desktop only.
    let pointerRaf = 0;
    addEventListener('pointermove', e => {
      if (pointerRaf) return;
      pointerRaf = requestAnimationFrame(() => {
        pointerRaf = 0;
        root.style.setProperty('--vt-x', `${e.clientX}px`);
        root.style.setProperty('--vt-y', `${e.clientY}px`);
      });
    }, { passive: true });
  }
})();
