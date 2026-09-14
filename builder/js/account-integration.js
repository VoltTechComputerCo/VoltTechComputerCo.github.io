const VT_ACCOUNT_VERSION = "2.2.0";
const PENDING_KEY = "volttech-builder-account-pending-v2";
const REQUIRED = ["cpu","motherboard","memory","gpu","case","cooler","psu","storage"];
const ORDER = ["cpu","motherboard","memory","gpu","case","cooler","psu","storage","fans"];

let authClient = null;
let currentUser = null;
let currentSavedId = new URLSearchParams(location.search).get("savedBuild") || null;
let currentSavedStatus = null;
let restoring = false;
let catalogueReady = false;
let initDone = false;

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function safeB64Decode(value){
  try{
    const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "===".slice((normalized.length + 3) % 4);
    return JSON.parse(atob(padded));
  }catch(error){
    console.warn("VoltTech build restore payload could not be decoded", error);
    return null;
  }
}

function loadScript(src){
  return new Promise((resolve,reject)=>{
    const existing = [...document.scripts].find(s => s.src === new URL(src, location.href).href);
    if(existing){
      if(existing.dataset.loaded === "1" || (src.includes("supabase-js") && window.supabase) || (src.includes("supabase-config") && window.VOLTTECH_SUPABASE)) return resolve();
      existing.addEventListener("load", resolve, {once:true});
      existing.addEventListener("error", reject, {once:true});
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.addEventListener("load",()=>{script.dataset.loaded="1";resolve();},{once:true});
    script.addEventListener("error",reject,{once:true});
    document.head.append(script);
  });
}

async function ensureAuth(){
  if(authClient) return authClient;
  if(!window.supabase) await loadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2");
  if(!window.VOLTTECH_SUPABASE) await loadScript("../supabase-config.js");
  if(!window.supabase || !window.VOLTTECH_SUPABASE) throw new Error("Account service could not be loaded.");
  authClient = window.supabase.createClient(
    window.VOLTTECH_SUPABASE.url,
    window.VOLTTECH_SUPABASE.publishableKey,
    {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}
  );
  const {data:{session}} = await authClient.auth.getSession();
  currentUser = session?.user || null;
  authClient.auth.onAuthStateChange((_event, sessionNow)=>{
    currentUser = sessionNow?.user || null;
    renderAccountState();
  });
  return authClient;
}

function installUi(){
  if(document.getElementById("vt-account-actions")) return;
  const summary = document.querySelector(".summary");
  if(!summary) return;
  const clear = document.getElementById("clear-build");
  const host = document.createElement("section");
  host.id = "vt-account-actions";
  host.className = "vt-account-actions";
  host.innerHTML = `
    <div class="vt-account-head">
      <span>VoltTech Account</span>
      <b id="vt-account-state">Checking account…</b>
    </div>
    <button type="button" class="vt-account-btn primary" id="vt-save-build">Save to my account</button>
    <button type="button" class="vt-account-btn" id="vt-request-quote">Request VoltTech quote</button>
    <a class="vt-account-link" href="../builds.html">My saved PC builds →</a>
    <p class="vt-account-message" id="vt-account-message" role="status" aria-live="polite"></p>`;
  summary.insertBefore(host, clear || null);

  const style = document.createElement("style");
  style.textContent = `
    .vt-account-actions{margin:12px;padding:13px;border:1px solid rgba(47,230,200,.24);background:linear-gradient(145deg,rgba(47,230,200,.055),#071012 65%);clip-path:polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)}
    .vt-account-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}.vt-account-head span{color:var(--teal);font:700 7px var(--mono);letter-spacing:.1em;text-transform:uppercase}.vt-account-head b{max-width:58%;overflow:hidden;color:#78928e;font:7px var(--mono);text-overflow:ellipsis;white-space:nowrap;text-align:right}
    .vt-account-btn{width:100%;min-height:44px;margin-top:7px;padding:10px;border:1px solid #29413f;background:#081012;color:#91aaa5;font:700 8px var(--mono);letter-spacing:.06em;text-transform:uppercase;clip-path:polygon(7px 0,100% 0,100% calc(100% - 7px),calc(100% - 7px) 100%,0 100%,0 7px)}
    .vt-account-btn.primary{border-color:rgba(47,230,200,.52);background:linear-gradient(100deg,rgba(47,230,200,.13),rgba(47,230,200,.035));color:var(--teal);box-shadow:inset 2px 0 0 rgba(47,230,200,.6)}
    .vt-account-btn:disabled{cursor:wait;opacity:.55}.vt-account-link{display:block;margin-top:10px;color:#7f9994;font:700 7px var(--mono);text-transform:uppercase;text-decoration:none}.vt-account-link:hover,.vt-account-link:focus-visible{color:var(--teal);outline:none}
    .vt-account-message{min-height:0;margin:9px 0 0;color:#78928e;font:7.5px var(--mono);line-height:1.55}.vt-account-message.good{color:#77d9ad}.vt-account-message.bad{color:#ff8585}.vt-account-message.warn{color:#ffbd69}
    @media(max-width:980px){.vt-account-actions{margin:12px 18px 2px}}`;
  document.head.append(style);

  document.getElementById("vt-save-build")?.addEventListener("click",()=>performAccountAction("save"));
  document.getElementById("vt-request-quote")?.addEventListener("click",()=>performAccountAction("quote"));
  document.getElementById("clear-build")?.addEventListener("click",()=>{
    setTimeout(()=>{
      if(readBuildSnapshot().items.length) return;
      currentSavedId=null;
      currentSavedStatus=null;
      const url=new URL(location.href);
      url.searchParams.delete("savedBuild");
      url.searchParams.delete("build");
      history.replaceState(null,"",url);
      renderAccountState();
      setMessage("Started a new unsaved build.");
    },0);
  });
}

function setMessage(text="", tone=""){
  const el = document.getElementById("vt-account-message");
  if(!el) return;
  el.textContent = text;
  el.className = `vt-account-message ${tone}`.trim();
}

function setBusy(busy){
  const save=document.getElementById("vt-save-build");
  const quote=document.getElementById("vt-request-quote");
  if(save) save.disabled=Boolean(busy);
  if(quote) quote.disabled=Boolean(busy)||["quote_requested","quoted"].includes(currentSavedStatus||"");
}

function renderAccountState(){
  const state = document.getElementById("vt-account-state");
  if(!state) return;
  state.textContent = currentUser ? (currentUser.email || "Signed in") : "Sign in required";
  const quote = document.getElementById("vt-request-quote");
  if(quote){
    quote.textContent = currentSavedStatus === "quote_requested" ? "Quote requested ✓" : currentSavedStatus === "quoted" ? "Quote created ✓" : "Request VoltTech quote";
    quote.disabled = ["quote_requested","quoted"].includes(currentSavedStatus || "");
  }
}

function catalogue(){
  return Array.isArray(window.__VT_BUILDER_CATALOGUE) ? window.__VT_BUILDER_CATALOGUE : [];
}

function productByName(type,name){
  const target = String(name || "").trim();
  return catalogue().find(p => p.type === type && String(p.name || "").trim() === target) || null;
}

function bestPrice(product){
  const offers = Array.isArray(product?.offers) ? product.offers : [];
  const offer = offers.find(o=>Number(o.price)>0) || null;
  return {price:Number(offer?.price||0),supplier:offer?.supplierName||offer?.supplier||offer?.source||"",stock:offer?.stockStatus||"Unconfirmed",checked:offer?.checkedAt||offer?.priceCheckedAt||new Date().toISOString()};
}

function readBuildSnapshot(){
  const rows = [...document.querySelectorAll("#build-list > .build-item, #build-list > .build-group")];
  const serialized = {version:2,categories:{}};
  const items = [];

  ORDER.forEach((type,index)=>{
    const row = rows[index];
    if(!row) return;
    const ids=[];
    if(row.matches("details.build-group")){
      row.querySelectorAll(".build-detail-row span").forEach(span=>{
        const raw=span.textContent.trim();
        const match=raw.match(/^(.*?)(?:\s+×(\d+))?$/);
        const name=(match?.[1]||raw).trim();
        const qty=Math.max(1,Number(match?.[2]||1));
        const product=productByName(type,name);
        if(!product) return;
        for(let n=0;n<qty;n++) ids.push(product.id);
        const offer=bestPrice(product);
        items.push({product_id:product.id,type,name:product.name,quantity:qty,unit_price:offer.price,supplier:offer.supplier,stock_status:offer.stock,price_checked_at:offer.checked});
      });
    }else{
      const name=row.querySelector("b")?.textContent?.trim()||"";
      if(name && !/not selected|optional/i.test(name)){
        const product=productByName(type,name);
        if(product){
          ids.push(product.id);
          const offer=bestPrice(product);
          items.push({product_id:product.id,type,name:product.name,quantity:1,unit_price:offer.price,supplier:offer.supplier,stock_status:offer.stock,price_checked_at:offer.checked});
        }
      }
    }
    if(ids.length) serialized.categories[type]=ids;
  });

  const total = Number(items.reduce((sum,item)=>sum+(Number(item.unit_price)||0)*(Number(item.quantity)||1),0).toFixed(2));
  const powerText = document.querySelector("#power .power-grid strong")?.textContent || "";
  const estimatedPower = Number((powerText.match(/\d+/)||[])[0]||0) || null;
  const hardConflict = Boolean(document.querySelector("#report .report-item.bad"));
  const review = Boolean(document.querySelector("#report .report-item.warn, #report .report-item.unknown"));
  const selectedCpu = serialized.categories.cpu?.[0] ? catalogue().find(p=>p.id===serialized.categories.cpu[0]) : null;
  const gpuOptional = !serialized.categories.gpu?.length && selectedCpu?.specs?.integratedGraphics === true;
  serialized.gpuOptional = gpuOptional;
  const complete = REQUIRED.every(type => type==="gpu" && gpuOptional ? true : Array.isArray(serialized.categories[type]) && serialized.categories[type].length);
  const compatibility = hardConflict ? "conflict" : review ? "review" : complete ? "clear" : "in_progress";

  return {serialized,items,estimated_total:total,estimated_power_watts:estimatedPower,compatibility_status:compatibility,complete,hardConflict};
}

function defaultBuildName(){
  const d = new Intl.DateTimeFormat("en-ZA",{day:"2-digit",month:"short",year:"numeric"}).format(new Date());
  return `My PC Build — ${d}`;
}

async function ensureSignedIn(action,snapshot){
  await ensureAuth();
  if(currentUser) return true;
  sessionStorage.setItem(PENDING_KEY, JSON.stringify({action,snapshot,createdAt:Date.now()}));
  const returnTo = `${location.pathname}${location.search || ""}`;
  location.href = `../account.html?returnTo=${encodeURIComponent(returnTo)}`;
  return false;
}

async function getExistingBuild(id){
  if(!id || !authClient || !currentUser) return null;
  const {data,error}=await authClient.from("saved_builds").select("id,name,status,user_id").eq("id",id).maybeSingle();
  if(error){console.warn("Could not load saved-build state",error);return null;}
  return data||null;
}

async function saveSnapshot(snapshot,{silent=false}={}){
  await ensureAuth();
  if(!currentUser) throw new Error("Please sign in before saving this build.");
  if(!snapshot.items.length) throw new Error("Choose at least one component before saving.");

  const existing = await getExistingBuild(currentSavedId);
  const now = new Date().toISOString();
  const payload = {
    user_id:currentUser.id,
    name:existing?.name || defaultBuildName(),
    status:"saved",
    build_data:{serialized:snapshot.serialized,items:snapshot.items,builder_version:"premium-v1.6.1+account-v2.2.0"},
    estimated_total:snapshot.estimated_total,
    estimated_power_watts:snapshot.estimated_power_watts,
    compatibility_status:snapshot.compatibility_status,
    updated_at:now
  };

  let result;
  if(existing && existing.status === "saved"){
    result = await authClient.from("saved_builds").update(payload).eq("id",existing.id).select("id,status,name").single();
  }else{
    result = await authClient.from("saved_builds").insert(payload).select("id,status,name").single();
  }
  if(result.error) throw result.error;
  currentSavedId = result.data.id;
  currentSavedStatus = result.data.status;
  const url = new URL(location.href);
  url.searchParams.set("savedBuild", currentSavedId);
  url.searchParams.delete("build");
  history.replaceState(null,"",url);
  renderAccountState();
  if(!silent) setMessage("Saved to your VoltTech account.","good");
  return result.data;
}

async function requestQuote(snapshot){
  if(!snapshot.complete) throw new Error("Finish the core build before requesting a quotation.");
  if(snapshot.hardConflict) throw new Error("Resolve the compatibility conflict before requesting a quotation.");
  const saved = await saveSnapshot(snapshot,{silent:true});
  const now = new Date().toISOString();
  const {data,error}=await authClient.from("saved_builds")
    .update({status:"quote_requested",quote_requested_at:now,updated_at:now})
    .eq("id",saved.id)
    .eq("status","saved")
    .select("id,status")
    .single();
  if(error) throw error;
  currentSavedStatus=data.status;
  renderAccountState();
  setMessage("Quote request sent to VoltTech. We’ll review stock, compatibility and final pricing before it becomes a normal account quote.","good");
}

async function performAccountAction(action){
  const snapshot=readBuildSnapshot();
  try{
    setBusy(true);
    setMessage(action==="quote"?"Preparing your quote request…":"Saving your build…");
    if(!await ensureSignedIn(action,snapshot)) return;
    if(action==="quote") await requestQuote(snapshot); else await saveSnapshot(snapshot);
  }catch(error){
    console.error("VoltTech account build action failed",error);
    setMessage(error?.message || "That account action could not be completed.","bad");
  }finally{
    setBusy(false);
  }
}

async function waitForBuilderReady(){
  for(let i=0;i<80;i++){
    if(catalogueReady && document.querySelector("#steps [data-category]") && catalogue().length) return true;
    await wait(50);
  }
  return false;
}

async function restoreSerialized(serialized){
  if(restoring || !serialized?.categories) return false;
  restoring=true;
  try{
    if(!await waitForBuilderReady()) throw new Error("The builder catalogue did not finish loading.");
    document.getElementById("choose-advanced")?.click();
    await wait(120);
    const compatible=document.getElementById("compatible-only");
    if(compatible?.checked){compatible.checked=false;compatible.dispatchEvent(new Event("change",{bubbles:true}));await wait(50);}

    for(const type of ORDER){
      const ids=Array.isArray(serialized.categories[type])?serialized.categories[type]:[];
      if(!ids.length) continue;
      const step=[...document.querySelectorAll("#steps [data-category]")].find(el=>el.dataset.category===type);
      step?.click();
      await wait(70);
      for(const id of ids){
        const button=[...document.querySelectorAll("#products [data-select-product]")].find(el=>el.dataset.selectProduct===id);
        if(!button || button.disabled){
          console.warn("Could not restore component",type,id);
          continue;
        }
        button.click();
        await wait(70);
        if(type!=="storage" && type!=="fans") break;
        step?.click();
        await wait(40);
      }
    }
    if(compatible && !compatible.checked){
      compatible.checked=true;
      compatible.dispatchEvent(new Event("change",{bubbles:true}));
    }
    setMessage("Saved build loaded. You can keep customising it.","good");
    return true;
  }finally{
    restoring=false;
  }
}

async function maybeRestore(){
  const params=new URLSearchParams(location.search);
  const encoded=params.get("build");
  let payload=encoded?safeB64Decode(encoded):null;
  const pendingRaw=sessionStorage.getItem(PENDING_KEY);
  let pending=null;
  if(pendingRaw){
    try{pending=JSON.parse(pendingRaw);}catch{}
    sessionStorage.removeItem(PENDING_KEY);
    if(!payload && pending?.snapshot?.serialized) payload=pending.snapshot.serialized;
  }
  if(payload) await restoreSerialized(payload);

  if(currentSavedId && authClient && currentUser){
    const existing=await getExistingBuild(currentSavedId);
    currentSavedStatus=existing?.status||null;
    renderAccountState();
  }

  if(pending?.action && pending?.snapshot){
    try{
      const fresh=readBuildSnapshot();
      if(pending.action==="quote") await requestQuote(fresh); else await saveSnapshot(fresh);
    }catch(error){setMessage(error?.message||"Could not complete the pending account action.","bad");}
  }
}

async function init(){
  if(initDone) return;
  initDone=true;
  installUi();
  try{
    await ensureAuth();
    renderAccountState();
  }catch(error){
    console.warn("VoltTech builder account integration unavailable",error);
    setMessage("Account tools are temporarily unavailable. The builder itself still works.","warn");
  }
  await maybeRestore();
}

window.addEventListener("volttech:catalogue-ready",()=>{catalogueReady=true;});
if(Array.isArray(window.__VT_BUILDER_CATALOGUE)) catalogueReady=true;
if(document.readyState === "loading") document.addEventListener("DOMContentLoaded",init,{once:true}); else queueMicrotask(init);
