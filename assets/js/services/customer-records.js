import { getAccountClient, loadAccountNotifications } from './account-session.js';

export const money = value => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(Number(value || 0));
export const money0 = value => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(Number(value || 0));
export const date = value => value ? new Intl.DateTimeFormat('en-ZA', { dateStyle: 'medium' }).format(new Date(value)) : '—';
export const dateTime = value => value ? new Intl.DateTimeFormat('en-ZA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';
export const buildRef = id => `VT-BLD-${String(id || '').replace(/-/g, '').slice(0, 8).toUpperCase()}`;

export function tone(status='') {
  const s=String(status).toLowerCase().replace(/[_-]+/g,' ');
  if(/overdue|declined|expired|failed|cancelled|rejected|error/.test(s)) return 'danger';
  if(/paid|accepted|completed|delivered|fulfilled|quoted|resolved|success/.test(s)) return 'success';
  if(/unpaid|pending|awaiting|requested|sent|viewed|due|waiting/.test(s)) return 'warning';
  if(/draft|saved|open|active|processing|repairing|scheduled|booked/.test(s)) return 'active';
  return 'neutral';
}

export function isExpiredQuote(row) {
  if (!row?.valid_until || !['sent','viewed'].includes(row.status)) return false;
  const end = new Date(`${row.valid_until}T23:59:59`);
  return !Number.isNaN(end.getTime()) && end.getTime() < Date.now();
}
export const effectiveQuoteStatus = row => isExpiredQuote(row) ? 'expired' : row.status;
export const originLabel = row => row?.source_type === 'builder' ? 'Builder' : row?.source_type === 'store' ? 'Store' : row?.quote_type === 'service' || row?.quote_type === 'repair' ? 'Service' : 'VoltTech';
export const sourceBuildLink = row => row?.source_type === 'builder' && row?.source_id ? `build-document.html?id=${encodeURIComponent(row.source_id)}` : '';

export async function requireCustomer() {
  const client = await getAccountClient();
  const { data: { session } } = await client.auth.getSession();
  if (!session?.user) {
    const returnTo = `${location.pathname}${location.search}${location.hash}`;
    location.replace(`account.html?returnTo=${encodeURIComponent(returnTo)}`);
    return null;
  }
  await loadAccountNotifications(client);
  return { client, user: session.user };
}

export async function loadActivity(client) {
  const [builds, quotes, invoiceResult, orders, jobs] = await Promise.all([
    client.from('saved_builds').select('id,name,status,estimated_total,quote_id,updated_at,build_data').order('updated_at',{ascending:false}),
    client.from('quotes').select('id,quote_number,title,status,total,created_at,valid_until,source_type,source_id').order('created_at',{ascending:false}),
    client.from('invoices').select('id,invoice_number,status,total,issued_at,due_at,paid_at,quote_id,source_type,source_id').order('issued_at',{ascending:false}),
    client.from('orders').select('id,order_number,status,total,payment_status,placed_at,created_at').order('created_at',{ascending:false}),
    client.from('service_jobs').select('id,job_number,status,title,device_name,opened_at,completed_at').order('opened_at',{ascending:false})
  ]);
  const invoices = invoiceResult.error ? [] : (invoiceResult.data || []);
  const invoiceByQuote = new Map(invoices.filter(row=>row.quote_id).map(row=>[row.quote_id,row]));
  const events=[];
  const make=(type,row,title,ref,status,total,when,href,action,extra=[],origin='',sourceHref='')=>({type,id:row.id,title,ref,status,total,when,href,action,origin,sourceHref,search:[type,title,ref,status,origin,...extra].filter(Boolean).join(' ').toLowerCase()});
  for (const row of builds.data || []) events.push(make('build',row,row.name||'PC Build',buildRef(row.id),row.status,row.estimated_total,row.updated_at,row.quote_id?`quote.html?id=${encodeURIComponent(row.quote_id)}`:`build-document.html?id=${encodeURIComponent(row.id)}`,row.quote_id?'Open quote':'Open build',(row.build_data?.items||[]).map(item=>item.name),'Builder',`build-document.html?id=${encodeURIComponent(row.id)}`));
  for (const row of quotes.data || []) { const invoice=invoiceByQuote.get(row.id); let href=`quote.html?id=${encodeURIComponent(row.id)}`,action='Open quote'; if(invoice){const paid=String(invoice.status||'').toLowerCase()==='paid'; href=paid?`receipt.html?id=${encodeURIComponent(invoice.id)}`:`invoice.html?id=${encodeURIComponent(invoice.id)}`; action=paid?'View receipt':'Open invoice';} events.push(make('quote',row,row.title||'VoltTech quotation',row.quote_number,effectiveQuoteStatus(row),row.total,row.created_at,href,action,[],originLabel(row),sourceBuildLink(row))); }
  for (const row of invoices) { const paid=String(row.status||'').toLowerCase()==='paid'; events.push(make('invoice',row,paid?'Paid invoice':'Invoice',row.invoice_number,row.status,row.total,row.issued_at,paid?`receipt.html?id=${encodeURIComponent(row.id)}`:`invoice.html?id=${encodeURIComponent(row.id)}`,paid?'View receipt':'Open invoice',[],originLabel(row),sourceBuildLink(row))); }
  for (const row of orders.data || []) events.push(make('order',row,'Order',row.order_number||`Order ${String(row.id).slice(0,8)}`,row.status,row.total,row.placed_at||row.created_at,`order-document.html?id=${encodeURIComponent(row.id)}`,'Open order',[row.payment_status],'Store'));
  for (const row of jobs.data || []) events.push(make('service',row,row.title||'Service job',row.job_number||`Job ${String(row.id).slice(0,8)}`,row.status,null,row.opened_at,`service-record.html?id=${encodeURIComponent(row.id)}`,'Open service record',[row.device_name],'Service'));
  return events.sort((a,b)=>new Date(b.when||0)-new Date(a.when||0));
}

export async function loadBuilds(client) {
  return client.from('saved_builds').select('id,name,status,build_data,estimated_total,estimated_power_watts,compatibility_status,quote_id,quote_requested_at,updated_at').order('updated_at',{ascending:false});
}
export async function deleteBuild(client,id){return client.from('saved_builds').delete().eq('id',id).in('status',['saved','archived']);}

export async function loadQuotes(client) {
  return client.from('quotes').select('id,quote_number,quote_type,title,status,subtotal,total,delivery_fee,discount_total,valid_until,customer_note,created_at,terms_version,source_type,source_id,source_metadata,quote_items(position,description,quantity,line_total,product_id)').order('created_at',{ascending:false});
}
export async function customerQuoteAction(client,id,action){
  const { error }=await client.rpc('customer_quote_action',{p_quote_id:id,p_action:action});
  if(error)return{error};
  try{await client.rpc('snapshot_quote',{p_quote_id:id});}catch{}
  return{error:null};
}

export async function loadDocuments(client){
  const [invoice,quote,build,order,service,proforma]=await Promise.all([
    client.from('invoices').select('id,invoice_number,status,total,issued_at,due_at,paid_at,source_type,source_id').order('issued_at',{ascending:false}),
    client.from('quotes').select('id,quote_number,status,total,title,created_at,source_type,source_id').order('created_at',{ascending:false}),
    client.from('saved_builds').select('id,name,status,estimated_total,updated_at').order('updated_at',{ascending:false}),
    client.from('orders').select('id,order_number,status,total,payment_status,placed_at,created_at').order('created_at',{ascending:false}),
    client.from('service_jobs').select('id,job_number,status,title,device_name,opened_at,completed_at').order('opened_at',{ascending:false}),
    client.from('proformas').select('id,proforma_number,total,created_at').order('created_at',{ascending:false})
  ]);
  return {invoice:invoice.error?[]:(invoice.data||[]),quote:quote.error?[]:(quote.data||[]),build:build.error?[]:(build.data||[]),order:order.error?[]:(order.data||[]),service:service.error?[]:(service.data||[]),proforma:proforma.error?[]:(proforma.data||[])};
}
