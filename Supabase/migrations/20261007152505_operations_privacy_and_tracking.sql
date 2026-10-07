revoke all on function public.operations_store_task() from public,anon,authenticated;
revoke all on function public.operations_store_gate() from public,anon,authenticated;
-- Customer-facing source metadata on commercial documents is never a private operations record.
grant select(product_id) on public.quote_items to authenticated;
