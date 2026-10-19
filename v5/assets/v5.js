const q=(s,r=document)=>r.querySelector(s);
const qa=(s,r=document)=>[...r.querySelectorAll(s)];

function setupShell(){
  const toggle=q('[data-menu]');
  const nav=q('#site-nav');
  if(toggle&&nav){
    const mq=matchMedia('(max-width:899px)');
    let open=false;
    const render=()=>{
      if(mq.matches){
        nav.hidden=!open;
        toggle.textContent=open?'Close':'Menu';
        toggle.setAttribute('aria-expanded',String(open));
        document.body.classList.toggle('menu-open',open);
      }else{
        nav.hidden=false;
        toggle.textContent='Menu';
        toggle.setAttribute('aria-expanded','false');
        document.body.classList.remove('menu-open');
      }
    };
    toggle.addEventListener('click',()=>{open=!open;render();if(open)requestAnimationFrame(()=>q('a',nav)?.focus())});
    nav.addEventListener('click',e=>{if(mq.matches&&e.target.closest('a')){open=false;render()}});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&open){open=false;render();toggle.focus()}});
    mq.addEventListener('change',()=>{open=false;render()});
    render();
  }
  const here=location.pathname.split('/').pop()||'index.html';
  qa('#site-nav a').forEach(a=>{
    const target=new URL(a.href,location.href).pathname.split('/').pop()||'index.html';
    if(target===here)a.setAttribute('aria-current','page');
  });
}

const products=[
  {cat:'gpu',brand:'NVIDIA',name:'GeForce RTX 5070 class',note:'1440p / creator performance',img:'../assets/categories/gpu.webp'},
  {cat:'gpu',brand:'AMD',name:'Radeon RX 7700 XT class',note:'High-refresh 1440p gaming',img:'../vt-alt-upgrades-zotac-gpu.webp'},
  {cat:'cpu',brand:'AMD',name:'Ryzen gaming CPU',note:'High-FPS gaming platform',img:'../assets/categories/cpu.webp'},
  {cat:'cpu',brand:'Intel',name:'Core desktop CPU',note:'Gaming + productivity platform',img:'../vt-stock-motherboard-cpu.webp'},
  {cat:'board',brand:'ASUS',name:'Performance motherboard',note:'Modern desktop foundation',img:'../assets/categories/motherboard.webp'},
  {cat:'memory',brand:'DDR5',name:'32 GB performance memory',note:'Gaming + multitasking baseline',img:'../assets/categories/memory.webp'},
  {cat:'storage',brand:'NVMe',name:'High-speed SSD storage',note:'Fast system and game storage',img:'../assets/categories/storage.webp'},
  {cat:'cooling',brand:'Air / AIO',name:'Performance CPU cooling',note:'Thermals without guesswork',img:'../assets/categories/cooler.webp'}
];

function setupStore(){
  const grid=q('#product-grid');
  if(!grid)return;
  const search=q('#product-search');
  const count=q('#result-count');
  let category='all';
  let query='';
  const render=()=>{
    const filtered=products.filter(p=>(category==='all'||p.cat===category)&&(!query||(`${p.brand} ${p.name} ${p.note}`).toLowerCase().includes(query)));
    grid.innerHTML=filtered.map(p=>`
      <article class="product-card">
        <div class="product-img"><img src="${p.img}" alt="" loading="lazy"></div>
        <div class="product-copy">
          <small>${p.brand}</small>
          <strong>${p.name}</strong>
          <p>${p.note}</p>
          <button type="button">Prototype detail →</button>
        </div>
      </article>`).join('');
    count.textContent=`${filtered.length} prototype items`;
  };
  qa('[data-cat]').forEach(btn=>btn.addEventListener('click',()=>{
    category=btn.dataset.cat;
    qa('[data-cat]').forEach(b=>b.classList.toggle('active',b===btn));
    render();
  }));
  search?.addEventListener('input',()=>{query=search.value.trim().toLowerCase();render()});
  render();
}

function setupBuilder(){
  const root=q('[data-builder]');
  if(!root)return;
  const steps=qa('.step',root);
  const progress=qa('.builder-progress span',root);
  let index=0;
  const state={goal:'',focus:'',budget:'R20 000',style:''};
  const render=()=>{
    steps.forEach((s,i)=>s.classList.toggle('active',i===index));
    progress.forEach((p,i)=>p.classList.toggle('active',i<=index));
    q('[data-prev]',root).hidden=index===0;
    const next=q('[data-next]',root);
    next.textContent=index===steps.length-1?'Start over':'Continue →';
    qa('[data-summary]',root).forEach(el=>{el.textContent=state[el.dataset.summary]||'Not chosen'});
  };
  qa('.choice',root).forEach(btn=>btn.addEventListener('click',()=>{
    const group=btn.closest('.step');
    qa('.choice',group).forEach(b=>b.classList.toggle('selected',b===btn));
    state[btn.dataset.key]=btn.dataset.value;
    render();
  }));
  const budget=q('#budget',root);
  const budgetOut=q('#budget-out',root);
  if(budget){
    const update=()=>{state.budget='R'+Number(budget.value).toLocaleString('en-ZA');budgetOut.textContent=state.budget;render()};
    budget.addEventListener('input',update);update();
  }
  q('[data-next]',root).addEventListener('click',()=>{
    if(index===steps.length-1){index=0}else index++;
    render();scrollTo({top:root.offsetTop-90,behavior:'smooth'});
  });
  q('[data-prev]',root).addEventListener('click',()=>{index=Math.max(0,index-1);render();scrollTo({top:root.offsetTop-90,behavior:'smooth'})});
  render();
}

setupShell();
setupStore();
setupBuilder();
