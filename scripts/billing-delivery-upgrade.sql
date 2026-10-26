-- Upgrade existing manual billing: shared numbering, private delivery breakdown and record search.
alter table public.billing_documents add column if not exists internal_delivery jsonb not null default '{}'::jsonb;

create or replace function public.vt_next_billing_number(p_kind text) returns text language plpgsql security definer set search_path='' as $$
declare n text;
begin
 perform pg_advisory_xact_lock(hashtextextended('volttech-document-number',0));
 loop
  if p_kind='invoice' then n:='VT-INV-'||to_char(current_date,'YYYY')||'-'||lpad(nextval('public.invoice_number_seq'::regclass)::text,4,'0');
  elsif p_kind='quote' then n:='VT-Q-'||to_char(current_date,'YYYY')||'-'||substr(gen_random_uuid()::text,1,6);
  else raise exception 'Invalid document kind';end if;
  exit when not exists(select 1 from public.billing_documents where document_number=n)
   and not exists(select 1 from public.quotes where quote_number=n)
   and not exists(select 1 from public.invoices where invoice_number=n);
 end loop;
 return n;
end $$;
revoke all on function public.vt_next_billing_number(text) from public,anon,authenticated;

create or replace function public.vt_assign_billing_number() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if TG_OP='UPDATE' then
  if old.status='issued' then new.document_number:=old.document_number;return new;end if;
  if old.document_number is not null and new.kind=old.kind then new.document_number:=old.document_number;return new;end if;
 end if;
 new.document_number:=public.vt_next_billing_number(new.kind);
 return new;
end $$;
revoke all on function public.vt_assign_billing_number() from public,anon,authenticated;
create trigger billing_assign_number before insert or update of kind,document_number on public.billing_documents for each row execute function public.vt_assign_billing_number();
update public.billing_documents set document_number=document_number,updated_at=now() where document_number is null;

create or replace function public.admin_billing_sourcing(p_product_ids text[]) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null or not coalesce(public.is_volttech_admin(),false) then raise exception 'Not authorised';end if;
 if cardinality(p_product_ids)>200 then raise exception 'Too many products';end if;
 select coalesce(jsonb_agg(jsonb_build_object('product_id',product_id,'supplier_id',supplier_id,'supplier_name',supplier_name,'cost_incl',cost_price,'cost_excl',round(cost_price/1.15,2),'stock_qty',stock_qty,'last_checked',last_checked) order by supplier_id),'[]'::jsonb) into result from public.store_supplier_offers where product_id=any(p_product_ids);
 return result;
end $$;
revoke all on function public.admin_billing_sourcing(text[]) from public,anon;
grant execute on function public.admin_billing_sourcing(text[]) to authenticated;

create or replace function public.admin_billing_records() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null or not coalesce(public.is_volttech_admin(),false) then raise exception 'Not authorised';end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',d.id,'kind',d.kind,'status',d.status,'document_number',d.document_number,'title',d.title,'total',d.total,'created_at',d.created_at,'customer_details',d.customer_details,'items',(select coalesce(jsonb_agg(jsonb_build_object('description',i.description,'sku',i.sku)),'[]'::jsonb) from public.billing_document_items i where i.document_id=d.id and i.active)) order by d.created_at desc),'[]'::jsonb) into result from public.billing_documents d;
 return result;
end $$;
revoke all on function public.admin_billing_records() from public,anon;
grant execute on function public.admin_billing_records() to authenticated;

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
 return did;
end $$;

create or replace function public.admin_issue_billing_document(p_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare doc public.billing_documents%rowtype;
begin
 if auth.uid() is null or not coalesce(public.is_volttech_admin(),false) then raise exception 'Not authorised';end if;
 select * into doc from public.billing_documents where id=p_id for update;
 if doc.id is null then raise exception 'Document not found';end if;
 if doc.status='issued' then return;end if;
 if doc.status<>'draft' then raise exception 'Only a draft can be issued';end if;
 update public.billing_documents set status='issued',issued_at=now(),updated_at=now() where id=p_id;
end $$;
