create or replace function public.enforce_store_launch_readiness()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  product_count integer := 0;
  builder_product_count integer := 0;
  required_category_count integer := 0;
  bad_price integer := 0;
  bad_stock integer := 0;
  stale_price integer := 0;
  shipping_cfg jsonb := '{}'::jsonb;
  bobgo_set boolean := false;
  yoco_key_set boolean := false;
  yoco_webhook_set boolean := false;
begin
  if new.builder_enabled is true and coalesce(old.builder_enabled,false) is false then
    select count(*) into builder_product_count
    from public.store_products
    where status='active' and visibility='public' and sale_mode<>'hidden'
      and metadata->>'builderId' is not null;

    select count(distinct type) into required_category_count
    from public.store_products
    where status='active' and visibility='public' and sale_mode<>'hidden'
      and metadata->>'builderId' is not null
      and type in ('cpu','motherboard','memory','gpu','case','cooler','psu','storage');

    if builder_product_count < 8 or required_category_count < 8 then
      raise exception 'Builder launch blocked: the linked component catalogue is incomplete.';
    end if;

    if to_regclass('public.saved_builds') is null
       or to_regprocedure('public.customer_request_build_quote(uuid)') is null then
      raise exception 'Builder launch blocked: saved-build or quote-request services are unavailable.';
    end if;
  end if;

  if new.catalogue_enabled is true and coalesce(old.catalogue_enabled,false) is false then
    select count(*),
           count(*) filter (where retail_price is null or retail_price <= 0),
           count(*) filter (where coalesce(stock_status,'') not in ('confirmed','in_stock','available','in-stock','available-to-order')),
           count(*) filter (where price_checked_at is null or price_checked_at < now() - interval '7 days')
      into product_count,bad_price,bad_stock,stale_price
      from public.store_products
     where status='active' and visibility='public' and is_demo=false;

    if product_count < 1 then
      raise exception 'Store launch blocked: no customer-facing catalogue products are loaded.';
    end if;

    if coalesce(new.direct_payment_enabled,false) is true then
      select coalesce(value,'{}'::jsonb) into shipping_cfg
      from public.store_private_settings
      where id='shipping';

      select exists(select 1 from vault.secrets where name='bobgo_api_token') into bobgo_set;
      select exists(select 1 from vault.secrets where name='yoco_secret_key') into yoco_key_set;
      select exists(select 1 from vault.secrets where name='yoco_webhook_secret') into yoco_webhook_set;

      if bad_price > 0
         or bad_stock > 0
         or stale_price > 0
         or not (shipping_cfg ? 'collection_address')
         or not (shipping_cfg ? 'collection_contact')
         or not bobgo_set
         or not yoco_key_set
         or not yoco_webhook_set then
        raise exception 'Store launch blocked: direct-payment commerce readiness checks have not passed.';
      end if;
    end if;
  end if;

  return new;
end;
$function$;

create or replace function public.admin_store_launch_readiness()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  product_count integer := 0;
  builder_product_count integer := 0;
  required_category_count integer := 0;
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
  builder_reasons jsonb := '[]'::jsonb;
begin
  if not public.is_volttech_admin() then raise exception 'Not authorised'; end if;

  select coalesce(direct_payment_enabled,false) into direct_pay
  from public.store_settings where id='store';

  select count(*) into demo_count
  from public.store_products
  where status='active' and visibility='public' and is_demo=true;

  select count(*),
         count(*) filter (where retail_price is null or retail_price <= 0),
         count(*) filter (where coalesce(stock_status,'') not in ('confirmed','in_stock','available','in-stock','available-to-order')),
         count(*) filter (where price_checked_at is null or price_checked_at < now() - interval '7 days')
    into product_count,bad_price,bad_stock,stale_price
    from public.store_products
   where status='active' and visibility='public' and is_demo=false;

  select count(*) into builder_product_count
  from public.store_products
  where status='active' and visibility='public' and sale_mode<>'hidden'
    and metadata->>'builderId' is not null;

  select count(distinct type) into required_category_count
  from public.store_products
  where status='active' and visibility='public' and sale_mode<>'hidden'
    and metadata->>'builderId' is not null
    and type in ('cpu','motherboard','memory','gpu','case','cooler','psu','storage');

  if builder_product_count < 8 then builder_reasons := builder_reasons || jsonb_build_array('Not enough Builder-linked products are available'); end if;
  if required_category_count < 8 then builder_reasons := builder_reasons || jsonb_build_array('One or more required Builder categories are empty'); end if;
  if to_regclass('public.saved_builds') is null then builder_reasons := builder_reasons || jsonb_build_array('Saved-build service is unavailable'); end if;
  if to_regprocedure('public.customer_request_build_quote(uuid)') is null then builder_reasons := builder_reasons || jsonb_build_array('Builder quote-request service is unavailable'); end if;

  select coalesce(value,'{}'::jsonb) into shipping_cfg
  from public.store_private_settings where id='shipping';
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

  return jsonb_build_object(
    'store_ready',jsonb_array_length(reasons)=0,
    'quote_first_mode',not direct_pay,
    'builder_ready',jsonb_array_length(builder_reasons)=0,
    'builder_locked_reason',case when jsonb_array_length(builder_reasons)=0 then null else builder_reasons end,
    'builder_product_count',builder_product_count,
    'builder_required_category_count',required_category_count,
    'real_product_count',product_count,
    'demo_product_count',demo_count,
    'missing_price_count',bad_price,
    'unconfirmed_stock_count',bad_stock,
    'stale_price_count',stale_price,
    'shipping_configured',(shipping_cfg ? 'collection_address') and (shipping_cfg ? 'collection_contact') and bobgo_set,
    'payments_configured',yoco_key_set and yoco_webhook_set,
    'reasons',reasons
  );
end;
$function$;

update public.store_settings
set builder_enabled=true,
    banner_text='VoltTech PC Parts + PC Builder are live in quote-first mode. Stock, final pricing, compatibility and delivery are confirmed before payment.',
    updated_at=now()
where id='store';
