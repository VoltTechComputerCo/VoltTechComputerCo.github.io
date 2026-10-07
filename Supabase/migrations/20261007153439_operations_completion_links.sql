create or replace function public.customer_operations_progress(p_quote_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare o public.operations_jobs%rowtype;
begin
 if auth.uid() is null or not exists(select 1 from public.quotes where id=p_quote_id and user_id=auth.uid()) then raise exception 'Not authorised'; end if;
 select * into o from public.operations_jobs where entity_key='quote:'||p_quote_id;
 return jsonb_build_object('stock_confirmed',o.stock_confirmed_at is not null,'quote_confirmed',o.pricing_confirmed_at is not null,'payment_released',o.payment_released_at is not null,'preparing',o.supplier_order_at is not null,'courier_booked',o.courier_booked_at is not null,'in_transit',o.collected_at is not null,'delivered',o.delivered_at is not null,'tracking_number',o.shipment->>'tracking','tracking_url',o.shipment->>'url');
end $$;
create function public.operations_completion_links() returns trigger language plpgsql security definer set search_path='' as $$
declare q public.quotes%rowtype;
begin
 if new.archived_at is not null and old.archived_at is null and split_part(new.entity_key,':',1)='store' then
  update public.store_requests set status='closed',updated_at=now() where id=split_part(new.entity_key,':',2)::uuid;
 end if;
 if new.delivered_at is not null and old.delivered_at is null and split_part(new.entity_key,':',1)='quote' then
  select * into q from public.quotes where id=split_part(new.entity_key,':',2)::uuid;
  if q.source_type='service' then update public.service_jobs set status='completed',completed_at=now() where id::text=q.source_id and user_id=q.user_id; end if;
 end if;
 return new;
end $$;
revoke all on function public.operations_completion_links() from public,anon,authenticated;
create trigger operations_completion_links after update on public.operations_jobs for each row execute function public.operations_completion_links();
