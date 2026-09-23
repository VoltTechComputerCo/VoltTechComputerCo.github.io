let scheduled=false;
let observer=null;

function q(selector,root=document){return root.querySelector(selector)}
function qa(selector,root=document){return [...root.querySelectorAll(selector)]}

function setQuestionCopy(question,title,copy){
  if(!question)return;
  const b=q('.question-head b',question),small=q('.question-head small',question);
  if(b&&b.textContent!==title)b.textContent=title;
  if(small&&small.textContent!==copy)small.textContent=copy;
}

function setChoiceValue(form,name,value){
  const input=q(`input[name="${name}"]`,form);
  if(input)input.value=value;
  const group=q(`[data-choice-group="${name}"]`,form);
  qa('.choice-card',group||document).forEach(button=>{
    if(group)button.classList.toggle('active',button.dataset.value===String(value));
  });
}

function useCase(form){return q('input[name="useCase"]',form)?.value||'gaming'}

function adaptGuidedForm(form){
  const mode=useCase(form);
  const target=q('input[name="target"]',form)?.closest('.guided-question');
  const fps=q('input[name="fpsTarget"]',form)?.closest('.guided-question');
  const storage=q('input[name="storageNeed"]',form)?.closest('.guided-question');
  const intro=q('.guided-head p');

  const gaming=mode==='gaming'||mode==='streaming';
  const creator=mode==='creator'||mode==='workstation';

  if(target){
    target.hidden=mode==='office';
    if(creator)setQuestionCopy(target,'What resolution will you work at?','Resolution helps us weight graphics, memory and platform headroom for creative and professional work.');
    else setQuestionCopy(target,'What are your games going to look like?','Resolution changes how heavily we should weight the graphics card.');
  }
  if(fps)fps.hidden=!gaming;

  if(mode==='office'){
    setChoiceValue(form,'target','unsure');
    setChoiceValue(form,'fpsTarget','60');
    setQuestionCopy(storage,'How much everyday storage feels comfortable?','Choose enough room for Windows, work, photos and the apps you actually use.');
    const copy='Four focused choices. No spec-sheet homework. We’ll keep the machine fast, quiet and sensible for everyday use.';
    if(intro&&intro.textContent!==copy)intro.textContent=copy;
  }else if(creator){
    setChoiceValue(form,'fpsTarget','60');
    setQuestionCopy(storage,'How much project storage do you want to start with?','Storage is easy to expand later, so choose the working space that feels comfortable now.');
    const copy='Five focused choices. Tell us about the workload and we’ll spend the budget where it improves the work.';
    if(intro&&intro.textContent!==copy)intro.textContent=copy;
  }else{
    if(q('input[name="target"]',form)?.value==='unsure')setChoiceValue(form,'target','1440p');
    if(q('input[name="fpsTarget"]',form)?.value==='60')setChoiceValue(form,'fpsTarget','120');
    setQuestionCopy(storage,'How big is the game library situation?','Storage is easy to expand later, so choose what feels comfortable now.');
    const copy='Six quick choices. No spec-sheet homework. We’ll spend the budget where it actually matters for the way you use the PC.';
    if(intro&&intro.textContent!==copy)intro.textContent=copy;
  }
}

function installGuidedAdaptation(){
  const form=q('#guided-form');
  if(!form||form.dataset.experienceBound==='1')return;
  form.dataset.experienceBound='1';
  const group=q('[data-choice-group="useCase"]',form);
  group?.addEventListener('click',event=>{
    if(!event.target.closest('.choice-card'))return;
    queueMicrotask(()=>adaptGuidedForm(form));
  });
  adaptGuidedForm(form);
}

function selectedName(type){
  const rows=qa('#build-list > .build-item, #build-list > .build-group');
  const order=['cpu','motherboard','memory','gpu','case','cooler','psu','storage','fans'];
  const row=rows[order.indexOf(type)];
  if(!row||row.matches('details.build-group'))return'';
  const name=q('b',row)?.textContent?.trim()||'';
  return /not selected|optional/i.test(name)?'':name;
}

