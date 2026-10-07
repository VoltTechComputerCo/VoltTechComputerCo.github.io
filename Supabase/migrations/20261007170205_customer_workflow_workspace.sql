alter table public.operations_jobs add column if not exists waybill_approved_at timestamptz;
-- Customer entry points are ownership checked; internal operations remain private.
create or replace function public.customer_order_link(p_id uuid) returns text language plpgsql security definer set search_path='' as $$
declare r public.store_requests%rowtype; link text; token text;
begin
 select * into r from public.store_requests where id=p_id and user_id=auth.uid() for update;
 if not found or auth.uid() is null then raise exception 'Order not found'; end if;
 select customer_link into link from public.operations_jobs where entity_key='store:'||p_id;
 if link is null then
  token:=encode(extensions.gen_random_bytes(32),'hex');
  link:='/order-status.html?ref='||r.request_number||'&token='||token;
  update public.store_requests set public_token_hash=encode(extensions.digest(token,'sha256'),'hex') where id=p_id;
  insert into public.operations_jobs(entity_key,customer_link) values('store:'||p_id,link) on conflict(entity_key) do update set customer_link=excluded.customer_link;
 end if;
 return link;
end $$;
revoke all on function public.customer_order_link(uuid) from public,anon;
grant execute on function public.customer_order_link(uuid) to authenticated;

create or replace function public.customer_workflow_jobs() returns jsonb language sql security definer set search_path='' as $$
 select coalesce(jsonb_agg(job order by job->>'updated_at' desc),'[]') from (
 select jsonb_build_object('id',r.id,'kind','store','reference',r.request_number,'title','Hardware order','stage',r.checkout_stage,'payment_status',r.payment_status,'approval',o.approval,'total',r.final_total,'updated_at',r.updated_at,'href','/order-status.html?id='||r.id,'stock',o.stock_confirmed_at is not null,'quote',o.quote_sent_at is not null,'preparing',o.supplier_order_at is not null,'courier',o.courier_booked_at is not null and o.waybill_approved_at is not null,'transit',o.collected_at is not null,'delivered',o.delivered_at is not null,'latest_update',(select n.message from public.notifications n where n.recipient_role='customer' and n.entity_type='customer_workflow' and n.entity_id='store:'||r.id order by n.created_at desc limit 1)) job
 from public.store_requests r left join public.operations_jobs o on o.entity_key='store:'||r.id where r.user_id=auth.uid() and auth.uid() is not null
 union all
 select jsonb_build_object('id',q.id,'kind','quote','reference',q.quote_number,'title',q.title,'stage',q.status,'payment_status',coalesce(i.status,'unpaid'),'approval',case when q.status='accepted' then 'accepted' else 'pending' end,'total',q.total,'updated_at',q.updated_at,'href',case when i.id is not null then '/invoice.html?id='||i.id else '/quote.html?id='||q.id end,'stock',o.stock_confirmed_at is not null,'quote',q.sent_at is not null,'preparing',o.supplier_order_at is not null,'courier',o.courier_booked_at is not null and o.waybill_approved_at is not null,'transit',o.collected_at is not null,'delivered',o.delivered_at is not null,'latest_update',(select n.message from public.notifications n where n.recipient_role='customer' and n.entity_type='customer_workflow' and n.entity_id='quote:'||q.id order by n.created_at desc limit 1))
 from public.quotes q left join public.operations_jobs o on o.entity_key='quote:'||q.id left join lateral(select id,status from public.invoices where quote_id=q.id order by issued_at desc limit 1)i on true where q.user_id=auth.uid() and auth.uid() is not null and q.status<>'draft' and not exists(select 1 from public.store_requests r where r.quote_id=q.id)
 ) jobs
$$;
revoke all on function public.customer_workflow_jobs() from public,anon;
grant execute on function public.customer_workflow_jobs() to authenticated;

