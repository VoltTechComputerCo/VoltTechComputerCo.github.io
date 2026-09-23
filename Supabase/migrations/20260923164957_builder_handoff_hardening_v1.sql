create or replace function public.vt_guard_saved_build_write()
returns trigger
language plpgsql
set search_path to ''
as $function$
declare
  v_categories jsonb;
  v_required text;
  v_gpu_optional boolean;
begin
  if public.is_volttech_admin() then
    return new;
  end if;

  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if tg_op = 'INSERT' then
    if new.user_id <> auth.uid() then
      raise exception 'Not authorised';
    end if;
    if new.status <> 'saved' then
      raise exception 'New builds must start as saved';
    end if;
    if new.quote_id is not null or new.quote_requested_at is not null or new.quoted_at is not null then
      raise exception 'Quote fields are server managed';
    end if;
    new.created_at := now();
    new.updated_at := now();
    return new;
  end if;

  if old.user_id <> auth.uid() or new.user_id <> old.user_id then
    raise exception 'Not authorised';
  end if;

  if new.quote_id is distinct from old.quote_id
     or new.quoted_at is distinct from old.quoted_at
     or new.created_at is distinct from old.created_at then
    raise exception 'Quote and creation fields are server managed';
  end if;

  if old.status = 'saved' and new.status = 'saved' then
    if new.quote_requested_at is distinct from old.quote_requested_at then
      raise exception 'Quote request timestamp is server managed';
    end if;
    new.updated_at := now();
    return new;
  end if;

  if old.status = 'saved' and new.status = 'quote_requested' then
    if new.quote_id is not null or new.quoted_at is not null then
      raise exception 'Quote linkage is admin managed';
    end if;
    if coalesce(new.compatibility_status, '') not in ('clear','review') then
      raise exception 'Build must be complete and free of hard compatibility conflicts';
    end if;

    v_categories := new.build_data #> '{serialized,categories}';
    if jsonb_typeof(v_categories) <> 'object' then
      raise exception 'Build component data is incomplete';
    end if;

    foreach v_required in array array['cpu','motherboard','memory','case','cooler','psu','storage']
    loop
      if jsonb_typeof(v_categories -> v_required) <> 'array'
         or jsonb_array_length(v_categories -> v_required) = 0 then
        raise exception 'Build component data is incomplete';
      end if;
    end loop;

    v_gpu_optional := coalesce(new.build_data #>> '{serialized,gpuOptional}', 'false') = 'true';
    if not v_gpu_optional and (
      jsonb_typeof(v_categories -> 'gpu') <> 'array'
      or jsonb_array_length(v_categories -> 'gpu') = 0
    ) then
      raise exception 'A graphics card is required for this build';
    end if;

    new.quote_requested_at := now();
    new.updated_at := now();
    return new;
  end if;

  raise exception 'This build is locked after a quote request';
end;
$function$;

drop trigger if exists vt_guard_saved_build_write on public.saved_builds;
create trigger vt_guard_saved_build_write
before insert or update on public.saved_builds
for each row execute function public.vt_guard_saved_build_write();

drop policy if exists saved_builds_insert on public.saved_builds;
create policy saved_builds_insert
on public.saved_builds
for insert
to authenticated
with check (
  auth.uid() = user_id
  and status = 'saved'
  and quote_id is null
  and quote_requested_at is null
  and quoted_at is null
);

create or replace function public.customer_request_build_quote(p_build_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_row public.saved_builds%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  update public.saved_builds
     set status = 'quote_requested'
   where id = p_build_id
     and user_id = auth.uid()
     and status = 'saved'
  returning * into v_row;

  if v_row.id is null then
    raise exception 'Saved build not found or no longer editable';
  end if;

  return jsonb_build_object(
    'id', v_row.id,
    'status', v_row.status,
    'quote_requested_at', v_row.quote_requested_at
  );
end;
$function$;

revoke all on function public.customer_request_build_quote(uuid) from public;
grant execute on function public.customer_request_build_quote(uuid) to authenticated;

create or replace function public.admin_create_quote(
  p_user_id uuid,
  p_quote_type text,
  p_title text,
  p_valid_until date,
  p_customer_note text,
  p_internal_note text,
  p_delivery_fee numeric,
  p_discount_total numeric,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
declare
  q uuid;
  x jsonb;
  n int:=0;
begin
  if not public.is_volttech_admin() then
    raise exception 'Not authorised';
  end if;

  insert into public.quotes(
    user_id,quote_number,quote_type,title,status,valid_until,
    customer_note,internal_note,delivery_fee,discount_total
  )
  values(
    p_user_id,
    'VT-Q-'||to_char(current_date,'YYYY')||'-'||substr(gen_random_uuid()::text,1,6),
    p_quote_type,p_title,'draft',p_valid_until,p_customer_note,p_internal_note,
    coalesce(p_delivery_fee,0),coalesce(p_discount_total,0)
  )
  returning id into q;

  for x in select value from jsonb_array_elements(p_items) loop
    n:=n+1;

    insert into public.quote_items(
      quote_id,user_id,position,item_type,description,sku,quantity,unit_price,line_total,
      supplier,supplier_sku,supplier_cost,stock_status,price_checked_at,product_id,source_metadata
    )
    values(
      q,p_user_id,n,
      coalesce(x->>'item_type','service'),
      x->>'description',
      nullif(x->>'sku',''),
      (x->>'quantity')::numeric,
      (x->>'unit_price')::numeric,
      (x->>'quantity')::numeric*(x->>'unit_price')::numeric,
      nullif(x->>'supplier',''),
      nullif(x->>'supplier_sku',''),
      nullif(x->>'supplier_cost','')::numeric,
      nullif(x->>'stock_status',''),
      nullif(x->>'price_checked_at','')::timestamptz,
      nullif(x->>'product_id',''),
      coalesce(x->'source_metadata','{}'::jsonb)
    );
  end loop;

  update public.quotes
  set subtotal=(select coalesce(sum(line_total),0) from public.quote_items where quote_id=q)
  where id=q;

  update public.quotes
  set total=subtotal+coalesce(delivery_fee,0)-coalesce(discount_total,0),
      updated_at=now()
  where id=q;

  return q;
end;
$function$;

create or replace function public.admin_quote_saved_build(
  p_build_id uuid,
  p_valid_until date default null
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
declare
  b public.saved_builds%rowtype;
  q uuid;
  v_items jsonb;
begin
  if not public.is_volttech_admin() then
    raise exception 'Not authorised';
  end if;

  select *
    into b
    from public.saved_builds
   where id = p_build_id
   for update;

  if b.id is null then
    raise exception 'Build not found';
  end if;
  if b.status <> 'quote_requested' then
    raise exception 'Build is not awaiting a quote';
  end if;

  select jsonb_agg(
    jsonb_build_object(
      'product_id', nullif(item->>'product_id',''),
      'description', item->>'name',
      'quantity', greatest(coalesce(nullif(item->>'quantity','')::numeric,1),1),
      'unit_price', coalesce(nullif(item->>'unit_price','')::numeric,0),
      'item_type', 'product',
      'supplier', nullif(item->>'supplier',''),
      'supplier_sku', nullif(item->>'supplier_sku',''),
      'supplier_cost', null,
      'stock_status', nullif(item->>'stock_status',''),
      'price_checked_at', nullif(item->>'price_checked_at',''),
      'source_metadata', jsonb_strip_nulls(jsonb_build_object(
        'builder_category', nullif(item->>'type',''),
        'builder_product_id', nullif(item->>'product_id',''),
        'offer_freshness', nullif(item->>'offer_freshness',''),
        'offer_stale', item->'offer_stale',
        'pricing_basis', coalesce(nullif(item->>'pricing_basis',''),'builder_estimate')
      ))
    )
  )
  into v_items
  from jsonb_array_elements(coalesce(b.build_data->'items','[]'::jsonb)) as item;

  if jsonb_array_length(coalesce(v_items,'[]'::jsonb)) = 0 then
    raise exception 'Build has no quoteable component items';
  end if;

  q := public.admin_create_quote(
    b.user_id,
    'system_build',
    'PC Build — ' || coalesce(nullif(b.name,''),'Custom configuration'),
    coalesce(p_valid_until, current_date + 7),
    'Prepared from your saved VoltTech PC Builder configuration. Final stock, compatibility and pricing must be reviewed before this quotation is sent.',
    'PC Builder saved build ' || b.id::text,
    0,
    0,
    v_items
  );

  perform public.admin_link_quote_source(
    q,
    'builder',
    b.id::text,
    jsonb_build_object(
      'saved_build_name', b.name,
      'estimated_total', b.estimated_total,
      'estimated_power_watts', b.estimated_power_watts,
      'compatibility_status', b.compatibility_status,
      'component_count', jsonb_array_length(coalesce(b.build_data->'items','[]'::jsonb)),
      'linked_product_count', (
        select count(*)
        from jsonb_array_elements(coalesce(b.build_data->'items','[]'::jsonb)) as item
        where nullif(item->>'product_id','') is not null
      ),
      'pricing_basis', 'builder_estimate'
    )
  );

  update public.saved_builds
     set status='quoted',
         quote_id=q::text,
         quoted_at=now(),
         updated_at=now()
   where id=b.id;

  return q;
end;
$function$;

revoke all on function public.admin_quote_saved_build(uuid,date) from public;
grant execute on function public.admin_quote_saved_build(uuid,date) to authenticated;
