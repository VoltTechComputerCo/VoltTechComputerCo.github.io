create table if not exists public.store_suppliers(
  id text primary key,
  name text not null,
  account_reference text,
  status text not null default 'active' check(status in ('active','pending','paused')),
  priority integer not null default 100 check(priority > 0),
  feed_mode text,
  feed_status text not null default 'not_configured',
  feed_last_synced_at timestamptz,
  contact_name text,
  contact_email text,
  contact_phone text,
  portal_url text,
  order_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.store_suppliers enable row level security;
revoke all on public.store_suppliers from anon, authenticated;
grant select on public.store_suppliers to authenticated;
grant all on public.store_suppliers to service_role;
drop policy if exists store_suppliers_admin_read on public.store_suppliers;
create policy store_suppliers_admin_read on public.store_suppliers for select to authenticated using (public.is_volttech_admin());

insert into public.store_suppliers(id,name,account_reference,status,priority,feed_mode,feed_status,contact_name,contact_email,contact_phone,portal_url,order_url,metadata) values
('syntech','Syntech',null,'active',10,'account-feed-json','awaiting_feed_urls','Karjil Mahadeo','Karjil@syntech.co.za','060 551 4851','https://www.syntech.co.za/my-account/feeds/','https://www.syntech.co.za/my-account/',jsonb_build_object('application_reference','RSA0017947','approval','approved','role','preferred','feeds',jsonb_build_array('JSON','CSV','XML'),'feed_strategy','full daily; update hourly','cost_vat_basis','exclusive')),
('tarsus','Tarsus Distribution','TA10047603','active',20,'rest-api','credentials_ready','Neo Moloi','NMoloi@tarsus.co.za','+27 72 894 6489','https://portal.tarsusdistribution.co.za/','https://portal.tarsusdistribution.co.za/default.aspx',jsonb_build_object('approval','approved','rest_api',true,'xml_feed',true,'cost_vat_basis','exclusive','stock_semantics','quantity')),
('esquire','Esquire Technologies','VLHR01','active',30,'csv-xml','live','Brenton John','brenton@esquire.co.za','0861700000','https://www.esquire.co.za/','https://www.esquire.co.za/',jsonb_build_object('approval','approved','direct_courier_confirmed',true,'collection_address','71 Landmarks Ave, Samrand Business Park, Centurion, 0157','cost_vat_basis','inclusive'))
on conflict(id) do update set name=excluded.name,account_reference=coalesce(excluded.account_reference,public.store_suppliers.account_reference),status=excluded.status,priority=excluded.priority,feed_mode=excluded.feed_mode,contact_name=excluded.contact_name,contact_email=excluded.contact_email,contact_phone=excluded.contact_phone,portal_url=excluded.portal_url,order_url=excluded.order_url,metadata=public.store_suppliers.metadata||excluded.metadata,updated_at=now();

create or replace function public.vt_supplier_secret(p_name text) returns text language sql security definer set search_path='' as $$
 select decrypted_secret from vault.decrypted_secrets where name=p_name order by updated_at desc limit 1
$$;
revoke all on function public.vt_supplier_secret(text) from public,anon,authenticated;
grant execute on function public.vt_supplier_secret(text) to service_role;

create or replace function public.admin_supplier_status() returns jsonb language sql security definer set search_path='' as $$
 select case when public.is_volttech_admin() then coalesce(jsonb_agg(jsonb_build_object(
  'id',s.id,'name',s.name,'account_reference',s.account_reference,'status',s.status,'priority',s.priority,'feed_mode',s.feed_mode,'feed_status',s.feed_status,'feed_last_synced_at',s.feed_last_synced_at,
  'contact_name',s.contact_name,'contact_email',s.contact_email,'contact_phone',s.contact_phone,'portal_url',s.portal_url,'order_url',s.order_url,'metadata',s.metadata,
  'offers',coalesce(o.offer_count,0),'in_stock_offers',coalesce(o.in_stock_count,0)
 ) order by s.priority,s.name),'[]'::jsonb) else '[]'::jsonb end
 from public.store_suppliers s
 left join (
  select supplier_id,count(*) offer_count,count(*) filter(where coalesce(stock_qty,0)>0 and stock_status not in ('out-of-stock','out_of_stock')) in_stock_count
  from public.store_supplier_offers group by supplier_id
 ) o on o.supplier_id=s.id
$$;
revoke all on function public.admin_supplier_status() from public,anon;
grant execute on function public.admin_supplier_status() to authenticated;