create or replace function public.operations_customer_event(p_key text,p_event text,p_message text,p_dedupe text,p_email boolean default true) returns void language plpgsql security definer set search_path='' as $$
declare ident uuid:=split_part(p_key,':',2)::uuid; uid uuid; email text; link text; ref text; nid uuid; token text;
begin
 if split_part(p_key,':',1)='store' then
  select user_id,coalesce(nullif(guest_email,''),public.vt_customer_email(user_id)),request_number into uid,email,ref from public.store_requests where id=ident;
  select customer_link into link from public.operations_jobs where entity_key=p_key;
  if uid is null and link is null and p_event<>'request' then
   token:=encode(extensions.gen_random_bytes(32),'hex');link:='/order-status.html?ref='||ref||'&token='||token;
   update public.store_requests set public_token_hash=encode(extensions.digest(token,'sha256'),'hex') where id=ident;
   insert into public.operations_jobs(entity_key,customer_link) values(p_key,link) on conflict(entity_key) do update set customer_link=excluded.customer_link;
  end if;
  if uid is not null then link:='/order-status.html?id='||ident; end if;
 else
  select user_id,public.vt_customer_email(user_id),quote_number into uid,email,ref from public.quotes where id=ident;
  link:='/quote.html?id='||ident;
  if p_event in ('release_payment','payment_received') then select '/invoice.html?id='||id into link from public.invoices where quote_id=ident order by issued_at desc limit 1; end if;
 end if;
 if uid is not null then
 insert into public.notifications(recipient_user_id,recipient_role,event_type,title,message,action_url,entity_type,entity_id,priority,dedupe_key)
 values(uid,'customer','operations_customer',coalesce(ref,'VoltTech')||' update',p_message,coalesce(link,'/account.html'),'customer_workflow',p_key,'normal',p_dedupe)
 on conflict(dedupe_key) do nothing returning id into nid;
 end if;
 if (nid is not null or uid is null) and p_email and email is not null then
  insert into public.email_outbox(recipient_user_id,recipient_email,notification_id,message_kind,source_type,source_id,subject,payload,dedupe_key)
  values(uid,email,nid,'operations_customer','customer_workflow',p_key,coalesce(ref,'VoltTech')||' update',jsonb_build_object('message',p_message,'action_url',coalesce(link,'/account.html')),'customer-email:'||p_dedupe) on conflict(dedupe_key) do nothing;
 end if;
end $$;
revoke all on function public.operations_customer_event(text,text,text,text,boolean) from public,anon,authenticated;

create or replace function public.operations_customer_step() returns trigger language plpgsql security definer set search_path='' as $$
declare action text; message text;
begin
 if new.history is not distinct from old.history then return new; end if;
 action:=new.history->-1->>'action';
 message:=case action when 'reserve' then '✅ Stock confirmed. Your final quotation is being prepared.' when 'price' then '✅ Final pricing confirmed. Your quotation is being prepared for review.' when 'send_quote' then '⚡ Your confirmed quotation is ready. Review the items and total, then accept or decline.' when 'revised' then '⏳ A revised quotation is being prepared. We will notify you when it is ready.' when 'revise' then '⏳ Your quotation is being revised. Payment remains unavailable until the revised quotation is approved.' when 'release_payment' then '⚡ Your approved quote is ready for payment. Open the payment portal from your order workspace.' when 'supplier_order' then '✅ Payment received. Your order is being prepared for fulfilment.' when 'courier' then '⏳ Courier booking recorded. Tracking will open after the waybill has been sent and confirmed.' when 'waybill_sent' then '⏳ Waybill sent. Awaiting confirmation before tracking opens.' when 'waybill_approved' then '✅ Waybill approved. Your courier tracking is now available.' when 'preparing' then '⏳ Your parcel is being prepared for collection.' when 'collected' then '✅ Your parcel has been collected by the courier.' when 'in_transit' then '⏳ Your parcel is in transit. Open your order to track delivery.' when 'delivered' then '✅ Your order has been delivered. Your final invoice and history are available.' when 'service_complete' then '✅ Your service job is complete. Your invoice and history are available.' when 'close' then '✅ Your job is complete and archived. You can still view its history.' else null end;
 if message is not null then perform public.operations_customer_event(new.entity_key,action,message,'customer-step:'||new.entity_key||':'||jsonb_array_length(new.history)); end if;
 return new;
end $$;
revoke all on function public.operations_customer_step() from public,anon,authenticated;
create or replace trigger operations_customer_step after update of history on public.operations_jobs for each row execute function public.operations_customer_step();

create or replace function public.operations_customer_store_event() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='INSERT' then perform public.operations_customer_event('store:'||new.id,'request','✅ Request received. We are checking stock and preparing your quotation.','customer-request:'||new.id);
 elsif new.payment_status is distinct from old.payment_status then
  perform public.operations_customer_event('store:'||new.id,'payment_received',case new.payment_status when 'paid' then '✅ Payment received. Your order is moving to fulfilment.' when 'failed' then '⚠ Payment did not complete. Open your order to check the status before retrying.' when 'refunded' then '✅ Your payment refund has been recorded.' when 'partially_refunded' then '✅ A partial refund has been recorded.' else '⏳ Your payment is awaiting confirmation.' end,'customer-payment:'||new.id||':'||new.payment_status||':'||new.updated_at);
 end if;
 return new;
end $$;
revoke all on function public.operations_customer_store_event() from public,anon,authenticated;
create or replace trigger operations_customer_store_event after insert or update of payment_status on public.store_requests for each row execute function public.operations_customer_store_event();
create or replace function public.operations_customer_approval_event() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.approval is distinct from old.approval and new.approval in ('accepted','declined') then
  perform public.operations_customer_event(new.entity_key,'approval',case new.approval when 'accepted' then '✅ Quote accepted. We will notify you when payment is released.' else 'Your quotation has been declined. Contact us if you would like a revision.' end,'customer-approval:'||new.entity_key||':'||new.approval||':'||coalesce(new.approved_at,now()));
 end if; return new;
