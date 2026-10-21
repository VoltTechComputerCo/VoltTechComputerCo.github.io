// Anonymous catalogue export: never use a service key or copy private supplier/account data.
import fs from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
const config=await fs.readFile('supabase-config.js','utf8');
const url=config.match(/url:"([^"]+)"/)[1],key=config.match(/publishableKey:"([^"]+)"/)[1];
const core=await fs.readFile('commerce/js/store-core.js','utf8');
const fields=core.match(/const LISTING_FIELDS='([^']+)'/)[1];
async function read(table,params,count=false){
 const endpoint=new URL(`${url}/rest/v1/${table}`);
 for(const [key,value] of Object.entries(params))endpoint.searchParams.set(key,String(value));
 for(let attempt=0;attempt<3;attempt++){
  try{
   const response=await fetch(endpoint,{headers:{apikey:key,...(count?{Prefer:'count=exact'}:{})},signal:AbortSignal.timeout(30000)});
   if(!response.ok)throw new Error(`Catalogue export: ${table} ${response.status}`);
   return {data:await response.json(),count:Number(response.headers.get('content-range')?.split('/')[1])};
  }catch(error){if(attempt===2)throw error;}
 }
}
const params={select:fields,status:'eq.active',visibility:'eq.public',sale_mode:'neq.hidden',is_demo:'eq.false',order:'sort_priority.desc,featured.desc,name,id',limit:1000};
const [settings,categories,first]=await Promise.all([
 read('store_settings',{id:'eq.store',select:'catalogue_enabled,builder_enabled,direct_payment_enabled'}),
 read('store_categories',{select:'*',is_active:'eq.true',order:'sort_order'}),
 read('store_products',{...params,offset:0},true)
]);
if(settings.data.length!==1||!Number.isInteger(first.count))throw Error('Incomplete public catalogue export');
const rows=[...first.data];
const pages=await Promise.all(Array.from({length:Math.max(0,Math.ceil(first.count/1000)-1)},(_,i)=>read('store_products',{...params,offset:(i+1)*1000})));
for(const page of pages)rows.push(...page.data);
if(rows.length!==first.count||new Set(rows.map(p=>p.id)).size!==rows.length)throw Error('Catalogue export count mismatch');
const publicRows=rows.filter(p=>p.status==='active'&&p.visibility==='public'&&p.is_demo===false&&p.sale_mode!=='hidden');
if(publicRows.length!==rows.length)throw Error('Export includes a non-public product');
const payload={schemaVersion:1,generatedAt:new Date().toISOString(),settings:settings.data[0],categories:categories.data,products:settings.data[0].catalogue_enabled?publicRows:[]};
await fs.mkdir('assets/data',{recursive:true});
await fs.writeFile('assets/data/catalogue.json.gz',gzipSync(JSON.stringify(payload),{level:9}));
console.log(`Exported ${payload.products.length} public products; ${Buffer.byteLength(JSON.stringify(payload))} bytes`);
