import { connectCart, connectProductionServices } from '../services/home-integrations.js';
import { readStreamJourney, saveStreamResult, trackStreamEvent } from '../services/stream-scan-handoff.js';
import {
  connections, contextNote, createStreamAnswers, gpus, label, platforms,
  recommendationFor, resolutions, resultRows, setupTypes, streamQuestions,
  symptoms, uploads, urgencyScore
} from '../services/stream-scan-model.js';

connectProductionServices();
connectCart();

const params=new URLSearchParams(location.search);
const requestedIssue=params.get('issue');
const answers=createStreamAnswers();
let step=0,tension=.08,target=.08;
const panel=document.getElementById('panel');
const meter=document.getElementById('meter');
const progressLabel=document.getElementById('progress-label');
const canvas=document.getElementById('scope');
const context=canvas?.getContext('2d');
const reading=document.getElementById('reading');
const status=document.getElementById('status');
const priority=document.getElementById('scan-priority');
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
let clock=0,rafId=0;

if(requestedIssue&&symptoms.some(row=>row[0]===requestedIssue)){
  answers.symptom=requestedIssue;
  step=1;
}

function questions(){return streamQuestions(answers)}
function track(name,payload={}){trackStreamEvent(name,payload)}
function updateUrgency(){target=urgencyScore(answers);if(reduceMotion){tension=target;paint(false)}}
function renderMeter(total){
  meter.innerHTML=Array.from({length:total},(_,index)=>`<i class="${index<=step?'on':''}"></i>`).join('');
  progressLabel.textContent=step<total?`STEP ${Math.min(step+1,total)} / ${total}`:'RESULT';
}
function clearFrom(index){
  const rows=questions();
  for(let i=index;i<rows.length;i++){
    const key=rows[i].key;
    if(key in answers)answers[key]=null;
  }
}
function goBack(){
  const targetStep=Math.max(0,step-1);
  clearFrom(targetStep);
  step=targetStep;
  updateUrgency();
  render();
}
function renderOptions(question){
  panel.innerHTML=`<h2>${question.title}</h2><div class="scan-options">${question.options.map(row=>`<button type="button" class="scan-option" data-value="${row[0]}">${row[1]}</button>`).join('')}</div>${step?'<div class="scan-nav"><button type="button" class="button button-secondary" id="scan-back-step">← BACK</button></div>':''}`;
  panel.querySelectorAll('.scan-option').forEach(button=>button.addEventListener('click',()=>{
    const value=button.dataset.value;
    if(question.key==='symptom'){
      Object.keys(answers).forEach(key=>{answers[key]=null});
      answers.symptom=value;
    }else answers[question.key]=value;
    step++;
    updateUrgency();
    render();
  }));
  document.getElementById('scan-back-step')?.addEventListener('click',goBack);
}
function resultNote(){
  return 'Starting-price estimate only, not a guaranteed final quotation. This is answer-based triage, not a live OBS, hardware or network scan. Final scope can change after the actual configuration and connection behaviour are reviewed.';
}
function renderResult(){
  const result=recommendationFor(answers);
  const rows=resultRows(answers);
  const issue=label(symptoms,answers.symptom)||'Streaming support';
  const extra=contextNote(answers);
  const startedFrom=readStreamJourney();
  const lines=[
    'Hi VoltTech, I ran Stream Scan.','',
    startedFrom?`Started from: ${startedFrom}`:'',
    `Issue: ${issue}`,
    ...rows.map(row=>`${row[0]}: ${row[1]}`),
    `Likely category: ${result[0]}`,
    `Recommended service: ${result[2]}`,
    `Estimated starting price: ${result[3]}`,'',
    'Could you please review this and advise me on the next step?'
  ].filter(Boolean);
  const message=lines.join('\n');
  panel.innerHTML=`<span class="scan-badge">LIKELY STREAM ISSUE</span><h2>${result[0]}</h2><p class="scan-result-copy">${result[1]}</p><div class="scan-diags"><div class="scan-diag"><span>Selected issue</span><span>${issue}</span></div>${rows.map(row=>`<div class="scan-diag"><span>${row[0]}</span><span>${row[1]}</span></div>`).join('')}<div class="scan-diag"><span>Recommended</span><span>${result[2]}</span></div></div>${extra?`<div class="stream-context"><strong>Why this matters</strong><p>${extra}</p></div>`:''}<div class="scan-price">${result[3]}</div><p class="scan-price-label">STARTING SERVICE ESTIMATE</p><div class="scan-note">${resultNote()}</div><div class="stream-security"><strong>Security:</strong> VoltTech never needs your Twitch/YouTube password, 2FA code or stream key.</div><div class="scan-actions"><a class="button" data-scan-route="whatsapp" target="_blank" rel="noopener" href="https://wa.me/27618435775?text=${encodeURIComponent(message)}">WHATSAPP RESULT →</a><a class="button button-secondary" data-scan-route="email" href="mailto:volttechcomputerco@gmail.com?subject=${encodeURIComponent('VoltTech Stream Scan result')}&body=${encodeURIComponent(message)}">EMAIL RESULT</a></div><div class="scan-result-links"><a class="button button-secondary" href="streaming-setup-south-africa.html">VIEW STREAMING SUPPORT →</a><button type="button" class="button button-secondary" id="scan-restart">RUN ANOTHER SCAN</button></div>`;
  panel.querySelectorAll('[data-scan-route]').forEach(link=>link.addEventListener('click',()=>track('vt_diagnostic_handoff',{scan:'Stream Scan',route:link.dataset.scanRoute,issue:answers.symptom||'unknown',source_context:startedFrom||'direct'})));
  document.getElementById('scan-restart')?.addEventListener('click',()=>{
    Object.keys(answers).forEach(key=>{answers[key]=null});
    step=0;target=.08;updateUrgency();render();
  });
  saveStreamResult({scan:'Stream Scan',result:result[0],startedFrom:startedFrom||null,at:Date.now()});
  track('stream_scan_result',{symptom:answers.symptom,platform:answers.platform||'unknown',recommendation:result[2]});
}
function render(){
  const rows=questions();
  renderMeter(rows.length);
  if(step<rows.length)renderOptions(rows[step]);else renderResult();
}

