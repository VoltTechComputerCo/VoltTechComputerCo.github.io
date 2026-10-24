-- Outbound enquiries only. No customer information, purchase orders or stock approval.
update public.store_suppliers set account_reference=coalesce(account_reference,'VOL007'),
 metadata=metadata||jsonb_build_object('stock_request_enabled',true,'stock_request_email','Karjil@syntech.co.za') where id='syntech';
update public.store_suppliers set metadata=metadata||jsonb_build_object('stock_request_enabled',true,'stock_request_email','brenton@esquire.co.za') where id='esquire';

create or replace function public.vt_queue_supplier_stock_enquiries(p_request_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare r public.store_requests%rowtype; g record; audit jsonb := '[]'; email_id uuid;
begin
 select * into r from public.store_requests where id=p_request_id for update;
 if not found or r.status not in ('submitted','reviewing') or r.payment_status='paid'
    or r.checkout_stage<>'pending_stock_confirmation' then return; end if;
 -- A deferred trigger sees the complete cart even when items were inserted separately.
 for g in
 with chosen as (
  select i.id item_id, p.name product_name, i.quantity, o.supplier_id, o.supplier_sku
  from public.store_request_items i
  left join public.store_products p on p.id=i.product_id
  left join lateral (
   select f.* from public.store_supplier_offers f join public.store_suppliers s on s.id=f.supplier_id
   where f.product_id=i.product_id and s.status='active' and nullif(trim(f.supplier_sku),'') is not null
   order by case when f.stock_qty>=i.quantity and f.stock_status not in ('out-of-stock','out_of_stock','backorder') then 0
                 when f.stock_qty>0 and f.stock_status not in ('out-of-stock','out_of_stock','backorder') then 1 else 2 end,
            s.priority, f.cost_price nulls last, f.id limit 1
  ) o on true where i.request_id=r.id
 )
 select s.id supplier_id, s.name supplier_name, s.account_reference,
        s.metadata->>'stock_request_email' recipient,
        coalesce(s.metadata->>'stock_request_enabled','false')='true' enabled,
        jsonb_agg(jsonb_build_object('item_id',c.item_id,'name',c.product_name,'sku',c.supplier_sku,'quantity',c.quantity) order by c.item_id) lines
 from chosen c left join public.store_suppliers s on s.id=c.supplier_id
 group by s.id
 loop
  email_id := null;
  if g.enabled and g.recipient ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
   insert into public.email_outbox(recipient_email,message_kind,source_type,source_id,subject,payload,dedupe_key)
   values(g.recipient,'supplier_stock_request','store_request',r.id::text,
    'VoltTech stock confirmation / hold request — '||r.request_number,
    jsonb_build_object('supplier_id',g.supplier_id,'supplier_name',g.supplier_name,
      'account_reference',g.account_reference,'request_number',r.request_number,'lines',g.lines),
    'supplier-stock:'||r.id::text||':'||g.supplier_id||':v1')
   on conflict(dedupe_key) do nothing;
   select id into email_id from public.email_outbox where dedupe_key='supplier-stock:'||r.id::text||':'||g.supplier_id||':v1';
  end if;
  audit := audit||jsonb_build_array(jsonb_build_object('supplier_id',g.supplier_id,
    'supplier_name',coalesce(g.supplier_name,'No matched supplier'),'email_id',email_id,
    'state',case when email_id is not null then 'queued' else 'needs_contact' end,
    'reason',case when email_id is null then 'A verified sales contact or exact supplier offer is required.' else null end,
    'item_ids',(select jsonb_agg(l->'item_id') from jsonb_array_elements(g.lines) l)));
 end loop;
 update public.store_requests set metadata=metadata||jsonb_build_object('supplier_stock_requests',audit) where id=r.id;
end $$;
revoke all on function public.vt_queue_supplier_stock_enquiries(uuid) from public,anon,authenticated;
grant execute on function public.vt_queue_supplier_stock_enquiries(uuid) to service_role;

create or replace function public.vt_supplier_stock_enquiry_trigger()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 perform public.vt_queue_supplier_stock_enquiries(new.request_id);
 return new;
exception when others then
 -- A mail problem must never discard a customer's submitted RFQ.
 update public.store_requests set metadata=metadata||jsonb_build_object('supplier_stock_requests',
   jsonb_build_array(jsonb_build_object('state','failed','reason','Automatic supplier enquiry could not be queued. Contact the supplier manually.')))
 where id=new.request_id;
 raise warning 'Supplier enquiry queue failed for request %: %',new.request_id,sqlstate;
 return new;
end $$;
revoke all on function public.vt_supplier_stock_enquiry_trigger() from public,anon,authenticated;
create constraint trigger supplier_stock_enquiry_on_cart
after insert on public.store_request_items deferrable initially deferred
for each row execute function public.vt_supplier_stock_enquiry_trigger();
