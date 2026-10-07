alter table public.operations_jobs add column final_invoice jsonb;
create or replace function public.admin_operations_action(p_key text,p_action text,p_data jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
declare o public.operations_jobs%rowtype; r public.store_requests%rowtype; qu public.quotes%rowtype;
 k text:=split_part(p_key,':',1); ident uuid:=split_part(p_key,':',2)::uuid;
 paid boolean:=false; total numeric; n integer; ref text; email text; uid uuid; message text; link text; token text;
 row_data jsonb; reservation jsonb; qty numeric; cost numeric; price numeric; subtotal numeric:=0; delivery numeric; labour numeric; discount numeric; new_quote uuid;
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
  if o.quote_sent_at is not null then raise exception 'Cannot change reservation after quote is sent'; end if;
  if jsonb_typeof(p_data->'reservations') is distinct from 'array' then raise exception 'Reservations are required'; end if;
  n:=0;
  for row_data in
   select to_jsonb(i) from public.store_request_items i where k='store' and request_id=ident
   union all select to_jsonb(i) from public.quote_items i where k='quote' and quote_id=ident and item_type in ('part','product')
  loop
   select value into reservation from jsonb_array_elements(p_data->'reservations') where value->>'item_id'=row_data->>'id';
   qty:=(reservation->>'reserved_quantity')::numeric; cost:=(reservation->>'cost')::numeric;
   if reservation is null or qty is null or qty<(row_data->>'quantity')::numeric or qty::text in ('NaN','Infinity','-Infinity') or cost is null or cost<0 or cost::text in ('NaN','Infinity','-Infinity') then raise exception 'Each product requires reserved quantity and confirmed cost'; end if;
   if reservation->>'state' not in ('reserved','local') or reservation->>'state' is null then raise exception 'Feed availability is not reserved stock'; end if;
   if reservation->>'state'='reserved' and (nullif(trim(reservation->>'reference'),'') is null or nullif(trim(reservation->>'supplier'),'') is null or nullif(trim(reservation->>'sku'),'') is null) then raise exception 'Supplier, SKU and reservation reference are required'; end if;
   n:=n+1;
  end loop;
  if jsonb_array_length(p_data->'reservations')<>n then raise exception 'Reservation lines must match product lines'; end if;
  update public.operations_jobs set reservations=p_data->'reservations',stock_confirmed_at=now() where entity_key=p_key;
 elsif p_action='price' then
  if o.stock_confirmed_at is null then raise exception 'Reserve stock first'; end if;
  if o.quote_sent_at is not null then raise exception 'Revise the quote before changing prices'; end if;
  if k='store' and not paid then
   labour:=coalesce((p_data->>'labour')::numeric,0);discount:=coalesce((p_data->>'discount')::numeric,0);
   if labour<0 or discount<0 or labour::text in ('NaN','Infinity','-Infinity') or discount::text in ('NaN','Infinity','-Infinity') then raise exception 'Invalid labour or discount'; end if;
   delivery:=(p_data->>'delivery')::numeric;
   if delivery is null or delivery<0 or delivery::text in ('NaN','Infinity','-Infinity') then raise exception 'Confirm delivery charge'; end if;
   for row_data in select to_jsonb(i) from public.store_request_items i where request_id=ident loop
    select (value->>'unit_price')::numeric into price from jsonb_array_elements(p_data->'pricing') where value->>'item_id'=row_data->>'id';
    if price is null or price<0 or price::text in ('NaN','Infinity','-Infinity') then raise exception 'Every line needs a valid selling price'; end if;
    update public.store_request_items set displayed_price=price,price_checked_at=now() where id=(row_data->>'id')::uuid;
    subtotal:=subtotal+price*(row_data->>'quantity')::numeric;
   end loop;
   if subtotal+labour-discount<=0 then raise exception 'Total must be positive'; end if;
   update public.store_requests set final_subtotal=subtotal+labour,final_delivery_fee=delivery,final_total=subtotal+labour+delivery-discount,confirmed_at=now(),checkout_stage='quote_ready',shipping_provider='bobgo_manual',shipping_service='Manual confirmed delivery',updated_at=now() where id=ident;
  end if;
  if k='quote' and qu.status='draft' then
   delivery:=(p_data->>'delivery')::numeric; discount:=coalesce((p_data->>'discount')::numeric,0);
   if delivery is null or delivery<0 or discount<0 or delivery::text in ('NaN','Infinity','-Infinity') or discount::text in ('NaN','Infinity','-Infinity') then raise exception 'Confirm valid delivery and discount'; end if;
   subtotal:=0;
   for row_data in select to_jsonb(i) from public.quote_items i where quote_id=ident loop
    select (value->>'unit_price')::numeric into price from jsonb_array_elements(p_data->'pricing') where value->>'item_id'=row_data->>'id';
    if price is null or price<0 or price::text in ('NaN','Infinity','-Infinity') then raise exception 'Every quote line needs a selling price'; end if;
    update public.quote_items set unit_price=price,line_total=price*quantity,price_checked_at=now() where id=(row_data->>'id')::uuid;
    subtotal:=subtotal+price*(row_data->>'quantity')::numeric;
   end loop;
   if subtotal+delivery-discount<=0 then raise exception 'Quote total must be positive'; end if;
   update public.quotes set subtotal=subtotal,delivery_fee=delivery,discount_total=discount,total=subtotal+delivery-discount,updated_at=now() where id=ident;
  end if;
  update public.operations_jobs set pricing_confirmed_at=now(),quote_details=case when k='store' and not paid then jsonb_build_object('labour',labour,'discount',discount,'vat_separately_charged',false) else quote_details end,quote_sent_at=case when k='quote' then qu.sent_at else quote_sent_at end where entity_key=p_key;
 elsif p_action='send_quote' then
  if o.stock_confirmed_at is null or o.pricing_confirmed_at is null then raise exception 'Stock and final price must be confirmed'; end if;
  if k='quote' then perform public.admin_send_quote(ident);
  else
   if email is null then raise exception 'Customer email is required'; end if;
   token:=encode(extensions.gen_random_bytes(32),'hex');
   update public.store_requests set public_token_hash=encode(extensions.digest(token,'sha256'),'hex'),checkout_stage='awaiting_approval',updated_at=now() where id=ident;
   link:='/order-status.html?ref='||ref||'&token='||token;
   update public.operations_jobs set customer_link=link where entity_key=p_key;
  end if;
  update public.operations_jobs set quote_sent_at=now(),approval='pending',approved_total=null,approved_at=null where entity_key=p_key;
 elsif p_action='revise' then
  if paid or o.payment_released_at is not null then raise exception 'Payment has been released; resolve any payment attempt before revising'; end if;
  if k='quote' then
    select public.admin_create_quote(qu.user_id,qu.quote_type,qu.title||' (revision)',current_date+7,qu.customer_note,qu.internal_note,qu.delivery_fee,qu.discount_total,coalesce((select jsonb_agg(to_jsonb(i)) from public.quote_items i where quote_id=ident),'[]')) into new_quote;
    update public.quotes set source_type=qu.source_type,source_id=qu.source_id,source_metadata=qu.source_metadata where id=new_quote;
    update public.operations_jobs set archived_at=now(),history=history||jsonb_build_array(jsonb_build_object('action','revised','at',now(),'replacement',new_quote)) where entity_key=p_key;
    return jsonb_build_object('ok',true,'new_key','quote:'||new_quote);
   end if;
  update public.operations_jobs set quote_sent_at=null,pricing_confirmed_at=null,approval='pending',approved_at=null,approved_total=null where entity_key=p_key;
  if k='store' then update public.store_requests set checkout_stage='quote_ready',updated_at=now() where id=ident; end if;
 elsif p_action='release_payment' then
  if o.stock_confirmed_at is null or o.pricing_confirmed_at is null or o.quote_sent_at is null or total is null or total<=0 then raise exception 'Stock and quote must be confirmed'; end if;
  if k='store' and (o.approval<>'accepted' or o.approved_total is distinct from total) then raise exception 'Customer must accept the current total'; end if;
  if k='quote' and qu.status<>'accepted' then raise exception 'Customer must accept the quote'; end if;
  if paid then raise exception 'Already paid'; end if;
  update public.operations_jobs set payment_released_at=now() where entity_key=p_key;
  if k='store' then
   token:=encode(extensions.gen_random_bytes(32),'hex'); link:='/order-status.html?ref='||ref||'&token='||token;
   update public.operations_jobs set customer_link=link where entity_key=p_key;
   update public.store_requests set checkout_stage='awaiting_payment',public_token_hash=encode(extensions.digest(token,'sha256'),'hex'),updated_at=now() where id=ident;
  else perform public.admin_create_invoice(ident); end if;
 elsif p_action='service_complete' then
  if k<>'quote' or exists(select 1 from public.quote_items where quote_id=ident and item_type in ('part','product')) then raise exception 'Service-only quote required'; end if;
  if not paid then raise exception 'Verified payment required'; end if;
  update public.operations_jobs set delivered_at=now() where entity_key=p_key;
 elsif p_action='supplier_order' then
  if not paid then raise exception 'Verified payment required before ordering'; end if;
  if o.stock_confirmed_at is null then raise exception 'Confirm reserved stock first'; end if;
  if nullif(trim(p_data->>'reference'),'') is null then raise exception 'Supplier order reference required'; end if;
  update public.operations_jobs set supplier_order_at=now(),supplier_order_reference=left(p_data->>'reference',160) where entity_key=p_key;
 elsif p_action='courier' then
  if not paid or o.supplier_order_at is null then raise exception 'Paid supplier order required'; end if;
  if nullif(trim(p_data->>'tracking'),'') is null or nullif(trim(p_data->>'waybill'),'') is null then raise exception 'Shipment and waybill references required'; end if;
  cost:=(p_data->>'cost')::numeric;
  if cost is null or cost<0 or cost::text in ('NaN','Infinity','-Infinity') then raise exception 'Confirm courier cost'; end if;
  if k='store' then perform public.admin_mark_store_manual_shipment(ident,'Bob Go',p_data->>'tracking',p_data->>'url',p_data->>'waybill',null); end if;
  update public.operations_jobs set courier_booked_at=now(),courier_cost=cost,shipment=p_data where entity_key=p_key;
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
 if link is not null then update public.operations_jobs set customer_link=link where entity_key=p_key; end if;
 if k='store' and link is null then select customer_link into link from public.operations_jobs where entity_key=p_key; end if;
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


create function public.operations_store_invoice() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.payment_status='paid' and old.payment_status is distinct from new.payment_status then
  insert into public.operations_jobs(entity_key) values('store:'||new.id) on conflict do nothing;
  update public.operations_jobs set final_invoice=jsonb_build_object(
   'invoice_number','VT-INV-'||new.request_number,'issued_at',now(),'paid',true,'customer_name',new.guest_name,'currency','ZAR',
   'subtotal',new.final_subtotal,'delivery',new.final_delivery_fee,'total',new.final_total,
   'adjustments',quote_details,'items',(select jsonb_agg(jsonb_build_object('description',product_name,'quantity',quantity,'unit_price',displayed_price,'line_total',quantity*displayed_price)) from public.store_request_items where request_id=new.id))
  where entity_key='store:'||new.id and final_invoice is null;
 end if;
 return new;
end $$;
revoke all on function public.operations_store_invoice() from public,anon,authenticated;
create trigger operations_store_invoice after update on public.store_requests for each row execute function public.operations_store_invoice();
