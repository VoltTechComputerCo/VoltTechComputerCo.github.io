alter policy "Public can browse supplier-backed store products" on public.store_products using (
status='active' and visibility='public' and sale_mode<>'hidden' and not coalesce(is_demo,false)
and vt_has_real_supplier_offer(id)
and (vt_gaming_product_allowed(type,name,short_description) or (metadata->>'catalogue_approval'='lunatech-full-range-20261026' and metadata->>'supplier'='lunatech'))
);;