end $$;
revoke all on function public.operations_customer_approval_event() from public,anon,authenticated;
create or replace trigger operations_customer_approval_event after update of approval on public.operations_jobs for each row execute function public.operations_customer_approval_event();

create or replace function public.operations_customer_quote_event() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.status is distinct from old.status and new.status in ('accepted','declined','expired') then
  perform public.operations_customer_event('quote:'||new.id,'approval',case new.status when 'accepted' then '✅ Quote accepted. We will notify you when payment is released.' when 'declined' then 'Your quotation has been declined. Contact us for a revision.' else 'Your quotation has expired. Contact us for an updated quotation.' end,'customer-quote:'||new.id||':'||new.status||':'||new.updated_at);
 end if; return new;
end $$;
revoke all on function public.operations_customer_quote_event() from public,anon,authenticated;
create or replace trigger operations_customer_quote_event after update of status on public.quotes for each row execute function public.operations_customer_quote_event();

create or replace function public.customer_operations_progress(p_quote_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare o public.operations_jobs%rowtype; invoice_id uuid;
begin
 if auth.uid() is null or not exists(select 1 from public.quotes where id=p_quote_id and user_id=auth.uid()) then raise exception 'Not authorised'; end if;
 select * into o from public.operations_jobs where entity_key='quote:'||p_quote_id;
 select id into invoice_id from public.invoices where quote_id=p_quote_id order by issued_at desc limit 1;
 return jsonb_build_object('approval',(select status='accepted' from public.quotes where id=p_quote_id),'payment_received',exists(select 1 from public.invoices where quote_id=p_quote_id and status='paid'),'stock_confirmed',o.stock_confirmed_at is not null,'quote_confirmed',o.pricing_confirmed_at is not null,'payment_released',o.payment_released_at is not null,'can_pay',invoice_id is not null and public.operations_payment_ready('invoice',invoice_id) and not exists(select 1 from public.invoices where id=invoice_id and status in ('paid','void','cancelled','refunded')),'preparing',o.supplier_order_at is not null,'courier_booked',o.courier_booked_at is not null,'waybill_confirmed',o.waybill_approved_at is not null,'in_transit',o.collected_at is not null,'delivered',o.delivered_at is not null,'tracking_number',case when o.waybill_approved_at is not null then o.shipment->>'tracking' end,'tracking_url',case when o.waybill_approved_at is not null then o.shipment->>'url' end,'updates',coalesce((select jsonb_agg(jsonb_build_object('message',n.message,'at',n.created_at) order by n.created_at desc) from public.notifications n where n.recipient_user_id=auth.uid() and n.entity_type='customer_workflow' and n.entity_id='quote:'||p_quote_id),'[]'));
end $$;
-- One customer event owns both channels; remove the former four-action email shortcut.
do $$
declare definition text; start_pos integer; end_pos integer;
begin
 select pg_get_functiondef(oid) into definition from pg_proc where oid='public.admin_operations_action(text,text,jsonb)'::regprocedure;
 start_pos:=strpos(definition,' if p_action in (''send_quote'',''release_payment'',''courier'',''delivered'') and email is not null then');
 if start_pos>0 then
  end_pos:=strpos(substr(definition,start_pos),' return jsonb_build_object(''ok'',true,''private_link'',link);');
  if end_pos=0 then raise exception 'Could not identify legacy email block'; end if;
  definition:=substr(definition,1,start_pos-1)||substr(definition,start_pos+end_pos-1);
  execute definition;
 end if;
end $$;

-- Tracking and collection require a separately confirmed waybill.
do $$
declare definition text;
begin
 select pg_get_functiondef(oid) into definition from pg_proc where oid='public.admin_operations_action(text,text,jsonb)'::regprocedure;
 if strpos(definition,'p_action=''waybill_approved''')=0 then
 definition:=replace(definition,' elsif p_action=''preparing'' then',E' elsif p_action=''waybill_approved'' then\n  if o.waybill_sent_at is null then raise exception ''Send waybill first''; end if;\n  update public.operations_jobs set waybill_approved_at=now() where entity_key=p_key;\n elsif p_action=''preparing'' then');
 end if;
 if strpos(definition,'or o.waybill_approved_at is null')=0 then
 definition:=replace(definition,'o.courier_booked_at is null or o.waybill_sent_at is null','o.courier_booked_at is null or o.waybill_sent_at is null or o.waybill_approved_at is null');
 end if;
 execute definition;
end $$;
-- The central admin workspace shows the content and delivery state of customer updates.
do $$ declare definition text;
begin
 select pg_get_functiondef(oid) into definition from pg_proc where oid='public.admin_operations_data()'::regprocedure;
 definition:=replace(definition,'select id,source_id,subject,status,error_message,created_at from public.email_outbox','select id,source_id,subject,status,error_message,created_at,message_kind,payload,recipient_email,notification_id from public.email_outbox');
 execute definition;
end $$;
