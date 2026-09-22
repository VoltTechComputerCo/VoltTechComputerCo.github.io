export function enhanceDialogs(root = document) {
  if (typeof HTMLDialogElement === 'undefined' || !HTMLDialogElement.prototype.showModal) return;
  root.querySelectorAll('[data-dialog-open]').forEach(trigger => {
    const dialog = root.getElementById(trigger.dataset.dialogOpen);
    if (!dialog) return;
    trigger.hidden = false;
    trigger.addEventListener('click', () => dialog.showModal());
  });
  root.querySelectorAll('[data-dialog-close]').forEach(button => {
    button.addEventListener('click', () => button.closest('dialog').close());
  });
}
