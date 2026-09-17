(()=>{
  if(window.__voltTechPortalShellV5)return;
  window.__voltTechPortalShellV5=true;

  const page=(location.pathname.split("/").pop()||"index.html").toLowerCase();
  const customerPages=new Set(["activity.html","builds.html","quotes.html","documents.html","privacy-center.html"]);
  const esc=v=>String(v??"").replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[a]));

  function labelBefore(target,text){
    if(!target||target.previousElementSibling?.classList.contains("portal-section-label"))return;
    const el=document.createElement("div");
    el.className="portal-section-label";
    el.textContent=text;
    target.insertAdjacentElement("beforebegin",el);
  }

  function accountShell(){
    const hub=document.querySelector("#accountHub");
    const nav=hub?.querySelector(".account-primary-nav");
    if(!hub||!nav)return;

    nav.classList.add("portal-account-nav");

    const more=document.querySelector("#accountMenuToggle");
    if(more)more.textContent="More";

    if(!nav.querySelector('a[href="quotes.html"]')){
      const quote=document.createElement("a");
      quote.className="tab";
      quote.href="quotes.html";
      quote.textContent="Quotes";
      const docs=nav.querySelector('a[href="documents.html"]');
      nav.insertBefore(quote,docs||more||null);
    }

    const panel=document.querySelector("#accountMenu");
    const grid=panel?.querySelector(".account-more-grid");
    if(panel)panel.classList.add("portal-more-panel");

    if(grid&&!grid.querySelector('a[href="index.html"]')){
      const home=document.createElement("a");
      home.className="tab";
      home.href="index.html";
      home.textContent="VoltTech Home";
      grid.appendChild(home);
    }

    const admin=document.querySelector("#adminShortcut");
    if(admin&&grid){
      admin.classList.add("portal-admin-link");
      admin.textContent="Admin Hub";
      grid.appendChild(admin);
    }

    const dashboard=hub.querySelector(".dashboard-grid");
    const quick=hub.querySelector(".quick-row");
    labelBefore(dashboard,"Account at a glance");
    labelBefore(quick,"Quick actions");

    const params=new URLSearchParams(location.search);
    if(params.get("more")==="1"){
      setTimeout(()=>{
        if(panel?.hidden)more?.click();
        more?.scrollIntoView({block:"nearest"});
      },80);
    }
  }

  function customerNav(){
    const nav=document.querySelector("nav");
    const wrap=nav?.querySelector(".wrap");
    if(!wrap)return;

    let old=wrap.querySelector(".navlinks,.v4-page-nav");
    if(!old){
      old=document.createElement("div");
      wrap.appendChild(old);
    }
    old.className="portal-customer-nav";

    const links=[
      ["account.html","Overview","account.html"],
      ["activity.html","Activity","activity.html"],
      ["builds.html","Builds","builds.html"],
      ["quotes.html","Quotes","quotes.html"],
      ["documents.html","Documents","documents.html"],
      ["account.html?more=1","More","more"],
      ["index.html","Home","home"]
    ];
    old.innerHTML=links.map(([href,label,key])=>{
      const active=page===key?" active":"";
      return `<a class="${active.trim()}" href="${href}">${esc(label)}</a>`;
    }).join("");
    wrap.classList.add("portal-header-has-notify");
  }

  function makeAdminNav(active){
    const nav=document.createElement("div");
    nav.className="portal-admin-nav";
    nav.innerHTML=`
      <a class="portal-admin-back" href="account.html">← Account</a>
      <a class="${active==="queue"?"active":""}" href="admin.html">Queue</a>
      <a class="${active==="customers"?"active":""}" href="admin-customers.html">Customers</a>
      <a class="${active==="parts"?"active":""}" href="admin-store.html">Parts</a>
      <button class="portal-admin-more-btn ${active==="more"?"active":""}" type="button" aria-expanded="false" aria-label="Open Admin menu">Menu</button>
      <div class="portal-admin-more" hidden>
        <a href="admin-records.html">Records</a>
        <a href="index.html">VoltTech Home</a>
        <a href="admin-builds.html">Build requests</a>
        <a href="admin-deletions.html">Account deletions</a>
      </div>`;
    const btn=nav.querySelector(".portal-admin-more-btn");
    const menu=nav.querySelector(".portal-admin-more");
    btn.addEventListener("click",()=>{
      const open=menu.hidden;
      menu.hidden=!open;
      btn.setAttribute("aria-expanded",String(open));
    });
    document.addEventListener("click",e=>{
      if(menu.hidden||e.target.closest(".portal-admin-nav"))return;
      menu.hidden=true;btn.setAttribute("aria-expanded","false");
    });
    return nav;
  }

  function adminNav(){
    const active=
      page==="admin.html"?"queue":
      page==="admin-customers.html"||page==="admin-customer.html"?"customers":
      page==="admin-store.html"?"parts":"more";

    if(page==="admin.html"){
      const tools=document.querySelector(".top .tools");
      if(tools){
        const nav=makeAdminNav(active);
        tools.replaceWith(nav);
        document.querySelector(".top")?.classList.add("portal-header-has-notify");
      }
      return;
    }

    const wrap=document.querySelector("nav .wrap");
    if(!wrap)return;
    const old=wrap.querySelector(".navlinks,.v4-page-nav,.back");
    const nav=makeAdminNav(active);
    if(old)old.replaceWith(nav);
    else wrap.appendChild(nav);
    wrap.classList.add("portal-header-has-notify");
  }

  function adminHome(){
    if(page!=="admin.html")return;
    const app=document.querySelector("#app");
    const workflow=document.querySelector("#workflowPanel");
    if(!app||!workflow)return;

    const panels=[...app.querySelectorAll(":scope > .panel")];
    const findPanel=title=>panels.find(p=>p.querySelector(":scope > h2")?.textContent.trim().toLowerCase()===title.toLowerCase());

    const customerLookup=findPanel("Customer lookup");
    const quotePanel=findPanel("Create quotation");
    const recent=findPanel("Recent quotes");

    if(customerLookup)customerLookup.dataset.portalHidden="true";
    if(recent)recent.dataset.portalHidden="true";

    if(quotePanel){
      quotePanel.id="portalManualQuote";
      quotePanel.classList.add("portal-collapsible");
      quotePanel.hidden=true;
    }

    if(!workflow.querySelector(".portal-admin-actions")){
      const actions=document.createElement("div");
      actions.className="portal-admin-actions";
      actions.innerHTML=`
        <a href="admin-customers.html">Customers</a>
        <button class="primary" id="portalCreateQuote" type="button">Create manual quote</button>
        <a href="admin-records.html">Find any record</a>`;
      workflow.appendChild(actions);

      actions.querySelector("#portalCreateQuote")?.addEventListener("click",()=>{
        if(!quotePanel)return;
        quotePanel.hidden=!quotePanel.hidden;
        if(!quotePanel.hidden)quotePanel.scrollIntoView({behavior:"smooth",block:"start"});
      });
    }

    const params=new URLSearchParams(location.search);
    if(location.hash==="#quoteForm"||params.has("customer")||params.get("createQuote")==="1"){
      if(quotePanel){
        quotePanel.hidden=false;
        setTimeout(()=>quotePanel.scrollIntoView({behavior:"smooth",block:"start"}),120);
      }
    }
  }

  function statusTone(value){
    const s=String(value||"").trim().toLowerCase().replace(/[_-]+/g," ").replace(/\s+/g," ");
    if(!s)return"neutral";
    if(/\b(overdue|declined|expired|failed|failure|cancelled|canceled|rejected|conflict|blocked|urgent|error)\b/.test(s))return"danger";
    if(/\b(paid|accepted|completed|complete|delivered|fulfilled|quoted|closed|resolved|successful|success)\b/.test(s))return"success";
    if(/\b(unpaid|pending|awaiting|quote requested|requested|sent|viewed|issued|due|waiting|needs review|ready to invoice|ready to send|payment due)\b/.test(s))return"warning";
    if(/\b(draft|saved|open|active|in progress|processing|diagnosing|diagnostics|repairing|scheduled|booked|working)\b/.test(s))return"active";
    if(/\b(archived|void|inactive)\b/.test(s))return"neutral";
    return"neutral";
  }

  function decorateStatus(el){
    if(!(el instanceof HTMLElement))return;
    const tone=statusTone(el.textContent);
    el.classList.remove("vt-status-success","vt-status-warning","vt-status-danger","vt-status-active","vt-status-neutral");
    el.classList.add(`vt-status-${tone}`);
  }

  function applyStatusTones(root=document){
    const selectors=".pill,.v4-status,.vt-work-stage,[data-status-pill]";
    if(root instanceof Element&&root.matches(selectors))decorateStatus(root);
    root.querySelectorAll?.(selectors).forEach(decorateStatus);
  }

  function watchStatuses(){
    applyStatusTones(document);
    let queued=false;
    const observer=new MutationObserver(mutations=>{
      if(queued)return;
      if(!mutations.some(m=>m.addedNodes.length||m.type==="characterData"))return;
      queued=true;
      requestAnimationFrame(()=>{queued=false;applyStatusTones(document)});
    });
    observer.observe(document.body,{childList:true,subtree:true,characterData:true});
  }

  function init(){
    if(page==="account.html")accountShell();
    else if(customerPages.has(page))customerNav();

    if(page.startsWith("admin")){
      adminNav();
      adminHome();
    }
    watchStatuses();
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);
  else init();
})();
