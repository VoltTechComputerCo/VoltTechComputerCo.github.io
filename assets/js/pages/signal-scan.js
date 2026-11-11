import { connectCart, connectProductionServices } from '../services/home-integrations.js?v=20261021.3';
import { readSignalJourney, saveSignalResult, trackSignalEvent } from '../services/signal-scan-handoff.js?v=20261021.3';
import {
  allowedSources,
  applyContext,
  contextLabel,
  createAnswers,
  issueSets,
  resultConfig,
  resultRows,
  scanMode,
  scanQuestions,
  sourceInfo,
  urgencyScore
} from '../services/signal-scan-model.js?v=20261021.3';

connectProductionServices();
connectCart();

const params = new URLSearchParams(location.search);
const source = allowedSources.includes(params.get('source')) ? params.get('source') : null;
const requestedIssue = params.get('issue');
const answers = createAnswers();
let step = 0;
let tension = .08;
let target = .08;

const panel = document.getElementById('panel');
const meter = document.getElementById('meter');
const progressLabel = document.getElementById('progress-label');
const backLink = document.getElementById('scan-back');
const canvas = document.getElementById('scope');
const context = canvas?.getContext('2d');
const reading = document.getElementById('reading');
const status = document.getElementById('status');
const priority = document.getElementById('scan-priority');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
let scopeVisible = true;
let lastPaint = 0;
let rafId = 0;

if (source && requestedIssue && issueSets[source].some(row => row[0] === requestedIssue)) {
  applyContext(answers, source, requestedIssue);
  step = 1;
}

function currentMode() { return scanMode(answers, source); }
function questions() { return scanQuestions(answers, source); }
function updateUrgency() {
  target = urgencyScore(answers, source);
  const level = !answers.symptom ? 'ready' : target < .32 ? 'low' : target < .58 ? 'elevated' : 'high';
  const labels = {
    ready: ['READY', 'Awaiting your first answer'],
    low: ['LOW', 'Low priority'],
    elevated: ['MODERATE', 'Moderate priority'],
    high: ['HIGH', 'High priority']
  };
  if (priority.dataset.level !== level) {
    priority.dataset.level = level;
    [reading.textContent, status.textContent] = labels[level];
  }
  if (motion.matches) { tension = target; drawScope(0); }
}
function servicePage() { return sourceInfo[currentMode()]?.page || 'pc-repair-pretoria.html'; }
function serviceLabel() { return sourceInfo[currentMode()]?.label || 'PC Support'; }
function journeyContext() { return readSignalJourney(); }
function track(name, payload = {}) { trackSignalEvent(name, payload); }
function renderMeter(total) {
  meter.innerHTML = Array.from({ length: total }, (_, index) =>
    `<i aria-hidden="true" class="${index < step ? 'done' : index === step && total > 1 ? 'current' : ''}"></i>`).join('');
  meter.setAttribute('aria-valuemax', total);
  meter.setAttribute('aria-valuenow', Math.min(step, total));
  progressLabel.textContent = !answers.symptom ? 'Choose an issue' : step < total ? `Question ${step + 1} of ${total}` : 'Complete';
}
function clearFrom(index) {
  const rows = questions();
  for (let i = index; i < rows.length; i++) {
    const key = rows[i].key;
    if (key === 'context') { answers.context = null; if (source) answers.symptom = null; }
    else if (key === 'symptom') { answers.symptom = null; answers.context = null; }
    else if (key in answers) answers[key] = null;
  }
}
function goBack() {
  const targetStep = Math.max(0, step - 1);
  clearFrom(targetStep);
  step = targetStep;
  updateUrgency();
  render(true);
}
function renderOptions(question) {
  panel.innerHTML = `<h3 tabindex="-1">${question.title}</h3><div class="signal-options">${question.options.map(row => `<button type="button" class="signal-option" data-value="${row[0]}">${row[1]}</button>`).join('')}</div>${step ? '<div class="scan-nav"><button type="button" class="button button-secondary" id="scan-back-step">← Previous question</button></div>' : ''}`;
  panel.querySelectorAll('.signal-option').forEach(button => button.addEventListener('click', () => {
    const value = button.dataset.value;
    if (question.key === 'symptom') {
      answers.symptom = value;
      answers.context = null;
      answers.duration = answers.age = answers.usage = answers.backup = null;
    } else if (question.key === 'context') {
      applyContext(answers, source, value);
      answers.duration = answers.age = answers.usage = answers.backup = null;
    } else answers[question.key] = value;
    step++;
    updateUrgency();
    render(true);
  }));
  document.getElementById('scan-back-step')?.addEventListener('click', goBack);
}
function resultNote(mode) {
  if (mode === 'upgrades') return 'Initial upgrade advice via WhatsApp or email is free. The price shown applies only if hands-on assessment or testing is required. Parts are quoted separately.';
  if (mode === 'windows') return 'This is a typical service range. Backup requirements, the target drive, activation or licensing, and any hardware or recovery work can change the final scope.';
  if (mode === 'security') return 'These symptoms can suggest unwanted software, but they do not prove an infection. If sensitive accounts may be at risk, avoid further sensitive logins and change credentials from a trusted device.';
  return 'This is an answer-based triage estimate, not a remote hardware scan or guaranteed final quotation. Final pricing depends on diagnosis, scope and any parts needed.';
}
function renderResult() {
  const result = resultConfig(answers, source);
  const mode = currentMode();
  const issue = contextLabel(answers, source);
  const rows = resultRows(answers);
  const startedFrom = journeyContext();
  const messageLines = [
    'Hi VoltTech, I ran Signal Scan.', '',
    startedFrom ? `Started from: ${startedFrom}` : '',
    `Service path: ${serviceLabel()}`,
    `Selected issue: ${issue}`,
    ...rows.map(row => `${row[0]}: ${row[1]}`),
    `Likely category: ${result[0]}`,
    `Estimate: ${result[2]}`,
    '', 'Could you please review this and advise me on the next step?'
  ].filter(Boolean);
  const message = messageLines.join('\n');
  const summary = [['Selected issue', issue], ['Recommended service', result[3]], ...rows];
  panel.innerHTML = `
    <p class="eyebrow">YOUR RECOMMENDED NEXT STEP</p>
    <h3 tabindex="-1">${result[0]}</h3>
    <p class="scan-result-copy">${result[1]}</p>
    <div class="signal-estimate"><span>Starting service estimate</span><strong>${result[2]}</strong></div>
    <p class="signal-result-note">${resultNote(mode)}</p>
    <div class="signal-actions">
      <a class="button" data-scan-route="whatsapp" target="_blank" rel="noopener" href="https://wa.me/27618435775?text=${encodeURIComponent(message)}">Send via WhatsApp ↗</a>
      <a class="button button-secondary" data-scan-route="email" href="mailto:info@volttechcomputerco.co.za?subject=${encodeURIComponent('VoltTech Signal Scan result')}&body=${encodeURIComponent(message)}">Email result</a>
    </div>
    <details class="signal-summary"><summary>Review your answers</summary><dl>
      ${summary.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}
    </dl></details>
    <div class="signal-result-links">
      <a href="${servicePage()}">View ${serviceLabel()} →</a>
      <button type="button" class="button button-secondary" id="scan-restart">Start over</button>
    </div>`;

  panel.querySelectorAll('[data-scan-route]').forEach(link => link.addEventListener('click', () => track('vt_diagnostic_handoff', { scan: 'Signal Scan', route: link.dataset.scanRoute, service_path: mode, source_context: startedFrom || source || 'direct' })));
  document.getElementById('scan-restart')?.addEventListener('click', () => {
    Object.keys(answers).forEach(key => { answers[key] = null; });
    step = 0;
    target = .08;
    updateUrgency();
    render(true);
  });
  saveSignalResult({ scan: 'Signal Scan', result: result[0], startedFrom: startedFrom || null, at: Date.now() });
  track('signal_scan_result', { mode: 'pc', service_path: mode, symptom: answers.symptom, context: answers.context || 'general' });
}
function render(focusHeading = false) {
  const rows = questions();
  renderMeter(rows.length);
  if (step < rows.length) renderOptions(rows[step]);
  else renderResult();
  if (focusHeading) panel.querySelector('h3').focus();
  panel.getAnimations().forEach(animation => animation.cancel());
  if (focusHeading && !motion.matches) {
    panel.animate([{ opacity: .55, transform: 'translateY(5px)' }, { opacity: 1, transform: 'translateY(0)' }],
      { duration: 220, easing: 'ease-out' });
  }
}

