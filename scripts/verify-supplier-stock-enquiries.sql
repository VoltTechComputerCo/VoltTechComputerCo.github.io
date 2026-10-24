-- Run as the migration role. All fixtures and queued emails are rolled back.
begin;
do $$
declare request_id uuid; product_row record; email_count integer; line_count integer; report jsonb;
begin
 insert into public.store_requests(guest_name,guest_email,guest_phone,customer_note,item_count)
 values('PRIVATE CUSTOMER','private-customer@example.test','PRIVATE PHONE','PRIVATE NOTE',4) returning id into request_id;
 -- Separate inserts intentionally test complete-cart grouping at transaction end.
 for product_row in
  select * from (select distinct on (o.supplier_id) p.*,o.supplier_id
   from public.store_products p join public.store_supplier_offers o on o.product_id=p.id
   where o.supplier_id in ('syntech','esquire','tarsus') and p.status='active'
    and not exists(select 1 from public.store_supplier_offers f where f.product_id=p.id and f.supplier_id<>o.supplier_id)
   order by o.supplier_id,p.id) products
 loop
  insert into public.store_request_items(request_id,product_id,product_slug,product_name,product_type,brand,quantity,product_snapshot)
  values(request_id,product_row.id,product_row.slug,'PRIVATE CUSTOMER INPUT',product_row.type,product_row.brand,1,'{"customer_note":"PRIVATE NOTE"}');
  if product_row.supplier_id='syntech' then
   insert into public.store_request_items(request_id,product_id,product_slug,product_name,product_type,brand,quantity)
   values(request_id,product_row.id,product_row.slug,'PRIVATE CUSTOMER INPUT',product_row.type,product_row.brand,2);
  end if;
 end loop;
 set constraints supplier_stock_enquiry_on_cart immediate;
 select count(*),sum(jsonb_array_length(payload->'lines')) into email_count,line_count
 from public.email_outbox where source_id=request_id::text and message_kind='supplier_stock_request';
 if email_count<>2 or line_count<>3 then raise exception 'Expected two supplier emails and three lines; got %, %',email_count,line_count; end if;
 if exists(select 1 from public.email_outbox where source_id=request_id::text and message_kind='supplier_stock_request'
    and payload::text ilike '%PRIVATE%') then raise exception 'Customer data leaked into supplier payload'; end if;
 perform public.vt_queue_supplier_stock_enquiries(request_id);
 if (select count(*) from public.email_outbox where source_id=request_id::text and message_kind='supplier_stock_request')<>2 then raise exception 'Duplicate enquiries queued'; end if;
 select metadata->'supplier_stock_requests' into report from public.store_requests where id=request_id;
 if not exists(select 1 from jsonb_array_elements(report) a where a->>'supplier_id'='tarsus' and a->>'state'='needs_contact') then raise exception 'Unverified Tarsus contact was not blocked'; end if;
 if has_function_privilege('anon','public.vt_queue_supplier_stock_enquiries(uuid)','EXECUTE') or
    has_function_privilege('authenticated','public.vt_queue_supplier_stock_enquiries(uuid)','EXECUTE') then raise exception 'Queue helper exposed to customers'; end if;
 raise notice 'PASS: complete cart, grouping, supplier routing, duplicate prevention, privacy, contact blocking and permissions';
end $$;
rollback;
