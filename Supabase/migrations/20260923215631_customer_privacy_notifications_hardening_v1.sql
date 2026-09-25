create or replace function public.guard_account_deletion_request_update()
returns trigger
language plpgsql
set search_path to ''
as $function$
declare
  v_uid uuid := auth.uid();
begin
  if public.is_volttech_admin() then
    return new;
  end if;

  if v_uid is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.user_id <> v_uid then raise exception 'Not authorised'; end if;
    if not coalesce(new.export_confirmed,false) then raise exception 'Data export acknowledgement is required'; end if;
    new.status := 'requested'; new.requested_at := now(); new.recovery_until := now() + interval '7 days';
    new.cancelled_at := null; new.completed_at := null; new.admin_note := null; new.updated_at := now();
    return new;
  end if;

  if old.user_id <> v_uid or new.user_id <> old.user_id then raise exception 'Not authorised'; end if;
  if old.status = 'requested' and new.status = 'cancelled' then
    if new.requested_at is distinct from old.requested_at or new.recovery_until is distinct from old.recovery_until or new.completed_at is distinct from old.completed_at or new.admin_note is distinct from old.admin_note then raise exception 'Protected deletion request fields cannot be changed'; end if;
    if old.export_confirmed and not new.export_confirmed then raise exception 'Export confirmation cannot be reversed'; end if;
    new.cancelled_at := now(); new.updated_at := now(); return new;
  end if;
  if old.status = 'cancelled' and new.status = 'requested' then
    if not coalesce(new.export_confirmed,false) then raise exception 'Data export acknowledgement is required'; end if;
    new.status := 'requested'; new.requested_at := now(); new.recovery_until := now() + interval '7 days'; new.cancelled_at := null; new.completed_at := null; new.admin_note := old.admin_note; new.updated_at := now(); return new;
  end if;
  if new.status is distinct from old.status or new.requested_at is distinct from old.requested_at or new.recovery_until is distinct from old.recovery_until or new.cancelled_at is distinct from old.cancelled_at or new.completed_at is distinct from old.completed_at or new.admin_note is distinct from old.admin_note or (old.export_confirmed and not new.export_confirmed) then raise exception 'Protected deletion request fields cannot be changed'; end if;
  new.updated_at := now(); return new;
end;
$function$;

drop trigger if exists guard_account_deletion_request_update on public.account_deletion_requests;
create trigger guard_account_deletion_request_update
before insert or update on public.account_deletion_requests
for each row execute function public.guard_account_deletion_request_update();

create or replace function public.vt_guard_notification_customer_update()
returns trigger
language plpgsql
set search_path to ''
as $function$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null or public.is_volttech_admin() then return new; end if;
  if old.recipient_role <> 'customer' or old.recipient_user_id <> v_uid then raise exception 'Not authorised'; end if;
  if new.recipient_user_id is distinct from old.recipient_user_id or new.recipient_role is distinct from old.recipient_role or new.event_type is distinct from old.event_type or new.title is distinct from old.title or new.message is distinct from old.message or new.action_url is distinct from old.action_url or new.entity_type is distinct from old.entity_type or new.entity_id is distinct from old.entity_id or new.priority is distinct from old.priority or new.dedupe_key is distinct from old.dedupe_key or new.metadata is distinct from old.metadata or new.email_sent_at is distinct from old.email_sent_at or new.whatsapp_sent_at is distinct from old.whatsapp_sent_at or new.created_at is distinct from old.created_at then raise exception 'Notification content is server managed'; end if;
  return new;
end;
$function$;

drop trigger if exists vt_guard_notification_customer_update on public.notifications;
create trigger vt_guard_notification_customer_update
before update on public.notifications
for each row execute function public.vt_guard_notification_customer_update();