function integratedGraphicsSelected(){
  const cpuName=selectedName('cpu');
  if(!cpuName)return false;
  const catalogue=Array.isArray(window.__VT_BUILDER_CATALOGUE)?window.__VT_BUILDER_CATALOGUE:[];
  const cpu=catalogue.find(product=>product.type==='cpu'&&String(product.name||'').trim()===cpuName);
  return cpu?.specs?.integratedGraphics===true;
}

function enhanceIntegratedGraphicsState(){
  const step=q('#steps [data-category="gpu"]');
  if(!step)return;
  const noDiscreteGpu=!selectedName('gpu');
  const satisfied=noDiscreteGpu&&integratedGraphicsSelected();
  step.classList.toggle('igpu-satisfied',satisfied);
  if(!satisfied){q('.igpu-summary-note',q('#report')||document)?.remove();return;}
  step.classList.add('complete');
  const index=q('.step-index',step),summary=q('.step-label small',step);
  if(index&&index.textContent!=='✓')index.textContent='✓';
  const copy='Integrated graphics available · discrete GPU optional';
  if(summary&&summary.textContent!==copy)summary.textContent=copy;

  const report=q('#report');
  if(report&&!q('.igpu-summary-note',report)){
    const note=document.createElement('div');
    note.className='report-item good igpu-summary-note';
    note.textContent='✓ Integrated graphics selected — a discrete graphics card is optional for this build.';
    report.prepend(note);
  }
}

function installFlowRail(){
  if(q('#builder-flowrail'))return;
  const trust=q('.builder-trust');
  if(!trust)return;
  const nav=document.createElement('nav');
  nav.id='builder-flowrail';
  nav.className='builder-flowrail';
  nav.setAttribute('aria-label','PC Builder progress');
  nav.innerHTML=`<span data-flow-stage="route"><b>01</b><em>Choose route</em></span><span data-flow-stage="brief"><b>02</b><em>Set the brief</em></span><span data-flow-stage="parts"><b>03</b><em>Choose parts</em></span><span data-flow-stage="review"><b>04</b><em>Review build</em></span>`;
  trust.insertAdjacentElement('afterend',nav);
}

function buildSelectedCount(){
  return qa('#build-list > .build-item b, #build-list > .build-group summary b').filter(node=>!/^not selected$|^optional$/i.test(node.textContent.trim())).length;
}

function updateFlowRail(){
  const rail=q('#builder-flowrail');
  if(!rail)return;
  let active='route';
  if(!q('#guided-panel')?.hidden)active='brief';
  if(!q('#builder-layout')?.hidden){
    const complete=/BUILD COMPLETE/i.test(q('#report')?.textContent||'');
    active=complete?'review':'parts';
  }
  const order=['route','brief','parts','review'];
  const index=order.indexOf(active);
  qa('[data-flow-stage]',rail).forEach((item,i)=>{
    item.classList.toggle('active',i===index);
    item.classList.toggle('done',i<index);
  });
}

function strengthenInspectionTruth(){
  if(window.__VT_BUILDER_INSPECT!==true)return;
  const note=q('#catalogue-note');
  if(note&&note.dataset.prototypeTruth!=='1'){
    note.dataset.prototypeTruth='1';
    note.classList.add('prototype-data-note');
    note.innerHTML='<strong>PROTOTYPE DATA ONLY.</strong> Local test catalogue and mock supplier offers are being used. Displayed price and stock snapshots are stale test data — never a quotation or live availability.';
  }
  qa('.supplier').forEach(node=>{
    if(!node.textContent.includes('PROTOTYPE'))node.textContent=`PROTOTYPE · ${node.textContent}`;
  });
}

function improveMobileSummary(){
  const button=q('#mobile-summary');
  if(button&&button.textContent!=='Review build')button.textContent='Review build';
}

function refresh(){
  scheduled=false;
  installGuidedAdaptation();
  installFlowRail();
  enhanceIntegratedGraphicsState();
  strengthenInspectionTruth();
  improveMobileSummary();
  updateFlowRail();
}

function schedule(){
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(refresh);
}

export function enhanceBuilderExperience(){
  refresh();
  if(observer)return;
  observer=new MutationObserver(schedule);
  const app=q('#builderApp');
  if(app)observer.observe(app,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','class']});
  window.addEventListener('volttech:catalogue-ready',schedule);
  document.addEventListener('change',schedule);
  document.addEventListener('click',schedule);
}
