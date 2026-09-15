
(()=>{
  let activeResolve=null,lastFocus=null;
  const q=s=>document.querySelector(s);

  function ensure(){
    let shell=q("#vtDialogShell");
    if(shell)return shell;
    shell=document.createElement("div");
    shell.id="vtDialogShell";
    shell.className="vt-dialog-backdrop";
    shell.hidden=true;
    shell.innerHTML=`<section class="vt-dialog" role="dialog" aria-modal="true" aria-labelledby="vtDialogTitle">
      <span class="vt-dialog-kicker" id="vtDialogKicker">VOLTTECH</span>
      <h2 id="vtDialogTitle">Confirm action</h2>
      <p id="vtDialogMessage"></p>
      <pre id="vtDialogDetails" hidden></pre>
      <div class="vt-dialog-actions">
        <button class="vt-dialog-btn" id="vtDialogCancel" type="button">Cancel</button>
        <button class="vt-dialog-btn primary" id="vtDialogConfirm" type="button">Confirm</button>
      </div>
    </section>`;
    document.body.append(shell);
    shell.addEventListener("click",e=>{if(e.target===shell)finish(false)});
    q("#vtDialogCancel").addEventListener("click",()=>finish(false));
    q("#vtDialogConfirm").addEventListener("click",()=>finish(true));
    return shell;
  }

  function finish(value){
    const shell=q("#vtDialogShell");
    if(!shell||shell.hidden)return;
    shell.hidden=true;
    document.body.style.overflow="";
    const resolve=activeResolve;activeResolve=null;
    if(lastFocus?.focus)lastFocus.focus();
    if(resolve)resolve(value);
  }

  function open(options={}){
    if(activeResolve)finish(false);
    const shell=ensure(),dialog=shell.querySelector(".vt-dialog");
    const danger=options.tone==="danger";
    dialog.classList.toggle("danger",danger);
    q("#vtDialogKicker").textContent=options.kicker||"VOLTTECH";
    q("#vtDialogTitle").textContent=options.title||"Confirm action";
    q("#vtDialogMessage").textContent=options.message||"";
    const details=q("#vtDialogDetails");
    details.hidden=!options.details;
    details.textContent=options.details||"";
    const cancel=q("#vtDialogCancel"),confirm=q("#vtDialogConfirm");
    cancel.textContent=options.cancelText||"Cancel";
    confirm.textContent=options.confirmText||"Confirm";
    cancel.hidden=!!options.hideCancel;
    confirm.className=`vt-dialog-btn ${danger?"danger":"primary"}`;
    shell.hidden=false;
    document.body.style.overflow="hidden";
    lastFocus=document.activeElement;
    setTimeout(()=>confirm.focus(),0);
    return new Promise(resolve=>{activeResolve=resolve});
  }

  window.VoltTechDialog={
    confirm:opts=>open(opts),
    message:opts=>open({...opts,hideCancel:true,confirmText:opts?.confirmText||"Close"})
  };

  document.addEventListener("keydown",e=>{
    if(e.key==="Escape"&&activeResolve)finish(false);
  });

  /* Existing account.js uses a browser confirm for deleting addresses.
     Capture the click before that handler so the customer only ever sees
     the VoltTech dialog, while keeping the existing account script untouched. */
  document.addEventListener("click",async e=>{
    const button=e.target.closest?.("[data-delete-address]");
    if(!button||!document.querySelector("#accountHub"))return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    const ok=await window.VoltTechDialog.confirm({
      kicker:"ACCOUNT / ADDRESS",
      title:"Delete this delivery location?",
      message:"This removes the saved address from your VoltTech account. It does not affect invoices or completed order records.",
      confirmText:"Delete location",
      tone:"danger"
    });
    if(!ok)return;

    const status=document.querySelector("#hubStatus");
    if(status){status.textContent="Deleting delivery location…";status.dataset.type=""}
    try{
      const client=window.volttechAuth||window.supabase.createClient(
        VOLTTECH_SUPABASE.url,VOLTTECH_SUPABASE.publishableKey,
        {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}
      );
      const {error}=await client.from("customer_addresses").delete().eq("id",button.dataset.deleteAddress);
      if(error)throw error;
      button.closest(".address-card")?.remove();
      if(status){status.textContent="Delivery location deleted.";status.dataset.type="success"}
    }catch(err){
      if(status){status.textContent=`Could not delete location: ${err.message||err}`;status.dataset.type="error"}
    }
  },true);
})();
