create table if not exists public.creator_registrations (
  twitch_user_id text primary key,
  streamer_login text not null unique references public.streamers(login) on delete cascade,
  volttech_user_id uuid references auth.users(id) on delete set null,
  registration_source text not null default 'twitch_self'
    check (registration_source in ('twitch_self','twitch_tag_discovery','external_seed')),
  self_declared_south_africa boolean not null default false,
  twitch_owner_verified_at timestamptz,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists creator_registrations_volttech_user_uidx
  on public.creator_registrations (volttech_user_id) where volttech_user_id is not null;
alter table public.creator_registrations enable row level security;
drop policy if exists "Creator can read own linked registration" on public.creator_registrations;
create policy "Creator can read own linked registration" on public.creator_registrations
for select to authenticated using (volttech_user_id = (select auth.uid()));
grant select on public.creator_registrations to authenticated;
revoke insert, update, delete on public.creator_registrations from anon, authenticated;
grant select, insert, update, delete on public.creator_registrations to service_role;

create table if not exists public.creator_discovery_hits (
  streamer_login text primary key, twitch_user_id text, display_name text,
  profile_image_url text, description text, stream_title text, game_name text,
  viewer_count integer not null default 0 check (viewer_count >= 0),
  tags text[] not null default '{}', discovery_score integer not null default 0,
  discovery_source text not null default 'twitch_tag_scan',
  evidence jsonb not null default '{}'::jsonb,
  auto_registered boolean not null default false,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
alter table public.creator_discovery_hits enable row level security;
revoke all on public.creator_discovery_hits from anon, authenticated;
grant select, insert, update, delete on public.creator_discovery_hits to service_role;

create or replace function public.my_creator_profile()
returns table (
  streamer_login text, registration_source text, self_declared_south_africa boolean,
  twitch_owner_verified_at timestamptz, display_name text, profile_image_url text,
  description text, is_live boolean, viewer_count integer, game_name text,
  title text, last_live_at timestamptz, checked_at timestamptz
)
language sql stable security definer set search_path = ''
as $$
  select r.streamer_login, r.registration_source, r.self_declared_south_africa,
    r.twitch_owner_verified_at, s.display_name, s.profile_image_url, s.description,
    coalesce(st.is_live,false), coalesce(st.viewer_count,0), coalesce(st.game_name,''),
    coalesce(st.title,''), st.last_live_at, st.checked_at
  from public.creator_registrations r
  join public.streamers s on s.login=r.streamer_login
  left join public.streamer_status st on st.streamer_login=r.streamer_login
  where r.volttech_user_id=(select auth.uid()) limit 1;
$$;
revoke all on function public.my_creator_profile() from public, anon;
grant execute on function public.my_creator_profile() to authenticated;

create table if not exists private.creator_discovery_config (
  id text primary key default 'default' check (id='default'),
  scan_pages integer not null default 12 check (scan_pages between 1 and 50),
  auto_register_threshold integer not null default 100 check (auto_register_threshold between 1 and 500),
  last_success_at timestamptz, last_error text, updated_at timestamptz not null default now()
);
insert into private.creator_discovery_config (id) values ('default') on conflict (id) do nothing;
grant usage on schema private to service_role;
grant select, update on private.creator_discovery_config to service_role;

create or replace function public.record_creator_discovery_result(p_success boolean,p_error text default null)
returns void language plpgsql security definer set search_path=''
as $$
begin
  update private.creator_discovery_config
  set last_success_at=case when p_success then now() else last_success_at end,
      last_error=case when p_success then null else left(coalesce(p_error,'Unknown discovery error'),1000) end,
      updated_at=now()
  where id='default';
end;
$$;
revoke all on function public.record_creator_discovery_result(boolean,text) from public,anon,authenticated;
grant execute on function public.record_creator_discovery_result(boolean,text) to service_role;
