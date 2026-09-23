import { connectCart, connectProductionServices } from '../services/home-integrations.js';
import { readSignalJourney, saveSignalResult, trackSignalEvent } from '../services/signal-scan-handoff.js';
import {
  ages,
  allowedSources,
  applyContext,
  backups,
  contextLabel,
  createAnswers,
  durations,
  issueSets,
  resultConfig,
  resultRows,
  scanMode,
  scanQuestions,
  sourceInfo,
  urgencyScore,
  uses
} from '../services/signal-scan-model.js';

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
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let clock = 0;
let rafId = 0;

if (source && requestedIssue && issueSets[source].some(row => row[0] === requestedIssue)) {
  applyContext(answers, source, requestedIssue);
  step = 1;
}

function currentMode() { return scanMode(answers, source); }
function questions() { return scanQuestions(answers, source); }
function updateUrgency() {
  target = urgencyScore(answers, source);
  if (reduceMotion) { tension = target; paint(false); }
}
function servicePage() { return sourceInfo[currentMode()]?.page || 'pc-repair-pretoria.html'; }
function serviceLabel() { return sourceInfo[currentMode()]?.label || 'PC Support'; }
function journeyContext() { return readSignalJourney(); }
function track(name, payload = {}) { trackSignalEvent(name, payload); }
function renderMeter(total) {
  meter.innerHTML = Array.from({ length: total }, (_, index) => `<i class="${index <= step ? 'on' : ''}"></i>`).join('');
  progressLabel.textContent = step < total ? `STEP ${Math.min(step + 1, total)} / ${total}` : 'RESULT';
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
  render();
}
function renderOptions(question) {
  panel.innerHTML = `<h2>${question.title}</h2><div class="scan-options">${question.options.map(row => `<button type="button" class="scan-option" data-value="${row[0]}">${row[1]}</button>`).join('')}</div>${step ? '<div class="scan-nav"><button type="button" class="button button-secondary" id="scan-back-step">← BACK</button></div>' : ''}`;
  panel.querySelectorAll('.scan-option').forEach(button => button.addEventListener('click', () => {
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
    render();
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
  panel.innerHTML = `<span class="scan-badge">LIKELY SERVICE PATH</span><h2>${result[0]}</h2><p class="scan-result-copy">${result[1]}</p><div class="scan-diags"><div class="scan-diag"><span>Selected issue</span><span>${issue}</span></div><div class="scan-diag"><span>Recommended service</span><span>${result[3]}</span></div>${rows.map(row => `<div class="scan-diag"><span>${row[0]}</span><span>${row[1]}</span></div>`).join('')}</div><div class="scan-price">${result[2]}</div><p class="scan-price-label">STARTING SERVICE ESTIMATE</p><div class="scan-note">${resultNote(mode)}</div><div class="scan-actions"><a class="button" data-scan-route="whatsapp" target="_blank" rel="noopener" href="https://wa.me/27618435775?text=${encodeURIComponent(message)}">WHATSAPP RESULT →</a><a class="button button-secondary" data-scan-route="email" href="mailto:volttechcomputerco@gmail.com?subject=${encodeURIComponent('VoltTech Signal Scan result')}&body=${encodeURIComponent(message)}">EMAIL RESULT</a></div><div class="scan-result-links"><a class="button button-secondary" href="${servicePage()}">VIEW ${serviceLabel().toUpperCase()} →</a><button type="button" class="button button-secondary" id="scan-restart">RUN ANOTHER SCAN</button></div>`;
  panel.querySelectorAll('[data-scan-route]').forEach(link => link.addEventListener('click', () => track('vt_diagnostic_handoff', { scan: 'Signal Scan', route: link.dataset.scanRoute, service_path: mode, source_context: startedFrom || source || 'direct' })));
  document.getElementById('scan-restart')?.addEventListener('click', () => {
    Object.keys(answers).forEach(key => { answers[key] = null; });
    step = 0;
    target = .08;
    updateUrgency();
    render();
  });
  saveSignalResult({ scan: 'Signal Scan', result: result[0], startedFrom: startedFrom || null, at: Date.now() });
  track('signal_scan_result', { mode: 'pc', service_path: mode, symptom: answers.symptom, context: answers.context || 'general' });
}
function render() {
  const rows = questions();
  renderMeter(rows.length);
  if (step < rows.length) renderOptions(rows[step]);
  else renderResult();
}

if (source && backLink) {
  backLink.href = sourceInfo[source].page;
  backLink.textContent = `← BACK TO ${sourceInfo[source].label.toUpperCase()}`;
}

function priorityLevel() { return tension < .32 ? 'low' : tension < .58 ? 'elevated' : 'high'; }
function paint(animate = true) {
  if (!context || !canvas || document.hidden) { rafId = 0; return; }
  if (animate && !reduceMotion) tension += (target - tension) * .05; else tension = target;
  const ratio = Math.min(devicePixelRatio || 1, 2);
  const width = canvas.width, height = canvas.height;
  context.clearRect(0, 0, width, height);
  const level = priorityLevel();
  const colour = level === 'high' ? '#ff7272' : level === 'elevated' ? '#ffb454' : '#35ead7';
  context.beginPath();
  context.strokeStyle = colour;
  context.lineWidth = 1.7 * ratio;
  for (let x = 0; x <= width; x += 2) {
    const noise = reduceMotion ? 0 : (Math.random() - .5) * tension * tension * .3 * height;
    const y = height / 2 + Math.sin(x * (.015 + tension * .11) + clock) * (6 + tension * 26) * ratio + noise;
    if (x) context.lineTo(x, y); else context.moveTo(x, y);
  }
  context.stroke();
  if (!reduceMotion) clock += .05;
  reading.textContent = level === 'low' ? 'LOW' : level === 'elevated' ? 'ELEVATED' : 'HIGH';
  status.textContent = level === 'low' ? 'LOW PRIORITY' : level === 'elevated' ? 'MODERATE PRIORITY' : 'HIGH PRIORITY';
  priority.dataset.level = level;
  if (!reduceMotion) rafId = requestAnimationFrame(() => paint(true)); else rafId = 0;
}
function resizeScope() {
  if (!canvas) return;
  const ratio = Math.min(devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.round(rect.width * ratio));
  canvas.height = Math.max(1, Math.round(rect.height * ratio));
  paint(false);
}
function startScope() {
  if (reduceMotion) { paint(false); return; }
  if (!rafId && !document.hidden) rafId = requestAnimationFrame(() => paint(true));
}

addEventListener('resize', resizeScope);
document.addEventListener('visibilitychange', () => { if (!document.hidden) startScope(); });
resizeScope();
updateUrgency();
render();
startScope();
