-- Payment checkout and verified webhooks operate as service_role.
-- Keep customer grants and row-level security unchanged.
grant select, insert, update on public.store_payments to service_role;
