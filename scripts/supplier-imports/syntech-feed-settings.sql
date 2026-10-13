-- Only the owner may configure feeds; account-key URLs stay in encrypted Vault.
create or replace function public.admin_configure_syntech_feeds(p_full_url text,p_update_url text) returns void language plpgsql security definer set search_path='' as $$
declare n text; u text; sid uuid;
begin
 if auth.uid() is null or not coalesce(public.is_volttech_admin(),false) then raise exception 'Not authorised';end if;
 foreach u in array array[p_full_url,p_update_url] loop
  if length(u)>2048 or u !~ '^https://([a-zA-Z0-9-]+\.)*syntech\.co\.za/' then raise exception 'Use the HTTPS JSON feed links from Syntech';end if;
 end loop;
 for n,u in select 'syntech_full_feed_url',p_full_url union all select 'syntech_update_feed_url',p_update_url loop
  select id into sid from vault.secrets where name=n;
  if sid is null then perform vault.create_secret(u,n);else perform vault.update_secret(sid,u,n);end if;
 end loop;
 update public.store_suppliers set feed_status='configured',metadata=metadata||jsonb_build_object('feed_activation_required',false),updated_at=now() where id='syntech';
end $$;
revoke all on function public.admin_configure_syntech_feeds(text,text) from public,anon;
grant execute on function public.admin_configure_syntech_feeds(text,text) to authenticated;

create or replace function public.vt_claim_syntech_sync() returns boolean language plpgsql security definer set search_path='' as $$
declare s public.store_suppliers%rowtype;
begin
 select * into s from public.store_suppliers where id='syntech' for update;
 if s.feed_status='blocked' or ((s.metadata->>'sync_paused_until')::timestamptz>now()) or ((s.metadata->>'last_attempt_at')::timestamptz>now()-interval '20 minutes') then return false;end if;
 update public.store_suppliers set metadata=metadata||jsonb_build_object('last_attempt_at',now()) where id='syntech';
 return true;
end $$;
revoke all on function public.vt_claim_syntech_sync() from public,anon,authenticated;
grant execute on function public.vt_claim_syntech_sync() to service_role;

-- This token authenticates only the fixed server-side feed sync endpoint.
do $$ begin
 if not exists(select 1 from vault.secrets where name='supplier_sync_cron_token') then
  perform vault.create_secret(encode(extensions.gen_random_bytes(32),'hex'),'supplier_sync_cron_token');
 end if;
end $$;
create or replace function public.vt_run_syntech_sync(p_mode text default 'update') returns void language plpgsql security definer set search_path='' as $$
declare token text;
begin
 if p_mode not in ('full','update') then raise exception 'Invalid mode';end if;
 if not exists(select 1 from vault.secrets where name=case p_mode when 'full' then 'syntech_full_feed_url' else 'syntech_update_feed_url' end) then return;end if;
 select decrypted_secret into token from vault.decrypted_secrets where name='supplier_sync_cron_token';
 perform net.http_post(url:='https://qdqhfnvwqvgesfdmocir.supabase.co/functions/v1/sync-supplier-catalogue',headers:=jsonb_build_object('Content-Type','application/json','x-supplier-cron-token',token),body:=jsonb_build_object('supplier','syntech','mode',p_mode),timeout_milliseconds:=120000);
end $$;
revoke all on function public.vt_run_syntech_sync(text) from public,anon,authenticated;
grant execute on function public.vt_run_syntech_sync(text) to service_role;
select cron.schedule('syntech-stock-hourly','13 * * * *','select public.vt_run_syntech_sync(''update'');');
select cron.schedule('syntech-catalogue-daily','43 1 * * *','select public.vt_run_syntech_sync(''full'');');

create or replace function public.vt_update_preferred_offer_products(p_ids text[]) returns void language sql security invoker set search_path='' as $$
 with ranked as (
  select o.*,row_number() over(partition by o.product_id order by case when o.stock_qty>0 then 0 else 1 end,coalesce(s.priority,100),o.cost_price) as position
  from public.store_supplier_offers o left join public.store_suppliers s on s.id=o.supplier_id
  where o.product_id=any(p_ids)
 ), best as(select * from ranked where position=1)
 update public.store_products p set stock_qty=b.stock_qty,stock_status=b.stock_status,price_checked_at=b.last_checked,
 retail_price=case when coalesce((p.metadata->>'auto_markup_disabled')::boolean,false) then p.retail_price else round(b.cost_price*(1+coalesce((p.metadata->>'markup_percent')::numeric,30)/100),2) end,
 metadata=p.metadata||jsonb_build_object('preferred_supplier',b.supplier_id,'preferred_supplier_name',b.supplier_name,'stock_connected',b.stock_qty is not null,'pricing_state','priced','last_supplier_sync',now()),updated_at=now()
 from best b where p.id=b.product_id;
$$;
revoke all on function public.vt_update_preferred_offer_products(text[]) from public,anon,authenticated;
grant execute on function public.vt_update_preferred_offer_products(text[]) to service_role;