if (source && backLink) {
  backLink.href = sourceInfo[source].page;
  backLink.textContent = `← Back to ${sourceInfo[source].label}`;
}

const signalColours = { ready: '#5ee8da', low: '#5ee8da', elevated: '#ffbc70', high: '#ff838d' };

function drawScope(time) {
  if (!context) return;
  const { width, height } = canvas;
  const colour = signalColours[priority.dataset.level] || signalColours.ready;
  const amplitude = height * (.11 + tension * .23);
  const phase = time / 470;
  context.clearRect(0, 0, width, height);

  const glow = context.createLinearGradient(0, 0, width, 0);
  glow.addColorStop(0, colour + '00');
  glow.addColorStop(.22, colour);
  glow.addColorStop(.78, colour);
  glow.addColorStop(1, colour + '00');

  for (const [opacity, offset, thickness] of [[.17, 1.7, 1], [.33, .8, 1], [1, 0, 2]]) {
    context.beginPath();
    context.globalAlpha = opacity;
    context.strokeStyle = glow;
    context.lineWidth = thickness * Math.min(devicePixelRatio || 1, 2);
    for (let x = 0; x <= width; x += 2) {
      const position = x / width;
      const envelope = Math.sin(Math.PI * position) ** 1.5;
      const wave = Math.sin(position * (15 + tension * 20) - phase + offset);
      const harmonic = Math.sin(position * 35 - phase * 1.6 + offset) * .26;
      const y = height / 2 + (wave + harmonic) * amplitude * envelope;
      if (x === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.stroke();
  }
  context.globalAlpha = 1;
}

function resizeScope() {
  const ratio = Math.min(devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.round(rect.width * ratio));
  canvas.height = Math.max(1, Math.round(rect.height * ratio));
  drawScope(0);
}

function paint(time) {
  rafId = 0;
  if (!scopeVisible || document.hidden || motion.matches) return;
  if (time - lastPaint >= 30) {
    tension += (target - tension) * .13;
    drawScope(time);
    lastPaint = time;
  }
  startScope();
}

function startScope() {
  if (context && !rafId && scopeVisible && !document.hidden && !motion.matches) {
    rafId = requestAnimationFrame(paint);
  }
}

new ResizeObserver(resizeScope).observe(canvas);
new IntersectionObserver(([entry]) => {
  scopeVisible = entry.isIntersecting;
  startScope();
}).observe(canvas);
document.addEventListener('visibilitychange', startScope);
motion.addEventListener('change', () => {
  tension = target;
  drawScope(0);
  startScope();
});
updateUrgency();
render();
startScope();
