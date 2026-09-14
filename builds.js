(()=> {
  const c = supabase.createClient(VOLTTECH_SUPABASE.url, VOLTTECH_SUPABASE.publishableKey, {
    auth:{persistSession:true, autoRefreshToken:true, detectSessionInUrl:true}
  });
  const q = s => document.querySelector(s);
  const money = n => new Intl.NumberFormat("en-ZA",{style:"currency",currency:"ZAR",maximumFractionDigits:0}).format(Number(n||0));
  const esc = v => String(v??"").replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[a]));
  const REQUIRED=["cpu","motherboard","memory","gpu","case","cooler","psu","storage"];
  let rows = [];

  function status(message="", type="") {
    q("#status").textContent = message;
    q("#status").dataset.type = type;
  }

  function statusLabel(v) {
    return ({saved:"Saved",quote_requested:"Quote requested",quoted:"Quote ready",archived:"Archived"}[v] || v || "Saved");
  }

  function date(v) {
    if (!v) return "—";
    try { return new Intl.DateTimeFormat("en-ZA",{dateStyle:"medium",timeStyle:"short"}).format(new Date(v)); }
    catch { return "—"; }
  }

  function shareValue(serialized) {
    return btoa(JSON.stringify(serialized || {})).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");
  }

  function buildIsComplete(r){
    const serialized=r?.build_data?.serialized||{};
    const cats=serialized.categories||{};
    return REQUIRED.every(type=>type==="gpu"&&serialized.gpuOptional===true ? true : Array.isArray(cats[type])&&cats[type].length);
  }

  function card(r) {
    const items = r.build_data?.items || [];
    const names = items.slice(0,6).map(i=>i.name).join(" · ") + (items.length>6 ? ` · +${items.length-6} more` : "");
    const s = r.status || "saved";
    const canDelete = ["saved","archived"].includes(s);
    const canQuote = s==="saved" && buildIsComplete(r) && r.compatibility_status!=="conflict";
    return `<article class="card">
      <div class="head">
        <div><span class="mini">Updated ${esc(date(r.updated_at))}</span><h2>${esc(r.name || "VoltTech PC Build")}</h2></div>
        <span class="pill ${s==="quote_requested"?"requested":s==="quoted"?"quoted":""}">${esc(statusLabel(s))}</span>
      </div>
      <div class="total"><span>${items.length} selected part${items.length===1?"":"s"}${r.estimated_power_watts?` · ${esc(r.estimated_power_watts)} W est.`:""}</span><b>${money(r.estimated_total)}</b></div>
      <p class="parts">${esc(names || "Saved component configuration")}</p>
      <div class="card-actions">
        <button class="btn teal" data-resume="${esc(r.id)}">Resume build</button>
        ${canQuote ? `<button class="btn primary" data-quote="${esc(r.id)}">Request quote</button>` : s==="saved" ? `<button class="btn" disabled title="Complete the core build and resolve hard conflicts before requesting a quote">Finish build first</button>` : ""}
        ${r.quote_id ? `<a class="btn primary" href="quotes.html">Open quote</a>` : s==="quote_requested" ? `<a class="btn" href="quotes.html">Quotes</a>` : ""}
        ${canDelete ? `<button class="btn" data-delete="${esc(r.id)}">Delete</button>` : ""}
      </div>
    </article>`;
  }

  async function load() {
    status("Loading saved builds…");
    const {data,error} = await c.from("saved_builds")
      .select("id,name,status,build_data,estimated_total,estimated_power_watts,compatibility_status,quote_id,quote_requested_at,updated_at")
      .order("updated_at",{ascending:false});

    if (error) {
      status(error.message,"error");
      q("#builds").innerHTML = '<p class="empty">Could not load saved builds.</p>';
      return;
    }

    rows = data || [];
    status(rows.length ? `${rows.length} saved build${rows.length===1?"":"s"}` : "");
    q("#builds").innerHTML = rows.length ? rows.map(card).join("") : '<p class="empty">You have no saved PC builds yet. Start a build and save it to your VoltTech account.</p>';

    document.querySelectorAll("[data-resume]").forEach(b=>b.onclick=()=>resume(b.dataset.resume));
    document.querySelectorAll("[data-quote]").forEach(b=>b.onclick=()=>requestQuote(b.dataset.quote));
    document.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>remove(b.dataset.delete));
  }

  function resume(id) {
    const r = rows.find(v=>v.id===id);
    if (!r) return;
    const encoded=encodeURIComponent(shareValue(r.build_data?.serialized || {}));
    location.href = `builder/?savedBuild=${encodeURIComponent(id)}&build=${encoded}`;
  }

  async function requestQuote(id) {
    const r=rows.find(v=>v.id===id);
    if(!r || !buildIsComplete(r) || r.compatibility_status==="conflict"){
      status("Finish the core build and resolve hard compatibility conflicts before requesting a quote.","error");
      return;
    }
    status("Submitting build for VoltTech review…");
    const now = new Date().toISOString();
    const {error} = await c.from("saved_builds")
      .update({status:"quote_requested",quote_requested_at:now,updated_at:now})
      .eq("id",id)
      .eq("status","saved");
    if (error) {
      status(error.message,"error");
      return;
    }
    status("Quote request sent to VoltTech.","success");
    await load();
  }

  async function remove(id) {
    if (!confirm("Delete this saved PC build?")) return;
    const {error} = await c.from("saved_builds")
      .delete()
      .eq("id",id)
      .in("status",["saved","archived"]);
    if (error) {
      status(error.message,"error");
      return;
    }
    status("Saved build deleted.","success");
    await load();
  }

  async function init() {
    const {data:{session}} = await c.auth.getSession();
    if (!session?.user) {
      location.replace(`account.html?returnTo=${encodeURIComponent("/builds.html")}`);
      return;
    }
    await load();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
