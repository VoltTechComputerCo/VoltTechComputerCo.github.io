create or replace function public.vt_update_preferred_offer_products(p_ids text[]) returns void language sql set search_path='' as $fn$
 with ranked as (
  select o.*,row_number() over(partition by o.product_id order by case when o.stock_qty>0 then 0 else 1 end,coalesce(s.priority,100),o.cost_price) as position
  from public.store_supplier_offers o left join public.store_suppliers s on s.id=o.supplier_id where o.product_id=any(p_ids)
 ), best as(select * from ranked where position=1)
 update public.store_products p set stock_qty=b.stock_qty,stock_status=b.stock_status,price_checked_at=b.last_checked,
 retail_price=case when coalesce((p.metadata->>'auto_markup_disabled')::boolean,false) then p.retail_price when p.metadata->>'deal_managed'='true' and (p.metadata->>'deal_ends_at')::timestamptz>now() and p.metadata->>'deal_fixed_price' is not null then (p.metadata->>'deal_fixed_price')::numeric else round(b.cost_price*(1+(case
 when p.metadata->>'deal_managed'='true' and (p.metadata->>'deal_ends_at')::timestamptz>now() then coalesce((p.metadata->>'markup_percent')::numeric,30)
 when p.metadata->>'deal_managed'='true' then coalesce((p.metadata->>'regular_markup_percent')::numeric,30)
 else coalesce((p.metadata->>'markup_percent')::numeric,30) end)/100),2) end,
 compare_at_price=case when p.metadata->>'deal_managed'='true' and (p.metadata->>'deal_ends_at')::timestamptz<=now() then null else p.compare_at_price end,
 metadata=p.metadata||jsonb_build_object('preferred_supplier',b.supplier_id,'preferred_supplier_name',b.supplier_name,'stock_connected',b.stock_qty is not null,'pricing_state','priced','last_supplier_sync',now()),updated_at=now()
 from best b where p.id=b.product_id;
$fn$;

create or replace function public.vt_expire_store_deals() returns void language plpgsql set search_path='' as $fn$
declare ids text[];
begin
 select array_agg(id) into ids from public.store_products where metadata->>'deal_managed'='true' and (metadata->>'deal_ends_at')::timestamptz<=now();
 if ids is null then return;end if;
 update public.store_products set compare_at_price=null,metadata=(metadata-'compare_at_verified'-'deal_ends_at')||jsonb_build_object('markup_percent',coalesce((metadata->>'regular_markup_percent')::numeric,30),'deal_managed',false),updated_at=now() where id=any(ids);
 perform public.vt_update_preferred_offer_products(ids);
end $fn$;
revoke all on function public.vt_expire_store_deals() from public,anon,authenticated;
grant execute on function public.vt_expire_store_deals() to service_role;
do $schedule$ begin
 if not exists(select 1 from cron.job where jobname='expire-store-deals')then
  perform cron.schedule('expire-store-deals','* * * * *','select public.vt_expire_store_deals()');
 end if;
end $schedule$;

