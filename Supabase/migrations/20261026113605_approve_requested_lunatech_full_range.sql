create or replace function public.vt_guard_gaming_catalogue() returns trigger language plpgsql set search_path='' as $$
begin
 if not coalesce(new.is_demo,false)
 and new.metadata->>'catalogue_approval'='lunatech-full-range-20261026'
 and exists(select 1 from public.store_supplier_offers o where o.product_id=new.id and o.supplier_id='lunatech' and o.supplier_sku=new.model)
 then return new;end if;
 if not public.vt_gaming_product_allowed(new.type,new.name,new.short_description) or coalesce(new.is_demo,false) then new.visibility:='private';new.sale_mode:='hidden';end if;
 return new;
end $$;;
