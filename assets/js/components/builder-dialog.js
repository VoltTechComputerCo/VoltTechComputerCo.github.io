let activeResolve = null;
let lastFocus = null;

function shell() {
  let dialog = document.getElementById('builder-confirm-dialog');
  if (dialog) return dialog;
  dialog = document.createElement('dialog');
  dialog.id = 'builder-confirm-dialog';
  dialog.className = 'dialog builder-confirm-dialog';
  dialog.setAttribute('aria-labelledby', 'builder-confirm-title');
  dialog.innerHTML = `<button class="button button-secondary dialog-close" type="button" data-builder-cancel aria-label="Close dialog">×</button>
    <p class="eyebrow" id="builder-confirm-kicker">VOLTTECH / PC BUILDER</p>
    <h2 id="builder-confirm-title">Confirm action</h2>
    <p id="builder-confirm-message"></p>
    <pre id="builder-confirm-details" hidden></pre>
    <div class="actions">
      <button class="button button-secondary" id="builder-confirm-cancel" type="button">Cancel</button>
      <button class="button" id="builder-confirm-ok" type="button">Confirm</button>
    </div>`;
  document.body.append(dialog);
  dialog.addEventListener('cancel', event => { event.preventDefault(); finish(false); });
  dialog.querySelector('[data-builder-cancel]').addEventListener('click', () => finish(false));
  dialog.querySelector('#builder-confirm-cancel').addEventListener('click', () => finish(false));
  dialog.querySelector('#builder-confirm-ok').addEventListener('click', () => finish(true));
  return dialog;
}

function finish(value) {
  const dialog = document.getElementById('builder-confirm-dialog');
  if (!dialog?.open) return;
  dialog.close();
  const resolve = activeResolve;
  activeResolve = null;
  lastFocus?.focus?.();
  resolve?.(value);
}

function open(options = {}) {
  if (activeResolve) finish(false);
  const dialog = shell();
  dialog.classList.toggle('is-danger', options.tone === 'danger');
  dialog.querySelector('#builder-confirm-kicker').textContent = options.kicker || 'VOLTTECH / PC BUILDER';
  dialog.querySelector('#builder-confirm-title').textContent = options.title || 'Confirm action';
  dialog.querySelector('#builder-confirm-message').textContent = options.message || '';
  const details = dialog.querySelector('#builder-confirm-details');
  details.hidden = !options.details;
  details.textContent = options.details || '';
  const cancel = dialog.querySelector('#builder-confirm-cancel');
  const confirm = dialog.querySelector('#builder-confirm-ok');
  cancel.hidden = Boolean(options.hideCancel);
  cancel.textContent = options.cancelText || 'Cancel';
  confirm.textContent = options.confirmText || 'Confirm';
  confirm.classList.toggle('button-danger', options.tone === 'danger');
  lastFocus = document.activeElement;
  dialog.showModal();
  queueMicrotask(() => confirm.focus());
  return new Promise(resolve => { activeResolve = resolve; });
}

export function installBuilderDialog() {
  window.VoltTechDialog = {
    confirm: options => open(options),
    message: options => open({ ...options, hideCancel: true, confirmText: options?.confirmText || 'Close' })
  };
}
