(function(){
'use strict';

const body=document.body;
const gate=document.getElementById('builderGate');
const state=document.getElementById('builderState');

function lockBuilder(){
  body.classList.add('builder-gated');
  body.classList.remove('builder-open');
  gate?.removeAttribute('hidden');
  if(state) state.textContent='Coming Soon';
}

function openBuilder(){
  body.classList.remove('builder-gated');
  body.classList.add('builder-open');
  gate?.setAttribute('hidden','');
  if(state) state.textContent='Builder Preview';
  const script=document.createElement('script');
  script.type='module';
  script.src='./js/app.js?v=3.2.0';
  document.body.appendChild(script);
}

async function init(){
  lockBuilder();
  try{
    if(typeof supabase==='undefined'||typeof VOLTTECH_SUPABASE==='undefined') return;
    const client=supabase.createClient(
      VOLTTECH_SUPABASE.url,
      VOLTTECH_SUPABASE.publishableKey,
      {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}
    );
    const {data,error}=await client
      .from('store_settings')
      .select('builder_enabled')
      .eq('id','store')
      .single();
    if(error||!data?.builder_enabled) return;
    openBuilder();
  }catch(error){
    console.error('VoltTech builder launch gate:',error);
    lockBuilder();
  }
}

init();
})();
