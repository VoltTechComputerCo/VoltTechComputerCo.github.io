const form = document.querySelector('#inspection-form');
const button = document.querySelector('#check-example');
const notes = document.querySelector('#inspection-notes');
const error = document.querySelector('#notes-error');
const status = document.querySelector('#form-status');

function clearFeedback() {
  notes.removeAttribute('aria-invalid');
  notes.setAttribute('aria-describedby', 'notes-hint');
  error.hidden = true;
  status.textContent = '';
}

function validateExample() {
  clearFeedback();
  if (notes.value.trim().length < 10) {
    notes.setAttribute('aria-invalid', 'true');
    notes.setAttribute('aria-describedby', 'notes-hint notes-error');
    error.hidden = false;
    notes.focus();
    return;
  }
  status.textContent = 'Example complete. Nothing was sent or saved.';
}

if (form && button && notes && error && status) {
  button.disabled = false;
  button.addEventListener('click', validateExample);
  form.addEventListener('submit', event => { event.preventDefault(); validateExample(); });
  notes.addEventListener('input', clearFeedback);
}
