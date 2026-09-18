create or replace function public.record_streamer_refresh_result(
  p_success boolean,
  p_error text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update private.streamer_refresh_config
  set last_success_at = case when p_success then now() else last_success_at end,
      last_error = case when p_success then null else left(coalesce(p_error, 'Unknown refresh error'), 1000) end,
      updated_at = now()
  where id = 'default';
end;
$$;

revoke all on function public.record_streamer_refresh_result(boolean, text)
from public, anon, authenticated;
grant execute on function public.record_streamer_refresh_result(boolean, text)
to service_role;
