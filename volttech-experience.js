/* VoltTech Experience System v1
   Progressive enhancement only. No business logic lives here. */
(() => {
  const d = document;
  const root = d.documentElement;
  const body = d.body;
  if (!body) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer:fine)').matches;

  body.classList.add('vt-experience-ready');

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

  // Reveal choreography. Choose structural surfaces, never form options/results
  // that are dynamically inserted by diagnostic tools.
  const selectors = [
    'main header',
    'main section',
    '.service-network',
    '.creator-network',
    '.scope-card',
    '.service',
    '.diagnostic-card',
    '.trust',
    '.review-card',
    '.creator-promo',
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
      '.service','.scope-card','.diagnostic-card','.trust','.review-card',
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
