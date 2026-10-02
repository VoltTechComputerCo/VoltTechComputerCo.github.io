create or replace function public.admin_store_launch_readiness()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  product_count integer := 0;
  bad_price integer := 0;
  bad_stock integer := 0;
  stale_price integer := 0;
  demo_count integer := 0;
  shipping_cfg jsonb := '{}'::jsonb;
  bobgo_set boolean := false;
  yoco_key_set boolean := false;
  yoco_webhook_set boolean := false;
  direct_pay boolean := false;
  reasons jsonb := '[]'::jsonb;
  store_ready boolean := false;
begin
  if not public.is_volttech_admin() then raise exception 'Not authorised'; end if;
  select coalesce(direct_payment_enabled,false) into direct_pay from public.store_settings where id='store';
  select count(*) into demo_count from public.store_products where status='active' and visibility='public' and is_demo=true;
  select count(*),
         count(*) filter (where retail_price is null or retail_price <= 0),
         count(*) filter (where coalesce(stock_status,'') not in ('confirmed','in_stock','available')),
         count(*) filter (where price_checked_at is null or price_checked_at < now() - interval '7 days')
    into product_count,bad_price,bad_stock,stale_price
    from public.store_products
   where status='active' and visibility='public' and is_demo=false;
  select coalesce(value,'{}'::jsonb) into shipping_cfg from public.store_private_settings where id='shipping';
  select exists(select 1 from vault.secrets where name='bobgo_api_token') into bobgo_set;
  select exists(select 1 from vault.secrets where name='yoco_secret_key') into yoco_key_set;
  select exists(select 1 from vault.secrets where name='yoco_webhook_secret') into yoco_webhook_set;
  if product_count < 1 then reasons := reasons || jsonb_build_array('No customer-facing catalogue products are loaded'); end if;
  if direct_pay then
    if bad_price > 0 then reasons := reasons || jsonb_build_array(bad_price || ' product(s) missing a sellable price'); end if;
    if bad_stock > 0 then reasons := reasons || jsonb_build_array(bad_stock || ' product(s) do not have confirmed sellable stock'); end if;
    if stale_price > 0 then reasons := reasons || jsonb_build_array(stale_price || ' product price check(s) are older than 7 days or missing'); end if;
    if not (shipping_cfg ? 'collection_address') then reasons := reasons || jsonb_build_array('Bob Go collection address is not configured'); end if;
    if not (shipping_cfg ? 'collection_contact') then reasons := reasons || jsonb_build_array('Bob Go collection contact is not configured'); end if;
    if not bobgo_set then reasons := reasons || jsonb_build_array('Bob Go API token is not configured'); end if;
    if not yoco_key_set then reasons := reasons || jsonb_build_array('Yoco secret key is not configured'); end if;
    if not yoco_webhook_set then reasons := reasons || jsonb_build_array('Yoco webhook secret is not configured'); end if;
  end if;
  store_ready := jsonb_array_length(reasons)=0;
  return jsonb_build_object(
    'store_ready',store_ready,'quote_first_mode',not direct_pay,'builder_ready',false,
    'builder_locked_reason','Custom PC Builder launch is intentionally paused.',
    'real_product_count',product_count,'demo_product_count',demo_count,
    'missing_price_count',bad_price,'unconfirmed_stock_count',bad_stock,'stale_price_count',stale_price,
    'shipping_configured',(shipping_cfg ? 'collection_address') and (shipping_cfg ? 'collection_contact') and bobgo_set,
    'payments_configured',yoco_key_set and yoco_webhook_set,'reasons',reasons
  );
end;
$function$;
