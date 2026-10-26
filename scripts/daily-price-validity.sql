-- Cap quote validity for volatile hardware across both billing workflows.
create or replace function public.vt_daily_price_item(p_id text,p_description text) returns boolean language sql stable security definer set search_path='' as $$
 select coalesce((select type in ('gpu','memory','storage') from public.store_products where id=p_id),
 coalesce(p_description,'') !~* '(heatsink|water.?block|enclosure|adapter|cooler)' and coalesce(p_description,'') ~* '(\m(RAM|DDR[345]|SSD|NVMe|HDD|GPU|RTX|GTX|GeForce|Radeon)\M|hard[ -]?drive|graphics card)');
$$;
revoke all on function public.vt_daily_price_item(text,text) from public,anon,authenticated;
create or replace function public.vt_cap_billing_quote_validity() returns trigger language plpgsql security definer set search_path='' as $$
declare deadline date;
begin
 if new.kind='quote' and exists(select 1 from public.billing_document_items i where i.document_id=new.id and i.active and public.vt_daily_price_item(i.product_id,i.description)) then
  deadline:=(coalesce(new.issued_at,now()) at time zone 'Africa/Johannesburg')::date+1;
  new.valid_until:=least(coalesce(new.valid_until,deadline),deadline);
 end if;
 return new;
end $$;
revoke all on function public.vt_cap_billing_quote_validity() from public,anon,authenticated;
create trigger billing_daily_price_validity before update on public.billing_documents for each row execute function public.vt_cap_billing_quote_validity();
create or replace function public.vt_cap_legacy_quote_validity() returns trigger language plpgsql security definer set search_path='' as $$
declare deadline date;
begin
 if new.status in ('draft','sent','viewed') and exists(select 1 from public.quote_items i where i.quote_id=new.id and public.vt_daily_price_item(i.product_id,i.description)) then
  deadline:=(coalesce(new.sent_at,new.created_at,now()) at time zone 'Africa/Johannesburg')::date+1;
  new.valid_until:=least(coalesce(new.valid_until,deadline),deadline);
 end if;
 return new;
end $$;
revoke all on function public.vt_cap_legacy_quote_validity() from public,anon,authenticated;
create trigger quotes_daily_price_validity before update on public.quotes for each row execute function public.vt_cap_legacy_quote_validity();
create or replace function public.vt_cap_quote_item_validity() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if public.vt_daily_price_item(new.product_id,new.description) then
  update public.quotes set valid_until=valid_until where id=new.quote_id and status in ('draft','sent','viewed');
 end if;
 return new;
end $$;
revoke all on function public.vt_cap_quote_item_validity() from public,anon,authenticated;
create trigger quote_items_daily_price_validity after insert or update on public.quote_items for each row execute function public.vt_cap_quote_item_validity();
