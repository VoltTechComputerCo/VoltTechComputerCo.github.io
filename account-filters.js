
(()=>{
  function bind(inputId,listId){
    const input=document.getElementById(inputId),list=document.getElementById(listId);
    if(!input||!list)return;
    const apply=()=>{
      const term=input.value.trim().toLowerCase();
      [...list.querySelectorAll(".history-card")].forEach(card=>{
        card.hidden=!!term&&!card.textContent.toLowerCase().includes(term);
      });
    };
    input.addEventListener("input",apply);
    new MutationObserver(apply).observe(list,{childList:true,subtree:true});
  }
  document.addEventListener("DOMContentLoaded",()=>{
    bind("accountOrderSearch","ordersList");
    bind("accountJobSearch","jobsList");
  });
})();
