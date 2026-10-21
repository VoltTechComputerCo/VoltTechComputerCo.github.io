-- Category pricing for confirmed VAT-inclusive supplier costs.
-- Company is not VAT registered: supplier VAT remains part of cost.
create or replace function public.vt_category_markup(p_category text) returns numeric
language sql immutable security invoker set search_path='' as $$
 select case
 when p_category in ('cpu','gpu','laptops','monitors','desktops','tablets','handhelds','upgrade-kits') then 12
 when p_category in ('memory','storage','motherboard') then 15
 when p_category in ('case','cooler','psu','fan','networking','power-protection') then 18
 when p_category in ('cables','adapters','thermal-paste') then 30
 when p_category in ('audio','controllers','headsets','keyboards','mice','webcams','desk-accessories','laptop-accessories') then 25
 else 18 end::numeric;
$$;
revoke all on function public.vt_category_markup(text) from public,anon,authenticated;
grant execute on function public.vt_category_markup(text) to service_role;

create or replace function public.vt_update_preferred_offer_products(p_ids text[]) returns void
language sql security invoker set search_path='' as $fn$
 with ranked as (
 select o.*,row_number() over(partition by o.product_id order by case when o.stock_qty>0 then 0 else 1 end,coalesce(s.priority,100),o.cost_price) as position
 from public.store_supplier_offers o left join public.store_suppliers s on s.id=o.supplier_id where o.product_id=any(p_ids)
 ), best as(select * from ranked where position=1),
 policy as(
 select b.*,public.vt_category_markup(p.category_slug) as target_markup,
 b.cost_price>0 and b.metadata->>'cost_vat_basis'='inclusive-normalized'
 and not coalesce((p.metadata->>'auto_markup_disabled')::boolean,false)
 and (coalesce((p.metadata->>'regular_markup_percent')::numeric,(p.metadata->>'markup_percent')::numeric,30)=30
 or p.metadata->>'pricing_policy'='category-20261022') as eligible
 from best b join public.store_products p on p.id=b.product_id
 )
 update public.store_products p set
 stock_qty=b.stock_qty,stock_status=b.stock_status,price_checked_at=b.last_checked,
 retail_price=case
 when coalesce((p.metadata->>'auto_markup_disabled')::boolean,false) then p.retail_price
 when b.metadata->>'cost_vat_basis' is distinct from 'inclusive-normalized' or b.cost_price<=0 then p.retail_price
 when p.metadata->>'deal_managed'='true' and (p.metadata->>'deal_ends_at')::timestamptz>now()
 then case when p.metadata->>'deal_fixed_price' is not null then (p.metadata->>'deal_fixed_price')::numeric
 else round(b.cost_price*(1+coalesce((p.metadata->>'markup_percent')::numeric,30)/100),2) end
 when b.eligible then round(b.cost_price*(1+b.target_markup/100),2)
 else round(b.cost_price*(1+coalesce((p.metadata->>'regular_markup_percent')::numeric,(p.metadata->>'markup_percent')::numeric,30)/100),2) end,
 compare_at_price=case when b.eligible and not coalesce(p.metadata->>'deal_managed'='true' and (p.metadata->>'deal_ends_at')::timestamptz>now(),false) then null
 when p.metadata->>'deal_managed'='true' and (p.metadata->>'deal_ends_at')::timestamptz<=now() then null else p.compare_at_price end,
 metadata=p.metadata||jsonb_build_object('preferred_supplier',b.supplier_id,'preferred_supplier_name',b.supplier_name,'stock_connected',b.stock_qty is not null,'pricing_state','priced','last_supplier_sync',now())
 ||case when b.eligible then jsonb_build_object(
 'pricing_policy','category-20261022',
 'pricing_previous',coalesce(p.metadata->'pricing_previous',jsonb_build_object('retail_price',p.retail_price,'markup_percent',p.metadata->'markup_percent','regular_markup_percent',p.metadata->'regular_markup_percent','recorded_at',now())),
 'regular_markup_percent',b.target_markup,
 'markup_percent',case when p.metadata->>'deal_managed'='true' and (p.metadata->>'deal_ends_at')::timestamptz>now() then coalesce((p.metadata->>'markup_percent')::numeric,30) else b.target_markup end)
 else '{}'::jsonb end,
 updated_at=now()
 from policy b where p.id=b.product_id;
$fn$;
revoke all on function public.vt_update_preferred_offer_products(text[]) from public,anon,authenticated;
grant execute on function public.vt_update_preferred_offer_products(text[]) to service_role;
select public.vt_update_preferred_offer_products(array(select id from public.store_products where is_demo=false));