function priorityLevel(){return tension<.32?'low':tension<.60?'elevated':'high'}
function paint(animate=true){
  if(!context||!canvas||document.hidden){rafId=0;return}
  if(animate&&!reduceMotion)tension+=(target-tension)*.05;else tension=target;
  const ratio=Math.min(devicePixelRatio||1,2),width=canvas.width,height=canvas.height;
  context.clearRect(0,0,width,height);
  const level=priorityLevel();
  const colour=level==='high'?'#ff7272':level==='elevated'?'#c28cff':'#35ead7';
  context.beginPath();context.strokeStyle=colour;context.lineWidth=1.7*ratio;
  for(let x=0;x<=width;x+=2){
    const noise=reduceMotion?0:(Math.random()-.5)*tension*tension*.3*height;
    const y=height/2+Math.sin(x*(.015+tension*.11)+clock)*(6+tension*26)*ratio+noise;
    if(x)context.lineTo(x,y);else context.moveTo(x,y);
  }
  context.stroke();if(!reduceMotion)clock+=.05;
  reading.textContent=level==='low'?'LOW':level==='elevated'?'ELEVATED':'HIGH';
  status.textContent=level==='low'?'LOW PRIORITY':level==='elevated'?'MODERATE PRIORITY':'HIGH PRIORITY';
  priority.dataset.level=level;
  if(!reduceMotion)rafId=requestAnimationFrame(()=>paint(true));else rafId=0;
}
function resizeScope(){
  if(!canvas)return;
  const ratio=Math.min(devicePixelRatio||1,2),rect=canvas.getBoundingClientRect();
  canvas.width=Math.max(1,Math.round(rect.width*ratio));canvas.height=Math.max(1,Math.round(rect.height*ratio));paint(false);
}
function startScope(){if(reduceMotion){paint(false);return}if(!rafId&&!document.hidden)rafId=requestAnimationFrame(()=>paint(true))}
addEventListener('resize',resizeScope);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)startScope()});
resizeScope();updateUrgency();render();startScope();
