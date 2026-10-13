begin;
select set_config('request.jwt.claim.sub',(select user_id::text from public.admin_users limit 1),true);
do $$
declare rid uuid:=gen_random_uuid(); iid uuid; product public.store_products%rowtype; payload jsonb; result jsonb;
begin
 select * into product from public.store_products where visibility='public' and metadata->>'supplier'='syntech' order by id limit 1;
 insert into public.store_requests(id,status,source,guest_name,guest_email,guest_phone,item_count,checkout_stage,delivery_method,payment_status) values(rid,'submitted','store_checkout','Rollback test','volttechcomputerco@gmail.com','0618435775',1,'pending_stock_confirmation','door','unpaid');
 insert into public.store_request_items(request_id,product_id,product_slug,product_name,product_type,brand,quantity,displayed_price,displayed_currency) values(rid,product.id,product.slug,product.name,product.type,product.brand,1,product.retail_price,'ZAR') returning id into iid;
 payload:=jsonb_build_object('reservations',jsonb_build_array(jsonb_build_object('item_id',iid,'reserved_quantity',1,'state','reserved','supplier','Syntech','sku','TEST-SKU','reference','ROLLBACK-SO','cost',100)),'pricing',jsonb_build_array(jsonb_build_object('item_id',iid,'unit_price',150)),'delivery',50,'labour',0,'discount',0);
 begin
  perform public.admin_prepare_store_quote(rid,jsonb_set(payload,'{reservations,0,state}','"feed_available"'));
  raise exception 'TEST FAIL: feed stock accepted as reservation';
 exception when others then if sqlerrm like 'TEST FAIL:%' then raise;end if;end;
 result:=public.admin_prepare_store_quote(rid,payload);
 if result->>'ok'<>'true' then raise exception 'TEST FAIL: quote preparation';end if;
 if public.operations_payment_ready('store',rid) then raise exception 'TEST FAIL: payment before approval';end if;
 perform public.operations_customer_approval(rid,'accepted');
 if not public.operations_payment_ready('store',rid) then raise exception 'TEST FAIL: no automatic payment release';end if;
 if not exists(select 1 from public.store_requests where id=rid and checkout_stage='awaiting_payment' and final_total=200) then raise exception 'TEST FAIL: incorrect checkout stage/total';end if;
 update public.operations_jobs set quote_details=quote_details||jsonb_build_object('valid_until',now()-interval '1 second') where entity_key='store:'||rid;
 if public.operations_payment_ready('store',rid) then raise exception 'TEST FAIL: expired quote allows payment';end if;
end $$;
select set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
set local role authenticated;
do $$ begin
 begin perform public.admin_prepare_store_quote(gen_random_uuid(),'{}');raise exception 'TEST FAIL: customer can prepare quote';exception when others then if sqlerrm like 'TEST FAIL:%' then raise;end if;end;
 if has_column_privilege('authenticated','public.store_requests','metadata','select') then raise exception 'TEST FAIL: private metadata';end if;
end $$;
reset role;
rollback;
select 'PASS: atomic quote preparation, reservation evidence, accept/pay, expiry and customer privacy' as verification;
