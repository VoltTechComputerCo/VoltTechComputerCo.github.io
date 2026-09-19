alter table public.store_settings
  add column if not exists builder_enabled boolean not null default false;

update public.store_settings
set builder_enabled = false,
    updated_at = now()
where id = 'store';
