create or replace function public.admin_save_billing_document(p_data jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare doc public.billing_documents%rowtype;customer public.billing_customers%rowtype;item jsonb;product public.store_products%rowtype;
 did uuid;seq integer:=0;qty numeric;price numeric;amount numeric;subtotal numeric:=0;delivery numeric;discount numeric;v_kind text;issue boolean;description text;sku text;
begin
 if auth.uid() is null or not coalesce(public.is_volttech_admin(),false) then raise exception 'Not authorised';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_data->>'request_key',0));
 if nullif(p_data->>'id','') is not null then
  select * into doc from public.billing_documents where id=(p_data->>'id')::uuid for update;
  if doc.id is null or doc.status<>'draft' then raise exception 'Only an existing draft can be edited';end if;
  if nullif(p_data->>'expected_updated_at','') is not null and doc.updated_at<>(p_data->>'expected_updated_at')::timestamptz then raise exception 'This draft changed in another window. Reload it before editing';end if;
 else
  select * into doc from public.billing_documents where request_key=(p_data->>'request_key')::uuid;
  if doc.id is not null then return doc.id;end if;
 end if;
 v_kind:=p_data->>'kind';issue:=coalesce((p_data->>'issue')::boolean,false);
 if v_kind is null or v_kind not in ('quote','invoice') or length(trim(coalesce(p_data->>'title','')))=0 or length(p_data->>'title')>180 then raise exception 'Select a document type and enter a title';end if;
 select * into customer from public.billing_customers where id=(p_data->>'customer_id')::uuid;
 if customer.id is null then raise exception 'Select or create a customer';end if;
 if jsonb_typeof(p_data->'items') is distinct from 'array' or jsonb_array_length(p_data->'items') not between 1 and 200 then raise exception 'Add between 1 and 200 line items';end if;
 delivery:=round(coalesce((p_data->>'delivery_fee')::numeric,0),2);discount:=round(coalesce((p_data->>'discount_total')::numeric,0),2);
 if delivery<0 or discount<0 or length(coalesce(p_data->>'customer_note',''))>4000 then raise exception 'Check delivery, discount and customer note';end if;
 if doc.id is null then
 insert into public.billing_documents(customer_id,kind,customer_details,title,subtotal,total,delivery_fee,discount_total,customer_note,valid_until,due_date,created_by,request_key)
 values(customer.id,v_kind,jsonb_build_object('full_name',customer.full_name,'billing_email',customer.billing_email,'phone',customer.phone,'company_name',customer.company_name,'address',customer.address),trim(p_data->>'title'),0,0,delivery,discount,left(p_data->>'customer_note',4000),nullif(p_data->>'valid_until','')::date,nullif(p_data->>'due_date','')::date,auth.uid(),(p_data->>'request_key')::uuid) returning id into did;
 else
  did:=doc.id;
  update public.billing_documents set customer_id=customer.id,kind=v_kind,customer_details=jsonb_build_object('full_name',customer.full_name,'billing_email',customer.billing_email,'phone',customer.phone,'company_name',customer.company_name,'address',customer.address),title=trim(p_data->>'title'),delivery_fee=delivery,discount_total=discount,customer_note=left(p_data->>'customer_note',4000),valid_until=nullif(p_data->>'valid_until','')::date,due_date=nullif(p_data->>'due_date','')::date,updated_at=now() where id=did;
  update public.billing_document_items set active=false where document_id=did;
 end if;
 for item in select value from jsonb_array_elements(p_data->'items') loop
  seq:=seq+1;qty:=round((item->>'quantity')::numeric,2);price:=round((item->>'unit_price')::numeric,2);
  if qty is null or price is null or qty<=0 or qty>10000 or price<0 then raise exception 'Every item needs a positive quantity and a non-negative selling price';end if;
  product:=null;
  if nullif(item->>'product_id','') is not null then
   select * into product from public.store_products where id=item->>'product_id' and not is_demo and status<>'discontinued';
   if product.id is null then raise exception 'Selected product no longer exists';end if;
   description:=product.name;sku:=coalesce(nullif(product.identifiers->>'mpn',''),nullif(product.identifiers->>'sku',''),product.model);
  else description:=trim(item->>'description');sku:=null;end if;
  if description is null or length(description)=0 or length(description)>2000 then raise exception 'Enter a line description or select a product';end if;
  amount:=round(qty*price,2);subtotal:=subtotal+amount;
  insert into public.billing_document_items(document_id,position,product_id,sku,description,item_type,quantity,unit_price,line_total)
  values(did,seq,product.id,sku,description,case when product.id is not null then 'product' when item->>'item_type'='labour' then 'labour' else 'service' end,qty,price,amount)
  on conflict(document_id,position) do update set product_id=excluded.product_id,sku=excluded.sku,description=excluded.description,item_type=excluded.item_type,quantity=excluded.quantity,unit_price=excluded.unit_price,line_total=excluded.line_total,active=true;
 end loop;
 if subtotal+delivery-discount<0 then raise exception 'Discount cannot exceed the document total';end if;
 update public.billing_documents set subtotal=admin_save_billing_document.subtotal,total=admin_save_billing_document.subtotal+delivery-discount where id=did;
 if issue then
  update public.billing_documents set status='issued',issued_at=now(),document_number=case v_kind when 'invoice' then 'VT-INV-'||to_char(current_date,'YYYY')||'-'||lpad(nextval('public.invoice_number_seq'::regclass)::text,4,'0') else 'VT-Q-'||to_char(current_date,'YYYY')||'-M'||lpad(nextval('public.billing_quote_number_seq'::regclass)::text,4,'0') end where id=did;
 end if;
 return did;
end $$;

;
