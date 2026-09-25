create or replace function public.customer_save_address_v1(
  p_address_id uuid default null,
  p_label text default 'Delivery address',
  p_recipient_name text default null,
  p_phone text default null,
  p_address_line1 text default null,
  p_address_line2 text default null,
  p_suburb text default null,
  p_city text default null,
  p_province text default null,
  p_postal_code text default null,
  p_country text default 'South Africa',
  p_is_default_shipping boolean default false
)
returns uuid
language plpgsql
security invoker
set search_path to ''
as $function$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if coalesce(btrim(p_address_line1), '') = '' or coalesce(btrim(p_city), '') = '' then
    raise exception 'Address line 1 and city are required';
  end if;
  if p_address_id is not null and not exists (
    select 1 from public.customer_addresses where id = p_address_id and user_id = v_uid
  ) then raise exception 'Address not found'; end if;
  if coalesce(p_is_default_shipping, false) then
    update public.customer_addresses set is_default_shipping=false,updated_at=now()
    where user_id=v_uid and is_default_shipping=true and (p_address_id is null or id<>p_address_id);
  end if;
  if p_address_id is null then
    insert into public.customer_addresses(user_id,label,recipient_name,phone,address_line1,address_line2,suburb,city,province,postal_code,country,is_default_shipping,updated_at)
    values(v_uid,coalesce(nullif(btrim(p_label),''),'Delivery address'),nullif(btrim(p_recipient_name),''),nullif(btrim(p_phone),''),btrim(p_address_line1),nullif(btrim(p_address_line2),''),nullif(btrim(p_suburb),''),btrim(p_city),nullif(btrim(p_province),''),nullif(btrim(p_postal_code),''),coalesce(nullif(btrim(p_country),''),'South Africa'),coalesce(p_is_default_shipping,false),now())
    returning id into v_id;
  else
    update public.customer_addresses set label=coalesce(nullif(btrim(p_label),''),'Delivery address'),recipient_name=nullif(btrim(p_recipient_name),''),phone=nullif(btrim(p_phone),''),address_line1=btrim(p_address_line1),address_line2=nullif(btrim(p_address_line2),''),suburb=nullif(btrim(p_suburb),''),city=btrim(p_city),province=nullif(btrim(p_province),''),postal_code=nullif(btrim(p_postal_code),''),country=coalesce(nullif(btrim(p_country),''),'South Africa'),is_default_shipping=coalesce(p_is_default_shipping,false),updated_at=now()
    where id=p_address_id and user_id=v_uid returning id into v_id;
    if v_id is null then raise exception 'Address not found'; end if;
  end if;
  return v_id;
end;
$function$;

revoke all on function public.customer_save_address_v1(uuid,text,text,text,text,text,text,text,text,text,text,boolean) from public;
revoke all on function public.customer_save_address_v1(uuid,text,text,text,text,text,text,text,text,text,text,boolean) from anon;
grant execute on function public.customer_save_address_v1(uuid,text,text,text,text,text,text,text,text,text,text,boolean) to authenticated;
