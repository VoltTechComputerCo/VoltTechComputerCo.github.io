
(()=>{
const c=supabase.createClient(VOLTTECH_SUPABASE.url,VOLTTECH_SUPABASE.publishableKey),q=s=>document.querySelector(s),money=n=>new Intl.NumberFormat("en-ZA",{style:"currency",currency:"ZAR"}).format(Number(n||0));
let customers=[],quotes=[],invoices=new Map;
const esc=v=>String(v??"").replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[a]));
function item(){const d=document.createElement("div");d.className="item";d.innerHTML=`<div class="itemgrid"><div><label>Description</label><input class="desc" required></div><div><label>Qty</label><input class="qty" type="number" min=".01" step=".01" value="1"></div><div><label>Selling price</label><input class="price" type="number" min="0" step=".01" value="0"></div><div><label>Type</label><select class="itype"><option value="service">Service</option><option value="labour">Labour</option><option value="part">Part</option><option value="product">Product</option><option value="delivery">Delivery</option><option value="other">Other</option></select></div></div><div class="supplier"><div><label>Supplier</label><input class="supplierName"></div><div><label>Supplier cost</label><input class="cost" type="number" min="0" step=".01"></div><div><label>Stock</label><input class="stock" placeholder="In stock / order"></div></div><div class="row"><button type="button" class="btn danger remove">Remove</button></div>`;d.querySelector(".remove").onclick=()=>{d.remove();calc()};d.querySelectorAll("input").forEach(x=>x.oninput=calc);q("#items").append(d);calc()}
function calc(){let t=0;document.querySelectorAll(".item").forEach(d=>t+=(+d.querySelector(".qty").value||0)*(+d.querySelector(".price").value||0));t+=(+q("#delivery").value||0)-(+q("#discount").value||0);q("#total").textContent=money(t)}
function customerText(x){return[x.full_name,x.billing_email,x.phone,x.suburb,x.company_name].filter(Boolean).join(" ").toLowerCase()}
function customerLabel(x){return x.full_name||x.billing_email||"Customer"}
function selectCustomer(x){
 q("#customer").value=x.id;q("#customerSearch").value=customerLabel(x);
 q("#selectedCustomer").textContent=[customerLabel(x),x.billing_email,x.suburb].filter(Boolean).join(" · ");
 q("#customerResults").hidden=true
}
function renderCustomerPicker(){
 const term=q("#customerSearch").value.trim().toLowerCase(),box=q("#customerResults");
 const list=customers.filter(x=>!term||customerText(x).includes(term)).slice(0,10);
 box.innerHTML=list.length?list.map(x=>`<button class="vt-picker-option" type="button" data-customer="${x.id}"><b>${esc(customerLabel(x))}</b><span>${esc([x.billing_email,x.phone,x.suburb,x.company_name].filter(Boolean).join(" · "))}</span></button>`).join(""):'<div class="vt-empty-search">No customer matches that search.</div>';
 box.hidden=false;box.querySelectorAll("[data-customer]").forEach(b=>b.onclick=()=>selectCustomer(customers.find(x=>x.id===b.dataset.customer)))
}
function renderCustomerLookup(){
 const term=q("#customerLookupSearch").value.trim().toLowerCase();
 const list=customers.filter(x=>!term||customerText(x).includes(term)).slice(0,20);
 q("#customerLookupResults").innerHTML=list.length?list.map(x=>`<article class="vt-customer-card"><b>${esc(customerLabel(x))}</b><small>${esc([x.billing_email,x.phone,x.company_name,x.suburb].filter(Boolean).join(" · "))}</small><button class="btn use-customer" type="button" data-customer="${x.id}">Use in quote</button></article>`).join(""):'<div class="vt-empty-search">No customers match that search.</div>';
 q("#customerLookupResults").querySelectorAll("[data-customer]").forEach(b=>b.onclick=()=>{const x=customers.find(v=>v.id===b.dataset.customer);if(x){selectCustomer(x);q("#quoteForm").scrollIntoView({behavior:"smooth",block:"start"})}})
}
async function invoiceMap(){const{data,error}=await c.from("invoices").select("id,quote_id,invoice_number");if(error)return new Map;return new Map((data||[]).map(i=>[i.quote_id,i]))}
async function email(kind,id){try{return await c.functions.invoke("send-document-email",{body:{kind,source_id:id}})}catch(e){return{error:e}}}
function renderRecent(){
 const term=(q("#adminQuoteSearch").value||"").trim().toLowerCase(),filter=q("#adminQuoteStatus").value||"";
 const data=quotes.filter(x=>(!filter||x.status===filter)&&(!term||[x.quote_number,x.title,x.customer_name,x.status].filter(Boolean).join(" ").toLowerCase().includes(term)));
 q("#recent").innerHTML=data.length?data.map(x=>{const inv=invoices.get(x.id);return`<div class="quote"><div><b>${esc(x.quote_number)}</b><br>${esc(x.title)}<br><small>${esc(x.customer_name||"Customer")} · ${esc(x.status)}</small></div><div><b>${money(x.total)}</b>${x.status==="draft"?`<br><button class="btn send" data-id="${x.id}" data-num="${esc(x.quote_number)}">Send quote</button>`:""}${x.status==="accepted"?(inv?`<br><a class="btn" href="invoice.html?id=${encodeURIComponent(inv.id)}">Open invoice</a>`:`<br><button class="btn invoice" data-id="${x.id}" data-num="${esc(x.quote_number)}">Create invoice</button>`):""}</div></div>`}).join(""):'<p class="muted">No quotes match that search.</p>';
 document.querySelectorAll(".send").forEach(b=>b.onclick=()=>send(b.dataset.id,b.dataset.num));
 document.querySelectorAll(".invoice").forEach(b=>b.onclick=()=>invoice(b.dataset.id,b.dataset.num))
}
async function recent(){const[{data,error},im]=await Promise.all([c.rpc("admin_quotes"),invoiceMap()]);invoices=im;if(error){q("#recent").innerHTML=`<p>${esc(error.message)}</p>`;return}quotes=data||[];renderRecent()}
async function send(id,num){
 const ok=await VoltTechDialog.confirm({kicker:"ADMIN / QUOTE",title:`Send ${num||"this quote"}?`,message:"The quote will become visible in the customer's account and the email hook will be attempted if transactional email is configured.",confirmText:"Send quote"});
 if(!ok)return;q("#status").textContent="Sending quote…";
 const{error}=await c.rpc("admin_send_quote",{p_quote_id:id});if(error){q("#status").textContent=error.message;return}
 try{await c.rpc("snapshot_quote",{p_quote_id:id})}catch{}const mail=await email("quote",id);
 q("#status").textContent=mail?.error?"Quote sent to customer account. Transactional email is not configured yet.":"Quote sent to customer account and emailed.";recent()
}
async function invoice(id,num){
 const ok=await VoltTechDialog.confirm({kicker:"ADMIN / INVOICE",title:`Create invoice from ${num||"accepted quote"}?`,message:"This creates the customer's invoice from the accepted quotation. Check the quote is correct before continuing.",confirmText:"Create invoice"});
 if(!ok)return;q("#status").textContent="Creating invoice…";
 const{data,error}=await c.rpc("admin_create_invoice",{p_quote_id:id});if(error){q("#status").textContent=error.message;return}
 try{await c.rpc("snapshot_invoice",{p_invoice_id:data})}catch{}const mail=await email("invoice",data);
 q("#status").textContent=mail?.error?"Invoice created. Transactional email is not configured yet.":"Invoice created and emailed.";recent()
}
async function init(){
 const{data:{session}}=await c.auth.getSession();if(!session){location.href="account.html?returnTo=%2Fadmin.html";return}
 const{data:ok,error:adminError}=await c.rpc("is_volttech_admin");if(adminError||ok!==true){location.replace("account.html");return}
 q("#app").hidden=false;const{data,error}=await c.rpc("admin_customers");if(error){q("#status").textContent=error.message;return}
 customers=data||[];renderCustomerLookup();
 let d=new Date();d.setDate(d.getDate()+7);q("#valid").value=d.toISOString().slice(0,10);item();recent()
}
q("#add").onclick=item;q("#delivery").oninput=calc;q("#discount").oninput=calc;
q("#customerSearch")?.addEventListener("input",renderCustomerPicker);q("#customerSearch")?.addEventListener("focus",renderCustomerPicker);
q("#customerLookupSearch")?.addEventListener("input",renderCustomerLookup);
q("#adminQuoteSearch")?.addEventListener("input",renderRecent);q("#adminQuoteStatus")?.addEventListener("change",renderRecent);
document.addEventListener("click",e=>{if(!e.target.closest(".vt-picker"))q("#customerResults").hidden=true});
q("#quoteForm").onsubmit=async e=>{
 e.preventDefault();if(!q("#customer").value){q("#status").textContent="Choose a customer before creating the quote.";q("#customerSearch").focus();return}
 const items=[...document.querySelectorAll(".item")].map(d=>({description:d.querySelector(".desc").value.trim(),quantity:+d.querySelector(".qty").value||1,unit_price:+d.querySelector(".price").value||0,item_type:d.querySelector(".itype").value,supplier:d.querySelector(".supplierName").value.trim(),supplier_cost:d.querySelector(".cost").value||"",stock_status:d.querySelector(".stock").value.trim(),price_checked_at:new Date().toISOString()}));
 q("#status").textContent="Creating quote…";
 const{error}=await c.rpc("admin_create_quote",{p_user_id:q("#customer").value,p_quote_type:q("#type").value,p_title:q("#title").value.trim(),p_valid_until:q("#valid").value,p_customer_note:q("#customerNote").value.trim(),p_internal_note:q("#internalNote").value.trim(),p_delivery_fee:+q("#delivery").value||0,p_discount_total:+q("#discount").value||0,p_items:items});
 if(error){q("#status").textContent=error.message;return}q("#status").textContent="Draft quote created.";q("#title").value="";q("#customerNote").value="";q("#internalNote").value="";q("#items").innerHTML="";item();recent()
};
init()
})();
