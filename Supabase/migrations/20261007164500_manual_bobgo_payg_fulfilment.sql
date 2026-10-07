-- Bob Go PAYG accounts do not expose API access.
-- Keep supplier dispatch manual while preserving customer order status.

create or replace function public.admin_mark_store_manual_shipment(
  p_request_id uuid,
  p_courier_name text default 'Bob Go',
  p_tracking_number text default null,
  p_tracking_url text default null,
  p_waybill_reference text default null,
  p_internal_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  r public.store_requests%rowtype;
  courier_value text;
  tracking_value text;
  tracking_url_value text;
  waybill_value text;
begin
  if not public.is_volttech_admin() then raise exception 'Not authorised'; end if;

  select * into r
  from public.store_requests
  where id = p_request_id
  for update;

  if not found then raise exception 'Store checkout not found'; end if;
  if r.payment_status <> 'paid' then raise exception 'Order must be paid before courier booking is recorded'; end if;
  if r.status in ('cancelled','closed') then raise exception 'Checkout is not active'; end if;

  courier_value := nullif(left(trim(coalesce(p_courier_name,'')),120),'');
  tracking_value := nullif(left(trim(coalesce(p_tracking_number,'')),160),'');
  tracking_url_value := nullif(left(trim(coalesce(p_tracking_url,'')),500),'');
  waybill_value := nullif(left(trim(coalesce(p_waybill_reference,'')),160),'');

  if courier_value is null then courier_value := 'Bob Go'; end if;
  if tracking_value is null then raise exception 'Tracking or shipment reference is required'; end if;
  if tracking_url_value is not null and tracking_url_value !~ '^https://[^[:space:]]+$' then
    raise exception 'Tracking URL must be HTTPS';
  end if;

  update public.store_requests
  set delivery_status = 'booked',
      checkout_stage = 'fulfillment_booked',
      automation_status = 'shipment_booked_manual',
      shipping_provider = 'bobgo_manual',
      shipping_service = 'Bob Go manual booking',
      courier_name = courier_value,
      tracking_number = tracking_value,
      tracking_url = tracking_url_value,
      metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object(
        'manual_courier_booking_at', now(),
        'waybill_reference', waybill_value,
        'manual_dispatch_note', nullif(left(trim(coalesce(p_internal_note,'')),600),'')
      ),
      updated_at = now()
  where id = p_request_id;

  insert into public.store_automation_events(request_id,event_type,status,payload)
  values(
    p_request_id,
    'shipment_booked_manual',
    'succeeded',
    jsonb_build_object(
      'provider','bobgo_manual',
      'courier',courier_value,
      'tracking_number',tracking_value,
      'waybill_reference',waybill_value
    )
  );

  return jsonb_build_object(
    'ok',true,
    'request_id',p_request_id,
    'request_number',r.request_number,
    'courier',courier_value,
    'tracking_number',tracking_value,
    'tracking_url',tracking_url_value,
    'waybill_reference',waybill_value
  );
end;
$function$;

revoke all on function public.admin_mark_store_manual_shipment(uuid,text,text,text,text,text) from public;
grant execute on function public.admin_mark_store_manual_shipment(uuid,text,text,text,text,text) to authenticated;

update public.store_private_settings
set value = coalesce(value,'{}'::jsonb) || jsonb_build_object(
  'provider','bobgo',
  'mode','manual_payg',
  'configured',false,
  'environment','manual',
  'handling_time_days',0
),
updated_at=now()
where id='shipping';
