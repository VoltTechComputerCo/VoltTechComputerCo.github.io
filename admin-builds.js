(()=> {
  const c=supabase.createClient(VOLTTECH_SUPABASE.url,VOLTTECH_SUPABASE.publishableKey),q=s=>document.querySelector(s);
  const money=n=>new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR',maximumFractionDigits:0}).format(Number(n||0));
  const x=v=>String(v??'').replace(/[&<>"']/g,a=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[a]));
  let rows=[];

  async function init(){
    const{data:{session}}=await c.auth.getSession();
    if(!session){location.href='account.html?returnTo=%2Fadmin-builds.html';return}

    const{data:ok,error}=await c.rpc('is_volttech_admin');
    if(error||ok!==true){location.replace('account.html');return}

    q('#buildRequestSearch')?.addEventListener('input',render);
    await load();
  }

  async function load(){
    q('#status').textContent='Loading…';

    const[{data,error},customerResult]=await Promise.all([
      c.from('saved_builds')
        .select('id,user_id,name,status,build_data,estimated_total,estimated_power_watts,compatibility_status,quote_id,quote_requested_at,updated_at')
        .eq('status','quote_requested')
        .order('quote_requested_at',{ascending:true}),
      c.rpc('admin_customers')
    ]);

    if(error){
      q('#status').textContent=error.message;
      q('#requests').innerHTML='<p class="empty">Could not load PC build requests.</p>';
      return;
    }

    const customers=customerResult.error?[]:(customerResult.data||[]);
    const map=new Map(customers.map(p=>[p.id,p]));
    rows=(data||[]).map(r=>({...r,profiles:map.get(r.user_id)||null}));
    render();
  }

  function text(r){
    const p=r.profiles||{};
    return[
      p.full_name,p.billing_email,p.phone,p.suburb,p.company_name,
      r.name,r.status,r.compatibility_status,
      ...(r.build_data?.items||[]).map(i=>i.name)
    ].filter(Boolean).join(' ').toLowerCase();
  }

  function render(){
    const term=(q('#buildRequestSearch')?.value||'').trim().toLowerCase();
    const list=rows.filter(r=>!term||text(r).includes(term));

    q('#status').textContent=`${list.length} of ${rows.length} request${rows.length===1?'':'s'} waiting`;
    q('#requests').innerHTML=list.length
      ?list.map(card).join('')
      :'<p class="empty">No PC build requests match that search.</p>';

    document.querySelectorAll('[data-convert]').forEach(b=>b.onclick=()=>convert(b.dataset.convert));
    document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openBuild(b.dataset.open));

    const focus=new URLSearchParams(location.search).get('focus');
    if(focus){
      const el=document.querySelector(`[data-request="${CSS.escape(focus)}"]`);
      if(el){
        el.classList.add('vt-focus');
        setTimeout(()=>el.scrollIntoView({behavior:'smooth',block:'center'}),100);
      }
    }
  }

  function card(r){
    const p=r.profiles||{},items=r.build_data?.items||[];
    const linked=items.filter(i=>i.product_id).length;
    const refresh=items.filter(i=>!i.price_checked_at||['stale','unknown'].includes(String(i.offer_freshness||'unknown').toLowerCase())).length;

    return`<article class="card" data-request="${x(r.id)}">
      <div class="head">
        <div>
          <span class="mini">${x(p.full_name||p.billing_email||'Customer')}${p.suburb?' · '+x(p.suburb):''}</span>
          <h2>${x(r.name||'PC Build')}</h2>
          <span class="mini">Requested ${new Date(r.quote_requested_at||r.updated_at).toLocaleString('en-ZA')}</span>
        </div>
        <span class="pill">Quote requested</span>
      </div>

      <div class="vt-build-origin">
        <span>BUILDER SOURCE</span>
        <b>${linked}/${items.length} component${items.length===1?'':'s'} retain catalogue identity${refresh?` · ${refresh} estimate${refresh===1?'':'s'} need price refresh`:''}</b>
      </div>

      <div class="parts">
        ${items.map(i=>`<div class="part"><span>${x(i.name)}</span><b>${money(i.unit_price)}</b></div>`).join('')}
      </div>

      <div class="meta">
        <span>Estimate <b>${money(r.estimated_total)}</b></span>
        <span>Power <b>${r.estimated_power_watts||'—'} W</b></span>
        <span>Compatibility <b>${x(r.compatibility_status||'review')}</b></span>
      </div>

      <div class="actions">
        <button class="btn" data-convert="${x(r.id)}">Create linked draft quote</button>
        <button class="btn secondary" data-open="${x(r.id)}">Open in builder</button>
      </div>
    </article>`;
  }

  function openBuild(id){
    const r=rows.find(v=>v.id===id);
    if(!r)return;

    const serialized=r.build_data?.serialized||{};
    const b64=btoa(JSON.stringify(serialized))
      .replace(/\+/g,'-')
      .replace(/\//g,'_')
      .replace(/=+$/g,'');

    window.open(
      `builder/?build=${encodeURIComponent(b64)}&preview=1`,
      '_blank',
      'noopener,noreferrer'
    );
  }

  async function convert(id){
    const r=rows.find(v=>v.id===id);
    if(!r)return;
    const p=r.profiles||{};

    const ok=await VoltTechDialog.confirm({
      kicker:'ADMIN / PC BUILD',
      title:'Create a linked draft quote from this build?',
      message:`Customer: ${p.full_name||p.billing_email||'Customer'} · Build: ${r.name||'PC Build'}. The server will create the draft quote, retain Builder provenance and lock the saved build in one transaction. Refresh supplier pricing before sending the quotation.`,
      confirmText:'Create linked draft quote'
    });
    if(!ok)return;

    q('#status').textContent='Creating linked VoltTech quote…';
    const valid=new Date();
    valid.setDate(valid.getDate()+7);

    const{data,error}=await c.rpc('admin_quote_saved_build',{
      p_build_id:r.id,
      p_valid_until:valid.toISOString().slice(0,10)
    });

    if(error){
      q('#status').textContent=error.message;
      return;
    }

    const quoteId=extractId(data);
    q('#status').textContent='Linked draft quote created. Returning to the workflow…';
    setTimeout(()=>{
      location.href=quoteId
        ?`admin.html?focus=${encodeURIComponent(quoteId)}`
        :'admin.html';
    },350);
  }

  function extractId(data){
    if(!data)return null;
    if(typeof data==='string'||typeof data==='number')return data;
    if(Array.isArray(data))return extractId(data[0]);
    return data.id||data.quote_id||null;
  }

  document.addEventListener('DOMContentLoaded',init);
})();
