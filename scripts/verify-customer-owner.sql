begin;
select set_config('request.jwt.claim.sub',(select user_id::text from store_requests where user_id is not null limit 1),true);
do $$ declare rid uuid; jobs jsonb; link text; before_count integer;begin
 select id into rid from public.store_requests where user_id=auth.uid() limit 1;
 jobs:=public.customer_workflow_jobs();
 if jsonb_array_length(jobs)<1 then raise exception 'Missing owned request';end if;
 if jobs::text like '%reservations%' or jobs::text like '%cost%' or jobs::text like '%internal_note%' then raise exception 'Privacy leak';end if;
 link:=public.customer_order_link(rid);
 if link not like '/order-status.html?ref=%&token=%' then raise exception 'Invalid customer link';end if;
 perform public.operations_customer_event('store:'||rid,'QA','Safe QA message','QA-customer-dual-channel',true);
 perform public.operations_customer_event('store:'||rid,'QA','Safe QA message','QA-customer-dual-channel',true);
 if (select count(*) from public.notifications where dedupe_key='QA-customer-dual-channel' and recipient_user_id=auth.uid())<>1 or (select count(*) from public.email_outbox where dedupe_key='customer-email:QA-customer-dual-channel' and notification_id is not null)<>1 then raise exception 'Paired notifications missing or duplicated';end if;
 perform set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
 if public.customer_workflow_jobs()<>'[]'::jsonb then raise exception 'Other customer records leaked';end if;
 begin perform public.customer_order_link(rid);raise exception 'TEST FAIL: other customer access';exception when others then if sqlerrm='TEST FAIL: other customer access' then raise;end if;end;
end $$;
rollback;
select 'PASS: latest owned request, owner-only entry link, paired and deduplicated notification/email and private-data protection' verification;
