create extension if not exists pg_trgm with schema extensions;
create extension if not exists fuzzystrmatch with schema extensions;
alter table public.store_products add column if not exists search_vector tsvector
generated always as (
 setweight(to_tsvector('simple',coalesce(name,'')||' '||coalesce(brand,'')||' '||coalesce(model,'')), 'A') ||
 setweight(to_tsvector('simple',identifiers::text||' '||specs::text||' '||compatibility::text), 'B') ||
 setweight(to_tsvector('simple',coalesce(short_description,'')), 'C')
) stored;
create index if not exists store_products_search_vector_idx on public.store_products using gin(search_vector);
create index if not exists store_products_search_name_idx on public.store_products using gin(name extensions.gin_trgm_ops);

create or replace function public.search_store_products(p_query text) returns jsonb
language plpgsql stable security invoker set search_path='' set statement_timeout='5s' as $$
declare q text; words text[]; brand_name text; used integer:=0; remaining text; tq tsquery; payload jsonb;
begin
 q:=trim(regexp_replace(lower(left(coalesce(p_query,''),120)),'[^a-z0-9]+',' ','g'));
 if length(q)<2 then return jsonb_build_object('matches','[]'::jsonb,'suggestions','[]'::jsonb,'brand',null);end if;
 words:=regexp_split_to_array(q,' +');
 -- Match an unambiguous brand prefix, including common one/two-character typos.
 with brands as (
  select distinct p.brand,regexp_replace(lower(p.brand),'[^a-z0-9]','','g') as compact
  from public.store_products p where p.status='active' and p.visibility='public' and p.sale_mode<>'hidden' and not p.is_demo
 ), candidates as (
  select b.brand,n,replace(array_to_string(words[1:n],' '),' ','') as typed,b.compact
  from brands b cross join generate_series(1,least(3,array_length(words,1))) n
 ), scored as (
  select *,case when compact=typed then 2.0
   when length(typed)>=2 and compact like typed||'%' then 1.0
   when length(typed)>=4 and abs(length(compact)-length(typed))<=2 then greatest(extensions.similarity(compact,typed),case when extensions.levenshtein_less_equal(left(compact,120),left(typed,120),2)<=2 then 0.7-0.08*extensions.levenshtein_less_equal(left(compact,120),left(typed,120),2) else 0 end)
   else 0 end as score from candidates
 ) select s.brand,s.n into brand_name,used from scored s
 where score>=0.45 order by score desc,n desc,brand limit 1;
 remaining:=case when brand_name is null then q else coalesce(array_to_string(words[used+1:array_length(words,1)],' '),'') end;
 select to_tsquery('simple',string_agg(quote_literal(w)||':*',' & ')) into tq from unnest(regexp_split_to_array(remaining,' +')) w where w<>'';
 with matches as materialized (
  select p.id,p.slug,p.name,p.brand,p.retail_price,p.stock_qty,
   (case when brand_name is not null and lower(p.brand)=lower(brand_name) then 10 else 0 end
    +case when lower(coalesce(p.model,''))=q or lower(p.identifiers->>'sku')=q or lower(p.identifiers->>'mpn')=q then 20 else 0 end
    +coalesce(ts_rank_cd(p.search_vector,tq),0)
    +extensions.word_similarity(q,lower(p.name)))::numeric as score
  from public.store_products p
  where p.status='active' and p.visibility='public' and p.sale_mode<>'hidden' and not p.is_demo
  and (brand_name is null or lower(p.brand)=lower(brand_name))
  and (remaining='' or p.search_vector@@tq
   or regexp_replace(lower(p.name||' '||coalesce(p.model,'')),'[^a-z0-9]','','g') like '%'||replace(remaining,' ','')||'%'
   or (length(remaining)>=4 and extensions.word_similarity(remaining,lower(p.name))>=0.58))
 ), ranked as (select * from matches order by score desc,(stock_qty>0) desc nulls last,name,id)
 select jsonb_build_object('brand',brand_name,'matches',coalesce((select jsonb_agg(jsonb_build_object('id',id,'score',score)) from ranked),'[]'::jsonb),
 'suggestions',coalesce((select jsonb_agg(to_jsonb(s)) from (select id,slug,name,brand,retail_price,stock_qty from ranked limit 6) s),'[]'::jsonb)) into payload;
 return payload;
end $$;
revoke all on function public.search_store_products(text) from public;
grant execute on function public.search_store_products(text) to anon,authenticated,service_role;
;
