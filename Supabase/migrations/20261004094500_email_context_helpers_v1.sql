-- Narrow backend context helpers for transactional email rendering.
-- Avoids granting the mail worker direct SELECT access to customer/quote tables.

create or replace function public.vt_email_customer_name(p_user_id uuid)
returns text
language sql
security definer
set search_path to ''
as $$
  select nullif(trim(p.full_name),'')
  from public.profiles p
  where p.id=p_user_id
  limit 1;
$$;

revoke all on function public.vt_email_customer_name(uuid) from public;
grant execute on function public.vt_email_customer_name(uuid) to service_role;

create or replace function public.vt_email_quote_context(p_quote_id uuid)
returns jsonb
language sql
security definer
set search_path to ''
as $$
  select jsonb_build_object(
    'quote_number',q.quote_number,
    'title',q.title,
    'total',q.total,
    'currency',q.currency,
    'valid_until',q.valid_until
  )
  from public.quotes q
  where q.id=p_quote_id
  limit 1;
$$;

revoke all on function public.vt_email_quote_context(uuid) from public;
grant execute on function public.vt_email_quote_context(uuid) to service_role;

create or replace function public.vt_email_invoice_context(p_invoice_id uuid)
returns jsonb
language sql
security definer
set search_path to ''
as $$
  select jsonb_build_object(
    'invoice_number',i.invoice_number,
    'total',i.total,
    'currency',i.currency,
    'due_at',i.due_at
  )
  from public.invoices i
  where i.id=p_invoice_id
  limit 1;
$$;

revoke all on function public.vt_email_invoice_context(uuid) from public;
grant execute on function public.vt_email_invoice_context(uuid) to service_role;

revoke select on public.quotes from service_role;
