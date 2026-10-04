-- Final production email transport + STATIC mailer state.
-- Secrets are intentionally NOT stored here.
-- Required Vault secret: resend_api_key

create or replace function public.vt_queue_notification_email()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_email text;
  v_subject text;
  v_dedupe_key text;
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
    else coalesce(new.title,'VoltTech update')
  end;

  v_dedupe_key := case new.event_type
    when 'quote_ready' then 'quote:' || coalesce(new.entity_id,new.id::text) || ':issued'
    when 'invoice_issued' then 'invoice:' || coalesce(new.entity_id,new.id::text) || ':issued'
    when 'payment_received' then 'payment:' || coalesce(new.entity_id,new.id::text) || ':received'
    else 'notification:' || new.id::text
  end;

  insert into public.email_outbox(
    recipient_user_id,recipient_email,message_kind,source_type,source_id,
    notification_id,subject,payload,dedupe_key
  ) values (
    new.recipient_user_id,v_email,new.event_type,new.entity_type,new.entity_id,
    new.id,v_subject,
    jsonb_build_object(
      'title',new.title,'message',new.message,'action_url',new.action_url,
      'event_type',new.event_type,'entity_type',new.entity_type,
      'entity_id',new.entity_id,'priority',new.priority
    ),
    v_dedupe_key
  )
  on conflict(dedupe_key) do nothing;

  return new;
end;
$$;

create or replace function public.admin_queue_document_email(p_kind text,p_source_id uuid)
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
  v_dedupe_key text;
  v_outbox_id uuid;
begin
  if not public.is_volttech_admin() then raise exception 'Not authorised'; end if;

  if p_kind='quote' then
    select q.user_id,q.quote_number into v_user_id,v_number
    from public.quotes q where q.id=p_source_id;
    if v_user_id is null then raise exception 'Quote not found'; end if;
    v_subject := 'Your VoltTech quote ' || coalesce(v_number,'');
    v_dedupe_key := 'quote:' || p_source_id::text || ':issued';
  elsif p_kind='invoice' then
    select i.user_id,i.invoice_number into v_user_id,v_number
    from public.invoices i where i.id=p_source_id;
    if v_user_id is null then raise exception 'Invoice not found'; end if;
    v_subject := 'Your VoltTech invoice ' || coalesce(v_number,'');
    v_dedupe_key := 'invoice:' || p_source_id::text || ':issued';
  else
    raise exception 'Unsupported document kind';
  end if;

  v_email := public.vt_customer_email(v_user_id);
  if v_email is null or v_email='' then raise exception 'Customer email address is unavailable'; end if;

  insert into public.email_outbox(
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
        else 'https://volttechcomputerco.co.za/invoice.html?id=' || p_source_id::text end
    ),
    v_dedupe_key
  )
  on conflict(dedupe_key) do update
    set recipient_email=excluded.recipient_email,
        subject=excluded.subject,
        payload=excluded.payload,
        updated_at=now()
  returning id into v_outbox_id;

  return v_outbox_id;
end;
$$;

create or replace function public.vt_get_resend_api_key()
returns text language sql security definer set search_path to ''
as $$
  select decrypted_secret
  from vault.decrypted_secrets
  where name='resend_api_key'
  order by created_at desc
  limit 1;
$$;
revoke all on function public.vt_get_resend_api_key() from public;
grant execute on function public.vt_get_resend_api_key() to service_role;

create or replace function public.vt_claim_email_outbox(p_limit integer default 10)
returns setof public.email_outbox
language sql security definer set search_path to ''
as $$
  with picked as (
    select e.id
    from public.email_outbox e
    where e.attempt_count < 5
      and e.scheduled_at <= now()
      and (
        e.status in ('queued','failed')
        or (e.status='sending' and e.last_attempt_at < now()-interval '15 minutes')
      )
    order by e.scheduled_at,e.created_at
    for update skip locked
    limit greatest(1,least(coalesce(p_limit,10),25))
  )
  update public.email_outbox e
  set status='sending',attempt_count=e.attempt_count+1,last_attempt_at=now(),updated_at=now()
  from picked
  where e.id=picked.id
  returning e.*;
$$;
revoke all on function public.vt_claim_email_outbox(integer) from public;
grant execute on function public.vt_claim_email_outbox(integer) to service_role;

create or replace function public.vt_mark_email_sent(p_id uuid,p_provider_message_id text)
returns void language plpgsql security definer set search_path to ''
as $$
declare v_row public.email_outbox%rowtype;
begin
  update public.email_outbox
  set status='sent',provider_message_id=p_provider_message_id,sent_at=now(),
      error_message=null,updated_at=now()
  where id=p_id returning * into v_row;
  if v_row.id is null then return; end if;
  if v_row.notification_id is not null then
    update public.notifications set email_sent_at=coalesce(email_sent_at,now())
    where id=v_row.notification_id;
  end if;
  insert into public.email_delivery_log(
    user_id,document_kind,source_id,subject,provider_message_id,status,error_message
  ) values (
    v_row.recipient_user_id,v_row.message_kind,v_row.source_id,v_row.subject,
    p_provider_message_id,'sent',null
  );
end;
$$;
revoke all on function public.vt_mark_email_sent(uuid,text) from public;
grant execute on function public.vt_mark_email_sent(uuid,text) to service_role;

