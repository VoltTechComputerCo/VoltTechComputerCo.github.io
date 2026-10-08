-- Checkout and the scheduled email worker require server-only notification access.
-- Customer/admin column grants and existing row-level security remain unchanged.
grant select, insert, update on public.notifications to service_role;
grant select, insert, update on public.email_outbox to service_role;
