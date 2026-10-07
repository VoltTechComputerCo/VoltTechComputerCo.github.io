create table public.operations_jobs (
 entity_key text primary key,
 reservations jsonb not null default '[]',
 stock_confirmed_at timestamptz,
 pricing_confirmed_at timestamptz,
 quote_sent_at timestamptz,
 approval text not null default 'pending' check(approval in ('pending','accepted','declined')),
 approved_total numeric,
 approved_at timestamptz,
 payment_released_at timestamptz,
 supplier_order_at timestamptz,
 supplier_order_reference text,
 courier_booked_at timestamptz,
 waybill_sent_at timestamptz,
 preparing_at timestamptz,
 collected_at timestamptz,
 in_transit_at timestamptz,
 delivered_at timestamptz,
 archived_at timestamptz,
 courier_cost numeric check(courier_cost>=0),
 history jsonb not null default '[]',
 updated_at timestamptz not null default now()
);
alter table public.operations_jobs enable row level security;
revoke all on public.operations_jobs from anon,authenticated;
grant select on public.operations_jobs to authenticated;
grant all on public.operations_jobs to service_role;
create policy operations_admin_read on public.operations_jobs for select to authenticated using(public.is_volttech_admin());

create function public.admin_operations_action(p_key text,p_action text,p_data jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
declare o public.operations_jobs%rowtype; r public.store_requests%rowtype; qu public.quotes%rowtype;
 k text:=split_part(p_key,':',1); ident uuid:=split_part(p_key,':',2)::uuid;
 paid boolean:=false; total numeric; n integer; ref text; email text; uid uuid; message text; link text; token text;
 row_data jsonb; reservation jsonb; qty numeric; cost numeric; price numeric; subtotal numeric:=0; delivery numeric;
begin
 if not coalesce(public.is_volttech_admin(),false) then raise exception 'Not authorised'; end if;
 if k='store' then
  select * into r from public.store_requests where id=ident for update;
  if not found then raise exception 'Request not found'; end if;
  paid:=r.payment_status='paid'; total:=r.final_total; ref:=r.request_number; uid:=r.user_id;
  email:=coalesce(nullif(r.guest_email,''),public.vt_customer_email(r.user_id));
 elsif k='quote' then
  select * into qu from public.quotes where id=ident for update;
  if not found then raise exception 'Quote not found'; end if;
  select exists(select 1 from public.invoices where quote_id=ident and status='paid') into paid;
  total:=qu.total; ref:=qu.quote_number; uid:=qu.user_id; email:=public.vt_customer_email(uid);
 else raise exception 'Use the linked quotation workspace for commercial actions'; end if;
 insert into public.operations_jobs(entity_key) values(p_key) on conflict do nothing;
 select * into o from public.operations_jobs where entity_key=p_key for update;
 if o.archived_at is not null then raise exception 'Job is archived'; end if;
 if p_action='reserve' then
  if o.quote_sent_at is not null or paid then raise exception 'Cannot change reservation after quote is sent'; end if;
  if jsonb_typeof(p_data->'reservations') is distinct from 'array' then raise exception 'Reservations are required'; end if;
  n:=0;
  for row_data in
   select to_jsonb(i) from public.store_request_items i where k='store' and request_id=ident
   union all select to_jsonb(i) from public.quote_items i where k='quote' and quote_id=ident and item_type in ('part','product')
  loop
   select value into reservation from jsonb_array_elements(p_data->'reservations') where value->>'item_id'=row_data->>'id';
   qty:=(reservation->>'reserved_quantity')::numeric; cost:=(reservation->>'cost')::numeric;
   if reservation is null or qty is null or qty<(row_data->>'quantity')::numeric or cost is null or cost<0 or cost::text='NaN' then raise exception 'Each product requires reserved quantity and confirmed cost'; end if;
   if reservation->>'state' not in ('reserved','local') or reservation->>'state' is null then raise exception 'Feed availability is not reserved stock'; end if;
   if reservation->>'state'='reserved' and (nullif(trim(reservation->>'reference'),'') is null or nullif(trim(reservation->>'supplier'),'') is null or nullif(trim(reservation->>'sku'),'') is null) then raise exception 'Supplier, SKU and reservation reference are required'; end if;
   n:=n+1;
  end loop;
  if jsonb_array_length(p_data->'reservations')<>n then raise exception 'Reservation lines must match product lines'; end if;
  update public.operations_jobs set reservations=p_data->'reservations',stock_confirmed_at=now() where entity_key=p_key;
 elsif p_action='price' then
  if o.stock_confirmed_at is null then raise exception 'Reserve stock first'; end if;
  if paid or o.quote_sent_at is not null then raise exception 'Revise the quote before changing prices'; end if;
  if k='store' then
   delivery:=(p_data->>'delivery')::numeric;
   if delivery is null or delivery<0 or delivery::text='NaN' then raise exception 'Confirm delivery charge'; end if;
   for row_data in select to_jsonb(i) from public.store_request_items i where request_id=ident loop
    select (value->>'unit_price')::numeric into price from jsonb_array_elements(p_data->'pricing') where value->>'item_id'=row_data->>'id';
    if price is null or price<0 or price::text='NaN' then raise exception 'Every line needs a valid selling price'; end if;
    update public.store_request_items set displayed_price=price,price_checked_at=now() where id=(row_data->>'id')::uuid;
    subtotal:=subtotal+price*(row_data->>'quantity')::numeric;
   end loop;
   if subtotal<=0 then raise exception 'Total must be positive'; end if;
   update public.store_requests set final_subtotal=subtotal,final_delivery_fee=delivery,final_total=subtotal+delivery,confirmed_at=now(),checkout_stage='quote_ready',shipping_provider='bobgo_manual',shipping_service='Manual confirmed delivery',updated_at=now() where id=ident;
  end if;
  update public.operations_jobs set pricing_confirmed_at=now() where entity_key=p_key;
 elsif p_action='send_quote' then
  if o.stock_confirmed_at is null or o.pricing_confirmed_at is null then raise exception 'Stock and final price must be confirmed'; end if;
  if k='quote' then perform public.admin_send_quote(ident);
  else
   if email is null then raise exception 'Customer email is required'; end if;
   token:=encode(gen_random_bytes(32),'hex');
   update public.store_requests set public_token_hash=encode(digest(token,'sha256'),'hex'),checkout_stage='awaiting_approval',updated_at=now() where id=ident;
   link:='/order-status.html?ref='||ref||'&token='||token;
  end if;
  update public.operations_jobs set quote_sent_at=now(),approval='pending',approved_total=null,approved_at=null where entity_key=p_key;
 elsif p_action='revise' then
  if paid or o.payment_released_at is not null then raise exception 'Payment has been released; resolve any payment attempt before revising'; end if;
  if k='quote' and qu.status<>'draft' then raise exception 'Create a revised quotation using existing document controls'; end if;
  update public.operations_jobs set quote_sent_at=null,pricing_confirmed_at=null,approval='pending',approved_at=null,approved_total=null where entity_key=p_key;
  if k='store' then update public.store_requests set checkout_stage='quote_ready',updated_at=now() where id=ident; end if;
 elsif p_action='release_payment' then
  if o.stock_confirmed_at is null or o.pricing_confirmed_at is null or o.quote_sent_at is null or total is null or total<=0 then raise exception 'Stock and quote must be confirmed'; end if;
  if k='store' and (o.approval<>'accepted' or o.approved_total is distinct from total) then raise exception 'Customer must accept the current total'; end if;
  if k='quote' and qu.status<>'accepted' then raise exception 'Customer must accept the quote'; end if;
  if paid then raise exception 'Already paid'; end if;
  update public.operations_jobs set payment_released_at=now() where entity_key=p_key;
  if k='store' then
   token:=encode(gen_random_bytes(32),'hex'); link:='/order-status.html?ref='||ref||'&token='||token;
   update public.store_requests set checkout_stage='awaiting_payment',public_token_hash=encode(digest(token,'sha256'),'hex'),updated_at=now() where id=ident;
  else perform public.admin_create_invoice(ident); end if;
 elsif p_action='supplier_order' then
  if not paid then raise exception 'Verified payment required before ordering'; end if;
  if o.stock_confirmed_at is null then raise exception 'Confirm reserved stock first'; end if;
  if nullif(trim(p_data->>'reference'),'') is null then raise exception 'Supplier order reference required'; end if;
  update public.operations_jobs set supplier_order_at=now(),supplier_order_reference=left(p_data->>'reference',160) where entity_key=p_key;
 elsif p_action='courier' then
  if not paid or o.supplier_order_at is null then raise exception 'Paid supplier order required'; end if;
  if nullif(trim(p_data->>'tracking'),'') is null or nullif(trim(p_data->>'waybill'),'') is null then raise exception 'Shipment and waybill references required'; end if;
  cost:=(p_data->>'cost')::numeric;
  if cost is null or cost<0 or cost::text='NaN' then raise exception 'Confirm courier cost'; end if;
  if k='store' then perform public.admin_mark_store_manual_shipment(ident,'Bob Go',p_data->>'tracking',p_data->>'url',p_data->>'waybill',null); end if;
  update public.operations_jobs set courier_booked_at=now(),courier_cost=cost where entity_key=p_key;
 elsif p_action='waybill_sent' then
  if o.courier_booked_at is null then raise exception 'Book courier first'; end if;
  update public.operations_jobs set waybill_sent_at=now() where entity_key=p_key;
 elsif p_action='preparing' then
  if o.supplier_order_at is null then raise exception 'Place supplier order first'; end if;
  update public.operations_jobs set preparing_at=now() where entity_key=p_key;
 elsif p_action='collected' then
  if o.courier_booked_at is null or o.waybill_sent_at is null then raise exception 'Courier and sent waybill required'; end if;
  update public.operations_jobs set collected_at=now() where entity_key=p_key;
  if k='store' then update public.store_requests set delivery_status='in_transit',updated_at=now() where id=ident; end if;
 elsif p_action='in_transit' then
  if o.collected_at is null then raise exception 'Record collection first'; end if;
  update public.operations_jobs set in_transit_at=now() where entity_key=p_key;
 elsif p_action='delivered' then
  if o.collected_at is null then raise exception 'Record collection first'; end if;
  update public.operations_jobs set delivered_at=now() where entity_key=p_key;
  if k='store' then update public.store_requests set delivery_status='delivered',updated_at=now() where id=ident; end if;
 elsif p_action='close' then
  if o.delivered_at is null then raise exception 'Complete delivery first'; end if;
  update public.operations_jobs set archived_at=now() where entity_key=p_key;
 else raise exception 'Unknown action'; end if;
 message:=ref||': '||replace(p_action,'_',' ')||' recorded';
 update public.operations_jobs set updated_at=now(),history=history||jsonb_build_array(jsonb_build_object('action',p_action,'at',now(),'actor',auth.uid(),'data',p_data)) where entity_key=p_key;
 insert into public.notifications(recipient_role,event_type,title,message,action_url,entity_type,entity_id,priority,dedupe_key)
 values('admin','operations_update','Workflow updated',message,'/admin.html?job='||p_key,'operations',ident::text,'normal','ops:'||gen_random_uuid()) on conflict(dedupe_key) do nothing;
 if p_action in ('send_quote','release_payment','courier','delivered') and email is not null then
  insert into public.email_outbox(recipient_user_id,recipient_email,message_kind,source_type,source_id,subject,payload,dedupe_key)
  values(uid,email,'operations_customer','operations',ident::text,'VoltTech '||ref||' update',jsonb_build_object('message',case p_action when 'send_quote' then 'Your confirmed quotation is ready. Please review and accept or decline.' when 'release_payment' then 'Stock and final pricing are confirmed. Your approved order is ready for payment.' when 'courier' then 'Your courier booking is recorded. Open your VoltTech status page for tracking.' else 'Your order has been delivered. Thank you for choosing VoltTech.' end,'action_url',coalesce(link,case when k='quote' then '/quote.html?id='||ident else '/account.html' end)),'ops-email:'||gen_random_uuid());
 end if;
 return jsonb_build_object('ok',true,'private_link',link);
end $$;
revoke all on function public.admin_operations_action(text,text,jsonb) from public;
grant execute on function public.admin_operations_action(text,text,jsonb) to authenticated;

-- Even legacy admin controls cannot release an unreserved or unapproved store order.
create function public.operations_store_gate() returns trigger language plpgsql set search_path='' as $$
declare o public.operations_jobs%rowtype;
begin
 if new.checkout_stage='awaiting_payment' and old.checkout_stage is distinct from new.checkout_stage then
  select * into o from public.operations_jobs where entity_key='store:'||new.id;
  if o.stock_confirmed_at is null or o.pricing_confirmed_at is null or o.payment_released_at is null or o.approval<>'accepted' or o.approved_total is distinct from new.final_total then raise exception 'Use Operations Hub: reservation, current customer approval and payment release are required'; end if;
 end if;
 return new;
end $$;
create trigger operations_store_gate before update on public.store_requests for each row execute function public.operations_store_gate();

create function public.operations_payment_ready(p_kind text,p_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.operations_jobs o where o.entity_key=case when p_kind='store' then 'store:'||p_id else 'quote:'||(select quote_id from public.invoices where id=p_id) end
 and o.stock_confirmed_at is not null and o.pricing_confirmed_at is not null and o.payment_released_at is not null
 and (p_kind<>'store' or (o.approval='accepted' and o.approved_total=(select final_total from public.store_requests where id=p_id))))
$$;
revoke all on function public.operations_payment_ready(text,uuid) from public,anon,authenticated;
grant execute on function public.operations_payment_ready(text,uuid) to service_role;

create function public.operations_customer_approval(p_id uuid,p_action text) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.store_requests%rowtype; o public.operations_jobs%rowtype;
begin
 select * into r from public.store_requests where id=p_id for update;
 select * into o from public.operations_jobs where entity_key='store:'||p_id for update;
 if r.checkout_stage<>'awaiting_approval' or o.quote_sent_at is null or o.pricing_confirmed_at is null then raise exception 'No quote awaiting approval'; end if;
 if p_action not in ('accepted','declined') then raise exception 'Invalid approval'; end if;
 update public.operations_jobs set approval=p_action,approved_at=now(),approved_total=case when p_action='accepted' then r.final_total end,updated_at=now(),history=history||jsonb_build_array(jsonb_build_object('action','customer_'||p_action,'at',now(),'total',r.final_total)) where entity_key='store:'||p_id;
 insert into public.notifications(recipient_role,event_type,title,message,action_url,entity_type,entity_id,priority,dedupe_key)
 values('admin','operations_approval','Customer '||p_action||' quote',r.request_number||': customer '||p_action||' the confirmed quote','/admin.html?job=store:'||p_id,'store_request',p_id::text,'high','ops-approval:'||gen_random_uuid());
 insert into public.email_outbox(recipient_email,message_kind,source_type,source_id,subject,payload,dedupe_key)
 values('quotes@volttechcomputerco.co.za','operations_admin','store_request',p_id::text,r.request_number||' quote '||p_action,jsonb_build_object('message','Customer '||p_action||' the quotation. Review the next action in Operations.','action_url','/admin.html?job=store:'||p_id),'ops-approval-mail:'||gen_random_uuid());
 return jsonb_build_object('ok',true);
end $$;
revoke all on function public.operations_customer_approval(uuid,text) from public,anon,authenticated;
grant execute on function public.operations_customer_approval(uuid,text) to service_role;
create function public.admin_operations_data() returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not coalesce(public.is_volttech_admin(),false) then raise exception 'Not authorised'; end if;
 return jsonb_build_object(
 'stores',coalesce((select jsonb_agg(to_jsonb(r)||jsonb_build_object('items',(select coalesce(jsonb_agg(to_jsonb(i)),'[]') from public.store_request_items i where i.request_id=r.id))) from public.store_requests r),'[]'),
 'quotes',coalesce((select jsonb_agg(to_jsonb(q)||jsonb_build_object('items',(select coalesce(jsonb_agg(to_jsonb(i)),'[]') from public.quote_items i where i.quote_id=q.id))) from public.quotes q),'[]'),
 'invoices',coalesce((select jsonb_agg(to_jsonb(i)) from public.invoices i),'[]'),
 'services',coalesce((select jsonb_agg(to_jsonb(i)) from public.service_jobs i),'[]'),
 'builds',coalesce((select jsonb_agg(to_jsonb(i)) from public.saved_builds i),'[]'),
 'orders',coalesce((select jsonb_agg(to_jsonb(i)) from public.orders i),'[]'),
 'operations',coalesce((select jsonb_agg(to_jsonb(i)) from public.operations_jobs i),'[]'),
 'emails',coalesce((select jsonb_agg(to_jsonb(e)) from (select id,source_id,subject,status,error_message,created_at from public.email_outbox order by created_at desc limit 50) e),'[]'));
end $$;
revoke all on function public.admin_operations_data() from public;
grant execute on function public.admin_operations_data() to authenticated;
revoke select on public.quotes from authenticated;
revoke select(internal_note,source_metadata) on public.quotes from authenticated;
grant select(id,user_id,quote_number,quote_type,title,status,currency,subtotal,discount_total,delivery_fee,tax_total,total,vat_registered,customer_note,valid_until,sent_at,viewed_at,accepted_at,declined_at,terms_version,created_at,updated_at,source_type,source_id) on public.quotes to authenticated;
revoke select on public.store_requests from authenticated;
grant select(id,user_id,request_number,status,source,customer_note,delivery_address_id,quote_id,item_count,submitted_at,updated_at,guest_name,guest_email,guest_phone,checkout_stage,delivery_method,shipping_address,pickup_provider,pickup_point,delivery_status,courier_name,tracking_number,tracking_url,delivery_fee_estimate,confirmed_order_id,final_subtotal,final_delivery_fee,final_total,confirmed_at,payment_status,shipping_provider,shipping_service,shipping_eta) on public.store_requests to authenticated;
create function public.operations_store_task() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.payment_status='paid' and old.payment_status is distinct from new.payment_status then
  insert into public.notifications(recipient_role,event_type,title,message,action_url,entity_type,entity_id,priority,dedupe_key)
  values('admin','operations_paid','Payment received — supplier order required',new.request_number||': confirm supplier order, then book Bob Go manually.','/admin.html?job=store:'||new.id,'store_request',new.id::text,'high','ops-paid:'||new.id) on conflict(dedupe_key) do nothing;
  insert into public.email_outbox(recipient_email,message_kind,source_type,source_id,subject,payload,dedupe_key)
  values('billing@volttechcomputerco.co.za','operations_admin','store_request',new.id::text,new.request_number||' payment received',jsonb_build_object('message','Customer payment verified. The supplier order is the next action.','action_url','/admin.html?job=store:'||new.id),'ops-paid-email:'||new.id) on conflict(dedupe_key) do nothing;
 end if;
 return new;
end $$;
create trigger operations_store_task after update on public.store_requests for each row execute function public.operations_store_task();
update public.notifications set action_url='/admin.html?job=store:'||entity_id where recipient_role='admin' and entity_type='store_request';
