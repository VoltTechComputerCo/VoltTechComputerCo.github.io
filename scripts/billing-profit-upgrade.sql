-- Commercial figures live separately from every customer-facing document.
create table public.billing_document_financials (
 document_id uuid primary key references public.billing_documents(id) on delete cascade,
 details jsonb not null, updated_at timestamptz not null default now()
);
alter table public.billing_document_financials enable row level security;
create policy billing_financials_admin on public.billing_document_financials for select to authenticated using (public.is_volttech_admin());
revoke all on public.billing_document_financials from public,anon,authenticated;
grant select on public.billing_document_financials to authenticated;

create or replace function public.admin_get_billing_financials(p_id uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null or not coalesce(public.is_volttech_admin(),false) then raise exception 'Not authorised';end if;
 if not exists(select 1 from public.billing_documents where id=p_id) then raise exception 'Document not found';end if;
 select details into result from public.billing_document_financials where document_id=p_id;
 if result is not null then return result||jsonb_build_object('saved',true);end if;
 select jsonb_build_object('saved',false,'shipping_cost',null,'payment_fees',0,'other_costs',0,'items',coalesce(jsonb_agg(jsonb_build_object('position',i.position,'product_id',i.product_id,'cost_incl',o.cost_price,'supplier_id',o.supplier_id,'supplier_name',o.supplier_name)),'[]'::jsonb)) into result
 from public.billing_document_items i left join lateral (select * from public.store_supplier_offers o where o.product_id=i.product_id order by case when i.product_id like o.supplier_id||'-%' then 0 else 1 end,case o.supplier_id when 'syntech' then 0 when 'tarsus' then 1 when 'esquire' then 2 else 3 end,o.cost_price nulls last limit 1) o on true
 where i.document_id=p_id and i.active;
 return result;
end $$;
revoke all on function public.admin_get_billing_financials(uuid) from public,anon;
grant execute on function public.admin_get_billing_financials(uuid) to authenticated;

create or replace function public.admin_save_billing_financials(p_id uuid,p_data jsonb) returns void language plpgsql security definer set search_path='' as $$
declare doc public.billing_documents%rowtype;i record;x jsonb;cost numeric;shipping numeric;fees numeric;other numeric;rows jsonb:='[]'::jsonb;sup text;supname text;
begin
 if auth.uid() is null or not coalesce(public.is_volttech_admin(),false) then raise exception 'Not authorised';end if;
 select * into doc from public.billing_documents where id=p_id for update;
 if doc.id is null then raise exception 'Document not found';end if;
 if jsonb_typeof(p_data->'items') is distinct from 'array' or jsonb_array_length(p_data->'items')>200 then raise exception 'Invalid private cost details';end if;
 shipping:=round(nullif(p_data->>'shipping_cost','')::numeric,2);fees:=round(coalesce((p_data->>'payment_fees')::numeric,0),2);other:=round(coalesce((p_data->>'other_costs')::numeric,0),2);
 if shipping<0 or fees<0 or other<0 or shipping>99999999 or fees>99999999 or other>99999999 then raise exception 'Costs must be non-negative amounts';end if;
 for i in select * from public.billing_document_items where document_id=p_id and active order by position loop
  x:=null;select value into x from jsonb_array_elements(p_data->'items') where (value->>'position')::integer=i.position and coalesce(value->>'product_id','')=coalesce(i.product_id,'') limit 1;
  cost:=round(nullif(x->>'cost_incl','')::numeric,2);
  if cost<0 or cost>99999999 then raise exception 'Invalid unit cost';end if;
  sup:=nullif(x->>'supplier_id','');supname:=null;
  if sup is not null then select supplier_name into supname from public.store_supplier_offers where product_id=i.product_id and supplier_id=sup limit 1;end if;
  rows:=rows||jsonb_build_array(jsonb_build_object('position',i.position,'product_id',i.product_id,'cost_incl',cost,'supplier_id',sup,'supplier_name',supname));
 end loop;
 insert into public.billing_document_financials(document_id,details) values(p_id,jsonb_build_object('items',rows,'shipping_cost',shipping,'payment_fees',fees,'other_costs',other,'recorded_at',now()))
 on conflict(document_id) do update set details=excluded.details,updated_at=now();
end $$;
revoke all on function public.admin_save_billing_financials(uuid,jsonb) from public,anon;
grant execute on function public.admin_save_billing_financials(uuid,jsonb) to authenticated;

create or replace function public.admin_invoice_profit_report() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null or not coalesce(public.is_volttech_admin(),false) then raise exception 'Not authorised';end if;
 select coalesce(jsonb_agg(payload order by created_at desc),'[]'::jsonb) into result from (
 select d.created_at,jsonb_build_object('id',d.id,'ref',d.document_number,'status',d.status,'customer',d.customer_details->>'full_name','subtotal',d.subtotal,'discount_total',d.discount_total,'delivery_fee',d.delivery_fee,'total',d.total,'href','admin-invoices.html?id='||d.id,'financials',public.admin_get_billing_financials(d.id),'items',(select coalesce(jsonb_agg(jsonb_build_object('position',position,'product_id',product_id,'description',description,'quantity',quantity,'unit_price',unit_price)),'[]'::jsonb) from public.billing_document_items where document_id=d.id and active)) as payload from public.billing_documents d where d.kind='invoice'
 union all
 select d.created_at,jsonb_build_object('id',d.id,'ref',d.invoice_number,'status',d.status,'customer',d.customer_name,'subtotal',d.subtotal,'discount_total',d.discount_total,'delivery_fee',d.delivery_fee,'total',d.total,'href','invoice.html?id='||d.id,'financials',jsonb_build_object('saved',false,'items','[]'::jsonb),'items',(select coalesce(jsonb_agg(jsonb_build_object('position',position,'product_id',product_id,'description',description,'quantity',quantity,'unit_price',unit_price)),'[]'::jsonb) from public.invoice_items where invoice_id=d.id)) as payload from public.invoices d
 ) records;
 return result;
end $$;
revoke all on function public.admin_invoice_profit_report() from public,anon;
grant execute on function public.admin_invoice_profit_report() to authenticated;

create or replace function public.admin_save_billing_document(p_data jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare doc public.billing_documents%rowtype;customer public.billing_customers%rowtype;item jsonb;product public.store_products%rowtype;
 did uuid;seq integer:=0;qty numeric;price numeric;amount numeric;v_subtotal numeric:=0;delivery numeric;discount numeric;v_kind text;issue boolean;description text;sku text;
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
  amount:=round(qty*price,2);v_subtotal:=v_subtotal+amount;
  insert into public.billing_document_items(document_id,position,product_id,sku,description,item_type,quantity,unit_price,line_total)
  values(did,seq,product.id,sku,description,case when product.id is not null then 'product' when item->>'item_type'='labour' then 'labour' else 'service' end,qty,price,amount)
  on conflict(document_id,position) do update set product_id=excluded.product_id,sku=excluded.sku,description=excluded.description,item_type=excluded.item_type,quantity=excluded.quantity,unit_price=excluded.unit_price,line_total=excluded.line_total,active=true;
 end loop;
 if v_subtotal+delivery-discount<0 then raise exception 'Discount cannot exceed the document total';end if;
 update public.billing_documents set subtotal=v_subtotal,total=v_subtotal+delivery-discount where id=did;
 if issue then
  update public.billing_documents set status='issued',issued_at=now() where id=did;
 end if;
 if p_data ? 'internal_delivery' then
  if jsonb_typeof(p_data->'internal_delivery') is distinct from 'object' or octet_length((p_data->'internal_delivery')::text)>16000 then raise exception 'Invalid delivery breakdown';end if;
  update public.billing_documents set internal_delivery=p_data->'internal_delivery' where id=did;
 end if;
 if p_data ? 'internal_financials' then perform public.admin_save_billing_financials(did,p_data->'internal_financials');end if;
 return did;
end $$;

