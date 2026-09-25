create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.streamer_refresh_config (
  id text primary key default 'default' check (id = 'default'),
  refresh_secret text not null,
  last_success_at timestamptz,
  last_error text,
  updated_at timestamptz not null default now()
);

alter table private.streamer_refresh_config enable row level security;

insert into private.streamer_refresh_config (id, refresh_secret)
values (
  'default',
  replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
)
on conflict (id) do nothing;

create or replace function public.get_streamer_refresh_secret()
returns text
language sql
security definer
set search_path = ''
as $$
  select refresh_secret
  from private.streamer_refresh_config
  where id = 'default';
$$;

revoke all on function public.get_streamer_refresh_secret() from public, anon, authenticated;
grant execute on function public.get_streamer_refresh_secret() to service_role;

comment on function public.get_streamer_refresh_secret() is
  'Backend-only secret retrieval for scheduled streamer refresh. Not callable by anon/authenticated users.';
