-- Public Store catalogue is supplier-backed only.
-- Existing compatibility/test catalogue remains available to admins/Builder workflows,
-- but cannot become customer inventory without a genuine supplier offer.

create or replace function public.vt_has_real_supplier_offer(p_product_id text)
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select exists (
    select 1
    from public.store_supplier_offers o
    where o.product_id = p_product_id
      and lower(coalesce(o.supplier_id,'')) not in (
        'wootware','evetech','dreamware','rebeltech','fan-mock','mock-fans'
      )
      and lower(coalesce(o.supplier_name,'')) not in (
        'wootware','evetech','dreamware','rebeltech','fan mock feed'
      )
      and lower(coalesce(o.metadata->>'is_mock','false')) not in ('true','1','yes')
      and lower(coalesce(o.metadata->>'source_type','')) not in ('mock','fixture','test')
      and lower(coalesce(o.metadata->>'environment','')) not in ('mock','test','development')
  );
$$;

revoke all on function public.vt_has_real_supplier_offer(text) from public;
grant execute on function public.vt_has_real_supplier_offer(text) to anon,authenticated,service_role;

drop policy if exists "Public can browse published store products" on public.store_products;
drop policy if exists "Public can browse supplier-backed store products" on public.store_products;
create policy "Public can browse supplier-backed store products"
on public.store_products
for select
to anon,authenticated
using (
  status='active'
  and visibility='public'
  and sale_mode <> 'hidden'
  and public.vt_has_real_supplier_offer(id)
);

create or replace function public.get_public_supplier_highlights()
returns table(
  category_slug text,
  id text,
  slug text,
  name text,
  brand text,
  media jsonb
)
language sql
stable
security definer
set search_path to ''
as $$
  with eligible as (
    select
      p.category_slug,p.id,p.slug,p.name,p.brand,p.media,p.featured,p.sort_priority,
      max(o.cost_price) as supplier_cost_rank
    from public.store_products p
    join public.store_supplier_offers o on o.product_id=p.id
    where p.status='active'
      and p.visibility='public'
      and p.sale_mode <> 'hidden'
      and public.vt_has_real_supplier_offer(p.id)
      and p.category_slug in ('gpu','cpu','motherboard','memory','storage','cooler','case','psu')
    group by p.category_slug,p.id,p.slug,p.name,p.brand,p.media,p.featured,p.sort_priority
  )
  select distinct on (e.category_slug)
    e.category_slug,e.id,e.slug,e.name,e.brand,e.media
  from eligible e
  order by e.category_slug,e.featured desc,e.supplier_cost_rank desc nulls last,e.sort_priority desc,e.name;
$$;

revoke all on function public.get_public_supplier_highlights() from public;
grant execute on function public.get_public_supplier_highlights() to anon,authenticated,service_role;

update public.store_products p
set is_demo=true,
    metadata=coalesce(p.metadata,'{}'::jsonb) || jsonb_build_object(
      'catalogue_scope','builder-test',
      'public_store_eligible',false
    ),
    updated_at=now()
where not public.vt_has_real_supplier_offer(p.id);
