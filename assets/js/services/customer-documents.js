import { getAccountClient, loadAccountNotifications } from './account-session.js';
import { collectPersonalData } from './privacy-data.js';

export const money=value=>new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR'}).format(Number(value||0));
export const money0=value=>new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR',maximumFractionDigits:0}).format(Number(value||0));
export const date=value=>value?new Intl.DateTimeFormat('en-ZA',{dateStyle:'long'}).format(new Date(String(value).includes('T')?value:`${value}T12:00:00`)):'—';
export const cap=value=>String(value||'').replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
export const safeFile=value=>String(value||'document').replace(/[^A-Za-z0-9_-]+/g,'_').replace(/^_+|_+$/g,'')||'document';
export const buildRef=id=>`VT-BLD-${String(id||'').replace(/-/g,'').slice(0,8).toUpperCase()}`;
export const orderRef=row=>row?.order_number||`VT-ORD-${String(row?.id||'').replace(/-/g,'').slice(0,8).toUpperCase()}`;
export const proformaRef=row=>row?.proforma_number||`VT-PRO-${String(row?.id||'').replace(/-/g,'').slice(0,8).toUpperCase()}`;
export const serviceRef=row=>row?.job_number||`VT-JOB-${String(row?.id||'').replace(/-/g,'').slice(0,8).toUpperCase()}`;

export function quoteExpired(row,now=Date.now()){
  if(!row?.valid_until||!['sent','viewed'].includes(row.status))return false;
  const end=new Date(`${row.valid_until}T23:59:59`).getTime();
  return Number.isFinite(end)&&end<now;
}

export async function requireDocumentCustomer(){
  const client=await getAccountClient();
  const {data:{session}}=await client.auth.getSession();
  if(!session?.user){
    const returnTo=`${location.pathname}${location.search}${location.hash}`;
    location.replace(`account.html?returnTo=${encodeURIComponent(returnTo)}`);
    return null;
  }
  await loadAccountNotifications(client);
  return {client,user:session.user};
}

export async function loadDocument(client,user,kind,id){
  if(kind==='quote'){
    const result=await client.from('quotes').select('id,user_id,quote_number,quote_type,title,status,subtotal,total,delivery_fee,discount_total,valid_until,customer_note,created_at,terms_version,source_type,source_id,quote_items(position,description,quantity,line_total)').eq('id',id).maybeSingle();
    if(result.error||!result.data)return result;
    const profile=await client.from('profiles').select('full_name,company_name,billing_email,phone,suburb').eq('id',result.data.user_id).maybeSingle();
    return {data:{record:result.data,profile:profile.error?null:profile.data},error:null};
  }
  if(kind==='invoice'){
    const result=await client.from('invoices').select('id,invoice_number,status,currency,subtotal,delivery_fee,discount_total,tax_total,total,vat_registered,customer_name,customer_email,customer_company,customer_suburb,issued_at,due_at,paid_at,quote_id,source_type,source_id,invoice_items(position,item_type,description,quantity,unit_price,line_total)').eq('id',id).maybeSingle();
    if(result.error||!result.data)return result;
    let quoteNumber='';if(result.data.quote_id){const qr=await client.from('quotes').select('quote_number').eq('id',result.data.quote_id).maybeSingle();if(!qr.error&&qr.data)quoteNumber=qr.data.quote_number||''}
    return {data:{record:result.data,quoteNumber},error:null};
  }
  if(kind==='proforma')return client.from('proformas').select('*').eq('id',id).maybeSingle();
  if(kind==='receipt')return client.from('invoices').select('id,invoice_number,status,total,paid_at,issued_at,customer_name,customer_email').eq('id',id).maybeSingle();
  if(kind==='order')return client.from('orders').select('*,order_items(*)').eq('id',id).maybeSingle();
  if(kind==='build'){
    const result=await client.from('saved_builds').select('*').eq('id',id).maybeSingle();
    if(result.error||!result.data)return result;
    let quote=null;if(result.data.quote_id){const qr=await client.from('quotes').select('id,quote_number,status').eq('id',result.data.quote_id).maybeSingle();if(!qr.error)quote=qr.data}
    return {data:{record:result.data,quote},error:null};
  }
  if(kind==='service')return client.from('service_jobs').select('*,service_job_updates(*)').eq('id',id).maybeSingle();
  if(kind==='personal-data')return {data:await collectPersonalData(client,user),error:null};
  return {data:null,error:{message:'Unsupported document type.'}};
}

export async function customerQuoteAction(client,id,action){
  if(!['accepted','declined'].includes(action))return{error:{message:'Unsupported quote action.'}};
  const result=await client.rpc('customer_quote_action',{p_quote_id:id,p_action:action});
  if(result.error)return{error:result.error};
  try{await client.rpc('snapshot_quote',{p_quote_id:id})}catch{}
  return{error:null};
}
