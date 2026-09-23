export function applyBuilderHandoff() {
  const params = new URLSearchParams(location.search);
  const id = params.get('add');
  if (!id || !/^vt-[a-z0-9-]+$/i.test(id)) return;

  const type = inferType(id);
  let tries = 0;

  const attempt = () => {
    tries++;
    const manual = document.getElementById('hero-advanced') || document.getElementById('choose-advanced');
    const layout = document.getElementById('builder-layout');
    if (layout?.hidden && manual) manual.click();

    const step = type ? document.querySelector(`[data-category="${CSS.escape(type)}"]`) : null;
    if (step && !step.classList.contains('active')) step.click();

    const select = document.querySelector(`[data-select-product="${CSS.escape(id)}"]`);
    if (select && !select.disabled) {
      select.click();
      announce('Component added from the VoltTech PC Parts store.');
      cleanUrl();
      return;
    }

    if (tries < 80) setTimeout(attempt, 125);
    else announce('We opened PC Builder, but could not preselect that component automatically. Search for it by name to continue.', 'warn');
  };

  setTimeout(attempt, 100);
}

function inferType(id) {
  if (id.startsWith('vt-cpu-')) return 'cpu';
  if (id.startsWith('vt-gpu-')) return 'gpu';
  if (id.startsWith('vt-mb-')) return 'motherboard';
  if (id.startsWith('vt-mem-')) return 'memory';
  if (id.startsWith('vt-storage-') || id.startsWith('vt-ssd-')) return 'storage';
  if (id.startsWith('vt-psu-')) return 'psu';
  if (id.startsWith('vt-case-')) return 'case';
  if (id.startsWith('vt-cooler-')) return 'cooler';
  if (id.startsWith('vt-fan-')) return 'fans';
  return '';
}

function announce(message, tone = '') {
  const previous = document.querySelector('.builder-toast');
  previous?.remove();
  const note = document.createElement('div');
  note.className = `builder-toast ${tone}`.trim();
  note.textContent = message;
  note.setAttribute('role', 'status');
  document.body.append(note);
  setTimeout(() => note.remove(), 3500);
}

function cleanUrl() {
  const url = new URL(location.href);
  url.searchParams.delete('add');
  history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
}
