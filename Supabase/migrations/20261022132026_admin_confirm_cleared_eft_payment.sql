-- Explicit admin verification of cleared EFT funds; never called by a customer.
create or replace function public.admin_confirm_eft_payment(p_key text,p_amount numeric,p_reference text,p_bank_verified boolean default false)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 k text:=split_part(p_key,':',1); ident uuid; r public.store_requests%rowtype;
 qu public.quotes%rowtype; inv public.invoices%rowtype; o public.operations_jobs%rowtype;
 expected numeric; evidence jsonb; bankref text:=trim(p_reference);
begin
 if auth.uid() is null or not coalesce(public.is_volttech_admin(),false) then raise exception 'Not authorised'; end if;
 if p_bank_verified is distinct from true then raise exception 'Verify cleared funds in the bank account first'; end if;
 if bankref is null or length(bankref)=0 or length(bankref)>160 then raise exception 'A bank payment reference is required (maximum 160 characters)'; end if;
 if p_amount is null or p_amount<=0 or p_amount::text in ('NaN','Infinity','-Infinity') or round(p_amount,2)<>p_amount then raise exception 'Invalid payment amount'; end if;
 if k not in ('store','quote') then raise exception 'Open the linked order or quotation'; end if;
 ident:=split_part(p_key,':',2)::uuid;
 if k='store' then
  select * into r from public.store_requests where id=ident for update;
  if not found then raise exception 'Order not found'; end if;
  if r.payment_status='paid' then return jsonb_build_object('ok',true,'already_paid',true); end if;
  if r.status in ('cancelled','closed') or r.payment_status in ('cancelled','refunded','partially_refunded') or r.checkout_stage<>'awaiting_payment' then raise exception 'Order is not awaiting payment'; end if;
  expected:=r.final_total;
 else
  select * into qu from public.quotes where id=ident for update;
  if not found or qu.status<>'accepted' then raise exception 'An accepted quotation is required'; end if;
  select * into inv from public.invoices where quote_id=ident order by issued_at desc limit 1 for update;
  if not found then raise exception 'Release payment and issue the invoice first'; end if;
  if inv.status='paid' then return jsonb_build_object('ok',true,'already_paid',true); end if;
  if inv.status in ('void','cancelled','refunded') then raise exception 'Invoice is not payable'; end if;
  expected:=inv.total;
 end if;
 select * into o from public.operations_jobs where entity_key=p_key for update;
 if not found or o.archived_at is not null or o.stock_confirmed_at is null or o.pricing_confirmed_at is null or o.payment_released_at is null then raise exception 'Confirm stock, pricing and payment release first'; end if;
 if k='store' and (o.approval is distinct from 'accepted' or o.approved_total is distinct from expected) then raise exception 'Customer must accept the current total'; end if;
 if expected is null or expected<=0 or p_amount<>expected then raise exception 'Received amount must match the full confirmed total (%)',expected; end if;
 evidence:=jsonb_build_object('method','eft','reference',bankref,'amount',expected,'currency','ZAR','verified_at',now(),'verified_by',auth.uid(),'bank_verified',true);
 update public.operations_jobs set updated_at=now(),history=coalesce(history,'[]'::jsonb)||jsonb_build_array(jsonb_build_object('action','confirm_eft','at',now(),'actor',auth.uid(),'data',evidence)) where entity_key=p_key;
 if k='store' then
  update public.store_requests set payment_status='paid',checkout_stage='paid',metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('eft_payment',evidence),updated_at=now() where id=ident;
  if r.quote_id is not null then
   select * into inv from public.invoices where quote_id=r.quote_id and status not in ('paid','void','cancelled','refunded') order by issued_at desc limit 1 for update;
   if found then
    if inv.total<>expected then raise exception 'Linked invoice total differs from order; reconcile before confirming'; end if;
    insert into public.payments(invoice_id,user_id,provider,amount,currency,status,paid_at,metadata) values(inv.id,inv.user_id,'eft',expected,'ZAR','succeeded',now(),evidence);
    update public.invoices set status='paid',paid_at=now() where id=inv.id;
   end if;
  end if;
 else
  insert into public.payments(invoice_id,user_id,provider,amount,currency,status,paid_at,metadata) values(inv.id,inv.user_id,'eft',expected,'ZAR','succeeded',now(),evidence);
  update public.invoices set status='paid',paid_at=now() where id=inv.id;
 end if;
 return jsonb_build_object('ok',true,'payment_method','eft','amount',expected);
end $$;
revoke all on function public.admin_confirm_eft_payment(text,numeric,text,boolean) from public,anon;
grant execute on function public.admin_confirm_eft_payment(text,numeric,text,boolean) to authenticated;
