
import {PRESETS,ready,render,caption} from './ad-renderer.js';
const $=s=>document.querySelector(s);let products=[],revision=0;
const config=window.VOLTTECH_SUPABASE,client=window.supabase.createClient(config.url,config.publishableKey);
function selected(){const p=products.find(p=>p.id===$('#product').value),base=PRESETS[Number($('#preset').value)];return{p,preset:{...base,title:$('#headline').value||base.title}};}
async function preview(){const rev=++revision;$('#download').disabled=$('#copy').disabled=true;try{const {p,preset}=selected();const temp=document.createElement('canvas');await render(temp,p,preset,{story:$('#format').value==='story'});if(rev!==revision)return;const cv=$('#preview');cv.width=temp.width;cv.height=temp.height;cv.getContext('2d').drawImage(temp,0,0);$('#caption').value=caption(p,preset);$('#status').textContent='Ready to download. Price and availability taken from the current catalogue.';$('#download').disabled=$('#copy').disabled=false;}catch(e){if(rev===revision)$('#status').textContent=e.message;}}
try{
 const {data:{user}}=await client.auth.getUser();if(!user)throw Error('Sign in to your admin account, then reopen Marketing.');
 const {data:admin,error}=await client.rpc('is_volttech_admin');if(error||admin!==true)throw Error('Admin access required.');
 for(let from=0;;from+=1000){const {data,error}=await client.from('store_products').select('id,name,retail_price,stock_qty,status,visibility,sale_mode,is_demo,media').eq('status','active').eq('visibility','public').neq('sale_mode','hidden').gt('stock_qty',0).order('id').range(from,from+999);if(error)throw error;products.push(...data.filter(ready));if(data.length<1000)break;}
 const option=(value,text)=>{const o=document.createElement('option');o.value=value;o.textContent=text;return o;};
 PRESETS.forEach((p,i)=>$('#preset').append(option(i,p.key.replaceAll('-',' '))));products.sort((a,b)=>a.name.localeCompare(b.name));
 function list(){const selectedId=$('#product').value,q=$('#search').value.trim().toLowerCase();$('#product').replaceChildren();products.filter(p=>p.name.toLowerCase().includes(q)).forEach(p=>$('#product').append(option(p.id,p.name)));if(products.some(p=>p.id===selectedId&&p.name.toLowerCase().includes(q)))$('#product').value=selectedId;}
 list();$('#search').oninput=()=>{list();$('#headline').value='UPGRADE YOUR SETUP.';preview();};
 function choose(){$('#search').value='';list();const preset=PRESETS[Number($('#preset').value)],p=products.find(p=>p.id===preset.id);$('#product').value=p?.id||products[0]?.id;$('#headline').value=preset.title;preview();}
 $('#preset').onchange=choose;$('#product').onchange=()=>{$('#headline').value='UPGRADE YOUR SETUP.';preview();};$('#headline').onchange=preview;$('#format').onchange=preview;
 $('#download').onclick=()=>$('#preview').toBlob(b=>{if(!b)return;const url=URL.createObjectURL(b),a=document.createElement('a');a.href=url;a.download='volttech-'+selected().preset.key+'-'+$('#format').value+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);});
 $('#copy').onclick=async()=>{try{await navigator.clipboard.writeText($('#caption').value);$('#status').textContent='Caption copied.';}catch{$('#caption').select();$('#status').textContent='Select and copy the caption below.'}};
 $('#studio').hidden=false;choose();
}catch(e){$('#status').textContent=e.message;}