create or replace function public.vt_mark_email_failed(p_id uuid,p_error text)
returns void language plpgsql security definer set search_path to ''
as $$
declare v_row public.email_outbox%rowtype;
begin
  update public.email_outbox
  set status='failed',
      error_message=left(coalesce(p_error,'Unknown email error'),2000),
      scheduled_at=now()+make_interval(mins=>least(60,greatest(5,attempt_count*5))),
      updated_at=now()
  where id=p_id returning * into v_row;
  if v_row.id is null then return; end if;
  insert into public.email_delivery_log(
    user_id,document_kind,source_id,subject,provider_message_id,status,error_message
  ) values (
    v_row.recipient_user_id,v_row.message_kind,v_row.source_id,v_row.subject,
    null,'failed',left(coalesce(p_error,'Unknown email error'),2000)
  );
end;
$$;
revoke all on function public.vt_mark_email_failed(uuid,text) from public;
grant execute on function public.vt_mark_email_failed(uuid,text) to service_role;

do $$
begin
  if not exists(select 1 from vault.decrypted_secrets where name='mailer_cron_token') then
    perform vault.create_secret(
      encode(gen_random_bytes(32),'hex'),
      'mailer_cron_token',
      'Internal token for invoking VoltTech email workers',
      null
    );
  end if;
  if not exists(select 1 from vault.decrypted_secrets where name='static_list_signing_secret') then
    perform vault.create_secret(
      encode(gen_random_bytes(32),'hex'),
      'static_list_signing_secret',
      'Signing secret for STATIC unsubscribe links',
      null
    );
  end if;
end $$;

create or replace function public.vt_get_mailer_cron_token()
returns text language sql security definer set search_path to ''
as $$
  select decrypted_secret from vault.decrypted_secrets
  where name='mailer_cron_token' order by created_at desc limit 1;
$$;
revoke all on function public.vt_get_mailer_cron_token() from public;
grant execute on function public.vt_get_mailer_cron_token() to service_role;

create or replace function public.vt_get_static_signing_secret()
returns text language sql security definer set search_path to ''
as $$
  select decrypted_secret from vault.decrypted_secrets
  where name='static_list_signing_secret' order by created_at desc limit 1;
$$;
revoke all on function public.vt_get_static_signing_secret() from public;
grant execute on function public.vt_get_static_signing_secret() to service_role;

alter table public.static_subscribers
  add column if not exists confirmation_sent_at timestamptz null;

create table if not exists public.static_newsletter_runs(
  guid text primary key,
  title text not null,
  url text not null,
  description text null,
  status text not null default 'processing'
    check(status in ('processing','sent','partial','failed','no_subscribers')),
  subscriber_count integer not null default 0,
  sent_count integer not null default 0,
  failed_count integer not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz null,
  error_message text null,
  created_at timestamptz not null default now()
);

create table if not exists public.static_newsletter_deliveries(
  id uuid primary key default gen_random_uuid(),
  run_guid text not null references public.static_newsletter_runs(guid) on delete cascade,
  subscriber_id uuid not null references public.static_subscribers(id) on delete cascade,
  recipient_email text not null,
  status text not null check(status in ('sent','failed')),
  provider_message_id text null,
  error_message text null,
  sent_at timestamptz null,
  created_at timestamptz not null default now(),
  unique(run_guid,subscriber_id)
);

alter table public.static_newsletter_runs enable row level security;
alter table public.static_newsletter_deliveries enable row level security;

grant select,insert,update,delete on public.static_subscribers to service_role;
grant select,insert,update,delete on public.static_newsletter_runs to service_role;
grant select,insert,update,delete on public.static_newsletter_deliveries to service_role;

drop policy if exists "Service role manages STATIC subscribers" on public.static_subscribers;
create policy "Service role manages STATIC subscribers"
on public.static_subscribers for all to service_role using(true) with check(true);

drop policy if exists "Service role manages STATIC newsletter runs" on public.static_newsletter_runs;
create policy "Service role manages STATIC newsletter runs"
on public.static_newsletter_runs for all to service_role using(true) with check(true);

drop policy if exists "Service role manages STATIC newsletter deliveries" on public.static_newsletter_deliveries;
create policy "Service role manages STATIC newsletter deliveries"
on public.static_newsletter_deliveries for all to service_role using(true) with check(true);

drop policy if exists "Admins can read STATIC newsletter runs" on public.static_newsletter_runs;
create policy "Admins can read STATIC newsletter runs"
on public.static_newsletter_runs for select to authenticated using(public.is_volttech_admin());

drop policy if exists "Admins can read STATIC newsletter deliveries" on public.static_newsletter_deliveries;
create policy "Admins can read STATIC newsletter deliveries"
on public.static_newsletter_deliveries for select to authenticated using(public.is_volttech_admin());

do $$
declare v_job record;
begin
  for v_job in select jobid from cron.job where jobname in ('volttech-email-outbox','static-mailer-feed-watch')
  loop
    perform cron.unschedule(v_job.jobid);
  end loop;
end $$;

select cron.schedule(
  'volttech-email-outbox','* * * * *',
  $job$
  select net.http_post(
    url := 'https://qdqhfnvwqvgesfdmocir.supabase.co/functions/v1/process-email-outbox',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'x-volttech-mailer-token',
      (select decrypted_secret from vault.decrypted_secrets where name='mailer_cron_token' order by created_at desc limit 1)
    ),
    body := '{"limit":10}'::jsonb
  );
  $job$
);

select cron.schedule(
  'static-mailer-feed-watch','*/5 * * * *',
  $job$
  select net.http_post(
    url := 'https://qdqhfnvwqvgesfdmocir.supabase.co/functions/v1/process-static-mailer',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'x-volttech-mailer-token',
      (select decrypted_secret from vault.decrypted_secrets where name='mailer_cron_token' order by created_at desc limit 1)
    ),
    body := '{}'::jsonb
  );
  $job$
);
