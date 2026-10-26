-- Manual sales documents: customer contacts do not create authentication accounts.
create table public.billing_customers (
 id uuid primary key default gen_random_uuid(), account_id uuid references auth.users(id) on delete set null,
 full_name text not null check(length(full_name) between 1 and 120), billing_email text check(length(billing_email)<=254),
 phone text check(length(phone)<=40),company_name text check(length(company_name)<=160),address text check(length(address)<=1000),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create unique index billing_customers_email_unique on public.billing_customers(lower(billing_email)) where billing_email is not null and billing_email<>'';
create sequence public.billing_quote_number_seq;
create table public.billing_documents (
 id uuid primary key default gen_random_uuid(),customer_id uuid not null references public.billing_customers(id),
 kind text not null check(kind in ('quote','invoice')),status text not null default 'draft' check(status in ('draft','issued','cancelled')),
 document_number text unique,customer_details jsonb not null,title text not null,
 subtotal numeric(14,2) not null,delivery_fee numeric(14,2) not null default 0,discount_total numeric(14,2) not null default 0,total numeric(14,2) not null check(total>=0),
 customer_note text,valid_until date,due_date date,issued_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 created_by uuid not null references auth.users(id),request_key uuid not null unique
);
create table public.billing_document_items (
 id uuid primary key default gen_random_uuid(),document_id uuid not null references public.billing_documents(id) on delete cascade,
 position integer not null,product_id text,sku text,description text not null,item_type text not null,
 quantity numeric(12,2) not null check(quantity>0),unit_price numeric(14,2) not null check(unit_price>=0),line_total numeric(14,2) not null,
 unique(document_id,position)
);
alter table public.billing_document_items add column if not exists active boolean not null default true;
create index billing_documents_customer_idx on public.billing_documents(customer_id,created_at desc);
alter table public.billing_customers enable row level security;
alter table public.billing_documents enable row level security;
alter table public.billing_document_items enable row level security;
revoke all on public.billing_customers,public.billing_documents,public.billing_document_items from anon,authenticated;
grant select on public.billing_customers,public.billing_documents,public.billing_document_items to authenticated;
create policy billing_customers_admin_read on public.billing_customers for select to authenticated using ((select public.is_volttech_admin()));
create policy billing_documents_admin_read on public.billing_documents for select to authenticated using ((select public.is_volttech_admin()));
create policy billing_document_items_admin_read on public.billing_document_items for select to authenticated using ((select public.is_volttech_admin()));

create or replace function public.admin_save_billing_customer(p_data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare row public.billing_customers%rowtype;uid uuid;name text;email text;phone text;company text;address text;
begin
 if auth.uid() is null or not coalesce(public.is_volttech_admin(),false) then raise exception 'Not authorised';end if;
 uid:=nullif(p_data->>'account_id','')::uuid;
 if uid is not null then
  select p.full_name,p.billing_email,p.phone,p.company_name,p.suburb into name,email,phone,company,address from public.profiles p where p.id=uid;
  if not found then raise exception 'Registered customer not found';end if;
 else name:=trim(p_data->>'full_name');email:=lower(nullif(trim(p_data->>'billing_email'),''));phone:=nullif(trim(p_data->>'phone'),'');company:=nullif(trim(p_data->>'company_name'),'');address:=nullif(trim(p_data->>'address'),'');end if;
 name:=coalesce(nullif(name,''),email);
 if name is null or length(name)>120 or (email is not null and email!~'^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') then raise exception 'Enter a customer name and a valid email address, if supplied';end if;
 if email is not null then select * into row from public.billing_customers where lower(billing_email)=lower(email);end if;
 if row.id is not null then return to_jsonb(row);end if;
 insert into public.billing_customers(account_id,full_name,billing_email,phone,company_name,address) values(uid,name,email,phone,company,address) returning * into row;
 return to_jsonb(row);
end $$;

create or replace function public.admin_billing_catalogue(p_offset integer default 0) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null or not coalesce(public.is_volttech_admin(),false) then raise exception 'Not authorised';end if;
 select jsonb_build_object('total',(select count(*) from public.store_products where not is_demo and status<>'discontinued'),'products',coalesce(jsonb_agg(to_jsonb(p)),'[]'::jsonb)) into result
 from (select id,slug,name,brand,model,identifiers,retail_price,stock_qty,stock_status,category_slug,type,status,visibility,sale_mode,specs,compatibility,short_description,highlights
 from public.store_products where not is_demo and status<>'discontinued' order by id offset greatest(p_offset,0) limit 1000) p;
 return result;
end $$;

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
  update public.billing_documents set status='issued',issued_at=now(),document_number=case v_kind when 'invoice' then 'VT-INV-'||to_char(current_date,'YYYY')||'-'||lpad(nextval('public.invoice_number_seq'::regclass)::text,4,'0') else 'VT-Q-'||to_char(current_date,'YYYY')||'-M'||lpad(nextval('public.billing_quote_number_seq'::regclass)::text,4,'0') end where id=did;
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
 update public.billing_documents set status='issued',issued_at=now(),updated_at=now(),document_number=case doc.kind when 'invoice' then 'VT-INV-'||to_char(current_date,'YYYY')||'-'||lpad(nextval('public.invoice_number_seq'::regclass)::text,4,'0') else 'VT-Q-'||to_char(current_date,'YYYY')||'-M'||lpad(nextval('public.billing_quote_number_seq'::regclass)::text,4,'0') end where id=p_id;
end $$;
revoke all on function public.admin_save_billing_customer(jsonb),public.admin_billing_catalogue(integer),public.admin_save_billing_document(jsonb),public.admin_issue_billing_document(uuid) from public,anon;
grant execute on function public.admin_save_billing_customer(jsonb),public.admin_billing_catalogue(integer),public.admin_save_billing_document(jsonb),public.admin_issue_billing_document(uuid) to authenticated;

-- Strip internal commercial fields from historical customer-readable snapshots.
create or replace function public.vt_redact_commercial_json(value jsonb) returns jsonb language plpgsql immutable security invoker set search_path='' as $$
declare result jsonb;entry record;
begin
 if jsonb_typeof(value)='object' then
  result:='{}';for entry in select key,val from jsonb_each(value) as t(key,val) loop
   if entry.key!~*'supplier|cost|markup|margin|internal|reservation|source_metadata' then result:=result||jsonb_build_object(entry.key,public.vt_redact_commercial_json(entry.val));end if;
  end loop;return result;
 elsif jsonb_typeof(value)='array' then select coalesce(jsonb_agg(public.vt_redact_commercial_json(e)),'[]'::jsonb) into result from jsonb_array_elements(value) e;return result;
 else return value;end if;
end $$;
update public.customer_documents set snapshot=public.vt_redact_commercial_json(snapshot) where document_type in ('quote','invoice');
create or replace function public.vt_sanitize_customer_document() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.document_type in ('quote','invoice') then new.snapshot:=public.vt_redact_commercial_json(new.snapshot);end if;return new;
end $$;
create trigger sanitize_commercial_snapshot before insert or update of snapshot on public.customer_documents for each row execute function public.vt_sanitize_customer_document();
revoke all on function public.snapshot_quote(uuid),public.snapshot_invoice(uuid) from public,anon;
grant execute on function public.snapshot_quote(uuid),public.snapshot_invoice(uuid) to authenticated;
-- Customers cannot request private quote fields directly through the data API.
revoke select on public.quotes,public.quote_items from public,anon,authenticated;
grant select(id,user_id,quote_number,quote_type,title,status,currency,subtotal,discount_total,delivery_fee,tax_total,total,vat_registered,customer_note,valid_until,sent_at,viewed_at,accepted_at,declined_at,terms_version,created_at,updated_at,source_type,source_id) on public.quotes to authenticated;
grant select(id,quote_id,user_id,position,item_type,description,sku,quantity,unit_price,line_total,stock_status,price_checked_at,created_at,product_id) on public.quote_items to authenticated;
