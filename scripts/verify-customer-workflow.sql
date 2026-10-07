begin;
select set_config('request.jwt.claim.sub',(select user_id::text from public.admin_users limit 1),true);
do $$
declare rid uuid; key text; pricing jsonb; reservations jsonb; result jsonb;
begin
 select r.id into rid from public.store_requests r where exists(select 1 from public.store_request_items where request_id=r.id) order by submitted_at desc limit 1;
 if rid is null then raise exception 'No testable request'; end if;
 key:='store:'||rid;
 delete from public.operations_jobs where entity_key=key;
 update public.store_requests set payment_status='unpaid',checkout_stage='pending_stock_confirmation' where id=rid;
 select jsonb_agg(jsonb_build_object('item_id',id,'reserved_quantity',quantity,'state','feed_available','supplier','Esquire','sku','QA','reference','QA','cost',10)),jsonb_agg(jsonb_build_object('item_id',id,'unit_price',100)) into reservations,pricing from public.store_request_items where request_id=rid;
 begin perform public.admin_operations_action(key,'reserve',jsonb_build_object('reservations',reservations));raise exception 'TEST FAIL: feed availability accepted';exception when others then if sqlerrm='TEST FAIL: feed availability accepted' then raise; end if;end;
 select jsonb_agg(jsonb_build_object('item_id',id,'reserved_quantity',quantity,'state','reserved','supplier','Esquire','sku','QA','reference','QA-SO','cost',10)) into reservations from public.store_request_items where request_id=rid;
 perform public.admin_operations_action(key,'reserve',jsonb_build_object('reservations',reservations));
 perform public.admin_operations_action(key,'price',jsonb_build_object('pricing',pricing,'delivery',50,'labour',20,'discount',10));
 begin perform public.admin_operations_action(key,'release_payment','{}');raise exception 'TEST FAIL: payment before approval';exception when others then if sqlerrm='TEST FAIL: payment before approval' then raise; end if;end;
 perform public.admin_operations_action(key,'send_quote','{}');
 begin perform public.admin_operations_action(key,'release_payment','{}');raise exception 'TEST FAIL: payment before acceptance';exception when others then if sqlerrm='TEST FAIL: payment before acceptance' then raise; end if;end;
 perform public.operations_customer_approval(rid,'accepted');
 perform public.admin_operations_action(key,'release_payment','{}');
 if not public.operations_payment_ready('store',rid) then raise exception 'TEST FAIL: approved payment gate closed';end if;
 begin perform public.admin_operations_action(key,'supplier_order','{"reference":"QA"}');raise exception 'TEST FAIL: supplier before payment';exception when others then if sqlerrm='TEST FAIL: supplier before payment' then raise; end if;end;
 begin perform public.admin_operations_action(key,'courier','{"tracking":"QA","waybill":"QA","cost":10}');raise exception 'TEST FAIL: courier before supplier/payment';exception when others then if sqlerrm='TEST FAIL: courier before supplier/payment' then raise; end if;end;
 update public.store_requests set payment_status='paid' where id=rid;
 perform public.admin_operations_action(key,'supplier_order','{"reference":"QA"}');
 perform public.admin_operations_action(key,'courier','{"tracking":"QA","waybill":"QA","cost":10}');
 begin perform public.admin_operations_action(key,'collected','{}');raise exception 'TEST FAIL: collection before waybill';exception when others then if sqlerrm='TEST FAIL: collection before waybill' then raise; end if;end;
 perform public.admin_operations_action(key,'waybill_sent','{}');
 begin perform public.admin_operations_action(key,'collected','{}');raise exception 'TEST FAIL: collection before approval';exception when others then if sqlerrm='TEST FAIL: collection before approval' then raise; end if;end;
 perform public.admin_operations_action(key,'waybill_approved','{}');
 perform public.admin_operations_action(key,'preparing','{}');
 perform public.admin_operations_action(key,'collected','{}');
 perform public.admin_operations_action(key,'in_transit','{}');
 perform public.admin_operations_action(key,'delivered','{}');
 perform public.admin_operations_action(key,'close','{}');
 if (select count(*) from public.email_outbox where source_type='customer_workflow' and source_id=key)<12 then raise exception 'Missing step emails'; end if;
 if exists(select 1 from public.email_outbox where source_type='customer_workflow' and source_id=key and (payload->>'message' ilike '%brenton%' or payload->>'message' ilike '%QA-SO%')) then raise exception 'Private data exposed';end if;
end $$;
select set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
set local role authenticated;
do $$
begin
 if exists(select 1 from public.operations_jobs) then raise exception 'TEST FAIL: customer read private operations';end if;
 if has_column_privilege('authenticated','public.quotes','internal_note','select') or has_column_privilege('authenticated','public.store_requests','metadata','select') then raise exception 'TEST FAIL: private columns exposed'; end if;
 begin perform public.admin_operations_data();raise exception 'TEST FAIL: unauthorised operations';exception when others then if sqlerrm='TEST FAIL: unauthorised operations' then raise;end if;end;
end $$;
reset role;
rollback;
select 'PASS: reservation, price, approval, payment, supplier, courier, waybill, delivery, archive and customer privacy gates' verification;
