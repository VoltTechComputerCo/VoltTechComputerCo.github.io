create table public.billing_payments (
 id uuid primary key default gen_random_uuid(), document_id uuid not null references public.billing_documents(id),
 request_key uuid not null unique, amount numeric(14,2) not null check(amount>0), paid_on date not null,
 method text not null check(method in ('EFT','Card','Cash','Other','Not specified')), reference text not null default '',
 created_at timestamptz not null default now(),created_by uuid not null references auth.users(id),
 voided_at timestamptz,voided_by uuid references auth.users(id),void_reason text
);
create index billing_payments_document_idx on public.billing_payments(document_id);
alter table public.billing_payments enable row level security;
revoke all on public.billing_payments from public,anon,authenticated;
grant select on public.billing_payments to authenticated;
create policy billing_payments_admin on public.billing_payments for select to authenticated using (public.is_volttech_admin());
create function public.admin_record_billing_payment(p_id uuid,p_data jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare d public.billing_documents; existing public.billing_payments; pid uuid; a numeric; paid numeric; dt date;
begin
 if auth.uid() is null or not coalesce(public.is_volttech_admin(),false) then raise exception 'Not authorised';end if;
 select * into d from public.billing_documents where id=p_id for update;
 if d.id is null or d.kind<>'invoice' or d.status<>'issued' then raise exception 'Select an issued invoice';end if;
 select * into existing from public.billing_payments where request_key=(p_data->>'request_key')::uuid;
 if existing.id is not null then
  if existing.document_id<>p_id then raise exception 'Payment request already used';end if;
  return existing.id;
 end if;
 if nullif(p_data->>'expected_updated_at','')::timestamptz is distinct from d.updated_at then raise exception 'Invoice changed. Reload before recording payment';end if;
 a=round((p_data->>'amount')::numeric,2);dt=(p_data->>'paid_on')::date;
 if a is null or a<=0 or a::text in ('NaN','Infinity','-Infinity') then raise exception 'Enter a positive payment amount';end if;
 if dt is null or dt>(now() at time zone 'Africa/Johannesburg')::date then raise exception 'Enter a payment date no later than today';end if;
 select coalesce(sum(amount),0) into paid from public.billing_payments where document_id=p_id and voided_at is null;
 if a>d.total-paid then raise exception 'Payment exceeds the outstanding balance';end if;
 insert into public.billing_payments(document_id,request_key,amount,paid_on,method,reference,created_by)
 values(p_id,(p_data->>'request_key')::uuid,a,dt,coalesce(p_data->>'method','Not specified'),left(coalesce(p_data->>'reference',''),200),auth.uid()) returning id into pid;
 update public.billing_documents set updated_at=clock_timestamp() where id=p_id;
 return pid;
end $$;
create function public.admin_void_billing_payment(p_id uuid,p_reason text) returns void
language plpgsql security definer set search_path='' as $$
declare did uuid;
begin
 if auth.uid() is null or not coalesce(public.is_volttech_admin(),false) then raise exception 'Not authorised';end if;
 if length(trim(coalesce(p_reason,'')))<5 then raise exception 'Enter a reason for correcting this payment';end if;
 select document_id into did from public.billing_payments where id=p_id;
 if did is null then raise exception 'Payment not found';end if;
 perform 1 from public.billing_documents where id=did for update;
 update public.billing_payments set voided_at=now(),voided_by=auth.uid(),void_reason=left(trim(p_reason),500) where id=p_id and voided_at is null;
 update public.billing_documents set updated_at=clock_timestamp() where id=did;
end $$;
revoke all on function public.admin_record_billing_payment(uuid,jsonb),public.admin_void_billing_payment(uuid,text) from public,anon;
grant execute on function public.admin_record_billing_payment(uuid,jsonb),public.admin_void_billing_payment(uuid,text) to authenticated;
create or replace function public.admin_billing_records() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null or not coalesce(public.is_volttech_admin(),false) then raise exception 'Not authorised';end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',d.id,'kind',d.kind,'status',d.status,'document_number',d.document_number,'title',d.title,'total',d.total,'created_at',d.created_at,'customer_details',d.customer_details,'paid_total',(select coalesce(sum(p.amount),0) from public.billing_payments p where p.document_id=d.id and p.voided_at is null),'items',(select coalesce(jsonb_agg(jsonb_build_object('description',i.description,'sku',i.sku)),'[]'::jsonb) from public.billing_document_items i where i.document_id=d.id and i.active)) order by d.created_at desc),'[]'::jsonb) into result from public.billing_documents d;
 return result;
end $$;
