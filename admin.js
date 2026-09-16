(()=>{
const c=supabase.createClient(VOLTTECH_SUPABASE.url,VOLTTECH_SUPABASE.publishableKey),q=s=>document.querySelector(s),money=n=>new Intl.NumberFormat("en-ZA",{style:"currency",currency:"ZAR"}).format(Number(n||0));
let customers=[],quotes=[],invoices=new Map,creatingQuote=false;
const sendingQuotes=new Set(),creatingInvoices=new Set();

function node(tag,{className,text,attrs}={}){
 const el=document.createElement(tag);
 if(className)el.className=className;
 if(text!==undefined&&text!==null)el.textContent=String(text);
 if(attrs)Object.entries(attrs).forEach(([k,v])=>{if(v!==undefined&&v!==null)el.setAttribute(k,String(v))});
 return el;
}
function clear(el){while(el.firstChild)el.removeChild(el.firstChild)}
function setStatus(message){q("#status").textContent=message||""}
function setDefaultValidDate(){let d=new Date();d.setDate(d.getDate()+7);q("#valid").value=d.toISOString().slice(0,10)}

function item(){
 const d=document.createElement("div");d.className="item";
 // Static form markup only; no customer/database values are inserted here.
 d.innerHTML=`<div class="itemgrid"><div><label>Description</label><input class="desc" required></div><div><label>Qty</label><input class="qty" type="number" min=".01" step=".01" value="1"></div><div><label>Selling price</label><input class="price" type="number" min="0" step=".01" value="0"></div><div><label>Type</label><select class="itype"><option value="service">Service</option><option value="labour">Labour</option><option value="part">Part</option><option value="product">Product</option><option value="delivery">Delivery</option><option value="other">Other</option></select></div></div><div class="supplier"><div><label>Supplier</label><input class="supplierName"></div><div><label>Supplier cost</label><input class="cost" type="number" min="0" step=".01"></div><div><label>Stock</label><input class="stock" placeholder="In stock / order"></div></div><div class="row"><button type="button" class="btn danger remove">Remove</button></div>`;
 d.querySelector(".remove").onclick=()=>{d.remove();calc()};
 d.querySelectorAll("input").forEach(x=>x.oninput=calc);
 q("#items").append(d);calc()
}
function calc(){let t=0;document.querySelectorAll(".item").forEach(d=>t+=(+d.querySelector(".qty").value||0)*(+d.querySelector(".price").value||0));t+=(+q("#delivery").value||0)-(+q("#discount").value||0);q("#total").textContent=money(t)}
function customerText(x){return[x.full_name,x.billing_email,x.phone,x.suburb,x.company_name].filter(Boolean).join(" ").toLowerCase()}
function customerLabel(x){return x.full_name||x.billing_email||"Customer"}
function selectCustomer(x){
 if(!x)return;
 q("#customer").value=x.id;q("#customerSearch").value=customerLabel(x);
 q("#selectedCustomer").textContent=[customerLabel(x),x.billing_email,x.suburb].filter(Boolean).join(" · ");
 q("#customerResults").hidden=true
}
function customerMeta(x){return[x.billing_email,x.phone,x.suburb,x.company_name].filter(Boolean).join(" · ")}

function renderCustomerPicker(){
 const term=q("#customerSearch").value.trim().toLowerCase(),box=q("#customerResults");
 const list=customers.filter(x=>!term||customerText(x).includes(term)).slice(0,10);
 clear(box);
 if(!list.length){box.append(node("div",{className:"vt-empty-search",text:"No customer matches that search."}))}
 else list.forEach(x=>{
   const b=node("button",{className:"vt-picker-option",attrs:{type:"button"}});
   b.dataset.customer=x.id;
   b.append(node("b",{text:customerLabel(x)}),node("span",{text:customerMeta(x)}));
   b.onclick=()=>selectCustomer(x);
   box.append(b)
 });
 box.hidden=false
}
function renderCustomerLookup(){
 const term=q("#customerLookupSearch").value.trim().toLowerCase(),box=q("#customerLookupResults");
 const list=customers.filter(x=>!term||customerText(x).includes(term)).slice(0,20);
 clear(box);
 if(!list.length){box.append(node("div",{className:"vt-empty-search",text:"No customers match that search."}));return}
 list.forEach(x=>{
   const card=node("article",{className:"vt-customer-card"});
   const b=node("button",{className:"btn use-customer",text:"Use in quote",attrs:{type:"button"}});
   b.dataset.customer=x.id;
   b.onclick=()=>{selectCustomer(x);q("#quoteForm").scrollIntoView({behavior:"smooth",block:"start"})};
   card.append(node("b",{text:customerLabel(x)}),node("small",{text:[x.billing_email,x.phone,x.company_name,x.suburb].filter(Boolean).join(" · ")}),b);
   box.append(card)
 })
}
async function invoiceMap(){const{data,error}=await c.from("invoices").select("id,quote_id,invoice_number");if(error)return new Map;return new Map((data||[]).map(i=>[i.quote_id,i]))}
async function email(kind,id){try{return await c.functions.invoke("send-document-email",{body:{kind,source_id:id}})}catch(e){return{error:e}}}

function actionButton(text,className,id,num,handler,disabled){
 const b=node("button",{className:`btn ${className}`,text,attrs:{type:"button"}});b.dataset.id=id;b.dataset.num=num||"";b.disabled=!!disabled;b.onclick=()=>handler(id,num,b);return b
}
function renderRecent(){
 const term=(q("#adminQuoteSearch").value||"").trim().toLowerCase(),filter=q("#adminQuoteStatus").value||"",box=q("#recent");
 const data=quotes.filter(x=>(!filter||x.status===filter)&&(!term||[x.quote_number,x.title,x.customer_name,x.status].filter(Boolean).join(" ").toLowerCase().includes(term)));
 clear(box);
 if(!data.length){box.append(node("p",{className:"muted",text:"No quotes match that search."}));return}
 data.forEach(x=>{
   const inv=invoices.get(x.id),row=node("div",{className:"quote"}),left=node("div"),right=node("div");
   left.append(node("b",{text:x.quote_number||"Quote"}),document.createElement("br"),document.createTextNode(x.title||"Untitled quote"),document.createElement("br"),node("small",{text:`${x.customer_name||"Customer"} · ${x.status||"unknown"}`}));
   right.append(node("b",{text:money(x.total)}));
   if(x.status==="draft"){
     right.append(document.createElement("br"),actionButton(sendingQuotes.has(x.id)?"Sending…":"Send quote","send",x.id,x.quote_number,send,sendingQuotes.has(x.id)))
   }
   if(x.status==="accepted"){
     right.append(document.createElement("br"));
     if(inv){
       const a=node("a",{className:"btn",text:"Open invoice",attrs:{href:`invoice.html?id=${encodeURIComponent(inv.id)}`}});right.append(a)
     }else right.append(actionButton(creatingInvoices.has(x.id)?"Creating…":"Create invoice","invoice",x.id,x.quote_number,invoice,creatingInvoices.has(x.id)))
   }
   row.append(left,right);box.append(row)
 })
}
async function recent(){
 const[{data,error},im]=await Promise.all([c.rpc("admin_quotes"),invoiceMap()]);invoices=im;
 if(error){clear(q("#recent"));q("#recent").append(node("p",{text:error.message}));return}
 quotes=data||[];renderRecent()
}
async function send(id,num,button){
 if(sendingQuotes.has(id))return;
 const ok=await VoltTechDialog.confirm({kicker:"ADMIN / QUOTE",title:`Send ${num||"this quote"}?`,message:"The quote will become visible in the customer's account and the email hook will be attempted if transactional email is configured.",confirmText:"Send quote"});
 if(!ok)return;
 sendingQuotes.add(id);if(button){button.disabled=true;button.textContent="Sending…"}renderRecent();setStatus("Sending quote…");
 try{
   const{error}=await c.rpc("admin_send_quote",{p_quote_id:id});if(error){setStatus(error.message);return}
   try{await c.rpc("snapshot_quote",{p_quote_id:id})}catch{}
   const mail=await email("quote",id);
   setStatus(mail?.error?"Quote sent to customer account. Transactional email is not configured yet.":"Quote sent to customer account and emailed.");
   await recent()
 }finally{sendingQuotes.delete(id);renderRecent()}
}
async function invoice(id,num,button){
 if(creatingInvoices.has(id))return;
 const ok=await VoltTechDialog.confirm({kicker:"ADMIN / INVOICE",title:`Create invoice from ${num||"accepted quote"}?`,message:"This creates the customer's invoice from the accepted quotation. Check the quote is correct before continuing.",confirmText:"Create invoice"});
 if(!ok)return;
 creatingInvoices.add(id);if(button){button.disabled=true;button.textContent="Creating…"}renderRecent();setStatus("Creating invoice…");
 try{
   const{data,error}=await c.rpc("admin_create_invoice",{p_quote_id:id});if(error){setStatus(error.message);return}
   try{await c.rpc("snapshot_invoice",{p_invoice_id:data})}catch{}
   const mail=await email("invoice",data);
   setStatus(mail?.error?"Invoice created. Transactional email is not configured yet.":"Invoice created and emailed.");
   await recent()
 }finally{creatingInvoices.delete(id);renderRecent()}
}
function resetQuoteForm(){
 const form=q("#quoteForm");form.reset();q("#customer").value="";q("#customerSearch").value="";q("#selectedCustomer").textContent="No customer selected";q("#customerResults").hidden=true;
 q("#items").replaceChildren();q("#delivery").value="0";q("#discount").value="0";setDefaultValidDate();item();calc();q("#customerSearch").focus()
}
async function init(){
 const{data:{session}}=await c.auth.getSession();if(!session){location.href="account.html?returnTo=%2Fadmin.html";return}
 const{data:ok,error:adminError}=await c.rpc("is_volttech_admin");if(adminError||ok!==true){location.replace("account.html");return}
 q("#app").hidden=false;const{data,error}=await c.rpc("admin_customers");if(error){setStatus(error.message);return}
 customers=data||[];renderCustomerLookup();setDefaultValidDate();item();recent()
}
q("#add").onclick=item;q("#delivery").oninput=calc;q("#discount").oninput=calc;
q("#customerSearch")?.addEventListener("input",renderCustomerPicker);q("#customerSearch")?.addEventListener("focus",renderCustomerPicker);
q("#customerLookupSearch")?.addEventListener("input",renderCustomerLookup);
q("#adminQuoteSearch")?.addEventListener("input",renderRecent);q("#adminQuoteStatus")?.addEventListener("change",renderRecent);
document.addEventListener("click",e=>{if(!e.target.closest(".vt-picker"))q("#customerResults").hidden=true});
q("#quoteForm").onsubmit=async e=>{
 e.preventDefault();if(creatingQuote)return;
 if(!q("#customer").value){setStatus("Choose a customer before creating the quote.");q("#customerSearch").focus();return}
 const submit=q('#quoteForm button[type="submit"]');
 const items=[...document.querySelectorAll(".item")].map(d=>({description:d.querySelector(".desc").value.trim(),quantity:+d.querySelector(".qty").value||1,unit_price:+d.querySelector(".price").value||0,item_type:d.querySelector(".itype").value,supplier:d.querySelector(".supplierName").value.trim(),supplier_cost:d.querySelector(".cost").value||"",stock_status:d.querySelector(".stock").value.trim(),price_checked_at:new Date().toISOString()}));
 creatingQuote=true;q("#quoteForm").setAttribute("aria-busy","true");if(submit){submit.disabled=true;submit.textContent="Creating…"}setStatus("Creating quote…");
 try{
   const{error}=await c.rpc("admin_create_quote",{p_user_id:q("#customer").value,p_quote_type:q("#type").value,p_title:q("#title").value.trim(),p_valid_until:q("#valid").value,p_customer_note:q("#customerNote").value.trim(),p_internal_note:q("#internalNote").value.trim(),p_delivery_fee:+q("#delivery").value||0,p_discount_total:+q("#discount").value||0,p_items:items});
   if(error){setStatus(error.message);return}
   setStatus("Draft quote created.");resetQuoteForm();await recent()
 }finally{
   creatingQuote=false;q("#quoteForm").removeAttribute("aria-busy");if(submit){submit.disabled=false;submit.textContent="Create draft quote"}
 }
};
init()
})();
