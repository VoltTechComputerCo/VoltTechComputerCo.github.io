create or replace function public.admin_quote_provenance(p_ids uuid[]) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not coalesce(public.is_volttech_admin(),false) then raise exception 'Not authorised';end if;
 if cardinality(p_ids)>2000 then raise exception 'Request fewer quotes';end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',id,'source_type',source_type,'source_id',source_id,'source_metadata',source_metadata)) from public.quotes where id=any(p_ids)),'[]'::jsonb);
end $$;
revoke all on function public.admin_quote_provenance(uuid[]) from public,anon;
grant execute on function public.admin_quote_provenance(uuid[]) to authenticated;;
