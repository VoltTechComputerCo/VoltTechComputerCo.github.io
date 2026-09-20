(()=>{
  if(window.__voltTechPortalShellV61)return;
  window.__voltTechPortalShellV61=true;
  const page=(location.pathname.split("/").pop()||"index.html").toLowerCase();
  const customerPages=new Set(["activity.html","builds.html","quotes.html","documents.html","privacy-center.html"]);
  const esc=v=>String(v??"").replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[a]));

  function accountShell(){
    const hub=document.querySelector("#accountHub");
    if(!hub)return;
    if(hub.classList.contains("account-phase4")){
      const tab=new URLSearchParams(location.search).get("tab");
      if(tab)setTimeout(()=>document.querySelector(`[data-tab="${CSS.escape(tab)}"]`)?.click(),80);
    }
  }

  function customerNav(){
    const wrap=document.querySelector("nav .wrap");
    if(!wrap)return;
    if(document.querySelector(".portal-phase4-nav")){wrap.classList.add("portal-header-has-notify");return}
    let old=wrap.querySelector(".navlinks,.v4-page-nav");
    if(!old){old=document.createElement("div");wrap.appendChild(old)}
    old.className="portal-customer-nav";
    const links=[["account.html","Home","account.html"],["activity.html","Activity","activity.html"],["documents.html","Documents","documents.html"],["account.html?tab=profile","Account","account"]];
    old.innerHTML=links.map(([href,label,key])=>`<a class="${page===key?"active":""}" href="${href}">${esc(label)}</a>`).join("");
    wrap.classList.add("portal-header-has-notify");
  }

  function makeAdminNav(active){
    const nav=document.createElement("div");
    nav.className="portal-admin-nav portal-admin-nav-v61";
    nav.innerHTML=`<a class="portal-admin-back" href="account.html">← Account</a>
      <a class="${active==="queue"?"active":""}" href="admin.html">Work</a>
      <a class="${active==="customers"?"active":""}" href="admin-customers.html">Customers</a>
      <a class="${active==="parts"?"active":""}" href="admin-store.html">Parts Desk</a>
      <button class="portal-admin-more-btn ${active==="more"?"active":""}" type="button" aria-expanded="false">More</button>
      <div class="portal-admin-more" hidden>
        <a href="admin-records.html">Records search</a>
        <a href="admin-builds.html">Build request history</a>
        <a href="admin-deletions.html">Account deletions</a>
        <a href="index.html">VoltTech Home</a>
      </div>`;
    const btn=nav.querySelector(".portal-admin-more-btn"),menu=nav.querySelector(".portal-admin-more");
    btn.addEventListener("click",()=>{const open=menu.hidden;menu.hidden=!open;btn.setAttribute("aria-expanded",String(open))});
    document.addEventListener("click",e=>{if(!menu.hidden&&!e.target.closest(".portal-admin-nav")){menu.hidden=true;btn.setAttribute("aria-expanded","false")}});
    return nav;
  }

  function adminNav(){
    const active=page==="admin.html"?"queue":page==="admin-customers.html"||page==="admin-customer.html"?"customers":page==="admin-store.html"?"parts":"more";
    if(page==="admin.html"){
      const tools=document.querySelector(".top .tools");
      if(tools){tools.replaceWith(makeAdminNav(active));document.querySelector(".top")?.classList.add("portal-header-has-notify")}
      return;
    }
    const wrap=document.querySelector("nav .wrap,.store-nav .wrap");
    if(!wrap)return;
    const old=wrap.querySelector(".navlinks,.v4-page-nav,.back,.nav-links");
    const nav=makeAdminNav(active);
    if(old)old.replaceWith(nav);else wrap.appendChild(nav);
    wrap.classList.add("portal-header-has-notify");
  }

  function adminHome(){
    if(page!=="admin.html")return;
    const app=document.querySelector("#app"),workflow=document.querySelector("#workflowPanel");
    if(!app||!workflow)return;
    const panels=[...app.querySelectorAll(":scope > .panel")];
    const byTitle=t=>panels.find(p=>p.querySelector(":scope > h2")?.textContent.trim().toLowerCase()===t.toLowerCase());
    const customerLookup=byTitle("Customer lookup"),quotePanel=byTitle("Create quotation"),recent=byTitle("Recent quotes");
    if(customerLookup)customerLookup.dataset.portalHidden="true";
    if(recent)recent.dataset.portalHidden="true";
    if(quotePanel){quotePanel.id="portalManualQuote";quotePanel.classList.add("portal-collapsible");quotePanel.hidden=true}
    if(!workflow.querySelector(".portal-admin-actions")){
      const actions=document.createElement("div");
      actions.className="portal-admin-actions";
      actions.innerHTML='<a href="admin-customers.html">Find customer</a><button class="primary" id="portalCreateQuote" type="button">Create quote</button><a href="admin-records.html">Find record</a>';
      workflow.appendChild(actions);
      actions.querySelector("#portalCreateQuote")?.addEventListener("click",()=>{if(!quotePanel)return;quotePanel.hidden=!quotePanel.hidden;if(!quotePanel.hidden)quotePanel.scrollIntoView({behavior:"smooth",block:"start"})});
    }
    const params=new URLSearchParams(location.search);
    if(location.hash==="#quoteForm"||params.has("customer")||params.get("createQuote")==="1"){
      if(quotePanel){quotePanel.hidden=false;setTimeout(()=>quotePanel.scrollIntoView({behavior:"smooth",block:"start"}),120)}
    }
  }

  function adminPolish(){
    if(!page.startsWith("admin"))return;
    document.body.classList.add("vt-admin-phase4");
    if(page==="admin-builds.html"){
      document.querySelector("main h1")?.replaceChildren("Build request history");
      const lead=document.querySelector("main .lead");
      if(lead)lead.textContent="Existing account-backed build quotation requests submitted before new custom PC build requests were paused.";
    }
    if(page==="admin-records.html")document.querySelector("main h1")?.replaceChildren("Records");
    if(page==="admin-deletions.html")document.querySelector("main h1")?.replaceChildren("Account deletions");
  }

  function tone(v){
    const s=String(v||"").toLowerCase().replace(/[_-]+/g," ");
    if(/overdue|declined|expired|failed|cancelled|rejected|urgent|error/.test(s))return"danger";
    if(/paid|accepted|completed|delivered|fulfilled|quoted|resolved|success/.test(s))return"success";
    if(/unpaid|pending|awaiting|requested|sent|viewed|due|waiting/.test(s))return"warning";
    if(/draft|saved|open|active|processing|repairing|scheduled|booked/.test(s))return"active";
    return"neutral";
  }

  function applyStatuses(){
    document.querySelectorAll(".pill,.v4-status,.vt-work-stage,[data-status-pill]").forEach(el=>{
      el.classList.remove("vt-status-success","vt-status-warning","vt-status-danger","vt-status-active","vt-status-neutral");
      el.classList.add(`vt-status-${tone(el.textContent)}`);
    });
  }

  function init(){
    if(page==="account.html")accountShell(); else if(customerPages.has(page))customerNav();
    if(page.startsWith("admin")){adminNav();adminHome();adminPolish()}
    applyStatuses();
    new MutationObserver(()=>requestAnimationFrame(applyStatuses)).observe(document.body,{childList:true,subtree:true,characterData:true});
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();