-- Server-side only: recommendations are editorial picks, not invented sales rankings.
create or replace function public.vt_refresh_store_merchandising() returns void language plpgsql set search_path='' as $$
begin
 -- Expired reductions return to their recorded normal markup.
 update public.store_products set compare_at_price=null,
 metadata=(metadata-'compare_at_verified'-'deal_ends_at')||jsonb_build_object('markup_percent',coalesce((metadata->>'regular_markup_percent')::numeric,20),'deal_managed',false)
 where metadata->>'deal_managed'='true' and (metadata->>'deal_ends_at')::timestamptz<=now();
 with scored as(
  select p.id,p.category_slug,
   case when p.name~*'rtx[ -]*(5070|5060|4060|3060)|rx[ -]*(9060|9070|7600|7800)|ryzen.*(5600|5700x|7600|7800x3d|9800x3d|9700x)|core.*i5.*(12400|13400|14400)' then 400 else 0 end
   +case when p.name~*'b[456][0-9]{2}|b850|32gb|16gb|1tb|2tb|750w|850w|27.*monitor|144hz|165hz|180hz|mechanical|magnetic|g305|g502|cloud|990 evo|legend' then 150 else 0 end
   +case when p.retail_price between 200 and 20000 then 100 else 0 end
   +case when coalesce(p.media->>'primaryImage','')<>'' then 70 else 0 end
   +least(coalesce(p.stock_qty,0),50) as score,
   p.stock_qty
  from public.store_products p where p.visibility='public' and p.status='active' and p.is_demo=false and p.sale_mode<>'hidden'
 ), ranked as(select *,row_number() over(partition by category_slug order by case when stock_qty>0 then 0 else 1 end,score desc,id) as position from scored)
 update public.store_products p set featured=(r.position<=4 and r.stock_qty>0),sort_priority=r.score,
 metadata=p.metadata||jsonb_build_object('merchandising','editorial-category-picks','merchandising_updated_at',now())
 from ranked r where p.id=r.id and (p.featured is distinct from (r.position<=4 and r.stock_qty>0) or p.sort_priority is distinct from r.score);
 -- Old prices are actual public selling prices captured before a reduction; never generated anchors.
 with ranked as(
 select p.*,row_number() over(partition by category_slug order by sort_priority desc,id) as position,
 (select o.cost_price from public.store_supplier_offers o left join public.store_suppliers s on s.id=o.supplier_id
  where o.product_id=p.id and o.stock_qty>0 and o.cost_price>0 order by coalesce(s.priority,100),o.cost_price limit 1) as cost
 from public.store_products p where visibility='public' and status='active' and is_demo=false and stock_qty>0 and featured
 ), candidates as(select *,round(cost*1.15,2) as reduced from ranked where position<=2 and cost>0 and coalesce((metadata->>'auto_markup_disabled')::boolean,false)=false)
 update public.store_products p set compare_at_price=p.retail_price,retail_price=c.reduced,
 metadata=p.metadata||jsonb_build_object('regular_markup_percent',coalesce((p.metadata->>'markup_percent')::numeric,20),'markup_percent',15,
 'deal_managed',true,'compare_at_verified',true,'compare_at_basis','previous-public-selling-price','previous_price_observed_at',now(),'deal_started_at',now(),'deal_ends_at',now()+interval '30 days'),updated_at=now()
 from candidates c where p.id=c.id and p.retail_price>c.reduced and p.retail_price>=c.cost and p.metadata->>'deal_started_at' is null;
 -- Do not keep a crossed-out reference if a cost refresh has exceeded it.
 update public.store_products set compare_at_price=null,metadata=metadata-'compare_at_verified'
 where compare_at_price is not null and compare_at_price<=retail_price;
end $$;
revoke all on function public.vt_refresh_store_merchandising() from public,anon,authenticated;
grant execute on function public.vt_refresh_store_merchandising() to service_role;
select public.vt_refresh_store_merchandising();
