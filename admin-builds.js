(()=> {
  const c = supabase.createClient(VOLTTECH_SUPABASE.url, VOLTTECH_SUPABASE.publishableKey);
  const q = s => document.querySelector(s);
  const money = n => new Intl.NumberFormat("en-ZA", {style:"currency", currency:"ZAR", maximumFractionDigits:0}).format(Number(n||0));
  const x = v => String(v??"").replace(/[&<>"']/g, a => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[a]));
  let rows = [];

  async function init() {
    const {data:{session}} = await c.auth.getSession();
    if (!session) {
      location.href = "account.html?returnTo=%2Fadmin-builds.html";
      return;
    }
    const {data:ok, error} = await c.rpc("is_volttech_admin");
    if (error || ok !== true) {
      location.replace("account.html");
      return;
    }
    await load();
  }

  async function load() {
    q("#status").textContent = "Loading…";

    const [{data, error}, customerResult] = await Promise.all([
      c.from("saved_builds")
        .select("id,user_id,name,status,build_data,estimated_total,estimated_power_watts,compatibility_status,quote_id,quote_requested_at,updated_at")
        .eq("status","quote_requested")
        .order("quote_requested_at",{ascending:true}),
      c.rpc("admin_customers")
    ]);

    if (error) {
      q("#status").textContent = error.message;
      q("#requests").innerHTML = '<p class="empty">Could not load PC build requests.</p>';
      return;
    }

    const customers = customerResult.error ? [] : (customerResult.data || []);
    const customerMap = new Map(customers.map(p => [p.id, p]));

    rows = (data || []).map(r => ({
      ...r,
      profiles: customerMap.get(r.user_id) || null
    }));

    q("#status").textContent = `${rows.length} request${rows.length===1?"":"s"} waiting`;
    q("#requests").innerHTML = rows.length
      ? rows.map(card).join("")
      : '<p class="empty">No PC build quote requests are waiting.</p>';

    document.querySelectorAll("[data-convert]").forEach(b => b.onclick = () => convert(b.dataset.convert));
    document.querySelectorAll("[data-open]").forEach(b => b.onclick = () => openBuild(b.dataset.open));
  }

  function card(r) {
    const p = r.profiles || {};
    const items = r.build_data?.items || [];
    return `<article class="card">
      <div class="head">
        <div>
          <span class="mini">${x(p.full_name || p.billing_email || "Customer")}${p.suburb ? " · "+x(p.suburb) : ""}</span>
          <h2>${x(r.name || "PC Build")}</h2>
          <span class="mini">Requested ${new Date(r.quote_requested_at || r.updated_at).toLocaleString("en-ZA")}</span>
        </div>
        <span class="pill">Quote requested</span>
      </div>
      <div class="parts">${items.map(i => `<div class="part"><span>${x(i.name)}</span><b>${money(i.unit_price)}</b></div>`).join("")}</div>
      <div class="meta">
        <span>Estimate <b>${money(r.estimated_total)}</b></span>
        <span>Power <b>${r.estimated_power_watts || "—"} W</b></span>
        <span>Compatibility <b>${x(r.compatibility_status || "review")}</b></span>
      </div>
      <div class="actions">
        <button class="btn" data-convert="${x(r.id)}">Create draft quote</button>
        <button class="btn secondary" data-open="${x(r.id)}">Open in builder</button>
      </div>
    </article>`;
  }

  function openBuild(id) {
    const r = rows.find(v => v.id === id);
    if (!r) return;
    const serialized = r.build_data?.serialized || {};
    let b64 = btoa(JSON.stringify(serialized))
      .replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");
    window.open(`builder/?build=${encodeURIComponent(b64)}`, "_blank", "noopener,noreferrer");
  }

  async function convert(id) {
    const r = rows.find(v => v.id === id);
    if (!r) return;

    q("#status").textContent = "Creating normal VoltTech quote…";

    const items = (r.build_data?.items || []).map(i => ({
      description: i.name,
      quantity: Number(i.quantity || 1),
      unit_price: Number(i.unit_price || 0),
      item_type: "product",
      supplier: i.supplier || "",
      supplier_cost: "",
      stock_status: i.stock_status || "Unconfirmed",
      price_checked_at: i.price_checked_at || new Date().toISOString()
    }));

    let d = new Date();
    d.setDate(d.getDate() + 7);

    const {data, error} = await c.rpc("admin_create_quote", {
      p_user_id: r.user_id,
      p_quote_type: "system_build",
      p_title: `PC Build — ${r.name || "Custom configuration"}`,
      p_valid_until: d.toISOString().slice(0,10),
      p_customer_note: "Prepared from your saved VoltTech PC Builder configuration. Final stock, compatibility and pricing have been reviewed by VoltTech before this quotation was sent.",
      p_internal_note: `PC Builder saved build ${r.id}`,
      p_delivery_fee: 0,
      p_discount_total: 0,
      p_items: items
    });

    if (error) {
      q("#status").textContent = error.message;
      return;
    }

    const quoteId = extractId(data);
    const patch = {
      status: "quoted",
      quoted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (quoteId) patch.quote_id = String(quoteId);

    const {error:updateError} = await c.from("saved_builds").update(patch).eq("id", r.id);
    if (updateError) {
      q("#status").textContent = `Quote created, but build link could not be updated: ${updateError.message}`;
      return;
    }

    q("#status").textContent = "Draft quote created. Open the normal Admin Hub to review/send it to the customer.";
    await load();
  }

  function extractId(data) {
    if (!data) return null;
    if (typeof data === "string" || typeof data === "number") return data;
    if (Array.isArray(data)) return extractId(data[0]);
    return data.id || data.quote_id || null;
  }

  document.addEventListener("DOMContentLoaded", init);
})();