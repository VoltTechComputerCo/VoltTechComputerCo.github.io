(() => {
  const stage = document.querySelector('.vt-hardware-stage');
  const img = document.querySelector('.vt-hardware-stage-image img');
  const kicker = document.getElementById('vtStageKicker');
  const title = document.getElementById('vtStageTitle');
  const copy = document.getElementById('vtStageCopy');
  const meters = [
    document.getElementById('vtMeterA'),
    document.getElementById('vtMeterB'),
    document.getElementById('vtMeterC')
  ];
  const steps = [...document.querySelectorAll('.vt-hardware-step')];
  if (!stage || !img || !steps.length) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let activeIndex = -1;

  function setStage(step, index) {
    if (!step || index === activeIndex) return;
    activeIndex = index;
    steps.forEach((el, i) => el.classList.toggle('active', i === index));

    const apply = () => {
      img.src = step.dataset.image;
      img.alt = step.dataset.alt || '';
      kicker.textContent = step.dataset.kicker || '';
      title.textContent = step.dataset.title || '';
      copy.textContent = step.dataset.copy || '';

      const vals = [
        [step.dataset.meterA, step.dataset.valueA],
        [step.dataset.meterB, step.dataset.valueB],
        [step.dataset.meterC, step.dataset.valueC]
      ];
      meters.forEach((el, i) => {
        if (!el) return;
        el.querySelector('span').textContent = vals[i][0] || '';
        el.querySelector('b').textContent = vals[i][1] || '';
      });

      stage.dataset.changing = '0';
    };

    if (reduced) {
      apply();
    } else {
      stage.dataset.changing = '1';
      setTimeout(apply, 220);
    }
  }

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      const index = steps.indexOf(visible.target);
      if (index >= 0) setStage(visible.target, index);
    }, { rootMargin:'-22% 0px -38% 0px', threshold:[.2,.35,.5,.65] });
    steps.forEach(step => io.observe(step));
  } else {
    setStage(steps[0], 0);
  }

  setStage(steps[0], 0);
})();