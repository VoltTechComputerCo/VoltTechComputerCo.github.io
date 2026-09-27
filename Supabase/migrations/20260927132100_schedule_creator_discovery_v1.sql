create or replace function private.invoke_creator_discovery()
returns bigint language plpgsql security definer set search_path=''
as $$
declare v_api_key text; v_request_id bigint;
begin
  select decrypted_secret into v_api_key from vault.decrypted_secrets where name='automations_api_key' limit 1;
  if v_api_key is null then raise exception 'automations_api_key is missing from Vault'; end if;
  select net.http_post(
    url:='https://qdqhfnvwqvgesfdmocir.supabase.co/functions/v1/discover-sa-streamers',
    headers:=jsonb_build_object('Content-Type','application/json','apikey',v_api_key),
    body:='{}'::jsonb, timeout_milliseconds:=25000
  ) into v_request_id;
  return v_request_id;
end;
$$;
revoke all on function private.invoke_creator_discovery() from public,anon,authenticated;

do $$
declare v_jobid bigint;
begin
  select jobid into v_jobid from cron.job where jobname='discover-sa-streamers' limit 1;
  if v_jobid is not null then perform cron.unschedule(v_jobid); end if;
end;
$$;

select cron.schedule('discover-sa-streamers','17 3 * * *',$$select private.invoke_creator_discovery();$$);
