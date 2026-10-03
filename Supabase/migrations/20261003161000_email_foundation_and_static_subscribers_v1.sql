-- Email foundation for VoltTech transactional mail and STATIC subscriptions.
-- Applied to production Supabase on 2026-10-03.

create table if not exists public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid null references auth.users(id) on delete set null,
  recipient_email text not null,
  message_kind text not null,
  source_type text null,
  source_id text null,
  notification_id uuid null references public.notifications(id) on delete set null,
  subject text not null,
  payload jsonb not null default '{}'::jsonb,
  dedupe_key text null unique,
  status text not null default 'queued' check (status in ('queued','sending','sent','failed','cancelled')),
  attempt_count integer not null default 0,
  scheduled_at timestamptz not null default now(),
  last_attempt_at timestamptz null,
  sent_at timestamptz null,
  provider_message_id text null,
  error_message text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists email_outbox_status_schedule_idx
  on public.email_outbox(status, scheduled_at);
create index if not exists email_outbox_recipient_idx
  on public.email_outbox(recipient_email, created_at desc);

alter table public.email_outbox enable row level security;
drop policy if exists "Admins can read email outbox" on public.email_outbox;
create policy "Admins can read email outbox"
on public.email_outbox for select to authenticated
using (public.is_volttech_admin());

create table if not exists public.static_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  status text not null default 'pending'
    check (status in ('pending','active','unsubscribed','suppressed')),
  source text not null default 'static_site',
  consent_version text not null default '1.0',
  consent_at timestamptz not null default now(),
  confirmed_at timestamptz null,
  unsubscribed_at timestamptz null,
  confirmation_token_hash text null,
  unsubscribe_token_hash text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists static_subscribers_email_unique
  on public.static_subscribers(lower(email));
create index if not exists static_subscribers_status_idx
  on public.static_subscribers(status, created_at desc);

alter table public.static_subscribers enable row level security;
drop policy if exists "Admins can read STATIC subscribers" on public.static_subscribers;
create policy "Admins can read STATIC subscribers"
on public.static_subscribers for select to authenticated
using (public.is_volttech_admin());

create or replace function public.vt_customer_email(p_user_id uuid)
returns text
language sql
security definer
set search_path to ''
as $$
  select coalesce(
    nullif(trim((select p.billing_email from public.profiles p where p.id = p_user_id)), ''),
    nullif(trim((select u.email from auth.users u where u.id = p_user_id)), '')
  );
$$;

revoke all on function public.vt_customer_email(uuid) from public;
grant execute on function public.vt_customer_email(uuid) to service_role;

create or replace function public.vt_queue_notification_email()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_email text;
  v_subject text;
begin
  if new.recipient_role <> 'customer'
     or new.recipient_user_id is null
     or new.email_sent_at is not null
     or new.event_type not in ('account_welcome','quote_ready','invoice_issued','payment_received') then
    return new;
  end if;

  v_email := public.vt_customer_email(new.recipient_user_id);
  if v_email is null or v_email = '' then return new; end if;

  v_subject := case new.event_type
    when 'account_welcome' then 'Welcome to VoltTech Computer Co.'
    when 'quote_ready' then 'Your VoltTech quote is ready'
    when 'invoice_issued' then 'Your VoltTech invoice is ready'
    when 'payment_received' then 'Payment received — VoltTech'
    else coalesce(new.title, 'VoltTech update')
  end;

  insert into public.email_outbox (
    recipient_user_id, recipient_email, message_kind, source_type, source_id,
    notification_id, subject, payload, dedupe_key
  ) values (
    new.recipient_user_id, v_email, new.event_type, new.entity_type, new.entity_id,
    new.id, v_subject,
    jsonb_build_object(
      'title',new.title,'message',new.message,'action_url',new.action_url,
      'event_type',new.event_type,'entity_type',new.entity_type,
      'entity_id',new.entity_id,'priority',new.priority
    ),
    'notification:' || new.id::text
  )
  on conflict (dedupe_key) do nothing;

  return new;
end;
$$;

drop trigger if exists vt_queue_notification_email on public.notifications;
create trigger vt_queue_notification_email
after insert or update of event_type, recipient_user_id, recipient_role, email_sent_at
on public.notifications
for each row execute function public.vt_queue_notification_email();

create or replace function public.admin_queue_document_email(p_kind text, p_source_id uuid)
returns uuid
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_user_id uuid;
  v_email text;
  v_number text;
  v_subject text;
  v_outbox_id uuid;
begin
  if not public.is_volttech_admin() then raise exception 'Not authorised'; end if;

  if p_kind = 'quote' then
    select q.user_id,q.quote_number into v_user_id,v_number
      from public.quotes q where q.id=p_source_id;
    if v_user_id is null then raise exception 'Quote not found'; end if;
    v_subject := 'Your VoltTech quote ' || coalesce(v_number,'');
  elsif p_kind = 'invoice' then
    select i.user_id,i.invoice_number into v_user_id,v_number
      from public.invoices i where i.id=p_source_id;
    if v_user_id is null then raise exception 'Invoice not found'; end if;
    v_subject := 'Your VoltTech invoice ' || coalesce(v_number,'');
  else
    raise exception 'Unsupported document kind';
  end if;

  v_email := public.vt_customer_email(v_user_id);
  if v_email is null or v_email = '' then
    raise exception 'Customer email address is unavailable';
  end if;

  insert into public.email_outbox (
    recipient_user_id,recipient_email,message_kind,source_type,source_id,
    subject,payload,dedupe_key
  ) values (
    v_user_id,v_email,p_kind || '_document',p_kind,p_source_id::text,
    v_subject,
    jsonb_build_object(
      'kind',p_kind,'source_id',p_source_id,
      'document_url',
      case when p_kind='quote'
        then 'https://volttechcomputerco.co.za/quote.html?id=' || p_source_id::text
        else 'https://volttechcomputerco.co.za/invoice.html?id=' || p_source_id::text
      end
    ),
    p_kind || '_document:' || p_source_id::text
  )
  on conflict (dedupe_key) do update
    set status = case
      when public.email_outbox.status='sent' then public.email_outbox.status
      else 'queued'
    end,
    error_message=null,scheduled_at=now(),updated_at=now()
  returning id into v_outbox_id;

  return v_outbox_id;
end;
$$;

revoke all on function public.admin_queue_document_email(text,uuid) from public;
grant execute on function public.admin_queue_document_email(text,uuid) to authenticated;
