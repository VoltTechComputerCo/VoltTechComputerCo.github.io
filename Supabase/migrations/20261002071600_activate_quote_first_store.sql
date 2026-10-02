update public.store_products
set is_demo=false,
    sale_mode='quote',
    metadata=jsonb_set(jsonb_set(coalesce(metadata,'{}'::jsonb),'{catalogue_role}','"request_catalogue"'::jsonb,true),'{quote_only}','true'::jsonb,true),
    updated_at=now()
where status='active' and visibility='public' and is_demo=true and coalesce(metadata->>'source','')='manufacturer';

update public.store_settings
set catalogue_enabled=true,
    builder_enabled=false,
    checkout_mode='hybrid',
    direct_payment_enabled=false,
    banner_text='VoltTech PC Parts — browse components and request an order. Stock, final pricing and delivery are confirmed before payment.',
    updated_at=now()
where id='store';
