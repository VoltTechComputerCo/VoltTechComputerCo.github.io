create or replace function public.enforce_store_launch_readiness()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  product_count integer := 0;
  bad_price integer := 0;
  bad_stock integer := 0;
  stale_price integer := 0;
  shipping_cfg jsonb := '{}'::jsonb;
  bobgo_set boolean := false;
  yoco_key_set boolean := false;
  yoco_webhook_set boolean := false;
begin
  if new.builder_enabled is true and coalesce(old.builder_enabled,false) is false then
    raise exception 'Builder launch is intentionally locked while custom PC build sales are paused.';
  end if;
  if new.catalogue_enabled is true and coalesce(old.catalogue_enabled,false) is false then
    select count(*),
           count(*) filter (where retail_price is null or retail_price <= 0),
           count(*) filter (where coalesce(stock_status,'') not in ('confirmed','in_stock','available')),
           count(*) filter (where price_checked_at is null or price_checked_at < now() - interval '7 days')
      into product_count,bad_price,bad_stock,stale_price
      from public.store_products
     where status='active' and visibility='public' and is_demo=false;
    if product_count < 1 then raise exception 'Store launch blocked: no customer-facing catalogue products are loaded.'; end if;
    if coalesce(new.direct_payment_enabled,false) is true then
      select coalesce(value,'{}'::jsonb) into shipping_cfg from public.store_private_settings where id='shipping';
      select exists(select 1 from vault.secrets where name='bobgo_api_token') into bobgo_set;
      select exists(select 1 from vault.secrets where name='yoco_secret_key') into yoco_key_set;
      select exists(select 1 from vault.secrets where name='yoco_webhook_secret') into yoco_webhook_set;
      if bad_price > 0 or bad_stock > 0 or stale_price > 0
         or not (shipping_cfg ? 'collection_address') or not (shipping_cfg ? 'collection_contact')
         or not bobgo_set or not yoco_key_set or not yoco_webhook_set then
        raise exception 'Store launch blocked: direct-payment commerce readiness checks have not passed.';
      end if;
    end if;
  end if;
  return new;
end;
$function$;
